import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// ── Shared auth helper ────────────────────────────────────
async function resolveApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const key = authHeader.substring(7).trim()
  return db.apiKey.findUnique({ where: { key }, include: { user: true } })
}

// ── GET /api/v1/jobs/:id — poll async job status ──────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const record = await resolveApiKey(req)
    if (!record) {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 })
    }

    const job = await db.job.findUnique({ where: { id } })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.userId !== record.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json({
      job_id:     job.id,
      status:     job.status,      // pending | processing | done | failed
      image_url:  job.imageUrl ?? null,
      error:      job.error ?? null,
      created_at: job.createdAt.toISOString(),
      updated_at: job.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("GET /api/v1/jobs/:id error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
