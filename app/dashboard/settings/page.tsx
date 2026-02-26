"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertTriangle, User, CreditCard } from "lucide-react"

const PLAN_INFO: Record<string, { label: string; calls: string; color: string }> = {
  FREE:     { label: "Free",     calls: "100 calls / month",    color: "text-gray-700" },
  PRO:      { label: "Pro",      calls: "5,000 calls / month",  color: "text-violet-600" },
  BUSINESS: { label: "Business", calls: "25,000 calls / month", color: "text-blue-600" },
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()

  const [name, setName]       = useState("")
  const [email, setEmail]     = useState("")
  const [plan, setPlan]       = useState("FREE")
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving]     = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError]   = useState("")

  // load profile + plan on mount
  useEffect(() => {
    async function loadAll() {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/user/stats"),
        ])
        const [userData, statsData] = await Promise.all([
          userRes.json(),
          statsRes.json(),
        ])
        setName(userData.user?.name ?? "")
        setEmail(userData.user?.email ?? session?.user?.email ?? "")
        setPlan(statsData.plan ?? "FREE")
      } catch {
        // fall back to session data
        setName(session?.user?.name ?? "")
        setEmail(session?.user?.email ?? "")
      } finally {
        setIsLoadingProfile(false)
      }
    }
    loadAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setSaveError("Name cannot be empty"); return }
    setIsSaving(true)
    setSaveError("")
    setSaveSuccess(false)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Save failed")
      }
      // update next-auth session so the name reflects everywhere
      await updateSession({ name: name.trim() })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpgrade(plan: "PRO" | "BUSINESS") {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
  }

  const planInfo = PLAN_INFO[plan] ?? PLAN_INFO.FREE

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and subscription</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* ── Profile ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Profile</CardTitle>
            </div>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProfile ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading profile…</span>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted/50 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is tied to your sign-in provider and cannot be changed here.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setSaveError("")
                      setSaveSuccess(false)
                    }}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>

                {saveError && (
                  <p className="flex items-center gap-1.5 text-sm text-red-500">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {saveError}
                  </p>
                )}
                {saveSuccess && (
                  <p className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    Profile saved successfully.
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* ── Subscription ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>Manage your billing and plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
                <div>
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <p className={`text-2xl font-bold mt-0.5 ${planInfo.color}`}>
                    {planInfo.label}
                  </p>
                  <p className="text-sm text-muted-foreground">{planInfo.calls}</p>
                </div>
                {plan !== "FREE" && (
                  <Button variant="outline" size="sm" onClick={handleManageBilling}>
                    Manage billing
                  </Button>
                )}
              </div>

              {plan === "FREE" && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleUpgrade("PRO")}>
                    Upgrade to Pro ($9/mo)
                  </Button>
                  <Button variant="outline" onClick={() => handleUpgrade("BUSINESS")}>
                    Upgrade to Business ($29/mo)
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive">Delete Account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
