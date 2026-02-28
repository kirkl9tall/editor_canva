/**
 * Starter-kit Fabric.js canvas payloads for each preset template.
 *
 * Rules:
 *  - Coordinates are in canvas pixels (matching the w/h of each preset).
 *  - Text objects use {{placeholder}} syntax so the API substitution works out
 *    of the box when the user calls the render endpoint.
 *  - Keep it minimal – a solid background rect + headline + subtext is enough.
 */

interface FabricObject {
  type: string
  [key: string]: unknown
}

interface CanvasJson {
  version: string
  objects: FabricObject[]
  background?: string
}

// ── helpers ────────────────────────────────────────────────────────────────

function bgRect(w: number, h: number, fill: string): FabricObject {
  return {
    type: "Rect",
    version: "6.5.1",
    originX: "left",
    originY: "top",
    left: 0,
    top: 0,
    width: w,
    height: h,
    fill,
    stroke: null,
    strokeWidth: 0,
    selectable: false,
    evented: false,
    rx: 0,
    ry: 0,
    opacity: 1,
  }
}

function text(
  value: string,
  opts: {
    left: number
    top: number
    width: number
    fontSize: number
    fontWeight?: string
    fill?: string
    textAlign?: string
    fontFamily?: string
    lineHeight?: number
    charSpacing?: number
    opacity?: number
  }
): FabricObject {
  return {
    type: "Textbox",
    version: "6.5.1",
    originX: "left",
    originY: "top",
    left: opts.left,
    top: opts.top,
    width: opts.width,
    fontSize: opts.fontSize,
    fontWeight: opts.fontWeight ?? "normal",
    fontFamily: opts.fontFamily ?? "Inter",
    fill: opts.fill ?? "#ffffff",
    textAlign: opts.textAlign ?? "left",
    lineHeight: opts.lineHeight ?? 1.2,
    charSpacing: opts.charSpacing ?? 0,
    opacity: opts.opacity ?? 1,
    text: value,
    styles: [],
    splitByGrapheme: false,
  }
}

function accentLine(
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string
): FabricObject {
  return {
    type: "Rect",
    version: "6.5.1",
    originX: "left",
    originY: "top",
    left,
    top,
    width,
    height,
    fill,
    stroke: null,
    strokeWidth: 0,
    rx: height / 2,
    ry: height / 2,
    opacity: 1,
  }
}

// ── colour palette per category ────────────────────────────────────────────

const PALETTES: Record<string, { bg: string; accent: string; sub: string }> = {
  purple: { bg: "#1e0a3c", accent: "#7c3aed", sub: "#c4b5fd" },
  blue:   { bg: "#0f1f3d", accent: "#3b82f6", sub: "#93c5fd" },
  teal:   { bg: "#0d2b2b", accent: "#14b8a6", sub: "#99f6e4" },
  rose:   { bg: "#2d0a14", accent: "#f43f5e", sub: "#fda4af" },
  slate:  { bg: "#0f172a", accent: "#64748b", sub: "#cbd5e1" },
  amber:  { bg: "#1c0a00", accent: "#f59e0b", sub: "#fcd34d" },
  green:  { bg: "#052e16", accent: "#22c55e", sub: "#86efac" },
  indigo: { bg: "#1e1b4b", accent: "#6366f1", sub: "#a5b4fc" },
}

// ── per-preset builders ────────────────────────────────────────────────────

function socialPost(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.08)
  const availW = w - pad * 2
  const midY = Math.round(h * 0.38)
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      accentLine(pad, midY - 60, 48, 6, p.accent),
      text("{{title}}", {
        left: pad, top: midY - 40, width: availW,
        fontSize: Math.round(w * 0.065), fontWeight: "700",
        fill: "#ffffff", textAlign: "left",
      }),
      text("{{subtitle}}", {
        left: pad, top: midY + Math.round(w * 0.08), width: availW,
        fontSize: Math.round(w * 0.032), fontWeight: "400",
        fill: p.sub, textAlign: "left", lineHeight: 1.4,
      }),
      text("{{brand}}", {
        left: pad, top: h - pad - Math.round(w * 0.03), width: availW,
        fontSize: Math.round(w * 0.025), fontWeight: "700",
        fill: p.accent, textAlign: "left", charSpacing: 120,
        opacity: 0.9,
      }),
    ],
  }
}

function storyPost(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.1)
  const availW = w - pad * 2
  const midY = Math.round(h * 0.42)
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      // decorative top band
      { ...bgRect(w, Math.round(h * 0.04), p.accent), opacity: 0.6 },
      accentLine(pad, midY - 80, 56, 7, p.accent),
      text("{{title}}", {
        left: pad, top: midY - 55, width: availW,
        fontSize: Math.round(w * 0.1), fontWeight: "700",
        fill: "#ffffff", textAlign: "left",
      }),
      text("{{subtitle}}", {
        left: pad, top: midY + Math.round(w * 0.12), width: availW,
        fontSize: Math.round(w * 0.045), fontWeight: "400",
        fill: p.sub, textAlign: "left", lineHeight: 1.45,
      }),
      text("{{brand}}", {
        left: pad, top: h - Math.round(h * 0.06), width: availW,
        fontSize: Math.round(w * 0.038), fontWeight: "700",
        fill: p.accent, textAlign: "left", charSpacing: 140,
      }),
    ],
  }
}

function widePost(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.06)
  const availW = w - pad * 2
  const midY = Math.round(h * 0.35)
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      accentLine(pad, midY - 44, 40, 5, p.accent),
      text("{{title}}", {
        left: pad, top: midY - 26, width: availW,
        fontSize: Math.round(h * 0.2), fontWeight: "700",
        fill: "#ffffff", textAlign: "left",
      }),
      text("{{subtitle}}", {
        left: pad, top: midY + Math.round(h * 0.24), width: availW,
        fontSize: Math.round(h * 0.09), fontWeight: "400",
        fill: p.sub, textAlign: "left",
      }),
      text("{{brand}}", {
        left: pad, top: h - pad - Math.round(h * 0.1), width: availW,
        fontSize: Math.round(h * 0.075), fontWeight: "700",
        fill: p.accent, charSpacing: 130,
      }),
    ],
  }
}

function bannerPost(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const padL = Math.round(w * 0.04)
  const padV = Math.round(h * 0.22)
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      accentLine(padL, padV - 18, 32, 4, p.accent),
      text("{{title}}", {
        left: padL, top: padV, width: Math.round(w * 0.55),
        fontSize: Math.round(h * 0.26), fontWeight: "700",
        fill: "#ffffff",
      }),
      text("{{subtitle}}", {
        left: padL + Math.round(w * 0.58), top: padV - 4, width: Math.round(w * 0.34),
        fontSize: Math.round(h * 0.14), fontWeight: "400",
        fill: p.sub, lineHeight: 1.4,
      }),
    ],
  }
}

function adPost(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.09)
  const availW = w - pad * 2
  const ctaH = Math.round(h * 0.1)
  const ctaY = h - Math.round(h * 0.2)
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      accentLine(pad, Math.round(h * 0.25), 44, 5, p.accent),
      text("{{title}}", {
        left: pad, top: Math.round(h * 0.28), width: availW,
        fontSize: Math.round(w * 0.072), fontWeight: "700",
        fill: "#ffffff", textAlign: "center",
      }),
      text("{{subtitle}}", {
        left: pad, top: Math.round(h * 0.52), width: availW,
        fontSize: Math.round(w * 0.034), fontWeight: "400",
        fill: p.sub, textAlign: "center", lineHeight: 1.45,
      }),
      // CTA pill background
      {
        type: "Rect",
        version: "6.5.1",
        originX: "left",
        originY: "top",
        left: Math.round(w * 0.2),
        top: ctaY,
        width: Math.round(w * 0.6),
        height: ctaH,
        fill: p.accent,
        rx: ctaH / 2,
        ry: ctaH / 2,
        stroke: null,
        strokeWidth: 0,
        opacity: 1,
      } as FabricObject,
      text("{{cta}}", {
        left: Math.round(w * 0.2), top: ctaY + Math.round(ctaH * 0.18),
        width: Math.round(w * 0.6),
        fontSize: Math.round(ctaH * 0.44), fontWeight: "700",
        fill: "#ffffff", textAlign: "center",
      }),
    ],
  }
}

function printDoc(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.1)
  const availW = w - pad * 2
  return {
    version: "6.5.1",
    background: "#ffffff",
    objects: [
      bgRect(w, h, "#ffffff"),
      // left accent strip
      { ...bgRect(Math.round(w * 0.015), h, p.accent) },
      // top header band
      { ...bgRect(w, Math.round(h * 0.13), p.bg) },
      text("{{brand}}", {
        left: pad, top: Math.round(h * 0.025), width: availW,
        fontSize: Math.round(w * 0.045), fontWeight: "700",
        fill: "#ffffff",
      }),
      text("{{title}}", {
        left: pad, top: Math.round(h * 0.18), width: availW,
        fontSize: Math.round(w * 0.07), fontWeight: "700",
        fill: p.bg,
      }),
      accentLine(pad, Math.round(h * 0.3), 48, 5, p.accent),
      text("{{subtitle}}", {
        left: pad, top: Math.round(h * 0.33), width: availW,
        fontSize: Math.round(w * 0.032), fontWeight: "400",
        fill: "#374151", lineHeight: 1.6,
      }),
      text("{{body}}", {
        left: pad, top: Math.round(h * 0.42), width: availW,
        fontSize: Math.round(w * 0.026), fontWeight: "400",
        fill: "#6b7280", lineHeight: 1.7,
      }),
    ],
  }
}

function emailLayout(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.08)
  const availW = w - pad * 2
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      text("{{brand}}", {
        left: pad, top: Math.round(h * 0.12), width: availW,
        fontSize: Math.round(h * 0.14), fontWeight: "700",
        fill: p.accent, charSpacing: 100,
      }),
      accentLine(pad, Math.round(h * 0.38), 36, 4, p.accent),
      text("{{title}}", {
        left: pad, top: Math.round(h * 0.44), width: availW,
        fontSize: Math.round(h * 0.18), fontWeight: "700",
        fill: "#ffffff",
      }),
      text("{{subtitle}}", {
        left: pad, top: Math.round(h * 0.68), width: availW,
        fontSize: Math.round(h * 0.1), fontWeight: "400",
        fill: p.sub,
      }),
    ],
  }
}

function slideLayout(w: number, h: number, palette: keyof typeof PALETTES): CanvasJson {
  const p = PALETTES[palette]
  const pad = Math.round(w * 0.07)
  const availW = w - pad * 2
  const midY = Math.round(h * 0.38)
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      // bottom accent strip
      { ...bgRect(w, Math.round(h * 0.015), p.accent), top: h - Math.round(h * 0.015) },
      accentLine(pad, midY - 60, 56, 7, p.accent),
      text("{{title}}", {
        left: pad, top: midY - 34, width: availW,
        fontSize: Math.round(h * 0.14), fontWeight: "700",
        fill: "#ffffff",
      }),
      text("{{subtitle}}", {
        left: pad, top: midY + Math.round(h * 0.18), width: availW,
        fontSize: Math.round(h * 0.058), fontWeight: "400",
        fill: p.sub, lineHeight: 1.45,
      }),
      text("{{brand}}", {
        left: pad, top: h - Math.round(h * 0.1), width: availW,
        fontSize: Math.round(h * 0.042), fontWeight: "700",
        fill: p.accent, charSpacing: 140,
      }),
    ],
  }
}

function businessCard(w: number, h: number): CanvasJson {
  const p = PALETTES.purple
  const pad = Math.round(w * 0.07)
  const availW = w - pad * 2
  return {
    version: "6.5.1",
    background: p.bg,
    objects: [
      bgRect(w, h, p.bg),
      // right accent strip
      {
        type: "Rect", version: "6.5.1",
        originX: "left", originY: "top",
        left: w - Math.round(w * 0.025), top: 0,
        width: Math.round(w * 0.025), height: h,
        fill: p.accent, stroke: null, strokeWidth: 0, opacity: 1,
      } as FabricObject,
      text("{{name}}", {
        left: pad, top: Math.round(h * 0.2), width: availW,
        fontSize: Math.round(w * 0.055), fontWeight: "700",
        fill: "#ffffff",
      }),
      text("{{title}}", {
        left: pad, top: Math.round(h * 0.44), width: availW,
        fontSize: Math.round(w * 0.028), fontWeight: "400",
        fill: p.sub,
      }),
      accentLine(pad, Math.round(h * 0.58), 32, 3, p.accent),
      text("{{email}}", {
        left: pad, top: Math.round(h * 0.64), width: availW,
        fontSize: Math.round(w * 0.024), fontWeight: "400",
        fill: "#9ca3af",
      }),
      text("{{brand}}", {
        left: pad, top: Math.round(h * 0.78), width: availW,
        fontSize: Math.round(w * 0.03), fontWeight: "700",
        fill: p.accent, charSpacing: 120,
      }),
    ],
  }
}

// ── exported map ───────────────────────────────────────────────────────────

export const PRESET_CANVAS_DATA: Record<string, CanvasJson> = {
  "feed-square":   socialPost(1200, 1200, "purple"),
  "ig-post":       socialPost(1080, 1080, "indigo"),
  "ig-story":      storyPost(1080, 1920, "rose"),
  "pinterest":     storyPost(1000, 1500, "teal"),
  "tw-post":       widePost(1200, 675, "blue"),
  "fb-post":       widePost(1200, 630, "indigo"),
  "li-post":       widePost(1200, 627, "slate"),
  "li-banner":     bannerPost(1584, 396, "blue"),
  "og-image":      widePost(1200, 630, "purple"),
  "leaderboard":   bannerPost(728, 90, "slate"),
  "medium-rect":   adPost(300, 250, "purple"),
  "fb-ad":         adPost(1080, 1080, "rose"),
  "a4-doc":        printDoc(794, 1123, "indigo"),
  "business-card": businessCard(1050, 600),
  "poster-a3":     storyPost(1123, 1587, "amber"),
  "email-header":  emailLayout(600, 200, "purple"),
  "email-banner":  emailLayout(600, 300, "teal"),
  "slide-169":     slideLayout(1920, 1080, "indigo"),
  "slide-43":      slideLayout(1024, 768, "purple"),
}
