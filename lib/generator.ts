import puppeteer from "puppeteer"
import path from "path"
import { uploadToCloudinary } from "./cloudinary"

// Resolve the local fabric UMD build so Puppeteer can inject it without any CDN
const FABRIC_JS_PATH = path.resolve(
  process.cwd(),
  "node_modules/fabric/dist/index.min.js"
)

interface GenerateImageOptions {
  canvasJson: any
  variables?: Record<string, string>
  width: number
  height: number
  format?: "png" | "jpeg" | "pdf"
}

export async function generateImage({
  canvasJson,
  variables = {},
  width,
  height,
  format = "png",
}: GenerateImageOptions): Promise<string> {
  // Replace variables in canvas JSON
  const processedCanvas = JSON.parse(
    JSON.stringify(canvasJson).replace(
      /\{\{(\w+)\}\}/g,
      (match, key) => variables[key] || match
    )
  )

  // Minimal HTML shell — Fabric.js injected from local node_modules (no CDN)
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>* { margin: 0; padding: 0; } body { background: #fff; } canvas { display: block; }</style>
</head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
</body>
</html>`

  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()
  await page.setViewport({ width, height })
  await page.setContent(html, { waitUntil: "domcontentloaded" })

  // Inject Fabric.js UMD build from local node_modules (no network required)
  await page.addScriptTag({ path: FABRIC_JS_PATH })

  // Set up canvas, load JSON, apply modifications, render
  await page.evaluate(
    async (canvasData: object, w: number, h: number, mods: Record<string, string>) => {
      const f = (window as any).fabric

      /** Apply name-based modifications to canvas objects.
       *  - text / textbox / i-text  → set obj.text
       *  - image                    → setSrc + scale to maintain original bounding box
       */
      /** Recursively walk objects (enters fabric.Group children too). */
      function walkObjects(canvas: any, cb: (o: any) => void): void {
        function walk(obj: any) {
          cb(obj)
          if (obj.type === "group" && Array.isArray(obj._objects)) {
            obj._objects.forEach(walk)
          }
        }
        canvas.getObjects().forEach(walk)
      }

      async function applyModifications(
        canvas: any,
        modifications: Record<string, string>
      ): Promise<void> {
        const imagePromises: Promise<void>[] = []

        walkObjects(canvas, (obj: any) => {
          if (!obj.name || !(obj.name in modifications)) return
          const val = modifications[obj.name]
          const t: string = obj.type

          // ── TEXT ───────────────────────────────────────────────────────────
          if (t === "text" || t === "textbox" || t === "i-text") {
            obj.set("text", val)

            // Shrink-to-fit: reduce fontSize until text fits within box width
            if (obj.__shrinkToFit) {
              const maxW = (obj.width ?? 0) * (obj.scaleX ?? 1)
              while (obj.fontSize > 6) {
                // calcTextWidth is available on fabric text objects
                const tw: number = obj.calcTextWidth?.() ?? 0
                if (tw <= maxW) break
                obj.set("fontSize", obj.fontSize - 1)
              }
            }

          // ── IMAGE ──────────────────────────────────────────────────────────
          } else if (t === "image") {
            const bboxW = (obj.width ?? 0) * (obj.scaleX ?? 1)
            const bboxH = (obj.height ?? 0) * (obj.scaleY ?? 1)
            const scalingMode: string = obj.__imgScaling ?? "fill"

            imagePromises.push(
              obj.setSrc(val, { crossOrigin: "anonymous" }).then(() => {
                const natW: number = obj.width || 1
                const natH: number = obj.height || 1

                if (scalingMode === "fill") {
                  // Stretch to fill the bounding box exactly
                  obj.set({ scaleX: bboxW / natW, scaleY: bboxH / natH, clipPath: undefined })

                } else if (scalingMode === "cover") {
                  // Scale uniformly so the image COVERS the box (no letterbox),
                  // then clip to the box so no overflow is visible.
                  const scale = Math.max(bboxW / natW, bboxH / natH)
                  obj.set({
                    scaleX: scale,
                    scaleY: scale,
                    // Re-anchor so the image is centred inside its original position
                    originX: "center",
                    originY: "center",
                    left: (obj.left ?? 0) + bboxW / 2,
                    top:  (obj.top  ?? 0) + bboxH / 2,
                    clipPath: new (window as any).fabric.Rect({
                      width:   bboxW / scale,
                      height:  bboxH / scale,
                      originX: "center",
                      originY: "center",
                    }),
                  })

                } else {
                  // contain — scale uniformly so the image FITS inside the box
                  const scale = Math.min(bboxW / natW, bboxH / natH)
                  obj.set({ scaleX: scale, scaleY: scale, clipPath: undefined })
                }
              })
            )
          }
        })

        await Promise.all(imagePromises)
      }

      const canvas = new f.Canvas("canvas", {
        width: w,
        height: h,
        backgroundColor: "#ffffff",
        renderOnAddRemove: false,
      })
      try {
        await canvas.loadFromJSON(canvasData)
        await applyModifications(canvas, mods)
        canvas.renderAll()
      } catch {
        canvas.renderAll()
      }
      ;(window as any).canvasReady = true
    },
    processedCanvas,
    width,
    height,
    variables  // passed for name-based modifications (images + direct text slots)
  )

  // Give up to 10s for the evaluate + render to finish
  await page.waitForFunction(() => (window as any).canvasReady === true, {
    timeout: 10000,
  })

  // Screenshot based on format
  let buffer: Buffer

  if (format === "pdf") {
    buffer = await page.pdf({
      width: `${width}px`,
      height: `${height}px`,
      printBackground: true,
    }) as Buffer
  } else {
    buffer = await page.screenshot({
      type: format,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
    }) as Buffer
  }

  await browser.close()

  // Upload to Cloudinary
  const imageUrl = await uploadToCloudinary(buffer, format)

  return imageUrl
}
