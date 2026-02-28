"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Copy, Trash2, Key as KeyIcon, Check, X, Loader2, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ApiKey {
  id: string
  name: string
  maskedKey: string
  createdAt: string
  lastUsed: string | null
}

// ── tiny modal ────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])
  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // newly created key – shown once
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // keys created in this tab — backed by sessionStorage so navigation doesn't clear them
  const [sessionKeys, setSessionKeys] = useState<Map<string, string>>(() => {
    if (typeof window === "undefined") return new Map()
    const m = new Map<string, string>()
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith("rfy_key_")) {
        m.set(k.slice(8), sessionStorage.getItem(k)!)
      }
    }
    return m
  })
  // per-row copy confirmation
  const [rowCopied, setRowCopied] = useState<string | null>(null)

  // create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [keyName, setKeyName] = useState("")
  const [createError, setCreateError] = useState("")
  const [creating, setCreating] = useState(false)

  // delete confirmation (inline per-row)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadApiKeys() }, [])

  async function loadApiKeys() {
    try {
      const res = await fetch("/api/api-keys")
      const data = await res.json()
      setApiKeys(data.apiKeys || [])
    } catch {
      // silent
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!keyName.trim()) { setCreateError("Name is required"); return }
    setCreating(true)
    setCreateError("")
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName.trim() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // keep full value in sessionStorage for this tab so Copy works after navigation
      sessionStorage.setItem(`rfy_key_${data.apiKey.id}`, data.apiKey.key)
      setSessionKeys((prev) => new Map(prev).set(data.apiKey.id, data.apiKey.key))
      setNewKeyValue(data.apiKey.key)   // show full key once
      setCopied(false)
      setShowCreateDialog(false)
      await loadApiKeys()               // reload masked list
    } catch {
      setCreateError("Failed to create key. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" })
      sessionStorage.removeItem(`rfy_key_${id}`)
      setSessionKeys((prev) => { const m = new Map(prev); m.delete(id); return m })
      setConfirmDeleteId(null)
      await loadApiKeys()
    } catch {
      // silent
    } finally {
      setDeleting(false)
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyRowKey(id: string) {
    const val = sessionKeys.get(id)
    if (!val) return
    navigator.clipboard.writeText(val)
    setRowCopied(id)
    setTimeout(() => setRowCopied(null), 2000)
  }

  function openCreate() {
    setKeyName("")
    setCreateError("")
    setShowCreateDialog(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      {/* header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your keys for programmatic access</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* one-time new key banner */}
      {newKeyValue && (
        <Card className="mb-6 border-green-500 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Check className="h-5 w-5" />
              API Key Created
            </CardTitle>
            <CardDescription className="text-green-700">
              Copy your key now — you <strong>won't</strong> be able to see it again after dismissing this.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={newKeyValue} readOnly className="font-mono text-sm bg-white" />
              <Button
                variant={copied ? "outline" : "default"}
                onClick={() => copyKey(newKeyValue)}
                className={copied ? "border-green-500 text-green-700" : ""}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-3 text-green-800" onClick={() => setNewKeyValue(null)}>
              I've saved my key — dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* key list */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <KeyIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No API keys yet</h3>
            <p className="text-muted-foreground mb-4">Create a key to start generating images via API</p>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((k) => (
            <Card key={k.id} className={confirmDeleteId === k.id ? "border-destructive/60 bg-red-50" : ""}>
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{k.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono mt-0.5 truncate">
                    {k.maskedKey}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {formatDistanceToNow(new Date(k.createdAt), { addSuffix: true })}
                    {k.lastUsed && ` · Last used ${formatDistanceToNow(new Date(k.lastUsed), { addSuffix: true })}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {/* ── Copy key button ── */}
                  {confirmDeleteId !== k.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyRowKey(k.id)}
                      disabled={!sessionKeys.has(k.id)}
                      title={sessionKeys.has(k.id) ? "Copy API key" : "Full key only available in the session it was created"}
                      className={sessionKeys.has(k.id) ? "text-gray-700" : "text-gray-300 cursor-not-allowed"}
                    >
                      {rowCopied === k.id
                        ? <><Check className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />Copied!</>
                        : <><Copy className="mr-1.5 h-3.5 w-3.5" />Copy</>}
                    </Button>
                  )}
                  {confirmDeleteId === k.id ? (
                    <>
                      <span className="text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Revoke key?
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleting}
                        onClick={() => handleDelete(k.id)}
                      >
                        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, revoke"}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeleteId(k.id)}
                      className="text-destructive hover:text-destructive hover:border-destructive/50"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* curl example */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>Generate an image with a single API call</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-sm overflow-x-auto leading-relaxed">
{`curl -X POST http://localhost:3000/api/v1/images \\
  -H "Authorization: Bearer sk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "your_template_id",
    "modifications": {
      "name": "Jane Doe",
      "title": "Software Engineer"
    },
    "format": "png"
  }'`}
          </pre>
        </CardContent>
      </Card>

      {/* create dialog */}
      {showCreateDialog && (
        <Modal title="Create API Key" onClose={() => setShowCreateDialog(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production, My App, Testing"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">A label to identify this key — not the key itself.</p>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Key
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
