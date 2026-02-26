import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { stripe, PLANS } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const planRaw: unknown = body.plan

    if (planRaw !== "PRO" && planRaw !== "BUSINESS") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const plan = planRaw as "PRO" | "BUSINESS"

    const user = await db.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const priceId = PLANS[plan].priceId

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId || undefined,
      customer_email: !user.stripeCustomerId ? user.email : undefined,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/settings?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
