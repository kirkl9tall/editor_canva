import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PLANS } from "@/lib/stripe"

/**
 * Internal endpoint called by middleware.ts to enforce rate limits.
 * Protected by INTERNAL_SECRET header to prevent external calls.
 */
export async function POST(req: NextRequest) {
  // Verify internal secret
  const secret = req.headers.get("x-internal-secret")
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { apiKey } = await req.json()
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 400 })
    }

    const keyRecord = await db.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: { select: { id: true, plan: true, apiCallsThisMonth: true } } },
    })

    if (!keyRecord) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const user = keyRecord.user
    const planLimits = PLANS[user.plan]

    if (user.apiCallsThisMonth >= planLimits.apiCalls) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit: planLimits.apiCalls === Infinity ? null : planLimits.apiCalls,
          used: user.apiCallsThisMonth,
        },
        { status: 429 }
      )
    }

    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error("Rate check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
