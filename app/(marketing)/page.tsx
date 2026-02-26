"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Zap, Code2, Image, BarChart3, Lock, Layers, CheckCircle2, Sparkles, ChevronDown } from "lucide-react"

/* ── Mock API demo shown in hero ── */
function HeroVisual() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -inset-4 bg-violet-600/20 rounded-3xl blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <span className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs text-white/40 font-mono">POST /api/v1/images</span>
        </div>
        <div className="p-4 font-mono text-xs leading-relaxed">
          <p className="text-white/40">// Request</p>
          <p><span className="text-violet-400">Authorization:</span> <span className="text-emerald-400">Bearer sk_live_••••••••••</span></p>
          <pre className="mt-2 text-white/80">{`{
  "template_id": "tmpl_hero_card",
  "modifications": {
    "name": "Sarah Johnson",
    "title": "Senior Engineer"
  },
  "format": "png"
}`}</pre>
        </div>
        <div className="border-t border-white/10 mx-4" />
        <div className="p-4 font-mono text-xs leading-relaxed">
          <p className="text-white/40">// Response · 320ms</p>
          <pre className="mt-2 text-emerald-400">{`{
  "image_url": "https://res.cloudinary.com/…",
  "format": "png",
  "width": 1200,
  "height": 630
}`}</pre>
        </div>
        <div className="m-4 mt-0 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-px">
          <div className="rounded-[11px] bg-[#0d0020] px-5 py-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold text-sm shrink-0">SJ</div>
            <div>
              <p className="text-white font-semibold text-sm">Sarah Johnson</p>
              <p className="text-white/60 text-xs">Senior Engineer</p>
            </div>
            <Sparkles className="ml-auto h-5 w-5 text-fuchsia-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: Code2,     color: "bg-violet-100 text-violet-600",  title: "Simple REST API",        desc: "One POST request to generate any image. Send variables, get a URL back. Works in any language." },
  { icon: Layers,    color: "bg-blue-100 text-blue-600",      title: "Visual Template Editor",  desc: "Drag-and-drop canvas editor with text layers, images, shapes. Design once, reuse infinitely." },
  { icon: Zap,       color: "bg-amber-100 text-amber-600",    title: "Sub-second Rendering",   desc: "Powered by headless Chromium + Fabric.js. PNG and JPEG output with full font support." },
  { icon: Image,     color: "bg-emerald-100 text-emerald-600",title: "CDN Delivery",           desc: "Images auto-uploaded to Cloudinary. Globally cached, optimised, and served at the edge." },
  { icon: BarChart3, color: "bg-pink-100 text-pink-600",      title: "Usage Dashboard",        desc: "Track API calls per day, see your monthly quota, monitor per-key activity in real time." },
  { icon: Lock,      color: "bg-indigo-100 text-indigo-600",  title: "Secure API Keys",        desc: "Scoped API keys with creation timestamps. Keys shown only once; masked in your dashboard." },
]

const PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    desc: "Great for side projects",
    features: ["100 API calls/month", "3 templates", "PNG & JPEG output", "Community support"],
    cta: "Get started",
    monthlyHref: "/auth/signin",
    yearlyHref: "/auth/signin",
    highlight: false,
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    desc: "For teams shipping at scale",
    features: ["Unlimited API calls", "Unlimited templates", "PNG, JPEG & PDF output", "Priority support", "Cloudinary CDN included", "Usage analytics"],
    cta: "Start free trial",
    monthlyHref: "/auth/signin?plan=pro",
    yearlyHref: "/auth/signin?plan=pro&billing=yearly",
    highlight: true,
  },
  {
    name: "Business",
    monthlyPrice: 99,
    desc: "High-volume & white-label",
    features: ["Everything in Pro", "Custom domain", "SLA guarantee", "Dedicated support", "SSO / SAML", "Invoice billing"],
    cta: "Contact sales",
    monthlyHref: "/auth/signin?plan=business",
    yearlyHref: "/auth/signin?plan=business&billing=yearly",
    highlight: false,
  },
]

const FAQ_ITEMS = [
  { q: "Is there a free tier?",                  a: "Yes — the Free plan gives you 100 API calls per month and up to 3 templates at no cost. No credit card required to sign up." },
  { q: "Can I cancel my subscription anytime?",  a: "Absolutely. You can cancel from your account settings at any time. You’ll retain access to paid features until the end of your billing period." },
  { q: "What image formats are supported?",       a: "PNG and JPEG are available on all plans. PDF export is included on Pro and Business. All outputs are delivered via Cloudinary CDN." },
  { q: "Do my generated images expire?",          a: "No. Images are stored on Cloudinary indefinitely and served via global CDN. You can delete individual images from your dashboard whenever you like." },
  { q: "Is there an SDK or client library?",      a: "The API is plain REST — any HTTP client in any language works out of the box. Official Node.js and Python SDKs are on the roadmap." },
]

export default function HomePage() {
  const [isYearly, setIsYearly] = useState(false)
  const [openFaq, setOpenFaq]   = useState<number | null>(null)

  function getPrice(plan: (typeof PLANS)[0]) {
    if (plan.monthlyPrice === 0) return { display: "$0", original: null }
    const discounted = Math.floor(plan.monthlyPrice * 0.8)
    return isYearly
      ? { display: `$${discounted}`, original: `$${plan.monthlyPrice}` }
      : { display: `$${plan.monthlyPrice}`, original: null }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <header className="sticky top-0 z-30 bg-[#0d0020]/95 backdrop-blur-sm border-b border-white/10">
        <nav className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <span className="font-semibold text-white text-lg">Renderify</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#features" className="text-white/70 hover:text-white text-sm hidden sm:block transition-colors">Features</Link>
            <Link href="#demo"     className="text-white/70 hover:text-white text-sm hidden sm:block transition-colors">Demo</Link>
            <Link href="#pricing"  className="text-white/70 hover:text-white text-sm hidden sm:block transition-colors">Pricing</Link>
            <Link href="/docs"     className="text-white/70 hover:text-white text-sm hidden sm:block transition-colors">Docs</Link>
            <Link href="/auth/signin" className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-1.5 transition-colors whitespace-nowrap">Get Started Free</Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d0020] via-[#1a0040] to-[#0a0018] px-6 pt-20 pb-28">
        <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-700/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-fuchsia-700/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 mb-6">
              <Sparkles className="h-3 w-3" /> Image Generation API — by Renderify
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              <span className="text-white">Generate images</span><br />
              <span className="animate-gradient-x bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">at scale with code.</span>
            </h1>
            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-md">
              Design templates visually, then generate thousands of personalised images via a simple REST API.
              Perfect for OG images, certificates, and dynamic social cards.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/signin" className="inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 transition-colors shadow-lg shadow-violet-900/40">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:bg-white/10 text-white font-medium px-6 py-3 transition-colors">
                See how it works
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-white/40">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />100 free calls/mo</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Open-source editor</span>
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything you need to ship</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">A full-stack image generation platform — from visual editor to CDN delivery.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${f.color} mb-4`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO ─────────────────────────────────────────────────────────────── */}
      <section id="demo" className="px-6 py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">See it in action</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Design once. Generate forever.</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Open a template in the visual editor, place your{" "}
              <code className="bg-gray-100 text-violet-600 px-1.5 py-0.5 rounded text-sm font-mono">{"{{variables}}"}</code>
              {" "}and hit the API — done.
            </p>
          </div>

          {/* ── EDITOR MOCKUP ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-gray-200 shadow-2xl shadow-gray-200/80 overflow-hidden bg-white mx-auto max-w-5xl">

            {/* top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#4c1d95] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded hover:bg-white/10 text-white/70">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </div>
                <span className="text-white text-sm font-semibold">Social Card Template</span>
                <svg className="h-3 w-3 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" /></svg>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-white/70 hover:bg-white/10 transition font-medium">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  History
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-white/70 hover:bg-white/10 transition font-medium">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                  Test
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-violet-500 text-white font-bold transition">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  Save
                </button>
              </div>
            </div>

            {/* body row */}
            <div className="flex" style={{ height: "420px" }}>

              {/* left icon bar */}
              <div className="w-14 flex flex-col items-center py-3 gap-1 border-r bg-white shrink-0">
                {[
                  { label: "T", title: "Text" },
                  { label: "▭", title: "Rectangle" },
                  { label: "◯", title: "Circle" },
                  { label: "⬜", title: "Image" },
                ].map(({ label, title }) => (
                  <button key={title} title={title} className="w-10 h-10 flex flex-col items-center justify-center rounded-lg hover:bg-violet-50 text-gray-500 text-xs gap-0.5 transition">
                    <span className="text-base leading-none">{label}</span>
                    <span className="text-[9px] text-gray-400">{title}</span>
                  </button>
                ))}
              </div>

              {/* canvas area */}
              <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {/* canvas shadow */}
                <div className="relative" style={{ width: "480px", height: "270px" }}>
                  <div className="absolute inset-0 shadow-xl rounded-sm" />
                  {/* canvas */}
                  <div className="w-full h-full bg-gradient-to-br from-[#1a0040] to-[#0d0020] rounded-sm overflow-hidden relative select-none">
                    {/* background glow */}
                    <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-violet-700/30 blur-2xl" />
                    <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-fuchsia-700/20 blur-2xl" />
                    {/* avatar circle */}
                    <div className="absolute top-8 left-10 h-16 w-16 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      SJ
                    </div>
                    {/* name text layer — highlighted (selected) */}
                    <div className="absolute top-9 left-32" style={{ outline: "2px solid #7c3aed", outlineOffset: "2px" }}>
                      <p className="text-white font-bold text-xl leading-tight">{"{{name}}"}</p>
                    </div>
                    {/* title text layer */}
                    <div className="absolute top-[72px] left-32">
                      <p className="text-violet-300 text-sm">{"{{title}}"}</p>
                    </div>
                    {/* divider */}
                    <div className="absolute top-[115px] left-10 right-10 h-px bg-white/10" />
                    {/* stat boxes */}
                    <div className="absolute bottom-8 left-10 right-10 flex gap-3">
                      {[
                        { label: "Projects", val: "{{projects}}" },
                        { label: "Stars", val: "{{stars}}" },
                        { label: "Joined", val: "{{year}}" },
                      ].map(({ label, val }) => (
                        <div key={label} className="flex-1 rounded-lg bg-white/5 border border-white/10 px-2 py-2 text-center">
                          <p className="text-white/40 text-[9px] uppercase tracking-wide">{label}</p>
                          <p className="text-white text-xs font-semibold mt-0.5 font-mono">{val}</p>
                        </div>
                      ))}
                    </div>
                    {/* Renderify badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <div className="h-3 w-3 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                      <span className="text-[9px] text-white/30 font-semibold tracking-wide">Renderify</span>
                    </div>
                  </div>
                  {/* selection handles on the name layer */}
                  <div className="absolute" style={{ top: "34px", left: "128px", width: "112px", height: "32px", outline: "2px solid #7c3aed", pointerEvents: "none", borderRadius: "1px" }}>
                    {[["0%","0%"],["50%","0%"],["100%","0%"],["100%","50%"],["100%","100%"],["50%","100%"],["0%","100%"],["0%","50%"]].map(([l,t], i) => (
                      <div key={i} style={{ position: "absolute", left: l, top: t, transform: "translate(-50%,-50%)", width: "8px", height: "8px", background: "white", border: "2px solid #7c3aed", borderRadius: "2px" }} />
                    ))}
                  </div>
                </div>

                {/* zoom indicator */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white rounded-lg px-2 py-1 shadow text-xs text-gray-500 border border-gray-100">
                  <span>−</span>
                  <span className="font-medium text-gray-700 w-8 text-center">100%</span>
                  <span>+</span>
                </div>
              </div>

              {/* right properties panel */}
              <div className="w-56 border-l bg-white flex flex-col text-xs shrink-0 overflow-y-auto">
                <div className="px-3 py-2 bg-violet-50 border-b flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-violet-700 uppercase">Text</span>
                  <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
                <div className="p-3 space-y-2.5 border-b">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Content</p>
                    <div className="border border-violet-300 rounded px-2 py-1.5 text-gray-700 font-mono bg-violet-50/50">{"{{name}}"}</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Font</p>
                    <div className="flex gap-1">
                      <div className="flex-1 border rounded px-2 py-1.5 text-gray-700 bg-gray-50">Inter</div>
                      <div className="border rounded px-2 py-1.5 text-gray-700 bg-gray-50 w-10 text-center">24</div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Align</p>
                    <div className="flex gap-1">
                      {["≡","≡","≡"].map((_, i) => (
                        <button key={i} className={`flex-1 py-1 rounded border text-[10px] ${i===0 ? "bg-violet-100 border-violet-300 text-violet-700" : "border-gray-200 text-gray-400"}`}>{["L","C","R"][i]}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Color</p>
                    <div className="flex items-center gap-2 border rounded px-2 py-1.5 bg-gray-50">
                      <div className="h-4 w-4 rounded-sm bg-white border border-gray-300" />
                      <span className="text-gray-600 font-mono">#FFFFFF</span>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 bg-violet-50 border-b flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-violet-700 uppercase">Position</span>
                  <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1"><p className="text-[10px] text-gray-400 mb-1">X</p><div className="border rounded px-2 py-1.5 text-gray-700 bg-gray-50 font-mono">320</div></div>
                    <div className="flex-1"><p className="text-[10px] text-gray-400 mb-1">Y</p><div className="border rounded px-2 py-1.5 text-gray-700 bg-gray-50 font-mono">72</div></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1"><p className="text-[10px] text-gray-400 mb-1">W</p><div className="border rounded px-2 py-1.5 text-gray-700 bg-gray-50 font-mono">280</div></div>
                    <div className="flex-1"><p className="text-[10px] text-gray-400 mb-1">H</p><div className="border rounded px-2 py-1.5 text-gray-700 bg-gray-50 font-mono">32</div></div>
                  </div>
                </div>
                <div className="px-3 py-2 bg-violet-50 border-b flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-violet-700 uppercase">Layers</span>
                  <svg className="h-3 w-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </div>
                <div className="p-2 space-y-1">
                  {[
                    { label: "{{name}}", active: true, icon: "T" },
                    { label: "{{title}}", active: false, icon: "T" },
                    { label: "Stats Row", active: false, icon: "▭" },
                    { label: "Avatar", active: false, icon: "◯" },
                    { label: "Background", active: false, icon: "▭" },
                  ].map(({ label, active, icon }) => (
                    <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11px] cursor-pointer ${active ? "bg-violet-100 text-violet-700" : "hover:bg-gray-50 text-gray-600"}`}>
                      <span className="w-4 text-center text-[10px] shrink-0">{icon}</span>
                      <span className="flex-1 truncate font-mono">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* caption */}
          <p className="text-center text-sm text-gray-400 mt-6">
            The editor above is exactly what you use to design templates — fully interactive in your dashboard.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">Start free, scale as you grow. No hidden fees.</p>
          </div>

          {/* Monthly / Yearly toggle */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-12 h-6 rounded-full transition-colors ${isYearly ? "bg-violet-600" : "bg-gray-200"}`}
              aria-label="Toggle yearly billing"
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isYearly ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? "text-gray-900" : "text-gray-400"}`}>
              Yearly
              <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                Save 20%
              </span>
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PLANS.map((plan) => {
              const { display, original } = getPrice(plan)
              const href = isYearly ? plan.yearlyHref : plan.monthlyHref
              return (
                <div key={plan.name} className={`relative rounded-2xl p-8 border ${plan.highlight ? "border-violet-500 ring-2 ring-violet-500 shadow-xl shadow-violet-100" : "border-gray-200 shadow-sm"}`}>
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 py-0.5 text-xs font-semibold text-white shadow">
                        <Sparkles className="h-3 w-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <div className="mt-2 flex items-end gap-2">
                      {original && (
                        <span className="text-xl font-semibold text-gray-400 line-through mb-0.5">{original}</span>
                      )}
                      <span className="text-4xl font-extrabold text-gray-900">{display}</span>
                      <span className="text-gray-400 mb-1">/mo</span>
                    </div>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">Billed annually — save 20%</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 text-sm text-gray-600">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-violet-500" : "text-emerald-500"}`} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href={href} className={`block text-center rounded-xl py-2.5 font-semibold text-sm transition-colors ${plan.highlight ? "bg-violet-600 hover:bg-violet-500 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"}`}>
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Frequently asked questions</h2>
          </div>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 ml-4 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 bg-gradient-to-br from-violet-900 to-[#0a0018]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to automate your image workflow?</h2>
          <p className="text-violet-300 mb-8">Sign up in 30 seconds. 100 free image generations every month, no card required.</p>
          <Link href="/auth/signin" className="inline-flex items-center gap-2 rounded-full bg-white text-violet-700 font-bold px-8 py-3.5 hover:bg-violet-50 transition-colors shadow-lg">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#060010] border-t border-white/5 px-6 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500" />
                <span className="font-bold text-white">Renderify</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">
                Generate personalised images at scale with a simple REST API.
              </p>
            </div>
            {/* Product */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Product</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><Link href="/dashboard/templates" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Docs</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Company</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
            {/* Developers */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-4">Developers</p>
              <ul className="space-y-2.5 text-sm text-white/50">
                <li><Link href="/docs#curl" className="hover:text-white transition-colors">Quick Start</Link></li>
                <li><Link href="/docs#rate-limits" className="hover:text-white transition-colors">Rate Limits</Link></li>
                <li><Link href="/docs#errors" className="hover:text-white transition-colors">Error Codes</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-white/30">© 2025 Renderify. All rights reserved.</span>
            <span className="text-xs text-white/20">Built with Next.js &amp; Fabric.js</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
