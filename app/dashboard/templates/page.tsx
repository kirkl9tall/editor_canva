"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Plus, FileText, Folder, X, ChevronRight, Loader2, Trash2, AlertTriangle, Search, ChevronDown as SortIcon, CopyPlus, Pencil, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Template {
  id: string
  name: string
  width: number
  height: number
  previewUrl: string | null
  updatedAt: string
  project: { id: string; name: string }
}

interface Project {
  id: string
  name: string
}

function Modal({
  title,
  onClose,
  children,
  size = "md",
  contentClassName = "px-6 py-5",
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
  size?: "md" | "xl"
  contentClassName?: string
}) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${size === "xl" ? "max-w-3xl" : "max-w-md"} mx-4 overflow-hidden`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-black text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  )
}

const PRESETS = [
  { label: "Feed Square", w: 1200, h: 1200 },
  { label: "Instagram Post", w: 1080, h: 1080 },
  { label: "Instagram Story", w: 1080, h: 1920 },
  { label: "Pinterest Pin", w: 1000, h: 1500 },
  { label: "Twitter/X Post", w: 1200, h: 675 },
  { label: "LinkedIn Banner", w: 1584, h: 396 },
  { label: "Open Graph", w: 1200, h: 630 },
  { label: "A4 Document", w: 794, h: 1123 },
]

const PRESET_CATEGORIES = ["All", "Social Media", "Ads & Display", "Print", "Email", "Presentations"]

const PRESET_TEMPLATES = [
  { id: "feed-square", name: "Feed Square", category: "Social Media", w: 1200, h: 1200, img: "https://picsum.photos/seed/feedsquare/320/320" },
  { id: "ig-post", name: "Instagram Post", category: "Social Media", w: 1080, h: 1080, img: "https://picsum.photos/seed/igpost/320/320" },
  { id: "ig-story", name: "Instagram Story", category: "Social Media", w: 1080, h: 1920, img: "https://picsum.photos/seed/igstory/180/320" },
  { id: "pinterest", name: "Pinterest Pin", category: "Social Media", w: 1000, h: 1500, img: "https://picsum.photos/seed/pinterest/213/320" },
  { id: "tw-post", name: "Twitter/X Post", category: "Social Media", w: 1200, h: 675, img: "https://picsum.photos/seed/tweet/320/180" },
  { id: "fb-post", name: "Facebook Post", category: "Social Media", w: 1200, h: 630, img: "https://picsum.photos/seed/fbpost/320/168" },
  { id: "li-post", name: "LinkedIn Post", category: "Social Media", w: 1200, h: 627, img: "https://picsum.photos/seed/lipost/320/167" },
  { id: "li-banner", name: "LinkedIn Banner", category: "Social Media", w: 1584, h: 396, img: "https://picsum.photos/seed/libanner/400/100" },
  { id: "og-image", name: "Open Graph", category: "Ads & Display", w: 1200, h: 630, img: "https://picsum.photos/seed/ogimg/320/168" },
  { id: "leaderboard", name: "Leaderboard", category: "Ads & Display", w: 728, h: 90, img: "https://picsum.photos/seed/leader/400/49" },
  { id: "medium-rect", name: "Medium Rectangle", category: "Ads & Display", w: 300, h: 250, img: "https://picsum.photos/seed/medrect/320/267" },
  { id: "fb-ad", name: "Facebook Ad", category: "Ads & Display", w: 1080, h: 1080, img: "https://picsum.photos/seed/fbad2/320/320" },
  { id: "a4-doc", name: "A4 Document", category: "Print", w: 794, h: 1123, img: "https://picsum.photos/seed/a4doc/226/320" },
  { id: "business-card", name: "Business Card", category: "Print", w: 1050, h: 600, img: "https://picsum.photos/seed/bizcard/320/183" },
  { id: "poster-a3", name: "Poster A3", category: "Print", w: 1123, h: 1587, img: "https://picsum.photos/seed/postera3/226/320" },
  { id: "email-header", name: "Email Header", category: "Email", w: 600, h: 200, img: "https://picsum.photos/seed/emailhdr/320/107" },
  { id: "email-banner", name: "Email Banner", category: "Email", w: 600, h: 300, img: "https://picsum.photos/seed/emailbnr/320/160" },
  { id: "slide-169", name: "Slide 16:9", category: "Presentations", w: 1920, h: 1080, img: "https://picsum.photos/seed/slide169/320/180" },
  { id: "slide-43", name: "Slide 4:3", category: "Presentations", w: 1024, h: 768, img: "https://picsum.photos/seed/slide43/320/240" },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest")

  const [showProjectDialog, setShowProjectDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)

  const [projectName, setProjectName] = useState("")
  const [savingProject, setSavingProject] = useState(false)
  const [projectError, setProjectError] = useState("")

  const [templateName, setTemplateName] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [canvasW, setCanvasW] = useState(1200)
  const [canvasH, setCanvasH] = useState(630)
  const [newTemplateTab, setNewTemplateTab] = useState<"presets" | "custom">("presets")
  const [presetCategory, setPresetCategory] = useState("All")
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateError, setTemplateError] = useState("")

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/projects"),
      ])
      const tData = await tRes.json()
      const pData = await pRes.json()
      const loadedProjects: Project[] = pData.projects ?? []
      setTemplates(tData.templates ?? [])
      setProjects(loadedProjects)
      if (loadedProjects.length > 0) setSelectedProjectId(loadedProjects[0].id)
    } catch {
      // silent — empty state shown
    } finally {
      setIsLoading(false)
    }
  }

  function openProjectDialog() {
    setProjectName("")
    setProjectError("")
    setShowProjectDialog(true)
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) { setProjectError("Name is required"); return }
    setSavingProject(true)
    setProjectError("")
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const np: Project = data.project
      setProjects((prev) => [np, ...prev])
      setSelectedProjectId(np.id)
      setShowProjectDialog(false)
    } catch {
      setProjectError("Failed to create project. Please try again.")
    } finally {
      setSavingProject(false)
    }
  }

  function openTemplateDialog() {
    if (projects.length === 0) { openProjectDialog(); return }
    setTemplateName("")
    setTemplateError("")
    setCanvasW(1200)
    setCanvasH(630)
    setNewTemplateTab("presets")
    setPresetCategory("All")
    setSelectedPresetId(null)
    setShowTemplateDialog(true)
  }

  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!templateName.trim()) { setTemplateError("Name is required"); return }
    if (!selectedProjectId) { setTemplateError("Select a project"); return }
    if (canvasW < 1 || canvasH < 1) { setTemplateError("Invalid canvas size"); return }
    setSavingTemplate(true)
    setTemplateError("")
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName.trim(),
          projectId: selectedProjectId,
          width: canvasW,
          height: canvasH,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/dashboard/editor/${data.template.id}`)
    } catch {
      setTemplateError("Failed to create template. Please try again.")
      setSavingTemplate(false)
    }
  }

  async function handleDeleteTemplate(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      setDeleteConfirmId(null)
    } catch {
      // keep confirm visible on error
    } finally {
      setDeletingId(null)
    }
  }

  async function handleDuplicateTemplate(id: string) {
    setDuplicatingId(id)
    try {
      const res = await fetch(`/api/templates/${id}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTemplates((prev) => [data.template, ...prev])
    } catch {
      // silent
    } finally {
      setDuplicatingId(null)
    }
  }

  async function handleRenameTemplate(id: string, name: string) {
    const trimmed = name.trim()
    setEditingId(null)
    if (!trimmed) return
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      })
      if (!res.ok) throw new Error()
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, name: trimmed } : t))
    } catch {
      // silent — local state was already updated optimistically by setTemplates above
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Dashboard • Templates</p>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">Templates</h1>
            <p className="text-gray-500 text-sm mt-0.5">Create and manage your image templates</p>
          </div>
          <div className="flex gap-2 mt-1 shrink-0">
            <button
              type="button"
              onClick={openProjectDialog}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-black text-gray-700 transition-colors"
            >
              <Folder className="h-3.5 w-3.5" /> New Project
            </button>
            <button
              type="button"
              onClick={openTemplateDialog}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Template
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition-shadow"
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "az")}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="az">A → Z</option>
            </select>
            <SortIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {projects.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-xs font-black text-gray-600 border border-gray-200 shadow-sm">
              <Folder className="h-3 w-3" />
              {p.name}
            </span>
          ))}
        </div>
      )}

      {templates.length === 0 ? (
        <Card className="rounded-2xl ring-1 ring-black/5 border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl bg-violet-50 p-5 mb-5">
              <FileText className="h-10 w-10 text-violet-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">No templates yet</h3>
            <p className="text-gray-500 mb-6 max-w-xs">
              {projects.length === 0
                ? "Create a project first, then add your first template"
                : "Create your first template to get started"}
            </p>
            <div className="flex gap-2">
              {projects.length === 0 && (
                <button type="button" onClick={openProjectDialog} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-black text-gray-700 transition-colors">
                  <Folder className="h-3.5 w-3.5" /> New Project
                </button>
              )}
              <button type="button" onClick={openTemplateDialog} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition-colors">
                <Plus className="h-3.5 w-3.5" /> Create Template
              </button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {(() => {
            const filtered = templates
              .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
              .sort((a, b) => {
                if (sortBy === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                if (sortBy === "oldest") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                return a.name.localeCompare(b.name)
              })
            if (filtered.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No templates match <span className="font-medium">"{search}"</span></p>
                  <button onClick={() => setSearch("")} className="mt-2 text-sm text-violet-600 hover:underline">Clear search</button>
                </div>
              )
            }
            return (
              <div className="flex flex-col gap-2">
                {filtered.map((template) => {
                  const isConfirming = deleteConfirmId === template.id
                  const isDeleting = deletingId === template.id
                  return (
                    <div
                      key={template.id}
                      className={`group flex items-center gap-4 p-4 bg-white rounded-xl border transition-all duration-300 ease-out ${
                        isConfirming
                          ? "border-red-200 ring-1 ring-red-100"
                          : "border-gray-200 hover:border-violet-200 hover:shadow-md"
                      }`}
                    >
                      {/* Preview */}
                      <div className="shrink-0 w-20 h-14 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center">
                        {template.previewUrl ? (
                          <img src={template.previewUrl} alt={template.name} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="h-5 w-5 text-gray-200" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {editingId === template.id ? (
                          <input
                            value={editingName}
                            autoFocus
                            className="text-sm font-black border border-violet-400 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-violet-300 w-full max-w-xs"
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleRenameTemplate(template.id, editingName)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameTemplate(template.id, editingName)
                              if (e.key === "Escape") setEditingId(null)
                            }}
                          />
                        ) : (
                          <Link href={`/dashboard/editor/${template.id}`}>
                            <h3
                              className="text-sm font-black text-gray-900 truncate hover:text-violet-600 transition-colors cursor-pointer"
                              title="Double-click to rename"
                              onDoubleClick={(e) => {
                                e.preventDefault()
                                setEditingId(template.id)
                                setEditingName(template.name)
                              }}
                            >
                              {template.name}
                            </h3>
                          </Link>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                            <Folder className="h-2.5 w-2.5" />{template.project.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-mono leading-4">
                            {template.id.slice(0, 14)}
                          </span>
                          <span className="text-[10px] text-gray-400">{template.width}×{template.height}px</span>
                        </div>
                      </div>

                      {/* Actions */}
                      {!isConfirming ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link href={`/dashboard/editor/${template.id}`}>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-black transition-colors">
                              <Pencil className="h-3 w-3 text-violet-500" /> EDIT
                            </span>
                          </Link>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(template.id)
                              setCopiedId(template.id)
                              setTimeout(() => setCopiedId(null), 2000)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 text-[10px] font-black transition-colors"
                          >
                            {copiedId === template.id
                              ? <><Check className="h-3 w-3 text-emerald-500" /><span>COPIED</span></>
                              : <><Copy className="h-3 w-3 text-violet-500" /><span>COPY ID</span></>}
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template.id)}
                            disabled={duplicatingId === template.id}
                            className="p-1.5 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-50"
                            title="Duplicate"
                          >
                            {duplicatingId === template.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <CopyPlus className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(template.id)}
                            className="p-1.5 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-xs font-black text-red-700">Delete?</span>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={isDeleting}
                            className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-black text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                          >
                            {isDeleting ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-black text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </>
      )}

      {showProjectDialog && (
        <Modal title="New Project" onClose={() => setShowProjectDialog(false)}>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Social Media Campaign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
              />
              {projectError && <p className="text-sm text-red-500">{projectError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowProjectDialog(false)} className="px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-black text-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={savingProject} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition-colors disabled:opacity-60">
                {savingProject && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Project
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showTemplateDialog && (
        <Modal
          title="New Template"
          onClose={() => setShowTemplateDialog(false)}
          size="xl"
          contentClassName="p-0"
        >
          {/* ── Tabs ───────────────────────────────────── */}
          <div className="flex px-6 pt-3 pb-0 gap-1 border-b">
            {(["presets", "custom"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setNewTemplateTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${newTemplateTab === tab
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab === "presets" ? "🗂  Presets" : "✏️  Custom Size"}
              </button>
            ))}
          </div>

          {/* ── Presets tab ─────────────────────────────── */}
          {newTemplateTab === "presets" && (
            <div className="flex border-b" style={{ height: 336 }}>
              {/* Left: category sidebar */}
              <div className="w-40 shrink-0 border-r bg-gray-50 overflow-y-auto py-2">
                {PRESET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(cat)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${presetCategory === cat
                        ? "bg-white text-violet-700 font-medium border-r-2 border-violet-500"
                        : "text-muted-foreground hover:bg-white hover:text-foreground"
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {/* Right: preset card grid */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-2.5">
                  {PRESET_TEMPLATES.filter(
                    (p) => presetCategory === "All" || p.category === presetCategory
                  ).map((preset) => {
                    const isSelected = selectedPresetId === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedPresetId(preset.id)
                          setCanvasW(preset.w)
                          setCanvasH(preset.h)
                          if (!templateName || PRESET_TEMPLATES.some((p) => p.name === templateName)) {
                            setTemplateName(preset.name)
                          }
                        }}
                        className={`text-left rounded-xl border overflow-hidden transition-all ${isSelected
                            ? "border-violet-500 ring-2 ring-violet-300 shadow-sm"
                            : "border-border hover:border-violet-300 hover:shadow-sm"
                          }`}
                      >
                        <div className="bg-gray-100 overflow-hidden" style={{ height: 70 }}>
                          <img
                            src={preset.img}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-2 py-1.5">
                          <div className="text-xs font-medium leading-snug truncate">{preset.name}</div>
                          <div className="text-[10px] text-muted-foreground">{preset.w}×{preset.h}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Custom tab ───────────────────────────────── */}
          {newTemplateTab === "custom" && (
            <div className="px-6 pt-4 pb-2 space-y-3">
              <Label className="text-sm">Canvas size</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => { setCanvasW(preset.w); setCanvasH(preset.h); setSelectedPresetId(null) }}
                    className={`text-left px-2.5 py-2 rounded-lg border text-xs leading-tight transition ${canvasW === preset.w && canvasH === preset.h
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="opacity-60 mt-0.5">{preset.w}×{preset.h}</div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Width (px)</Label>
                  <Input type="number" min={1} max={8000} value={canvasW} onChange={(e) => setCanvasW(Number(e.target.value))} />
                </div>
                <span className="mt-5 text-muted-foreground">×</span>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Height (px)</Label>
                  <Input type="number" min={1} max={8000} value={canvasH} onChange={(e) => setCanvasH(Number(e.target.value))} />
                </div>
              </div>
            </div>
          )}

          {/* ── Footer (always visible) ───────────────────── */}
          <form onSubmit={handleCreateTemplate} className="px-6 pt-4 pb-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Template name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Product Launch Card"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                autoFocus={newTemplateTab === "custom"}
              />
            </div>
            {projects.length > 1 && (
              <div className="space-y-1.5">
                <Label>Project</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            {templateError && <p className="text-sm text-red-500">{templateError}</p>}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs text-muted-foreground tabular-nums">
                {canvasW} × {canvasH} px
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowTemplateDialog(false)} className="px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-black text-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={savingTemplate} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-black transition-colors disabled:opacity-60">
                  {savingTemplate && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create &amp; Open Editor
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
