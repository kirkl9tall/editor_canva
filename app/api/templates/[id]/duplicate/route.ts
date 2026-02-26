import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function POST(
  _req: NextRequest,
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

    const duplicate = await db.template.create({
      data: {
        name: `Copy of ${template.name}`,
        projectId: template.projectId,
        width: template.width,
        height: template.height,
        canvasJson: template.canvasJson !== null
          ? (template.canvasJson as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        previewUrl: template.previewUrl,
      },
      include: { project: true },
    })

    return NextResponse.json({ template: duplicate })
  } catch (error) {
    console.error("Duplicate template error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
