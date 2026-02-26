import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const image = await db.generatedImage.findUnique({ where: { id } })

    if (!image || image.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await db.generatedImage.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete image error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
