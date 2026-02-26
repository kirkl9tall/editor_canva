import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = await db.template.findMany({
      where: {
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, projectId, width = 1200, height = 630 } = body

    if (!name || !projectId) {
      return NextResponse.json(
        { error: "name and projectId are required" },
        { status: 400 }
      )
    }

    // Verify project belongs to user
    const project = await db.project.findUnique({
      where: { id: projectId },
    })

    if (!project || project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Create template with empty canvas
    const template = await db.template.create({
      data: {
        name,
        projectId,
        width,
        height,
        canvasJson: {
          version: "6.5.1",
          objects: [],
        },
      },
      include: {
        project: true,
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error("Create template error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
