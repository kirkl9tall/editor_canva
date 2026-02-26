import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateImage } from "@/lib/generator"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const template = await db.template.findUnique({
      where: { id },
      include: { project: true },
    })

    if (!template || template.project.userId !== session.user.id) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const body = await req.json()
    const { modifications = {} } = body

    const imageUrl = await generateImage({
      canvasJson: template.canvasJson,
      variables: modifications,
      width: template.width,
      height: template.height,
      format: "png",
    })

    return NextResponse.json({ image_url: imageUrl })
  } catch (error) {
    console.error("Preview generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    )
  }
}
