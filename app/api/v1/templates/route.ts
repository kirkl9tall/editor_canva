import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

async function resolveApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const key = authHeader.substring(7).trim()
  return db.apiKey.findUnique({ where: { key }, include: { user: true } })
}

/** Extract {{variable}} names from a Fabric.js canvasJson objects array */
function extractVariables(canvasJson: unknown): string[] {
  try {
    const json = canvasJson as { objects?: { text?: string; type?: string }[] } | null
    if (!json?.objects) return []
    const vars = new Set<string>()
    for (const obj of json.objects) {
      if (obj.text) {
        const matches = obj.text.match(/\{\{([^}]+)\}\}/g) ?? []
        for (const m of matches) vars.add(m.slice(2, -2).trim())
      }
    }
    return Array.from(vars)
  } catch {
    return []
  }
}

function serializeTemplate(t: {
  id: string
  name: string
  width: number
  height: number
  previewUrl: string | null
  canvasJson: unknown
  createdAt: Date
  updatedAt: Date
}) {
  const variables = extractVariables(t.canvasJson)
  const json = t.canvasJson as { objects?: unknown[] } | null
  return {
    id:          t.id,
    name:        t.name,
    width:       t.width,
    height:      t.height,
    preview_url: t.previewUrl,
    variables,
    layers:      json?.objects ?? [],
    created_at:  t.createdAt.toISOString(),
    updated_at:  t.updatedAt.toISOString(),
  }
}

// ── GET /api/v1/templates ─────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const record = await resolveApiKey(req)
    if (!record) {
      return NextResponse.json({ error: "Missing or invalid API key" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
    const skip  = (page - 1) * limit

    const [templates, total] = await Promise.all([
      db.template.findMany({
        where: { project: { userId: record.user.id } },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      db.template.count({ where: { project: { userId: record.user.id } } }),
    ])

    return NextResponse.json({
      templates: templates.map(serializeTemplate),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("GET /api/v1/templates error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
