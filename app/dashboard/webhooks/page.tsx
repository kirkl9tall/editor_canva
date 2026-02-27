"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, X, Copy, Check, Webhook } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// ── Types ─────────────────────────────────────────────────────────────────────

interface WebhookEntry {
  id: string
  url: string
  events: string[]
  createdAt: string
}

const ALL_EVENTS = [
  { value: "image.generated", label: "image.generated", description: "Fires after each successful image render" },
]

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // newly created secret — shown once
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // create dialog
  const [showCreate, setShowCreate] = useState(false)
  const [url, setUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["image.generated"])
  const [createError, setCreateError] = useState("")
  const [creating, setCreating] = useState(false)

  // delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadWebhooks()
  }, [])

  async function loadWebhooks() {
    try {
      const res = await fetch("/api/webhooks")
      const data = await res.json()
      setWebhooks(data.webhooks ?? [])
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError("")
    if (!url.trim()) { setCreateError("URL is required"); return }
    try { new URL(url.trim()) } catch { setCreateError("Enter a valid URL (https://…)"); return }
    if (selectedEvents.length === 0) { setCreateError("Select at least one event"); return }

    setCreating(true)
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), events: selectedEvents }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create webhook")
      setNewSecret(data.webhook.secret)
      setCopied(false)
      setShowCreate(false)
      setUrl("")
      setSelectedEvents(["image.generated"])
      await loadWebhooks()
    } catch (err) {
      setCreateError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" })
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      setConfirmDeleteId(null)
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  function copySecret() {
    if (!newSecret) return
    navigator.clipboard.writeText(newSecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Receive HTTP POST notifications when events occur in your Renderify account.
          </p>
        </div>
        <Button onClick={() => { setShowCreate(true); setCreateError("") }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {/* ── One-time secret banner ──────────────────────────────────────── */}
      {newSecret && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800 mb-1">
            ✓ Webhook registered — save your signing secret now
          </p>
          <p className="text-xs text-emerald-700 mb-3">
            This secret is shown <strong>only once</strong>. Use it to verify the{" "}
            <code className="font-mono bg-emerald-100 px-1 rounded">X-Renderify-Signature</code>{" "}
            header on incoming requests.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-emerald-200 px-3 py-2 font-mono text-sm text-emerald-900 truncate">
              {newSecret}
            </code>
            <Button variant="outline" size="sm" onClick={copySecret} className="shrink-0">
              {copied ? (
                <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />Copied</>
              ) : (
                <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</>
              )}
            </Button>
            <button
              onClick={() => setNewSecret(null)}
              className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Webhook list ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Endpoints</CardTitle>
          <CardDescription>
            Renderify sends a signed <code className="font-mono text-xs bg-muted px-1 rounded">POST</code> to each URL when subscribed events occur.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Webhook className="h-10 w-10 mb-3 opacity-30" />
              <p className="font-medium">No webhooks yet</p>
              <p className="text-sm mt-1">Add an endpoint to start receiving event notifications.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {webhooks.map((wh) => (
                <li key={wh.id} className="flex items-start gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm truncate text-foreground">{wh.url}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {wh.events.map((ev) => (
                        <span
                          key={ev}
                          className="text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-2 py-0.5"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Added{" "}
                      {formatDistanceToNow(new Date(wh.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Delete controls */}
                  {confirmDeleteId === wh.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">Remove?</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(wh.id)}
                        disabled={deleting}
                      >
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(wh.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition shrink-0"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ── Info card ───────────────────────────────────────────────────── */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Verifying signatures</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Each request includes an{" "}
            <code className="font-mono text-xs bg-muted px-1 rounded">X-Renderify-Signature</code>{" "}
            header. Verify it with HMAC-SHA256 using your signing secret:
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`const crypto = require('crypto')
const sig = req.headers['x-renderify-signature']
const expected = 'sha256=' + crypto
  .createHmac('sha256', YOUR_SECRET)
  .update(JSON.stringify(req.body))
  .digest('hex')
if (sig !== expected) return res.status(401).end()`}
          </pre>
        </CardContent>
      </Card>

      {/* ── Create modal ─────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal
          title="Register Webhook"
          onClose={() => { setShowCreate(false); setCreateError("") }}
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input
                id="wh-url"
                placeholder="https://your-server.com/hooks/renderify"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              {ALL_EVENTS.map((ev) => (
                <label key={ev.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-violet-600"
                    checked={selectedEvents.includes(ev.value)}
                    onChange={() => toggleEvent(ev.value)}
                  />
                  <div>
                    <p className="text-sm font-medium font-mono">{ev.label}</p>
                    <p className="text-xs text-muted-foreground">{ev.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Registering…</>
                ) : (
                  "Register Webhook"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowCreate(false); setCreateError("") }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
