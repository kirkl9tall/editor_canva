import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLANS } from "@/lib/stripe"

// Seeded pseudo-random for stable mock response-time data
function seededMs(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return Math.round(120 + (x - Math.floor(x)) * 280) // 120–400 ms
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, apiCallsThisMonth: true, apiCallsResetAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const planLimits = PLANS[user.plan]
    const limit = planLimits.apiCalls === Infinity ? 999999 : planLimits.apiCalls

    // Fetch generated images for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const images = await db.generatedImage.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, templateId: true },
      orderBy: { createdAt: "asc" },
    })

    // Group by date for bar chart
    const byDay: Record<string, number> = {}
    const byTemplate: Record<string, number> = {}
    for (const img of images) {
      const d = img.createdAt.toISOString().split("T")[0]
      byDay[d] = (byDay[d] || 0) + 1
      byTemplate[img.templateId] = (byTemplate[img.templateId] || 0) + 1
    }

    // Build last 30 days array with calls + mock averageMs
    const dailyData: Array<{ date: string; calls: number; averageMs: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dailyData.push({
        date: label,
        calls: byDay[dateStr] || 0,
        averageMs: seededMs(d.getDate() + d.getMonth() * 31),
      })
    }

    // Top 3 templates by call count
    const topTemplateIds = Object.entries(byTemplate)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)

    const templateNames = await db.template.findMany({
      where: { id: { in: topTemplateIds } },
      select: { id: true, name: true },
    })
    const nameMap = Object.fromEntries(templateNames.map((t) => [t.id, t.name]))

    const topTemplates = topTemplateIds.map((id) => ({
      templateId: id,
      name: nameMap[id] ?? "Deleted template",
      calls: byTemplate[id],
    }))

    return NextResponse.json({
      plan: user.plan,
      apiCallsThisMonth: user.apiCallsThisMonth,
      limit,
      resetAt: user.apiCallsResetAt,
      dailyData,
      topTemplates,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
