import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// ── DELETE /api/webhooks/:id ──────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const webhook = await db.webhook.findUnique({ where: { id } })

  if (!webhook) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (webhook.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await db.webhook.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
