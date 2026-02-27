"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { Loader2, Zap, TrendingUp, Clock, BarChart2, Activity, FileText } from "lucide-react"

type Tab = "calls" | "responseTime"

interface TopTemplate {
  templateId: string
  name: string
  calls: number
}

interface StatsData {
  plan: string
  apiCallsThisMonth: number
  limit: number
  resetAt: string
  dailyData: Array<{ date: string; calls: number; averageMs: number }>
  topTemplates: TopTemplate[]
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "text-gray-600",
  PRO: "text-violet-600",
  BUSINESS: "text-blue-600",
}

export default function UsagePage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("calls")

  useEffect(() => {
    fetch("/api/user/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setStats(data)
      })
      .catch(() => setError("Failed to load usage data."))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {error || "No data available."}
      </div>
    )
  }

  const usagePercent = stats.limit > 0 ? Math.min(100, (stats.apiCallsThisMonth / stats.limit) * 100) : 0
  const remaining = Math.max(0, stats.limit - stats.apiCallsThisMonth)
  const resetDate = new Date(stats.resetAt)
  const nextReset = new Date(resetDate)
  nextReset.setMonth(nextReset.getMonth() + 1)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Usage</h1>
        <p className="text-muted-foreground">Monitor your API usage and limits</p>
      </div>

      {/* stat cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Calls This Month</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.apiCallsThisMonth.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mt-1">
              of {stats.limit === 999999 ? "unlimited" : stats.limit.toLocaleString()} calls
            </p>
            {stats.limit < 999999 && (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-yellow-500" : "bg-violet-500"}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{usagePercent.toFixed(1)}% used</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${PLAN_COLORS[stats.plan] ?? ""}`}>{stats.plan}</div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.limit === 999999 ? "Unlimited calls/month" : `${stats.limit.toLocaleString()} calls/month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {stats.limit === 999999 ? "∞" : remaining.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Resets {nextReset.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* daily chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>
                {activeTab === "calls" ? "API Calls — Last 30 Days" : "Avg. Response Time — Last 30 Days"}
              </CardTitle>
              <CardDescription className="mt-0.5">
                {activeTab === "calls"
                  ? `${stats.dailyData.reduce((s, d) => s + d.calls, 0).toLocaleString()} total calls in this period`
                  : `Average render latency over the last 30 days`}
              </CardDescription>
            </div>
            {/* Tab switcher */}
            <div className="flex items-center gap-1 rounded-lg border bg-muted p-1 shrink-0">
              <button
                onClick={() => setActiveTab("calls")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "calls"
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                API Calls
              </button>
              <button
                onClick={() => setActiveTab("responseTime")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  activeTab === "responseTime"
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Response Time
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "calls" ? (
            stats.dailyData.every((d) => d.calls === 0) ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Zap className="h-10 w-10 mb-3 opacity-30" />
                <p>No API calls yet in the last 30 days.</p>
                <p className="text-sm mt-1">Make your first call using an API key.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                    formatter={(v: number) => [`${v} call${v !== 1 ? "s" : ""}`, "API Calls"]}
                  />
                  <Bar dataKey="calls" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  unit="ms"
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  formatter={(v: number) => [`${v} ms`, "Avg. Response Time"]}
                />
                <Line
                  type="monotone"
                  dataKey="averageMs"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* top templates */}
      {stats.topTemplates.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Top Templates — Last 30 Days
            </CardTitle>
            <CardDescription>Most-rendered templates in this period</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {stats.topTemplates.map((t, i) => {
                const maxCalls = stats.topTemplates[0].calls
                const pct = maxCalls > 0 ? (t.calls / maxCalls) * 100 : 0
                return (
                  <li key={t.templateId} className="flex items-center gap-4 px-6 py-4">
                    <span className="text-sm font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums shrink-0">
                      {t.calls.toLocaleString()} <span className="font-normal text-muted-foreground text-xs">calls</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
