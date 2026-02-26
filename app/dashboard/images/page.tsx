"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Loader2, Download, Image as ImageIcon, Search, ChevronLeft,
  ChevronRight, Copy, Check, Trash2, AlertTriangle,
} from "lucide-react"
import Link from "next/link"

interface GeneratedImage {
  id: string
  imageUrl: string
  format: string
  createdAt: string
  template: {
    id: string
    name: string
    width: number
    height: number
  }
}

const PAGE_SIZE = 24

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function isImgUrl(url: string) {
  return url.startsWith("data:") || url.startsWith("http")
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [url])
  return (
    <button
      onClick={copy}
      title="Copy image URL"
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 text-gray-500 transition-colors whitespace-nowrap"
    >
      {copied
        ? <><Check className="h-3 w-3 text-emerald-500 shrink-0" />Copied!</>
        : <><Copy className="h-3 w-3 shrink-0" />Copy URL</>}
    </button>
  )
}

export default function ImagesPage() {
  const [images, setImages]               = useState<GeneratedImage[]>([])
  const [total, setTotal]                 = useState(0)
  const [page, setPage]                   = useState(1)
  const [isLoading, setIsLoading]         = useState(true)
  const [search, setSearch]               = useState("")
  const [templateFilter, setTemplateFilter] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)

  async function loadImages(p: number) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/images?page=${p}&limit=${PAGE_SIZE}`)
      const data = await res.json()
      setImages(data.images ?? [])
      setTotal(data.total ?? 0)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadImages(page) }, [page])

  function handleDownload(img: GeneratedImage) {
    const a = document.createElement("a")
    a.href = img.imageUrl
    a.download = `${img.template.name.replace(/\s+/g, "-")}-${img.id.slice(-6)}.${img.format}`
    a.click()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/images/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setImages((prev) => prev.filter((img) => img.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      setDeleteConfirmId(null)
    } catch {
      // silent — keep confirm visible
    } finally {
      setDeletingId(null)
    }
  }

  // Build unique template name list for filter dropdown
  const templateNames = Array.from(
    new Set(images.map((img) => img.template.name))
  ).sort()

  const filtered = images.filter((img) => {
    const matchesSearch = img.template.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = !templateFilter || img.template.name === templateFilter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generated Images</h1>
          <p className="text-muted-foreground mt-1">
            All images generated via the API — {total.toLocaleString()} total
          </p>
        </div>
        <Link href="/docs">
          <Button variant="outline" size="sm">View API Docs</Button>
        </Link>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by template name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-violet-400"
          />
        </div>
        {templateNames.length > 1 && (
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="pl-3 pr-8 py-2 text-sm border border-input rounded-lg bg-background outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer appearance-none"
          >
            <option value="">All templates</option>
            {templateNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}
        {(search || templateFilter) && (
          <button
            onClick={() => { setSearch(""); setTemplateFilter("") }}
            className="text-sm text-violet-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <ImageIcon className="h-14 w-14 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground text-sm mb-6 text-center max-w-sm">
              Generated images appear here after you call the API with a template.
            </p>
            <Link href="/docs"><Button>View API Docs</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No images match your current filters.
              </p>
              <button
                onClick={() => { setSearch(""); setTemplateFilter("") }}
                className="mt-2 text-sm text-violet-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {/* List header */}
              <div className="hidden md:grid grid-cols-[120px_1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-muted/40 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <span>Preview</span>
                <span>Template</span>
                <span>Format</span>
                <span>Date</span>
                <span>Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {filtered.map((img) => {
                  const isConfirming = deleteConfirmId === img.id
                  const isDeleting = deletingId === img.id

                  return (
                    <div key={img.id} className="flex flex-col md:grid md:grid-cols-[120px_1fr_auto_auto_auto] gap-3 md:gap-4 items-start md:items-center px-4 py-3">
                      {/* Thumbnail */}
                      <div className="w-[120px] h-[80px] rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {isImgUrl(img.imageUrl) ? (
                          <img
                            src={img.imageUrl}
                            alt={img.template.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageIcon className="h-7 w-7 text-muted-foreground/40" />
                        )}
                      </div>

                      {/* Template info */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/dashboard/editor/${img.template.id}`}
                          className="text-sm font-medium truncate block hover:text-violet-700 transition-colors"
                        >
                          {img.template.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {img.template.width} × {img.template.height}px
                        </p>
                        {/* Mobile: show date inline */}
                        <p className="text-xs text-muted-foreground mt-0.5 md:hidden">
                          {formatDate(img.createdAt)}
                        </p>
                      </div>

                      {/* Format badge */}
                      <span className="inline-block text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border whitespace-nowrap">
                        {img.format}
                      </span>

                      {/* Date (desktop only) */}
                      <span className="hidden md:block text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatDate(img.createdAt)}
                      </span>

                      {/* Actions */}
                      {isConfirming ? (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs md:col-start-5">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span className="text-red-700 whitespace-nowrap">Delete?</span>
                          <button
                            onClick={() => handleDelete(img.id)}
                            disabled={isDeleting}
                            className="font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 whitespace-nowrap"
                          >
                            {isDeleting ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-gray-500 hover:text-gray-700 ml-0.5"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CopyUrlButton url={img.imageUrl} />
                          <button
                            onClick={() => handleDownload(img)}
                            title="Download"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500 transition-colors whitespace-nowrap"
                          >
                            <Download className="h-3 w-3 shrink-0" />
                            Download
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(img.id)}
                            title="Delete"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-gray-400 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 shrink-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !search && !templateFilter && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
