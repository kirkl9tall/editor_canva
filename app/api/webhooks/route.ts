import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomBytes } from "crypto"

// ── GET /api/webhooks — list registered webhooks ──────────
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const webhooks = await db.webhook.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, events: true, createdAt: true },
  })

  return NextResponse.json({ webhooks })
}

// ── POST /api/webhooks — register a new webhook ───────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { url, events = ["image.generated"] } = body

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "url must be a valid URL" }, { status: 400 })
  }

  const ALLOWED_EVENTS = ["image.generated"]
  const normalised: string[] = Array.isArray(events)
    ? events.filter((e: string) => ALLOWED_EVENTS.includes(e))
    : ["image.generated"]

  const secret = randomBytes(32).toString("hex")

  const webhook = await db.webhook.create({
    data: {
      userId: session.user.id,
      url,
      secret,
      events: normalised,
    },
  })

  return NextResponse.json({
    webhook: {
      id:         webhook.id,
      url:        webhook.url,
      events:     webhook.events,
      secret,        // shown once only
      created_at: webhook.createdAt.toISOString(),
    },
  }, { status: 201 })
}
