import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

async function resolveApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const key = authHeader.substring(7).trim()
  return db.apiKey.findUnique({ where: { key }, include: { user: true } })
}

function extractVariables(canvasJson: unknown): string[] {
  try {
    const json = canvasJson as { objects?: { text?: string }[] } | null
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

// ── GET /api/v1/templates/:id ─────────────────────────────
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

    const template = await db.template.findUnique({
      where: { id },
      include: { project: { select: { userId: true, name: true } } },
    })

    if (!template || template.project.userId !== record.user.id) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const json = template.canvasJson as { objects?: unknown[] } | null
    const variables = extractVariables(template.canvasJson)

    return NextResponse.json({
      template: {
        id:          template.id,
        name:        template.name,
        width:       template.width,
        height:      template.height,
        preview_url: template.previewUrl,
        variables,
        layers:      json?.objects ?? [],
        project:     template.project.name,
        created_at:  template.createdAt.toISOString(),
        updated_at:  template.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("GET /api/v1/templates/:id error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
