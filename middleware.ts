import { NextRequest, NextResponse } from "next/server"

/**
 * Rate-limiting middleware for /api/v1/* routes.
 *
 * Strategy: validate auth header format here (fast, no DB), then delegate
 * to the internal /api/internal/rate-check endpoint which runs a Prisma DB
 * check in the Node.js runtime (middleware is Edge, DB calls need Node.js).
 *
 * The actual per-request business logic in the route handler still does its
 * own checks — this middleware provides an early-exit before the heavy
 * Puppeteer render starts.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith("/api/v1/")) {
    return NextResponse.next()
  }

  // 1. Validate auth header format
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid authorization header. Pass: Authorization: Bearer <api_key>" },
      { status: 401 }
    )
  }

  const apiKey = authHeader.substring(7).trim()
  if (!apiKey) {
    return NextResponse.json({ error: "Empty API key" }, { status: 401 })
  }

  // 2. Call the internal rate-check endpoint (runs in Node.js, can use Prisma)
  const internalSecret = process.env.INTERNAL_SECRET
  if (!internalSecret) {
    // If no internal secret is configured, skip the middleware rate check.
    // The route handler will still enforce limits.
    return NextResponse.next()
  }

  try {
    const checkUrl = new URL("/api/internal/rate-check", request.nextUrl.origin)
    const checkRes = await fetch(checkUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({ apiKey }),
    })

    if (!checkRes.ok) {
      const body = await checkRes.json().catch(() => ({ error: "Request rejected" }))
      return NextResponse.json(body, { status: checkRes.status })
    }
  } catch {
    // If the rate-check call fails (e.g., cold start), let the request through.
    // The route handler will still do its own check.
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/v1/:path*"],
}
