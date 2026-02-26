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

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200)
    const page  = Math.max(Number(searchParams.get("page")  ?? "1"), 1)
    const skip  = (page - 1) * limit

    const [images, total] = await Promise.all([
      db.generatedImage.findMany({
        where: { userId: session.user.id },
        include: {
          template: { select: { id: true, name: true, width: true, height: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      db.generatedImage.count({ where: { userId: session.user.id } }),
    ])

    return NextResponse.json({ images, total, page, limit })
  } catch (error) {
    console.error("Images fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
