import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Shared API-key auth helper — returns the user or a NextResponse error
async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    }
  }

  const key = authHeader.substring(7).trim()
  const record = await db.apiKey.findUnique({
    where: { key },
    include: { user: true },
  })
  if (!record) {
    return { error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }) }
  }

  // Update last-used timestamp (fire and forget)
  db.apiKey.update({ where: { id: record.id }, data: { lastUsed: new Date() } }).catch(() => {})

  return { user: record.user }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req)
    if (auth.error) return auth.error
    const { user } = auth

    const { searchParams } = new URL(req.url)
    const page  = Math.max(1, Number(searchParams.get("page")  ?? 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)))
    const skip  = (page - 1) * limit

    const [images, total] = await Promise.all([
      db.generatedImage.findMany({
        where: { userId: user!.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          template: {
            select: { id: true, name: true, width: true, height: true },
          },
        },
      }),
      db.generatedImage.count({ where: { userId: user!.id } }),
    ])

    return NextResponse.json({
      images: images.map((img) => ({
        id:           img.id,
        image_url:    img.imageUrl,
        format:       img.format,
        template_id:  img.templateId,
        template:     img.template,
        variables:    img.variables,
        generated_at: img.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    console.error("GET /api/v1/images/history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
