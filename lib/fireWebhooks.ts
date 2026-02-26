import { createHmac } from "crypto"
import { db } from "@/lib/db"

interface WebhookPayload {
  event: string
  image_url: string
  template_id: string
  generated_at: string
  [key: string]: unknown
}

export async function fireWebhooks(userId: string, payload: WebhookPayload) {
  const webhooks = await db.webhook.findMany({
    where: { userId, events: { has: payload.event } },
  })

  if (webhooks.length === 0) return

  const body = JSON.stringify(payload)

  await Promise.allSettled(
    webhooks.map(async (wh) => {
      const signature = createHmac("sha256", wh.secret)
        .update(body)
        .digest("hex")

      try {
        await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Renderify-Signature": `sha256=${signature}`,
            "X-Renderify-Event": payload.event,
          },
          body,
          signal: AbortSignal.timeout(10_000),
        })
      } catch {
        // Fire-and-forget: log but don't throw
        console.warn(`Webhook delivery failed for ${wh.url}`)
      }
    })
  )
}
