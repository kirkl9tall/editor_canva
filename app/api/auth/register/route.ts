import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const registerSchema = z.object({
  name:     z.string().min(2, "Name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error("[register]", err)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
}
