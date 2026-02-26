import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
})

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    apiCalls: 100,
    templates: 3,
  },
  PRO: {
    name: "Pro",
    price: 9,
    priceId: process.env.STRIPE_PRICE_ID_PRO || "",
    apiCalls: 5000,
    templates: Infinity,
  },
  BUSINESS: {
    name: "Business",
    price: 29,
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS || "",
    apiCalls: 25000,
    templates: Infinity,
  },
} as const
