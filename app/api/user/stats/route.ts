import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { PLANS } from "@/lib/stripe"

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

    // Fetch generated images for the last 30 days, grouped by day (JS-side)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const images = await db.generatedImage.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    // Group by date string (YYYY-MM-DD)
    const byDay: Record<string, number> = {}
    for (const img of images) {
      const d = img.createdAt.toISOString().split("T")[0]
      byDay[d] = (byDay[d] || 0) + 1
    }

    // Build last 30 days array (fill zeros for missing days)
    const dailyData: Array<{ date: string; calls: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split("T")[0]
      // Format for display: "Feb 25"
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dailyData.push({ date: label, calls: byDay[dateStr] || 0 })
    }

    return NextResponse.json({
      plan: user.plan,
      apiCallsThisMonth: user.apiCallsThisMonth,
      limit,
      resetAt: user.apiCallsResetAt,
      dailyData,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
