import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateImage } from "@/lib/generator"
import { PLANS } from "@/lib/stripe"
import { fireWebhooks } from "@/lib/fireWebhooks"

// ── Shared auth helper ────────────────────────────────────
async function resolveApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  const key = authHeader.substring(7).trim()
  return db.apiKey.findUnique({ where: { key }, include: { user: true } })
}

// ── GET /api/v1/images — paginated image history ──────────
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

    const [images, total] = await Promise.all([
      db.generatedImage.findMany({
        where: { userId: record.user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          template: { select: { id: true, name: true, width: true, height: true } },
        },
      }),
      db.generatedImage.count({ where: { userId: record.user.id } }),
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
    console.error("GET /api/v1/images error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST /api/v1/images — generate a new image ────────────
export async function POST(req: NextRequest) {
  try {
    const apiKeyRecord = await resolveApiKey(req)
    if (!apiKeyRecord) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      )
    }

    const user = apiKeyRecord.user

    // Check plan limits
    const planLimits = PLANS[user.plan]
    if (user.apiCallsThisMonth >= planLimits.apiCalls) {
      return NextResponse.json(
        {
          error: "API call limit reached for your plan",
          limit: planLimits.apiCalls,
          used: user.apiCallsThisMonth,
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body = await req.json()
    const { template_id, modifications = {}, format = "png" } = body

    if (!template_id) {
      return NextResponse.json(
        { error: "template_id is required" },
        { status: 400 }
      )
    }

    // Get template
    const template = await db.template.findUnique({
      where: { id: template_id },
      include: { project: true },
    })

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Check if user owns the template
    if (template.project.userId !== user.id) {
      return NextResponse.json(
        { error: "Access denied to this template" },
        { status: 403 }
      )
    }

    // ── async=true: enqueue job and return immediately ────────────────────
    const isAsync = new URL(req.url).searchParams.get("async") === "true"
    if (isAsync) {
      const job = await db.job.create({
        data: {
          userId:     user.id,
          templateId: template.id,
          variables:  modifications,
          format,
          status:     "pending",
        },
      })

      // Fire-and-forget background processing
      setImmediate(async () => {
        try {
          await db.job.update({ where: { id: job.id }, data: { status: "processing" } })

          const imageUrl = await generateImage({
            canvasJson: template.canvasJson,
            variables:  modifications,
            width:      template.width,
            height:     template.height,
            format:     format as "png" | "jpeg" | "pdf",
          })

          await db.generatedImage.create({
            data: { templateId: template.id, userId: user.id, variables: modifications, imageUrl, format },
          })
          await db.user.update({
            where: { id: user.id },
            data:  { apiCallsThisMonth: { increment: 1 } },
          })
          await db.apiKey.update({
            where: { id: apiKeyRecord.id },
            data:  { lastUsed: new Date() },
          })
          await db.job.update({ where: { id: job.id }, data: { status: "done", imageUrl } })
        } catch (e) {
          await db.job.update({
            where: { id: job.id },
            data:  { status: "failed", error: String(e) },
          })
        }
      })

      return NextResponse.json({ job_id: job.id, status: "pending" }, { status: 202 })
    }

    // Generate image
    const imageUrl = await generateImage({
      canvasJson: template.canvasJson,
      variables: modifications,
      width: template.width,
      height: template.height,
      format: format as "png" | "jpeg" | "pdf",
    })

    // Save generated image record
    await db.generatedImage.create({
      data: {
        templateId: template.id,
        userId: user.id,
        variables: modifications,
        imageUrl,
        format,
      },
    })

    // Increment API call counter
    await db.user.update({
      where: { id: user.id },
      data: {
        apiCallsThisMonth: {
          increment: 1,
        },
      },
    })

    // Update API key last used
    await db.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsed: new Date() },
    })

    const generatedAt = new Date().toISOString()

    // Fire webhooks (non-blocking)
    fireWebhooks(user.id, {
      event:        "image.generated",
      image_url:    imageUrl,
      template_id:  template.id,
      generated_at: generatedAt,
    }).catch(() => {/* silently ignore webhook errors */})

    return NextResponse.json({
      success: true,
      image_url: imageUrl,
      template_id: template.id,
      format,
      generated_at: generatedAt,
      usage: {
        used: user.apiCallsThisMonth + 1,
        limit: planLimits.apiCalls === Infinity ? null : planLimits.apiCalls,
      },
    })
  } catch (error) {
    console.error("Image generation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
