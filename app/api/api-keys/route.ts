import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { generateApiKey } from "@/lib/api-key"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawKeys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, key: true, createdAt: true, lastUsed: true },
    })

    // Mask the key — never expose full key after creation
    const apiKeys = rawKeys.map((k) => ({
      id: k.id,
      name: k.name,
      maskedKey: `${k.key.substring(0, 7)}${'•'.repeat(24)}${k.key.slice(-4)}`,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
    }))

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("Get API keys error:", error)
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

    const key = generateApiKey()

    const apiKey = await db.apiKey.create({
      data: {
        name,
        key,
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Show once
        createdAt: apiKey.createdAt,
      },
    })
  } catch (error) {
    console.error("Create API key error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
