import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(
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

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Get template error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
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
    const { name, canvasJson, width, height, previewUrl } = body

    const updated = await db.template.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(canvasJson && { canvasJson }),
        ...(width && { width }),
        ...(height && { height }),
        ...(previewUrl !== undefined && { previewUrl }),
      },
      include: { project: true },
    })

    return NextResponse.json({ template: updated })
  } catch (error) {
    console.error("Update template error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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

    await db.template.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete template error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
