import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan as "PRO" | "BUSINESS"

        if (userId && plan) {
          await db.user.update({
            where: { id: userId },
            data: {
              plan,
              stripeCustomerId: session.customer as string,
            },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { plan: "FREE" },
        })
        break
      }

      case "invoice.paid": {
        // Fires on subscription renewal — reset monthly call counter
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (customerId) {
          await db.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              apiCallsThisMonth: 0,
              apiCallsResetAt: new Date(),
            },
          })
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (subscription.status === "active") {
          // Update plan based on price ID
          const priceId = subscription.items.data[0]?.price.id

          let plan: "FREE" | "PRO" | "BUSINESS" = "FREE"
          if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
            plan = "PRO"
          } else if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) {
            plan = "BUSINESS"
          }

          await db.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan },
          })
        } else {
          // Subscription not active, downgrade to free
          await db.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { plan: "FREE" },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}
