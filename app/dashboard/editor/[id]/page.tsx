"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  History,
  Play,
  Type,
  Square,
  Circle as CircleIcon,
  Image as ImageIcon,
  LayoutGrid,
  Star,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  BringToFront,
  SendToBack,
  Copy,
  Trash2,
  Minus,
  Plus,
  Pencil,
  ChevronDown,
  RefreshCw,
  Eye,
  EyeOff,
  X,
  Loader2,
  Undo2,
  Redo2,
  Download,
  Lock,
  Maximize2,
  GripVertical,
  ChevronUp,
  SquareDashed,
} from "lucide-react"
import { Canvas, IText, Rect, Circle, FabricImage, Shadow, filters as FabricFilters, type FabricObject } from "fabric"

// ─── helpers ────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

function PanelSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-violet-50 hover:bg-violet-100 transition"
      >
        <span className="text-[10px] font-bold tracking-widest text-violet-700 uppercase">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-violet-400 transition-transform duration-200",
            !open && "-rotate-90"
          )}
        />
      </button>
      {open && children}
    </div>
  )
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">
        {label}
      </label>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-violet-400 focus:border-violet-400 outline-none"
      />
    </div>
  )
}

function ToolbarBtn({
  icon: Icon,
  title,
  onClick,
  className = "",
  active = false,
}: {
  icon: any
  title: string
  onClick?: () => void
  className?: string
  active?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition",
        active && "bg-violet-100 text-violet-700",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function LayerIcon({ type, isPlaceholder }: { type: string | undefined; isPlaceholder?: boolean }) {
  if (isPlaceholder) return <SquareDashed className="h-3 w-3 text-violet-400 shrink-0" />
  if (type === "i-text" || type === "text") return <Type className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "image") return <ImageIcon className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "rect") return <Square className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "circle") return <CircleIcon className="h-3 w-3 text-gray-400 shrink-0" />
  return <Square className="h-3 w-3 text-gray-400 shrink-0" />
}

// ─── main page ───────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  canvasJson: any
  width: number
  height: number
}

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragSrcIdxRef = useRef<number | null>(null)

  const [template, setTemplate] = useState<Template | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null)
  const [layers, setLayers] = useState<FabricObject[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [imgFormat, setImgFormat] = useState<"auto" | "png" | "jpeg">("auto")
  const [imgQuality, setImgQuality] = useState(90)
  const [imgDpi, setImgDpi] = useState<"72" | "96" | "150" | "300">("96")
  const [pdfQuality, setPdfQuality] = useState(90)
  const [pdfDpi, setPdfDpi] = useState<"72" | "96" | "150" | "300">("150")
  // incremented instead of spreading Fabric objects — keeps prototype intact
  const [revision, setRevision] = useState(0)

  // ── test modal state ─────────────────────────────────────────────────────
  const [showTestModal, setShowTestModal] = useState(false)
  const [testVars, setTestVars] = useState<Record<string, string>>({})
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testError, setTestError] = useState("")

  async function handleDeleteTemplate() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/templates/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      router.push("/dashboard/templates")
    } catch {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // derived text/shape state from selected object
  const isText =
    selectedObject?.type === "i-text" || selectedObject?.type === "text"
  const isShape =
    selectedObject?.type === "rect" || selectedObject?.type === "circle"
  const isImage = selectedObject?.type === "image"
  const obj = selectedObject as any
  const isFrame = isShape && !!(obj?.isPlaceholder)

  // ── load template ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/templates/${params.id}`)
        const data = await res.json()
        setTemplate(data.template)
        setTemplateName(data.template.name)
      } catch (e) {
        console.error("Failed to load template", e)
      }
    }
    load()
  }, [params.id])

  // ── init canvas ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!template || !canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: template.width,
      height: template.height,
      backgroundColor: "#ffffff",
    })
    fabricRef.current = canvas

    const updateLayers = () => setLayers([...(canvas.getObjects() ?? [])])

    const bumpRevision = () => setRevision((r) => r + 1)
    canvas.on("object:added", updateLayers)
    canvas.on("object:removed", updateLayers)
    canvas.on("object:modified", () => { updateLayers(); bumpRevision() })
    canvas.on("object:scaling", bumpRevision)
    canvas.on("object:moving", bumpRevision)
    canvas.on("object:rotating", bumpRevision)
    canvas.on("selection:created", (e) => { setSelectedObject(e.selected?.[0] ?? null); bumpRevision() })
    canvas.on("selection:updated", (e) => { setSelectedObject(e.selected?.[0] ?? null); bumpRevision() })
    canvas.on("selection:cleared", () => setSelectedObject(null))

    // Double-click: fill Image Frame placeholder or swap image
    canvas.on("mouse:dblclick", async (e: any) => {
      const target = e.target as any
      if (!target) return
      // Let Fabric handle double-click on text objects natively
      if (target.type === "i-text" || target.type === "text") return
      if (target.isPlaceholder || target.type === "image") {
        const url = prompt("Enter image URL:")
        if (!url) return
        try {
          const newImg = await FabricImage.fromURL(url, { crossOrigin: "anonymous" })
          const targetW = (target.width ?? 100) * (target.scaleX ?? 1)
          const targetH = (target.height ?? 100) * (target.scaleY ?? 1)
          const imgW = newImg.width ?? 1
          const imgH = newImg.height ?? 1
          // Fit/contain: scale to fill the frame while preserving aspect ratio
          const scale = Math.min(targetW / imgW, targetH / imgH)
          const scaledW = imgW * scale
          const scaledH = imgH * scale
          newImg.scale(scale)
          newImg.set({
            left: (target.left ?? 0) + (targetW - scaledW) / 2,
            top: (target.top ?? 0) + (targetH - scaledH) / 2,
          })
          canvas.remove(target)
          canvas.add(newImg)
          canvas.setActiveObject(newImg)
          canvas.renderAll()
        } catch {
          alert("Failed to load image. Check the URL is publicly accessible.")
        }
      }
    })

    // Load saved canvas state — await so objects are present before syncing layers
    if (template.canvasJson && Object.keys(template.canvasJson).length > 0) {
      canvas.loadFromJSON(template.canvasJson).then(() => {
        canvas.renderAll()
        updateLayers() // sync layer panel AFTER objects are loaded
      })
    } else {
      updateLayers()
    }

    // Auto-fit zoom to container on load
    requestAnimationFrame(() => {
      if (containerRef.current) {
        const { offsetWidth: cw, offsetHeight: ch } = containerRef.current
        const pad = 64
        const fit = Math.floor(
          Math.min((cw - pad) / template.width, (ch - pad) / template.height) * 100
        )
        setZoom(Math.max(10, Math.min(fit, 100)))
      }
    })

    return () => { canvas.dispose() }
  }, [template])

  // ── zoom ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setZoom(zoom / 100)
    canvas.setDimensions({
      width: (template?.width ?? 800) * (zoom / 100),
      height: (template?.height ?? 600) * (zoom / 100),
    })
  }, [zoom, template])

  // ── keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Skip when typing in an input or editable element
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return

      const canvas = fabricRef.current
      if (!canvas) return
      const active = canvas.getActiveObject()

      // Delete / Backspace — remove selected object
      if ((e.key === "Delete" || e.key === "Backspace") && active) {
        e.preventDefault()
        canvas.remove(active)
        canvas.renderAll()
        return
      }

      // Ctrl/⌘+D — duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && active) {
        e.preventDefault()
          ; (active as any).clone().then((clone: FabricObject) => {
            clone.set({ left: ((active as any).left ?? 0) + 20, top: ((active as any).top ?? 0) + 20 })
            canvas.add(clone)
            canvas.setActiveObject(clone)
            canvas.renderAll()
          })
        return
      }

      // Ctrl/⌘+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault()
          ; (canvas as any).undo?.()
        canvas.renderAll()
        return
      }

      // Ctrl/⌘+S — save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        saveTemplate()
        return
      }

      // Escape — deselect
      if (e.key === "Escape") {
        canvas.discardActiveObject()
        canvas.renderAll()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── save ───────────────────────────────────────────────────────────────────
  async function saveTemplate() {
    const canvas = fabricRef.current
    if (!canvas) return
    setIsSaving(true)
    try {
      // Generate a preview thumbnail from the canvas at current zoom=100%
      // We temporarily reset zoom to 1 so the thumbnail is full-res, then restore
      const currentZoom = canvas.getZoom()
      canvas.setZoom(1)
      canvas.setDimensions({ width: template!.width, height: template!.height })

      // Export as small JPEG for the preview card (max 600px wide)
      const scale = Math.min(1, 600 / template!.width)
      const previewUrl = canvas.toDataURL({
        format: "jpeg",
        quality: 0.75,
        multiplier: scale,
      })

      // Restore zoom
      canvas.setZoom(currentZoom)
      canvas.setDimensions({
        width: template!.width * currentZoom,
        height: template!.height * currentZoom,
      })

      await fetch(`/api/templates/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          canvasJson: canvas.toJSON(["isPlaceholder"]),
          previewUrl,
        }),
      })
    } catch (e) {
      console.error("Save failed", e)
    } finally {
      setIsSaving(false)
    }
  }

  // ── add objects ────────────────────────────────────────────────────────────
  function addText() {
    const canvas = fabricRef.current
    if (!canvas) return
    const text = new IText("Double click to edit", {
      left: 80, top: 80, fontSize: 32, fill: "#1f2937", fontFamily: "Inter",
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  function addRect() {
    const canvas = fabricRef.current
    if (!canvas) return
    const rect = new Rect({ left: 80, top: 80, fill: "#7c3aed", width: 200, height: 100, rx: 8, ry: 8 })
    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  function addCircle() {
    const canvas = fabricRef.current
    if (!canvas) return
    const circle = new Circle({ left: 80, top: 80, fill: "#7c3aed", radius: 50 })
    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  async function addImageFromUrl() {
    const canvas = fabricRef.current
    if (!canvas) return
    const url = prompt("Enter image URL:")
    if (!url) return
    try {
      const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" })
      img.scale(0.5)
      img.set({ left: 80, top: 80 })
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    } catch { alert("Failed to load image") }
  }

  function addImageFrame() {
    const canvas = fabricRef.current
    if (!canvas) return
    const frame = new Rect({
      left: 80,
      top: 80,
      width: 240,
      height: 160,
      fill: "rgba(139,92,246,0.06)",
      stroke: "#7c3aed",
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      rx: 6,
      ry: 6,
    })
    ;(frame as any).isPlaceholder = true
    canvas.add(frame)
    canvas.setActiveObject(frame)
    canvas.renderAll()
  }

  // ── property update ────────────────────────────────────────────────────────
  function updateProp(key: string, value: any) {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject()
    if (!activeObj) return
    activeObj.set(key as any, value)
    canvas.renderAll()
    setRevision((r) => r + 1) // bump without spreading — keeps Fabric prototype intact
  }

  // ── alignment ──────────────────────────────────────────────────────────────
  function alignObject(dir: "left" | "right" | "centerH" | "top" | "bottom" | "centerV") {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject() as any
    if (!activeObj) return
    const cw = template?.width ?? 800
    const ch = template?.height ?? 600
    const ow = (activeObj.width ?? 0) * (activeObj.scaleX ?? 1)
    const oh = (activeObj.height ?? 0) * (activeObj.scaleY ?? 1)
    const pos = {
      left: { left: 0 },
      right: { left: cw - ow },
      centerH: { left: (cw - ow) / 2 },
      top: { top: 0 },
      bottom: { top: ch - oh },
      centerV: { top: (ch - oh) / 2 },
    }[dir]
    activeObj.set(pos)
    canvas.renderAll()
  }

  function duplicateSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject()
    if (!activeObj) return
    ;(activeObj as any).clone().then((clone: FabricObject) => {
      ;(clone as any).set({
        left: ((activeObj as any).left ?? 0) + 20,
        top: ((activeObj as any).top ?? 0) + 20,
      })
      canvas.add(clone)
      canvas.setActiveObject(clone)
      canvas.renderAll()
    })
  }

  function deleteSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject()
    if (!activeObj) return
    canvas.remove(activeObj)
    canvas.renderAll()
  }

  function selectLayer(o: FabricObject) {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.setActiveObject(o)
    canvas.renderAll()
  }

  function toggleVisibility(o: FabricObject) {
    const canvas = fabricRef.current
    if (!canvas) return
    o.set("visible", !o.visible)
    canvas.renderAll()
    setLayers([...(canvas.getObjects())])
  }

  function getLayerName(o: FabricObject) {
    const a = o as any
    if (a.isPlaceholder) return "Image Frame"
    if (o.type === "i-text" || o.type === "text") return `Text: ${String(a.text ?? "").substring(0, 18)}`
    if (o.type === "image") return "Image"
    if (o.type === "rect") return "Rectangle"
    if (o.type === "circle") return "Circle"
    return o.type ?? "Object"
  }

  // ── shadow ─────────────────────────────────────────────────────────────
  function applyShadow(props: { enabled?: boolean; color?: string; blur?: number; offsetX?: number; offsetY?: number }) {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject() as any
    if (!activeObj) return
    const cur = activeObj.shadow as any
    const nowEnabled = props.enabled !== undefined ? props.enabled : !!cur
    if (!nowEnabled) {
      activeObj.set("shadow", null)
    } else {
      activeObj.set("shadow", new Shadow({
        color: props.color ?? cur?.color ?? "rgba(0,0,0,0.5)",
        blur: props.blur !== undefined ? props.blur : (cur?.blur ?? 10),
        offsetX: props.offsetX !== undefined ? props.offsetX : (cur?.offsetX ?? 5),
        offsetY: props.offsetY !== undefined ? props.offsetY : (cur?.offsetY ?? 5),
      }))
    }
    canvas.renderAll()
    setRevision((r) => r + 1)
  }

  // ── image filters ──────────────────────────────────────────────────────
  function applyImageFilters(opts: { grayscale?: boolean; blur?: number; brightness?: number }) {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject() as any
    if (!activeObj || activeObj.type !== "image") return
    let next: any[] = [...(activeObj.filters ?? [])]
    if (opts.grayscale !== undefined) {
      next = next.filter((f: any) => f.type !== "Grayscale")
      if (opts.grayscale) next.push(new FabricFilters.Grayscale())
    }
    if (opts.blur !== undefined) {
      next = next.filter((f: any) => f.type !== "Blur")
      if (opts.blur > 0) next.push(new FabricFilters.Blur({ blur: opts.blur }))
    }
    if (opts.brightness !== undefined) {
      next = next.filter((f: any) => f.type !== "Brightness")
      if (opts.brightness !== 0) next.push(new FabricFilters.Brightness({ brightness: opts.brightness }))
    }
    activeObj.filters = next
    activeObj.applyFilters()
    canvas.renderAll()
    setRevision((r) => r + 1)
  }

  // ── image corner radius via clipPath ───────────────────────────────────
  function applyImageCornerRadius(radius: number) {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject() as any
    if (!activeObj || activeObj.type !== "image") return
    if (radius <= 0) {
      activeObj.set("clipPath", undefined)
    } else {
      activeObj.set("clipPath", new Rect({
        width: activeObj.width,
        height: activeObj.height,
        rx: radius,
        ry: radius,
        originX: "center",
        originY: "center",
      }))
    }
    canvas.renderAll()
    setRevision((r) => r + 1)
  }

  // ── replace the currently-selected image ───────────────────────────────
  async function replaceSelectedImage() {
    const canvas = fabricRef.current
    if (!canvas) return
    const activeObj = canvas.getActiveObject() as any
    if (!activeObj || activeObj.type !== "image") return
    const url = prompt("Enter new image URL:")
    if (!url) return
    try {
      const newImg = await FabricImage.fromURL(url, { crossOrigin: "anonymous" })
      newImg.set({
        left: activeObj.left,
        top: activeObj.top,
        scaleX: activeObj.scaleX,
        scaleY: activeObj.scaleY,
        angle: activeObj.angle,
        opacity: activeObj.opacity,
      })
      canvas.remove(activeObj)
      canvas.add(newImg)
      canvas.setActiveObject(newImg)
      canvas.renderAll()
    } catch {
      alert("Failed to load image. Check the URL is publicly accessible.")
    }
  }

  function moveLayerUp(visualIdx: number) {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getObjects()
    if (visualIdx <= 0) return // already topmost in the panel (highest z-index)
    const canvasIdx = objs.length - 1 - visualIdx
    const target = objs[canvasIdx]
    if (!target) return
    canvas.bringObjectForward(target)
    canvas.renderAll()
    setLayers([...(canvas.getObjects())])
  }

  function moveLayerDown(visualIdx: number) {
    const canvas = fabricRef.current
    if (!canvas) return
    const objs = canvas.getObjects()
    if (visualIdx >= objs.length - 1) return // already bottommost
    const canvasIdx = objs.length - 1 - visualIdx
    const target = objs[canvasIdx]
    if (!target) return
    canvas.sendObjectBackwards(target)
    canvas.renderAll()
    setLayers([...(canvas.getObjects())])
  }

  function moveLayerToIndex(fromVisualIdx: number, toVisualIdx: number) {
    const canvas = fabricRef.current
    if (!canvas || fromVisualIdx === toVisualIdx) return
    const objs = canvas.getObjects()
    const total = objs.length
    const fromCanvasIdx = total - 1 - fromVisualIdx
    const toCanvasIdx = total - 1 - toVisualIdx
    const target = objs[fromCanvasIdx]
    if (!target) return
    const diff = toCanvasIdx - fromCanvasIdx
    if (diff > 0) {
      for (let i = 0; i < diff; i++) canvas.bringObjectForward(target)
    } else {
      for (let i = 0; i < -diff; i++) canvas.sendObjectBackwards(target)
    }
    canvas.renderAll()
    setLayers([...(canvas.getObjects())])
  }

  // ─── render ────────────────────────────────────────────────────────────────
  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading editor…</p>
        </div>
      </div>
    )
  }

  // Re-read every time revision ticks so panels always reflect live Fabric state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _rev = revision

  const fillColor = typeof obj?.fill === "string" ? obj.fill : "#000000"

  // ── shadow derived values ────────────────────────────────────────────────
  const _shadow = obj?.shadow as any
  const shadowEnabled = !!_shadow
  const shadowColor = _shadow?.color ?? "rgba(0,0,0,0.5)"
  const shadowBlur = _shadow?.blur ?? 10
  const shadowOffsetX = _shadow?.offsetX ?? 5
  const shadowOffsetY = _shadow?.offsetY ?? 5

  // ── image corner radius (from clipPath) ──────────────────────────────────
  const _clip = isImage ? (obj?.clipPath as any) : null
  const imgCornerRadius: number = _clip?.rx ?? 0

  // ── image filter derived values ──────────────────────────────────────────
  const _filters: any[] = isImage ? (obj?.filters ?? []) : []
  const hasGrayscale = _filters.some((f: any) => f.type === "Grayscale")
  const filterBlurVal: number = (_filters.find((f: any) => f.type === "Blur"))?.blur ?? 0
  const filterBrightnessVal: number = (_filters.find((f: any) => f.type === "Brightness"))?.brightness ?? 0

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header
        className="h-12 flex items-center justify-between px-4 shrink-0 z-20"
        style={{ backgroundColor: "#4c1d95" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/templates")}
            className="p-1.5 rounded hover:bg-white/10 transition text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-semibold text-white placeholder:text-white/40 w-48"
          />
          <Pencil className="h-3 w-3 text-white/40" />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 border-r border-white/20 pr-2 mr-1">
            <button
              onClick={() => { (fabricRef.current as any)?.undo?.(); fabricRef.current?.renderAll() }}
              disabled={!canUndo}
              title="Undo"
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { (fabricRef.current as any)?.redo?.(); fabricRef.current?.renderAll() }}
              disabled={!canRedo}
              title="Redo"
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                const canvas = fabricRef.current
                if (!canvas) return
                const url = canvas.toDataURL({ format: "png", multiplier: 1 })
                const a = document.createElement("a")
                a.href = url; a.download = `${templateName || "template"}.png`; a.click()
              }}
              title="Download PNG"
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white/80 hover:bg-white/10 transition">
            <History className="h-3.5 w-3.5" /> History
          </button>
          <button
            onClick={() => {
              const json = JSON.stringify(fabricRef.current?.toJSON() ?? {})
              const matches = [...json.matchAll(/\{\{(\w+)\}\}/g)]
              const names = [...new Set(matches.map((m) => m[1]))]
              setTestVars(Object.fromEntries(names.map((n) => [n, ""])))
              setTestImageUrl(null)
              setTestError("")
              setShowTestModal(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white/80 hover:bg-white/10 transition"
          >
            <Play className="h-3.5 w-3.5" /> Test
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            onClick={saveTemplate}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-violet-500 hover:bg-violet-400 text-white transition disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT ICON BAR ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-start p-2 shrink-0 z-10">
          <aside
            className="flex flex-col items-center py-3 gap-1 rounded-xl w-12"
            style={{ backgroundColor: "#2d1b4e" }}
          >
            {[
              { icon: Type, label: "Text", action: addText },
              { icon: Square, label: "Rect", action: addRect },
              { icon: CircleIcon, label: "Circle", action: addCircle },
              { icon: ImageIcon, label: "Image", action: addImageFromUrl },
              { icon: SquareDashed, label: "Frame", action: addImageFrame },
              { icon: Star, label: "Rating", action: null as any },
              { icon: LayoutGrid, label: "Grid", action: null as any },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action ?? undefined}
                title={label}
                className={cn(
                  "w-10 h-10 flex flex-col items-center justify-center rounded-lg transition text-white/70",
                  action
                    ? "hover:bg-white/15 hover:text-white cursor-pointer"
                    : "opacity-30 cursor-not-allowed"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] mt-0.5 leading-none">{label}</span>
              </button>
            ))}
          </aside>
        </div>

        {/* ── MAIN CONTENT (size bar + context toolbar + canvas) ────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Always-visible canvas size bar ──────────────────────────── */}
          <div className="h-10 border-b bg-white flex items-center gap-2 px-3 shrink-0">
            <select
              className="border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-violet-400 bg-white"
              defaultValue="custom"
            >
              <option value="custom">Custom ({template.width} × {template.height})</option>
              <option value="1080x1080">Feed Square (1080 × 1080)</option>
              <option value="1080x1920">Instagram Story (1080 × 1920)</option>
              <option value="1200x630">Open Graph (1200 × 630)</option>
              <option value="1200x675">Twitter/X Post (1200 × 675)</option>
              <option value="1584x396">LinkedIn Banner (1584 × 396)</option>
            </select>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-gray-400">W</span>
              <span className="border border-gray-200 rounded px-2 py-1 bg-gray-50 font-mono w-16 text-center">{template.width}</span>
              <Lock className="h-3 w-3 text-gray-300" />
              <span className="text-gray-400">H</span>
              <span className="border border-gray-200 rounded px-2 py-1 bg-gray-50 font-mono w-16 text-center">{template.height}</span>
            </div>
            <button
              onClick={() => {
                if (containerRef.current && template) {
                  const { offsetWidth: cw, offsetHeight: ch } = containerRef.current
                  const pad = 64
                  const fit = Math.floor(Math.min((cw - pad) / template.width, (ch - pad) / template.height) * 100)
                  setZoom(Math.max(10, Math.min(fit, 100)))
                }
              }}
              title="Fit to window"
              className="ml-auto p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Context toolbar — shown when object selected */}
          {selectedObject ? (
            <div className="h-10 border-b bg-white flex items-center gap-1 px-3 shrink-0">
              {/* Align */}
              <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
                <ToolbarBtn icon={AlignLeft} title="Align Left" onClick={() => alignObject("left")} />
                <ToolbarBtn icon={AlignCenter} title="Align Center H" onClick={() => alignObject("centerH")} />
                <ToolbarBtn icon={AlignRight} title="Align Right" onClick={() => alignObject("right")} />
                <ToolbarBtn icon={AlignStartVertical} title="Align Top" onClick={() => alignObject("top")} />
                <ToolbarBtn icon={AlignCenterVertical} title="Align Middle" onClick={() => alignObject("centerV")} />
                <ToolbarBtn icon={AlignEndVertical} title="Align Bottom" onClick={() => alignObject("bottom")} />
              </div>
              {/* Layer order */}
              <div className="flex items-center gap-0.5 border-r border-gray-200 pr-2 mr-1">
                <ToolbarBtn
                  icon={BringToFront}
                  title="Bring Forward"
                  onClick={() => {
                    const active = fabricRef.current?.getActiveObject()
                    if (active) { fabricRef.current?.bringObjectForward(active); fabricRef.current?.renderAll() }
                  }}
                />
                <ToolbarBtn
                  icon={SendToBack}
                  title="Send Backward"
                  onClick={() => {
                    const active = fabricRef.current?.getActiveObject()
                    if (active) { fabricRef.current?.sendObjectBackwards(active); fabricRef.current?.renderAll() }
                  }}
                />
              </div>
              {/* Opacity */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 border-r border-gray-200 pr-2 mr-1">
                <span>Opacity</span>
                <input
                  type="number" min={0} max={100}
                  value={Math.round((obj?.opacity ?? 1) * 100)}
                  onChange={(e) => updateProp("opacity", Number(e.target.value) / 100)}
                  className="w-12 border border-gray-200 rounded px-1.5 py-0.5 text-xs text-center"
                />
                <span>%</span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-0.5 ml-auto">
                <ToolbarBtn icon={Copy} title="Duplicate" onClick={duplicateSelected} />
                <ToolbarBtn icon={Trash2} title="Delete" onClick={deleteSelected} className="hover:!text-red-500 hover:!bg-red-50" />
              </div>
            </div>
          ) : (
            <div className="h-10 border-b bg-white flex items-center px-3 shrink-0">
              <p className="text-xs text-gray-400">Select an object to see its controls</p>
            </div>
          )}

          {/* Canvas area */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto relative"
            style={{ backgroundColor: "#eef0f7" }}
          >
            {/* Outer padding wrapper — flex centers canvas, min sizes allow scroll when canvas > viewport */}
            <div className="flex items-center justify-center p-8" style={{ minHeight: "100%", minWidth: "max-content" }}>
              <div className="shadow-2xl rounded-sm" style={{ overflow: "hidden", lineHeight: 0 }}>
                <canvas ref={canvasRef} style={{ display: "block" }} />
              </div>
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-200 px-2 py-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(25, z - 10))}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 transition"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-medium w-11 text-center tabular-nums">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 transition"
              >
                <Plus className="h-3 w-3" />
              </button>
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => {
                  if (containerRef.current && template) {
                    const { offsetWidth: cw, offsetHeight: ch } = containerRef.current
                    const pad = 64
                    const fit = Math.floor(Math.min((cw - pad) / template.width, (ch - pad) / template.height) * 100)
                    setZoom(Math.max(10, Math.min(fit, 100)))
                  }
                }}
                className="px-1.5 text-[10px] font-semibold text-gray-500 hover:bg-gray-100 rounded transition"
                title="Fit to screen"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
        <aside className="w-72 border-l bg-white overflow-y-auto flex flex-col shrink-0">

          {/* LAYERS */}
          <PanelSection title="Layers">
            <div className="py-1">
              {layers.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 py-3">
                  No layers yet. Add objects using the toolbar.
                </p>
              ) : (
                [...layers].reverse().map((o, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={() => { dragSrcIdxRef.current = i }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragSrcIdxRef.current !== null) moveLayerToIndex(dragSrcIdxRef.current, i) }}
                    onClick={() => selectLayer(o)}
                    className={cn(
                      "group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-violet-50 transition select-none",
                      selectedObject === o && "bg-violet-50"
                    )}
                  >
                    <GripVertical className="h-3 w-3 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />
                    <LayerIcon type={o.type} isPlaceholder={(o as any).isPlaceholder} />
                    <span className={cn(
                      "flex-1 truncate text-xs",
                      selectedObject === o ? "text-violet-700 font-medium" : "text-gray-700"
                    )}>
                      {getLayerName(o)}
                    </span>
                    {/* Up */}
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayerUp(i) }}
                      title="Move up"
                      className="p-0.5 rounded hover:bg-violet-200 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-700 transition"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    {/* Down */}
                    <button
                      onClick={(e) => { e.stopPropagation(); moveLayerDown(i) }}
                      title="Move down"
                      className="p-0.5 rounded hover:bg-violet-200 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-700 transition"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {/* Visibility */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(o) }}
                      title={o.visible !== false ? "Hide" : "Show"}
                      className="p-0.5 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 text-gray-400 transition"
                    >
                      {o.visible !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </PanelSection>

          {/* ARRANGE */}
          {selectedObject && (
            <PanelSection title="Arrange">
              <div className="px-3 pt-2 pb-3 grid grid-cols-2 gap-2">
                <NumInput label="X" value={obj.left ?? 0} onChange={(v) => updateProp("left", v)} />
                <NumInput label="Y" value={obj.top ?? 0} onChange={(v) => updateProp("top", v)} />
                <NumInput
                  label="W"
                  value={(obj.width ?? 0) * (obj.scaleX ?? 1)}
                  onChange={(v) => updateProp("scaleX", v / (obj.width || 1))}
                />
                <NumInput
                  label="H"
                  value={(obj.height ?? 0) * (obj.scaleY ?? 1)}
                  onChange={(v) => updateProp("scaleY", v / (obj.height || 1))}
                />
              </div>
              <div className="px-3 pb-3">
                <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                  Rotation
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={360}
                    value={obj.angle ?? 0}
                    onChange={(e) => updateProp("angle", Number(e.target.value))}
                    className="flex-1 accent-violet-600"
                  />
                  <span className="text-xs tabular-nums text-gray-500 w-10 text-right">
                    {Math.round(obj.angle ?? 0)}°
                  </span>
                </div>
              </div>
            </PanelSection>
          )}

          {/* TEXT properties */}
          {isText && (
            <PanelSection title="Text">
              <div className="px-3 py-3 space-y-3">
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Content</label>
                  <textarea
                    rows={3}
                    value={obj?.text ?? ""}
                    onChange={(e) => updateProp("text", e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm resize-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Use {"{{variable}}"} for dynamic content</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Size</label>
                    <input
                      type="number" min={6} max={400}
                      value={obj?.fontSize ?? 32}
                      onChange={(e) => updateProp("fontSize", Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Font</label>
                    <select
                      value={obj?.fontFamily ?? "Inter"}
                      onChange={(e) => updateProp("fontFamily", e.target.value)}
                      className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-violet-400"
                    >
                      {["Inter", "Arial", "Helvetica", "Roboto", "Georgia", "Montserrat", "Oswald", "Playfair Display", "Courier New"].map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Style toggles */}
                <div className="flex gap-1 items-center">
                  {[
                    { label: "B", prop: "fontWeight", on: "bold", off: "normal", style: "font-bold" },
                    { label: "I", prop: "fontStyle", on: "italic", off: "normal", style: "italic" },
                  ].map(({ label, prop, on, off, style }) => (
                    <button
                      key={prop}
                      onClick={() => updateProp(prop, (obj as any)[prop] === on ? off : on)}
                      className={cn(
                        "w-7 h-7 rounded border text-xs transition",
                        style,
                        (obj as any)?.[prop] === on
                          ? "bg-violet-600 text-white border-violet-600"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => updateProp("underline", !obj?.underline)}
                    className={cn(
                      "w-7 h-7 rounded border text-xs transition underline",
                      obj?.underline
                        ? "bg-violet-600 text-white border-violet-600"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >U</button>

                  <div className="flex gap-1 ml-auto">
                    {["left", "center", "right"].map((a) => {
                      const icons: Record<string, any> = { left: AlignLeft, center: AlignCenter, right: AlignRight }
                      const Ic = icons[a]
                      return (
                        <button
                          key={a}
                          onClick={() => updateProp("textAlign", a)}
                          className={cn(
                            "w-7 h-7 rounded border text-xs flex items-center justify-center transition",
                            obj?.textAlign === a
                              ? "bg-violet-600 text-white border-violet-600"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          <Ic className="h-3 w-3" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color" value={fillColor}
                      onChange={(e) => updateProp("fill", e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-200 p-0.5 shrink-0"
                    />
                    <input
                      type="text" value={fillColor}
                      onChange={(e) => updateProp("fill", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-violet-400"
                    />
                  </div>
                </div>
              </div>
            </PanelSection>
          )}

          {/* SHAPE properties */}
          {isShape && (
            <PanelSection title={isFrame ? "Image Frame" : "Shape"}>
              <div className="px-3 py-3 space-y-3">
                {isFrame && (
                  <div className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2">
                    <SquareDashed className="h-4 w-4 text-violet-500 shrink-0" />
                    <p className="text-xs text-violet-700 leading-snug">Double-click the frame on the canvas to fill it with an image</p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Fill Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color" value={fillColor}
                      onChange={(e) => updateProp("fill", e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded border border-gray-200 p-0.5 shrink-0"
                    />
                    <input
                      type="text" value={fillColor}
                      onChange={(e) => updateProp("fill", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-violet-400"
                    />
                  </div>
                </div>
                {selectedObject?.type === "rect" && (
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                      Border Radius — {obj.rx ?? 0}px
                    </label>
                    <input
                      type="range" min={0} max={100}
                      value={obj.rx ?? 0}
                      onChange={(e) => {
                        updateProp("rx", Number(e.target.value))
                        updateProp("ry", Number(e.target.value))
                      }}
                      className="w-full accent-violet-600"
                    />
                  </div>
                )}
              </div>
            </PanelSection>
          )}

          {/* IMAGE properties */}
          {isImage && (
            <PanelSection title="Image">
              <div className="px-3 py-3 space-y-3">
                <button
                  onClick={replaceSelectedImage}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 text-xs text-gray-400 hover:border-violet-400 hover:text-violet-500 transition flex flex-col items-center gap-1"
                >
                  <ImageIcon className="h-5 w-5" />
                  Replace image
                </button>
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Corner Radius — {imgCornerRadius}px
                  </label>
                  <input
                    type="range" min={0} max={200}
                    value={imgCornerRadius}
                    onChange={(e) => applyImageCornerRadius(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>
              </div>
            </PanelSection>
          )}

          {/* IMAGE FILTERS — only when an image is selected */}
          {isImage && (
            <PanelSection title="Filters" defaultOpen={false}>
              <div className="px-3 py-3 space-y-3">
                {/* Grayscale */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">Grayscale</label>
                  <button
                    onClick={() => applyImageFilters({ grayscale: !hasGrayscale })}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      hasGrayscale ? "bg-violet-600" : "bg-gray-200"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      hasGrayscale ? "translate-x-[18px]" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                {/* Blur */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Blur — {filterBlurVal.toFixed(2)}
                  </label>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={filterBlurVal}
                    onChange={(e) => applyImageFilters({ blur: Number(e.target.value) })}
                    className="w-full accent-violet-600"
                  />
                </div>
                {/* Brightness */}
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Brightness — {filterBrightnessVal > 0 ? "+" : ""}{filterBrightnessVal.toFixed(2)}
                  </label>
                  <input
                    type="range" min={-1} max={1} step={0.01}
                    value={filterBrightnessVal}
                    onChange={(e) => applyImageFilters({ brightness: Number(e.target.value) })}
                    className="w-full accent-violet-600"
                  />
                </div>
              </div>
            </PanelSection>
          )}

          {/* EFFECTS (shadow) — shown for any selected object */}
          {selectedObject && (
            <PanelSection title="Effects" defaultOpen={false}>
              <div className="px-3 py-3 space-y-3">
                {/* Shadow toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">Drop Shadow</label>
                  <button
                    onClick={() => applyShadow({ enabled: !shadowEnabled })}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      shadowEnabled ? "bg-violet-600" : "bg-gray-200"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      shadowEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                    )} />
                  </button>
                </div>
                {shadowEnabled && (
                  <>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Shadow Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={shadowColor.startsWith("#") ? shadowColor : "#000000"}
                          onChange={(e) => applyShadow({ enabled: true, color: e.target.value })}
                          className="h-9 w-10 cursor-pointer rounded border border-gray-200 p-0.5 shrink-0"
                        />
                        <input
                          type="text"
                          value={shadowColor}
                          onChange={(e) => applyShadow({ enabled: true, color: e.target.value })}
                          className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-violet-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                        Blur — {shadowBlur}px
                      </label>
                      <input
                        type="range" min={0} max={60}
                        value={shadowBlur}
                        onChange={(e) => applyShadow({ enabled: true, blur: Number(e.target.value) })}
                        className="w-full accent-violet-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Offset X</label>
                        <input
                          type="number" min={-50} max={50}
                          value={shadowOffsetX}
                          onChange={(e) => applyShadow({ enabled: true, offsetX: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-violet-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Offset Y</label>
                        <input
                          type="number" min={-50} max={50}
                          value={shadowOffsetY}
                          onChange={(e) => applyShadow({ enabled: true, offsetY: Number(e.target.value) })}
                          className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs text-center focus:ring-1 focus:ring-violet-400 outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </PanelSection>
          )}

          {/* Canvas background — shown when nothing is selected */}
          {!selectedObject && (
            <>
              <div className="px-3 py-2">
                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Click an object on the canvas to edit its properties
                </p>
              </div>
              <PanelSection title="Canvas">
                <div className="px-3 py-3 space-y-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Background</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={typeof (fabricRef.current as any)?.backgroundColor === 'string' && (fabricRef.current as any)?.backgroundColor ? (fabricRef.current as any).backgroundColor : '#ffffff'}
                        onChange={(e) => {
                          const canvas = fabricRef.current
                          if (!canvas) return
                          canvas.set('backgroundColor', e.target.value)
                          canvas.renderAll()
                        }}
                        className="h-9 w-10 cursor-pointer rounded border border-gray-200 p-0.5 shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="#ffffff"
                        defaultValue="#ffffff"
                        onBlur={(e) => {
                          const canvas = fabricRef.current
                          if (!canvas) return
                          canvas.set('backgroundColor', e.target.value)
                          canvas.renderAll()
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const canvas = fabricRef.current
                            if (!canvas) return
                            canvas.set('backgroundColor', (e.target as HTMLInputElement).value)
                            canvas.renderAll()
                          }
                        }}
                        className="flex-1 border border-gray-200 rounded-md px-2 py-1.5 text-sm font-mono outline-none focus:ring-1 focus:ring-violet-400"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bg-transparent"
                      onChange={(e) => {
                        const canvas = fabricRef.current
                        if (!canvas) return
                        canvas.set('backgroundColor', e.target.checked ? '' : '#ffffff')
                        canvas.renderAll()
                      }}
                      className="accent-violet-600"
                    />
                    <label htmlFor="bg-transparent" className="text-xs text-gray-600 select-none cursor-pointer">
                      Transparent background
                    </label>
                  </div>
                </div>
              </PanelSection>
            </>
          )}

          {/* IMAGE SETTINGS — always visible */}
          <PanelSection title="Image Settings">
            <div className="px-3 py-3 space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Format</label>
                <select
                  value={imgFormat}
                  onChange={(e) => setImgFormat(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-violet-400"
                >
                  <option value="auto">Automatic</option>
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </div>
              {imgFormat !== "png" && (
                <div>
                  <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                    Quality — {imgQuality}%
                  </label>
                  <input
                    type="range" min={10} max={100} step={5}
                    value={imgQuality}
                    onChange={(e) => setImgQuality(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>
              )}
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">DPI</label>
                <select
                  value={imgDpi}
                  onChange={(e) => setImgDpi(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-violet-400"
                >
                  {(["72", "96", "150", "300"] as const).map((d) => (
                    <option key={d} value={d}>{d} DPI{d === "96" ? " (screen)" : d === "300" ? " (print)" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </PanelSection>

          {/* PDF SETTINGS — always visible */}
          <PanelSection title="PDF Settings" defaultOpen={false}>
            <div className="px-3 py-3 space-y-3">
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1.5 block uppercase tracking-wide">
                  Quality — {pdfQuality}%
                </label>
                <input
                  type="range" min={10} max={100} step={5}
                  value={pdfQuality}
                  onChange={(e) => setPdfQuality(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">DPI</label>
                <select
                  value={pdfDpi}
                  onChange={(e) => setPdfDpi(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-violet-400"
                >
                  {(["72", "96", "150", "300"] as const).map((d) => (
                    <option key={d} value={d}>{d} DPI{d === "96" ? " (screen)" : d === "150" ? " (web)" : d === "300" ? " (print)" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </PanelSection>

        </aside>
      </div>

      {/* ── DELETE CONFIRM ──────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-red-100 shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete template?</h3>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">"{templateName}"</span> will be permanently deleted.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-60"
              >
                {isDeleting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting…</> : <><Trash2 className="h-3.5 w-3.5" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEST MODAL ──────────────────────────────────────────────────── */}
      {showTestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowTestModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-lg font-semibold">Test Template</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {Object.keys(testVars).length === 0
                    ? "No {{variables}} detected in canvas"
                    : `${Object.keys(testVars).length} variable${Object.keys(testVars).length !== 1 ? "s" : ""} detected`}
                </p>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className={Object.keys(testVars).length > 0 && testImageUrl ? "grid grid-cols-2 gap-6" : ""}>

                {/* variable inputs + generate button */}
                <div className="space-y-4">
                  {Object.keys(testVars).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">
                        No{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs font-mono">{"{{variables}}"}</code>{" "}
                        found in this template.
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Add text layers using{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs font-mono">{"{{variable_name}}"}</code>{" "}
                        syntax to make them dynamic.
                      </p>
                    </div>
                  ) : (
                    Object.keys(testVars).map((v) => (
                      <div key={v}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-xs">{`{{${v}}}`}</span>
                        </label>
                        <input
                          type="text"
                          placeholder={`Value for ${v}…`}
                          value={testVars[v]}
                          onChange={(e) =>
                            setTestVars((prev) => ({ ...prev, [v]: e.target.value }))
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
                        />
                      </div>
                    ))
                  )}

                  {testError && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                      {testError}
                    </p>
                  )}

                  <button
                    disabled={testLoading}
                    onClick={async () => {
                      setTestLoading(true)
                      setTestError("")
                      setTestImageUrl(null)
                      try {
                        const res = await fetch(`/api/templates/${params.id}/preview`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ modifications: testVars }),
                        })
                        const data = await res.json()
                        if (!res.ok || data.error) throw new Error(data.error || "Generation failed")
                        setTestImageUrl(data.image_url)
                      } catch (e: any) {
                        setTestError(e.message || "Failed to generate preview")
                      } finally {
                        setTestLoading(false)
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition"
                  >
                    {testLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                    ) : (
                      <><Play className="h-4 w-4" /> Generate Preview</>
                    )}
                  </button>
                </div>

                {/* preview image */}
                {testImageUrl && (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</p>
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={testImageUrl} alt="Generated preview" className="w-full h-auto" />
                    </div>
                    <a
                      href={testImageUrl}
                      download={`${templateName || "preview"}.png`}
                      className="text-xs text-center text-violet-600 hover:text-violet-700 font-medium"
                    >
                      ↓ Download image
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
