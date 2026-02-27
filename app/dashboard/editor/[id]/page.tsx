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
  Grid3x3,
  Layers,
  Ungroup,
} from "lucide-react"
import { Canvas, IText, Rect, Circle, FabricImage, Group, type FabricObject } from "fabric"

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

function LayerIcon({ type }: { type: string | undefined }) {
  if (type === "i-text" || type === "text") return <Type className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "image") return <ImageIcon className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "rect") return <Square className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "circle") return <CircleIcon className="h-3 w-3 text-gray-400 shrink-0" />
  if (type === "group") return <Layers className="h-3 w-3 text-violet-400 shrink-0" />
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

  const [template, setTemplate] = useState<Template | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null)
  const [objRev, setObjRev] = useState(0)
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
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragSrcIndexRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<string[]>([])
  const histIndexRef = useRef(-1)
  const isLoadingHistoryRef = useRef(false)
  const clipboardRef = useRef<FabricObject | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; hasSelection: boolean; hasClipboard: boolean } | null>(null)

  // ── variables panel state ────────────────────────────────────────────────
  const [rightPanelTab, setRightPanelTab] = useState<"properties" | "variables">("properties")
  const [varValues, setVarValues] = useState<Record<string, string>>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState("")
  const [editingLayerObj, setEditingLayerObj] = useState<FabricObject | null>(null)
  const [editLayerName, setEditLayerName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [canvasBg, setCanvasBg] = useState("#ffffff")
  const [bgTransparent, setBgTransparent] = useState(false)

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
  const isMultiSelect = (selectedObject as any)?.type === "activeselection"
  const multiSelectCount = isMultiSelect ? ((selectedObject as any)?._objects?.length ?? 0) : 0
  const isGroup = selectedObject?.type === "group"
  const imgScaling: string = (obj as any)?.__imgScaling ?? "fill"
  const shrinkToFit: boolean = !!(obj as any)?.__shrinkToFit

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

    // ── history ────────────────────────────────────────────────────────────
    const pushHistory = () => {
      if (isLoadingHistoryRef.current) return
      historyRef.current = historyRef.current.slice(0, histIndexRef.current + 1)
      historyRef.current.push(JSON.stringify(canvas.toJSON()))
      histIndexRef.current = historyRef.current.length - 1
      setCanUndo(histIndexRef.current > 0)
      setCanRedo(false)
    }

    canvas.on("object:added", () => { updateLayers(); pushHistory() })
    canvas.on("object:removed", () => { updateLayers(); pushHistory() })
    canvas.on("object:modified", () => { updateLayers(); pushHistory() })
    canvas.on("selection:created", () => setSelectedObject(canvas.getActiveObject() ?? null))
    canvas.on("selection:updated", () => setSelectedObject(canvas.getActiveObject() ?? null))
    canvas.on("selection:cleared", () => setSelectedObject(null))

    // Load saved canvas state — await so objects are present before syncing layers
    if (template.canvasJson && Object.keys(template.canvasJson).length > 0) {
      canvas.loadFromJSON(template.canvasJson).then(() => {
        isLoadingHistoryRef.current = true
        canvas.renderAll()
        updateLayers()
        isLoadingHistoryRef.current = false
        // seed history with the loaded state
        historyRef.current = [JSON.stringify(canvas.toJSON())]
        histIndexRef.current = 0
        setCanUndo(false)
        setCanRedo(false)
        const bg = canvas.backgroundColor
        if (typeof bg === "string") {
          if (!bg) { setBgTransparent(true) }
          else { setCanvasBg(bg); setBgTransparent(false) }
        }
      })
    } else {
      updateLayers()
      historyRef.current = [JSON.stringify(canvas.toJSON())]
      histIndexRef.current = 0
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
  // ── snap to grid ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    const GRID = 10
    const handler = (e: any) => {
      const o = e.target
      if (!o) return
      o.set({
        left: Math.round((o.left ?? 0) / GRID) * GRID,
        top: Math.round((o.top ?? 0) / GRID) * GRID,
      })
    }
    if (snapToGrid) {
      canvas.on("object:moving", handler)
    } else {
      canvas.off("object:moving", handler)
    }
    return () => { canvas.off("object:moving", handler) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapToGrid])

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

      // Delete / Backspace — remove selected object(s)
      if ((e.key === "Delete" || e.key === "Backspace") && active) {
        e.preventDefault()
        if ((active as any).type === "activeselection") {
          ; (active as any).getObjects().forEach((o: FabricObject) => canvas.remove(o))
          canvas.discardActiveObject()
        } else {
          canvas.remove(active)
        }
        canvas.renderAll()
        return
      }

      // Ctrl/⌘+G — group selection
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "g") {
        const act = canvas.getActiveObject()
        if (act && (act as any).type === "activeselection") {
          e.preventDefault()
          groupSelected()
          return
        }
      }

      // Ctrl/⌘+Shift+G — ungroup
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "g") {
        const act = canvas.getActiveObject()
        if (act && (act as any).type === "group") {
          e.preventDefault()
          ungroupSelected()
          return
        }
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

      // Ctrl/⌘+C — copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && active) {
        e.preventDefault()
          ; (active as any).clone().then((clone: FabricObject) => { clipboardRef.current = clone })
        return
      }

      // Ctrl/⌘+V — paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault()
        const cb = clipboardRef.current
        if (!cb) return
          ; (cb as any).clone().then((clone: FabricObject) => {
            clone.set({ left: ((cb as any).left ?? 0) + 20, top: ((cb as any).top ?? 0) + 20 })
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

      // Escape — deselect + close context menu
      if (e.key === "Escape") {
        setCtxMenu(null)
        canvas.discardActiveObject()
        canvas.renderAll()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── scan canvas for {{variables}} when Variables tab is active ────────────
  useEffect(() => {
    if (rightPanelTab !== "variables") return
    const canvas = fabricRef.current
    if (!canvas) return
    const json = JSON.stringify(canvas.toJSON())
    const matches = [...json.matchAll(/\{\{(\w+)\}\}/g)]
    const names = [...new Set(matches.map((m) => m[1]))] as string[]
    setVarValues((prev) => Object.fromEntries(names.map((n) => [n, prev[n] ?? ""])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightPanelTab, layers])

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
          canvasJson: canvas.toJSON(),
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

  async function addImageContainer() {
    const canvas = fabricRef.current
    if (!canvas) return
    const imgCount = canvas.getObjects().filter(
      (o) => !!(o as any).name && /^\{\{image_\d+\}\}$/.test((o as any).name)
    ).length
    const varName = `{{image_${imgCount + 1}}}`
    const img = await FabricImage.fromURL(
      "https://placehold.co/400x300/e2e8f0/64748b?text=Image+Container"
    )
    img.scaleToWidth(200)
    ;(img as any).name = varName
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // reset so same file can be re-picked
    e.target.value = ""
    const canvas = fabricRef.current
    const target = selectedObject
    if (!canvas || !target || target.type !== "image") return
    const img = target as FabricImage
    // preserve current rendered dimensions
    const renderedW = (img.width ?? 400) * (img.scaleX ?? 1)
    const renderedH = (img.height ?? 300) * (img.scaleY ?? 1)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const url = ev.target?.result as string
      await img.setSrc(url)
      img.scaleX = renderedW / (img.width ?? renderedW)
      img.scaleY = renderedH / (img.height ?? renderedH)
      canvas.renderAll()
    }
    reader.readAsDataURL(file)
  }

  // ── property update ────────────────────────────────────────────────────────
  function updateProp(key: string, value: any) {
    const canvas = fabricRef.current
    if (!canvas || !selectedObject) return
    // @ts-ignore
    selectedObject.set(key, value)
    canvas.renderAll()
    setObjRev(r => r + 1) // force re-render safely
  }

  // ── alignment ──────────────────────────────────────────────────────────────
  function alignObject(dir: "left" | "right" | "centerH" | "top" | "bottom" | "centerV") {
    const canvas = fabricRef.current
    if (!canvas || !selectedObject) return
    const cw = template?.width ?? 800
    const ch = template?.height ?? 600
    const ow = (obj.width ?? 0) * (obj.scaleX ?? 1)
    const oh = (obj.height ?? 0) * (obj.scaleY ?? 1)
    const pos = {
      left: { left: 0 },
      right: { left: cw - ow },
      centerH: { left: (cw - ow) / 2 },
      top: { top: 0 },
      bottom: { top: ch - oh },
      centerV: { top: (ch - oh) / 2 },
    }[dir]
    selectedObject.set(pos)
    canvas.renderAll()
    setObjRev(r => r + 1)
  }

  function duplicateSelected() {
    const canvas = fabricRef.current
    if (!canvas || !selectedObject) return
    // @ts-ignore
    selectedObject.clone().then((clone: FabricObject) => {
      // @ts-ignore
      clone.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 })
      canvas.add(clone)
      canvas.setActiveObject(clone)
      canvas.renderAll()
    })
  }

  function deleteSelected() {
    const canvas = fabricRef.current
    if (!canvas || !selectedObject) return
    canvas.remove(selectedObject)
    canvas.renderAll()
  }

  function groupSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active || (active as any).type !== "activeselection") return
    const grp = (active as any).toGroup() as FabricObject
    canvas.setActiveObject(grp)
    canvas.requestRenderAll()
    setLayers([...(canvas.getObjects() ?? [])])
    setSelectedObject(grp)
  }

  function ungroupSelected() {
    const canvas = fabricRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active || (active as any).type !== "group") return
    const sel = (active as any).toActiveSelection() as FabricObject
    canvas.setActiveObject(sel)
    canvas.requestRenderAll()
    setLayers([...(canvas.getObjects() ?? [])])
    setSelectedObject(sel)
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

  function saveLayerName(o: FabricObject) {
    const name = editLayerName.trim()
    if (name) (o as any).name = name
    setEditingLayerObj(null)
    const canvas = fabricRef.current
    if (canvas) setLayers([...(canvas.getObjects())])
  }

  function lockObject(o: FabricObject) {
    const canvas = fabricRef.current
    if (!canvas) return
    o.set({
      lockMovementX: true, lockMovementY: true,
      lockScalingX: true, lockScalingY: true,
      lockRotation: true, selectable: false, evented: false,
    })
      ; (o as any).__locked = true
    canvas.discardActiveObject()
    canvas.renderAll()
    setLayers([...(canvas.getObjects())])
    setSelectedObject(null)
  }

  function unlockObject(o: FabricObject) {
    const canvas = fabricRef.current
    if (!canvas) return
    o.set({
      lockMovementX: false, lockMovementY: false,
      lockScalingX: false, lockScalingY: false,
      lockRotation: false, selectable: true, evented: true,
    })
      ; (o as any).__locked = false
    canvas.setActiveObject(o)
    canvas.renderAll()
    setLayers([...(canvas.getObjects())])
  }

  async function generatePreview() {
    setPreviewLoading(true)
    setPreviewError("")
    setPreviewUrl(null)
    try {
      const res = await fetch(`/api/templates/${params.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modifications: varValues }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Generation failed")
      setPreviewUrl(data.image_url)
    } catch (e: any) {
      setPreviewError(e.message || "Failed to generate preview")
    } finally {
      setPreviewLoading(false)
    }
  }

  function getLayerName(o: FabricObject) {
    const a = o as any
    if (a.name) return String(a.name)
    if (o.type === "i-text" || o.type === "text") return `Text: ${String(a.text ?? "").substring(0, 18)}`
    if (o.type === "image") return "Image"
    if (o.type === "rect") return "Rectangle"
    if (o.type === "circle") return "Circle"
    return o.type ?? "Object"
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

  const fillColor = typeof obj?.fill === "string" ? obj.fill : "#000000"

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
          {isEditingName ? (
            <input
              autoFocus
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") setIsEditingName(false)
                e.stopPropagation()
              }}
              className="bg-white/10 border border-white/30 rounded px-2 py-0.5 outline-none text-sm font-semibold text-white w-52"
            />
          ) : (
            <span
              onClick={() => setIsEditingName(true)}
              className="text-sm font-semibold text-white cursor-text hover:bg-white/10 rounded px-2 py-0.5 truncate max-w-[200px]"
            >
              {templateName || "Untitled"}
            </span>
          )}
          <button
            onClick={() => setIsEditingName(true)}
            title="Rename template"
            className="p-1 rounded hover:bg-white/10 transition"
          >
            <Pencil className="h-3 w-3 text-white/40 hover:text-white/70" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 border-r border-white/20 pr-2 mr-1">
            <button
              onClick={async () => {
                const canvas = fabricRef.current
                if (!canvas || histIndexRef.current <= 0) return
                histIndexRef.current--
                isLoadingHistoryRef.current = true
                await canvas.loadFromJSON(JSON.parse(historyRef.current[histIndexRef.current]))
                canvas.renderAll()
                setLayers([...(canvas.getObjects() ?? [])])
                isLoadingHistoryRef.current = false
                setCanUndo(histIndexRef.current > 0)
                setCanRedo(true)
              }}
              disabled={!canUndo}
              title="Undo"
              className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white disabled:opacity-30 transition"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={async () => {
                const canvas = fabricRef.current
                if (!canvas || histIndexRef.current >= historyRef.current.length - 1) return
                histIndexRef.current++
                isLoadingHistoryRef.current = true
                await canvas.loadFromJSON(JSON.parse(historyRef.current[histIndexRef.current]))
                canvas.renderAll()
                setLayers([...(canvas.getObjects() ?? [])])
                isLoadingHistoryRef.current = false
                setCanUndo(histIndexRef.current > 0)
                setCanRedo(histIndexRef.current < historyRef.current.length - 1)
              }}
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
              { icon: ImageIcon, label: "Image", action: addImageContainer },
              { icon: LayoutGrid, label: "Grid", action: null as any },
              { icon: Star, label: "Rating", action: null as any },
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
          <div className="border-b bg-white flex items-center gap-2 px-3 py-1.5 shrink-0 flex-wrap min-h-[40px]">
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
              <span className="text-gray-400 shrink-0">W</span>
              <input
                type="number" min={1}
                value={template.width}
                onChange={(e) => {
                  const v = Math.max(1, Math.round(Number(e.target.value)) || 1)
                  setTemplate(prev => prev ? { ...prev, width: v } : prev)
                  const canvas = fabricRef.current
                  if (canvas) { canvas.setDimensions({ width: v * (zoom / 100) }); canvas.renderAll() }
                }}
                className="border border-gray-200 rounded px-2 py-0.5 bg-white font-mono w-16 text-center text-xs outline-none focus:ring-1 focus:ring-violet-400"
              />
              <span className="text-gray-400 shrink-0">H</span>
              <input
                type="number" min={1}
                value={template.height}
                onChange={(e) => {
                  const v = Math.max(1, Math.round(Number(e.target.value)) || 1)
                  setTemplate(prev => prev ? { ...prev, height: v } : prev)
                  const canvas = fabricRef.current
                  if (canvas) { canvas.setDimensions({ height: v * (zoom / 100) }); canvas.renderAll() }
                }}
                className="border border-gray-200 rounded px-2 py-0.5 bg-white font-mono w-16 text-center text-xs outline-none focus:ring-1 focus:ring-violet-400"
              />
            </div>
            <div className="w-px h-5 bg-gray-200 shrink-0" />
            {/* Background controls */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-gray-400 shrink-0">BG</span>
              <input
                type="color"
                disabled={bgTransparent}
                value={bgTransparent ? "#ffffff" : canvasBg}
                onChange={(e) => {
                  const v = e.target.value
                  setCanvasBg(v)
                  const canvas = fabricRef.current
                  if (canvas) { canvas.set("backgroundColor", v); canvas.renderAll() }
                }}
                className="h-6 w-7 cursor-pointer rounded border border-gray-200 p-0 shrink-0 disabled:opacity-40"
              />
              <input
                type="text"
                disabled={bgTransparent}
                value={bgTransparent ? "transparent" : canvasBg}
                onChange={(e) => setCanvasBg(e.target.value)}
                onBlur={(e) => {
                  if (bgTransparent) return
                  const canvas = fabricRef.current
                  if (canvas) { canvas.set("backgroundColor", e.target.value); canvas.renderAll() }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !bgTransparent) {
                    const canvas = fabricRef.current
                    if (canvas) { canvas.set("backgroundColor", canvasBg); canvas.renderAll() }
                  }
                }}
                className="border border-gray-200 rounded px-1.5 py-0.5 font-mono text-xs w-[72px] outline-none focus:ring-1 focus:ring-violet-400 disabled:opacity-40 disabled:bg-gray-50"
              />
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={bgTransparent}
                  onChange={(e) => {
                    const t = e.target.checked
                    setBgTransparent(t)
                    const canvas = fabricRef.current
                    if (canvas) { canvas.set("backgroundColor", t ? "" : canvasBg); canvas.renderAll() }
                  }}
                  className="accent-violet-600"
                />
                Transparent
              </label>
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
              className="ml-auto p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition shrink-0"
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
                  onClick={() => { fabricRef.current?.bringObjectForward(selectedObject); fabricRef.current?.renderAll() }}
                />
                <ToolbarBtn
                  icon={SendToBack}
                  title="Send Backward"
                  onClick={() => { fabricRef.current?.sendObjectBackwards(selectedObject); fabricRef.current?.renderAll() }}
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
              {isMultiSelect && (
                <>
                  <span className="text-xs text-gray-500 font-medium border-r border-gray-200 pr-2 mr-1">
                    {multiSelectCount} selected
                  </span>
                  <ToolbarBtn icon={Layers} title="Group (Ctrl+G)" onClick={groupSelected} />
                  <ToolbarBtn icon={Copy} title="Duplicate all" onClick={duplicateSelected} />
                  <ToolbarBtn icon={Trash2} title="Delete all" onClick={deleteSelected} className="hover:!text-red-500 hover:!bg-red-50" />
                </>
              )}
              {!isMultiSelect && (
                <>{/* Actions */}
                  <div className="flex items-center gap-0.5 ml-auto">
                    {isGroup && (
                      <ToolbarBtn icon={Ungroup} title="Ungroup (Ctrl+Shift+G)" onClick={ungroupSelected} />
                    )}
                    <ToolbarBtn icon={Copy} title="Duplicate" onClick={duplicateSelected} />
                    <ToolbarBtn icon={Trash2} title="Delete" onClick={deleteSelected} className="hover:!text-red-500 hover:!bg-red-50" />
                  </div>
                </>
              )}
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
            onDoubleClick={(e) => {
              if ((e.target as HTMLElement).tagName === "CANVAS") return
              if (containerRef.current && template) {
                const { offsetWidth: cw, offsetHeight: ch } = containerRef.current
                const pad = 64
                const fit = Math.floor(
                  Math.min((cw - pad) / template.width, (ch - pad) / template.height) * 100
                )
                setZoom(Math.max(10, Math.min(fit, 100)))
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              const canvas = fabricRef.current
              if (!canvas) return
              const active = canvas.getActiveObject()
              const hasClipboard = !!clipboardRef.current
              // Open menu if there is a selection OR something in the clipboard
              if (!active && !hasClipboard) return
              setCtxMenu({ x: e.clientX, y: e.clientY, hasSelection: !!active, hasClipboard })
            }}
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
              <div className="w-px h-4 bg-gray-200 mx-0.5" />
              <button
                onClick={() => setSnapToGrid((s) => !s)}
                className={`p-1 rounded transition ${snapToGrid ? "bg-violet-100 text-violet-600" : "text-gray-400 hover:bg-gray-100"}`}
                title="Snap to grid (10px)"
              >
                <Grid3x3 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
        <aside className="w-72 border-l bg-white flex flex-col shrink-0">

          {/* ── Tab toggle ─────────────────────────────────────────────── */}
          <div className="flex border-b shrink-0">
            <button
              onClick={() => setRightPanelTab("properties")}
              className={cn(
                "flex-1 py-2 text-xs font-medium transition",
                rightPanelTab === "properties"
                  ? "text-violet-600 border-b-2 border-violet-500 bg-violet-50/50"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >Properties</button>
            <button
              onClick={() => setRightPanelTab("variables")}
              className={cn(
                "flex-1 py-2 text-xs font-medium transition",
                rightPanelTab === "variables"
                  ? "text-violet-600 border-b-2 border-violet-500 bg-violet-50/50"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >Variables</button>
          </div>

          {rightPanelTab === "properties" ? (
            <div className="flex-1 overflow-y-auto flex flex-col">

              {/* LAYERS */}
              <PanelSection title="Layers">
                <div className="py-1">
                  {layers.length === 0 ? (
                    <p className="text-xs text-gray-400 px-3 py-3">
                      No layers yet. Add objects using the toolbar.
                    </p>
                  ) : (
                    [...layers].reverse().map((o, i) => (
                      <div key={i}>
                        {dragOverIndex === i && (
                          <div className="h-0.5 bg-blue-500 mx-3 rounded" />
                        )}
                        <div
                          draggable
                          onDragStart={() => { dragSrcIndexRef.current = i }}
                          onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i) }}
                          onDragLeave={() => setDragOverIndex(null)}
                          onDrop={(e) => {
                            e.preventDefault()
                            setDragOverIndex(null)
                            const src = dragSrcIndexRef.current
                            if (src === null || src === i) return
                            dragSrcIndexRef.current = null
                            const canvas = fabricRef.current
                            if (!canvas) return
                            // layers is bottom-to-top; reverse index → canvas index
                            const total = layers.length
                            const srcCanvas = total - 1 - src
                            const dstCanvas = total - 1 - i
                            const obj = canvas.item(srcCanvas)
                            if (!obj) return
                            canvas.remove(obj)
                            canvas.insertAt(dstCanvas, obj)
                            canvas.renderAll()
                            setLayers([...(canvas.getObjects() ?? [])])
                          }}
                          onClick={() => selectLayer(o)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 cursor-grab hover:bg-violet-50 text-sm transition",
                            selectedObject === o && "bg-violet-50"
                          )}
                        >
                          <LayerIcon type={o.type} />
                          {editingLayerObj === o ? (
                            <input
                              type="text"
                              autoFocus
                              value={editLayerName}
                              onChange={(e) => setEditLayerName(e.target.value)}
                              onBlur={() => saveLayerName(o)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveLayerName(o)
                                if (e.key === "Escape") setEditingLayerObj(null)
                                e.stopPropagation()
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-xs border border-violet-400 rounded px-1 py-0.5 outline-none bg-white min-w-0"
                            />
                          ) : (
                            <span
                              onDoubleClick={(e) => { e.stopPropagation(); setEditingLayerObj(o); setEditLayerName(getLayerName(o)) }}
                              className={cn("flex-1 truncate text-xs", selectedObject === o ? "text-violet-700 font-medium" : "text-gray-700")}
                            >
                              {getLayerName(o)}
                            </span>
                          )}
                          {editingLayerObj !== o && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingLayerObj(o); setEditLayerName(getLayerName(o)) }}
                              className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 text-gray-400 shrink-0"
                              title="Rename layer"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}
                          {(o as any).__locked && (
                            <Lock className="h-3 w-3 text-amber-400 shrink-0" aria-label="Locked" />
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleVisibility(o) }}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 shrink-0"
                            title={o.visible ? "Hide layer" : "Show layer"}
                          >
                            {o.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>
                          <RefreshCw className="h-3 w-3 text-violet-300 shrink-0" aria-label="Dynamic layer" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PanelSection>

              {/* ARRANGE */}
              {selectedObject && isMultiSelect && (
                <PanelSection title="Selection">
                  <div className="px-3 py-3 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">{multiSelectCount} objects selected</p>
                    <button
                      onClick={() => { fabricRef.current?.discardActiveObject(); fabricRef.current?.renderAll() }}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 hover:bg-gray-50 transition"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="w-full text-xs border border-red-200 text-red-600 rounded px-2 py-1.5 hover:bg-red-50 transition"
                    >
                      Delete All
                    </button>
                  </div>
                </PanelSection>
              )}
              {selectedObject && !isMultiSelect && (
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
                      <input
                        type="number"
                        min={0}
                        max={360}
                        value={Math.round(obj.angle ?? 0)}
                        onChange={(e) => updateProp("angle", Number(e.target.value))}
                        className="w-14 text-xs border border-gray-200 rounded px-1.5 py-1 text-right outline-none focus:ring-1 focus:ring-violet-400"
                      />
                    </div>
                  </div>
                  {/* Lock / Unlock */}
                  <div className="px-3 pb-3">
                    {(obj as any).__locked ? (
                      <button
                        onClick={() => unlockObject(selectedObject!)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs rounded-lg border border-amber-300 bg-amber-50 text-amber-700 py-1.5 hover:bg-amber-100 transition"
                      >
                        <Lock className="h-3 w-3" />
                        Locked — click to unlock
                      </button>
                    ) : (
                      <button
                        onClick={() => lockObject(selectedObject!)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 py-1.5 hover:bg-gray-50 transition"
                      >
                        <Lock className="h-3 w-3" />
                        Lock object
                      </button>
                    )}
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
                    <div className="flex items-center justify-between pt-1">
                      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Shrink to fit</label>
                      <button
                        onClick={() => updateProp("__shrinkToFit", !shrinkToFit)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${shrinkToFit ? "bg-violet-600" : "bg-gray-200"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${shrinkToFit ? "translate-x-4" : ""}`} />
                      </button>
                    </div>
                </PanelSection>
              )}

              {/* SHAPE properties */}
              {isShape && (
                <PanelSection title="Shape">
                  <div className="px-3 py-3 space-y-3">
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
                  <div className="px-3 py-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-lg py-5 text-xs text-gray-400 hover:border-violet-400 hover:text-violet-500 transition flex flex-col items-center gap-1"
                    >
                      <ImageIcon className="h-5 w-5" />
                      Replace image (from file)
                    </button>

                    <div className="mt-3">
                      <label className="text-[10px] font-medium text-gray-400 mb-1 block uppercase tracking-wide">Image Scaling</label>
                      <select
                        value={imgScaling}
                        onChange={(e) => updateProp("__imgScaling", e.target.value)}
                        className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm bg-white outline-none focus:ring-1 focus:ring-violet-400"
                      >
                        <option value="fill">Fill (stretch)</option>
                        <option value="cover">Cover (crop to fit)</option>
                        <option value="contain">Contain (letterbox)</option>
                      </select>
                    </div>
                  </div>
                </PanelSection>
              )}

              {/* Canvas background — shown when nothing is selected */}
              {!selectedObject && (
                <div className="px-3 py-2">
                  <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                    Click an object on the canvas to edit its properties
                  </p>
                </div>
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

            </div>
          ) : (
            /* ── VARIABLES TAB ────────────────────────────────────────── */
            <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                {Object.keys(varValues).length === 0
                  ? 'No \u007b\u007bvariables\u007d\u007d found. Add text layers using \u007b\u007bname\u007d\u007d syntax.'
                  : `${Object.keys(varValues).length} variable${Object.keys(varValues).length !== 1 ? "s" : ""} detected`}
              </p>
              {Object.keys(varValues).map((v) => (
                <div key={v}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-xs">{`{{${v}}}`}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={`Value for ${v}…`}
                    value={varValues[v]}
                    onChange={(e) => setVarValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400"
                  />
                </div>
              ))}
              {previewError && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{previewError}</p>
              )}
              <div className="mt-auto pt-2">
                <button
                  disabled={previewLoading}
                  onClick={generatePreview}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold py-2.5 text-sm transition"
                >
                  {previewLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  ) : (
                    <><Play className="h-4 w-4" /> Generate Preview</>
                  )}
                </button>
              </div>
              {previewUrl && (
                <div className="flex flex-col gap-2">
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={previewUrl} alt="Generated preview" className="w-full h-auto" />
                  </div>
                  <a
                    href={previewUrl}
                    download={`${templateName || "preview"}.png`}
                    className="text-xs text-center text-violet-600 hover:text-violet-700 font-medium"
                  >
                    ↓ Download image
                  </a>
                </div>
              )}
            </div>
          )}
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


      {/* ── right-click context menu ───────────────────────────────────────────────────── */}
      {ctxMenu && (
        <>
          {/* invisible backdrop to catch outside clicks */}
          <div className="fixed inset-0 z-40" onClick={() => setCtxMenu(null)} />
          <div
            className="fixed z-50 min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-xl py-1 text-sm"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            {/* ── Copy (only when an object is selected) ── */}
            {ctxMenu.hasSelection && (
              <button
                onClick={() => {
                  const active = fabricRef.current?.getActiveObject()
                  if (active) {
                    ;(active as any).clone().then((clone: FabricObject) => {
                      clipboardRef.current = clone
                    })
                  }
                  setCtxMenu(null)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 transition text-left text-gray-700"
              >
                <span className="text-xs w-4 text-center">⧉</span>
                Copy
              </button>
            )}

            {/* ── Paste (only when clipboard has content) ── */}
            {ctxMenu.hasClipboard && (
              <button
                onClick={() => {
                  const canvas = fabricRef.current
                  const cb = clipboardRef.current
                  if (canvas && cb) {
                    ;(cb as any).clone().then((clone: FabricObject) => {
                      clone.set({
                        left: ((cb as any).left ?? 0) + 20,
                        top:  ((cb as any).top  ?? 0) + 20,
                      })
                      canvas.add(clone)
                      canvas.setActiveObject(clone)
                      canvas.renderAll()
                    })
                  }
                  setCtxMenu(null)
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 transition text-left text-gray-700"
              >
                <span className="text-xs w-4 text-center">📋</span>
                Paste
              </button>
            )}

            {/* ── Divider between clipboard actions and object actions ── */}
            {ctxMenu.hasSelection && (
              <div className="my-1 border-t border-gray-100" />
            )}

            {/* ── Object actions (only when something is selected) ── */}
            {ctxMenu.hasSelection && (
              <>
                {([
                  {
                    label: "Bring to Front",
                    icon: "⬆",
                    action: () => {
                      const c = fabricRef.current; const o = c?.getActiveObject()
                      if (c && o) { c.bringObjectToFront(o); c.renderAll() }
                    },
                  },
                  {
                    label: "Send to Back",
                    icon: "⬇",
                    action: () => {
                      const c = fabricRef.current; const o = c?.getActiveObject()
                      if (c && o) { c.sendObjectToBack(o); c.renderAll() }
                    },
                  },
                  {
                    label: "Duplicate",
                    icon: "⊞",
                    action: () => { duplicateSelected() },
                  },
                  { label: "---", icon: "", action: null },
                  {
                    label: "Delete",
                    icon: "🗑",
                    danger: true,
                    action: () => { deleteSelected() },
                  },
                ] as Array<{ label: string; icon: string; danger?: boolean; action: (() => void) | null }>).map((item, idx) =>
                  item.label === "---" ? (
                    <div key={idx} className="my-1 border-t border-gray-100" />
                  ) : (
                    <button
                      key={idx}
                      onClick={() => { item.action?.(); setCtxMenu(null) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 transition text-left ${item.danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"}`}
                    >
                      <span className="text-xs w-4 text-center">{item.icon}</span>
                      {item.label}
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  )
}
