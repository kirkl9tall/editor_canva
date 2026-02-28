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
    <div className="rounded-2xl bg-white ring-1 ring-black/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold tabular-nums text-gray-900">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${color} shadow-sm`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Dashboard • Overview</p>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Welcome back — here&apos;s what&apos;s happening.</p>
        </div>
        <Link href="/dashboard/templates">
          <span className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5 py-2.5 text-xs font-black transition-colors duration-200 cursor-pointer mt-1 whitespace-nowrap">
            <Plus className="h-3.5 w-3.5" /> New Template
          </span>
        </Link>
      </div>

      {/* Promo banner */}
      {stats?.plan === "FREE" && (
        <div className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-100">
              <Zap className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <span className="text-sm text-violet-800">
              You&apos;re on the <strong>Free plan</strong> — upgrade to unlock unlimited renders.
            </span>
          </div>
          <Link href="/dashboard/settings">
            <span className="text-[11px] font-black text-violet-600 hover:text-violet-700 whitespace-nowrap ml-4 transition-colors cursor-pointer">Upgrade →</span>
          </Link>
        </div>
      )}

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
              className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {recentTemplates.map((t) => (
              <Link key={t.id} href={`/dashboard/editor/${t.id}`}>
                <div className="group rounded-2xl bg-white ring-1 ring-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer">
                  <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
                    {t.previewUrl ? (
                      <img src={t.previewUrl} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="h-8 w-8 text-gray-200" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate group-hover:text-violet-700 transition-colors">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {t.width}×{t.height}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            <Link href="/dashboard/templates">
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white hover:border-violet-400 hover:bg-violet-50/50 transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-1.5 p-4 min-h-[100px]">
                <div className="rounded-full bg-gray-100 p-2">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-xs text-gray-400 text-center leading-snug">New Template</span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Hero: Automate Card */}
      <section>
        <div className="rounded-2xl overflow-hidden ring-1 ring-black/5 shadow-sm">
          {/* Top: dark purple */}
          <div className="bg-[#4c1d95] px-6 py-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-800/40 to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-violet-300 text-[10px] font-black uppercase tracking-widest mb-2">Get started</p>
              <h2 className="text-white text-2xl font-black tracking-tight mb-1.5">✨ Automate your creatives</h2>
              <p className="text-violet-200/80 text-sm">Connect Renderify to your stack and generate images at scale.</p>
              <div className="flex gap-2 mt-5 flex-wrap">
                {[
                  { label: "REST API", href: "/docs" },
                  { label: "n8n / Studio", href: "/dashboard/settings" },
                  { label: "Webhooks", href: "/dashboard/webhooks" },
                ].map((tab) => (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-colors duration-200"
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: white checklist */}
          <div className="bg-white divide-y divide-gray-100">
            {QUICK_START_STEPS.map((step) => (
              <div key={step.step} className="flex items-center gap-4 px-6 py-4">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    totalTemplates > 0 && step.step === 1
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-200"
                  }`}
                >
                  {totalTemplates > 0 && step.step === 1 ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-[11px] font-black text-gray-400">{step.step}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{step.description}</p>
                </div>
                <Link href={step.href}>
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-black text-violet-600 hover:text-violet-700 transition-colors whitespace-nowrap cursor-pointer">
                    {step.cta} <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
