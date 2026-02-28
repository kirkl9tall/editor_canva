"use client"

import { useId } from "react"

/**
 * InfinityLogo — the Renderify brand mark.
 * Uses useId() so each instance gets unique gradient IDs, preventing
 * the browser from reusing the first definition when multiple logos
 * appear on the same page (sidebar renders 3 instances).
 */
export default function InfinityLogo({
  size = 28,
  className,
}: {
  size?: number
  className?: string
}) {
  const uid = useId().replace(/:/g, "")
  const h = Math.round(size * 0.63)

  const gMain   = `${uid}-main`
  const gShadow = `${uid}-shadow`
  const gHi     = `${uid}-hi`

  // Figure-8 path in a 100 × 63 viewBox
  const p =
    "M50,31.5 C50,19 62,11 71.5,11 C83.5,11 91,19.5 91,31.5 C91,43.5 83.5,52 71.5,52 C62,52 50,44 50,31.5 C50,19 38,11 28.5,11 C16.5,11 9,19.5 9,31.5 C9,43.5 16.5,52 28.5,52 C38,52 50,44 50,31.5Z"

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 63"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Renderify logo"
    >
      <defs>
        {/* Main blue → indigo → purple gradient */}
        <linearGradient id={gMain} x1="0" y1="0" x2="100" y2="63" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#60a5fa" />
          <stop offset="48%"  stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        {/* Bottom shadow for 3-D depth */}
        <linearGradient id={gShadow} x1="50" y1="0" x2="50" y2="63" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#1e1b4b" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.55" />
        </linearGradient>

        {/* Top gloss highlight */}
        <linearGradient id={gHi} x1="20" y1="0" x2="80" y2="63" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#bfdbfe" stopOpacity="0.7" />
          <stop offset="60%"  stopColor="#a5b4fc" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#e9d5ff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* depth / drop-shadow layer */}
      <path d={p} stroke="#1e1b4b" strokeWidth="15" strokeLinecap="round"
            transform="translate(0,2)" opacity="0.3" />

      {/* main tube body */}
      <path d={p} stroke={`url(#${gMain})`} strokeWidth="13" strokeLinecap="round" />

      {/* bottom shading */}
      <path d={p} stroke={`url(#${gShadow})`} strokeWidth="13" strokeLinecap="round" />

      {/* top gloss */}
      <path d={p} stroke={`url(#${gHi})`} strokeWidth="5" strokeLinecap="round"
            transform="translate(0,-1)" />
    </svg>
  )
}
