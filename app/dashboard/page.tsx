"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  FileText,
  Key,
  Zap,
  TrendingUp,
  ArrowRight,
  Plus,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsData {
  plan: string
  apiCallsThisMonth: number
  limit: number
}

interface Template {
  id: string
  name: string
  width: number
  height: number
  previewUrl: string | null
  updatedAt: string
  project: { name: string }
}

const QUICK_START_STEPS = [
  {
    step: 1,
    icon: FileText,
    title: "Create a template",
    description: "Design a reusable image template with dynamic text and image variables.",
    href: "/dashboard/templates",
    cta: "Go to Templates",
    color: "bg-violet-100 text-violet-700",
  },
  {
    step: 2,
    icon: Key,
    title: "Get your API key",
    description: "Generate an API key to authenticate requests from your application.",
    href: "/dashboard/api-keys",
    cta: "Get API Key",
    color: "bg-blue-100 text-blue-700",
  },
  {
    step: 3,
    icon: Zap,
    title: "Call the API",
    description: "Send a POST request with your template ID and variables to generate images.",
    href: "/docs",
    cta: "View API Docs",
    color: "bg-emerald-100 text-emerald-700",
  },
]

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentTemplates, setRecentTemplates] = useState<Template[]>([])
  const [totalTemplates, setTotalTemplates] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/user/stats").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ])
      .then(([statsData, templatesData]) => {
        setStats(statsData)
        const all: Template[] = templatesData.templates ?? []
        setTotalTemplates(all.length)
        const recent = [...all]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
        setRecentTemplates(recent)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const remaining =
    stats && stats.limit >= 999999
      ? "Unlimited"
      : stats
      ? Math.max(0, stats.limit - stats.apiCallsThisMonth).toLocaleString()
      : "—"

  const planLabel = stats?.plan
    ? stats.plan.charAt(0) + stats.plan.slice(1).toLowerCase()
    : "Free"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back — here&apos;s what&apos;s happening.</p>
        </div>
        <Link href="/dashboard/templates">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Templates"
          value={totalTemplates}
          sub="across all projects"
          icon={FileText}
          color="bg-violet-100 text-violet-700"
        />
        <StatCard
          title="API Calls This Month"
          value={stats?.apiCallsThisMonth.toLocaleString() ?? "0"}
          sub={`${planLabel} plan`}
          icon={TrendingUp}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          title="Remaining Calls"
          value={remaining}
          sub={
            stats && stats.limit < 999999
              ? `of ${stats.limit.toLocaleString()} monthly limit`
              : "No limit on your plan"
          }
          icon={Zap}
          color="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Recent Templates */}
      {recentTemplates.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Templates</h2>
            <Link
              href="/dashboard/templates"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {recentTemplates.map((t) => (
              <Link key={t.id} href={`/dashboard/editor/${t.id}`}>
                <div className="group rounded-xl border bg-card hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                    {t.previewUrl ? (
                      <img src={t.previewUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate group-hover:text-violet-700 transition-colors">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t.width}×{t.height}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/dashboard/templates">
              <div className="rounded-xl border border-dashed bg-card hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-1.5 p-4 min-h-[100px]">
                <div className="rounded-full bg-muted p-2">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground text-center leading-snug">New Template</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Quick Start Guide */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Quick Start Guide</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_START_STEPS.map((step) => (
            <Card key={step.step} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2.5 ${step.color} shrink-0`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">STEP {step.step}</span>
                      {totalTemplates > 0 && step.step === 1 && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <CardTitle className="text-base mt-0.5">{step.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                <Link href={step.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:border-violet-400 group-hover:text-violet-700 transition-colors"
                  >
                    {step.cta}
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
