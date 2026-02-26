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

    const projects = await db.project.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        templates: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error("Get projects error:", error)
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
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        name,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
