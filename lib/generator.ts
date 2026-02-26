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

  // Set up canvas, load JSON, render — fabric v6 loadFromJSON returns a Promise
  await page.evaluate(
    (canvasData: object, w: number, h: number) => {
      const f = (window as any).fabric
      const canvas = new f.Canvas("canvas", {
        width: w,
        height: h,
        backgroundColor: "#ffffff",
        renderOnAddRemove: false,
      })
      return canvas.loadFromJSON(canvasData).then(() => {
        canvas.renderAll()
        ;(window as any).canvasReady = true
      }).catch(() => {
        canvas.renderAll()
        ;(window as any).canvasReady = true
      })
    },
    processedCanvas,
    width,
    height
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
