"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Copy, Check, ChevronDown } from "lucide-react"
import { useState, useCallback } from "react"

/* ─── syntax helpers ────────────────────────────────────── */
function K({ c }: { c: string }) { return <span className="text-violet-400">{c}</span> }
function S({ c }: { c: string }) { return <span className="text-emerald-400">{c}</span> }
function N({ c }: { c: string }) { return <span className="text-amber-300">{c}</span> }
function Cm({ c }: { c: string }) { return <span className="text-gray-500">{c}</span> }

/* ─── copy button ─────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }, [text])
  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/80 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  )
}

/* ─── code block with optional copy ──────────────────── */
function CodeBlock({ children, label, raw }: { children: React.ReactNode; label?: string; raw?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0020] text-sm font-mono leading-relaxed">
      {label && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-white/40">{label}</span>
          </div>
          {raw && <CopyButton text={raw} />}
        </div>
      )}
      <pre className="p-5 overflow-x-auto whitespace-pre text-white/85">{children}</pre>
    </div>
  )
}

/* ─── example with request + response tabs ──────────── */
function ExampleTabs({
  label,
  requestEl,
  requestRaw,
  responseEl,
  responseRaw,
}: {
  label: string
  requestEl: React.ReactNode
  requestRaw: string
  responseEl: React.ReactNode
  responseRaw: string
}) {
  const [tab, setTab] = useState<"request" | "response">("request")
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0d0020] text-sm font-mono leading-relaxed">
      {/* tab bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-xs text-white/40">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-white/10 rounded-md p-0.5">
            {(["request", "response"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 py-0.5 rounded text-xs font-sans transition-colors ${
                  tab === t ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                {t === "request" ? "Request" : "Response"}
              </button>
            ))}
          </div>
          <CopyButton text={tab === "request" ? requestRaw : responseRaw} />
        </div>
      </div>
      <pre className="p-5 overflow-x-auto whitespace-pre text-white/85">
        {tab === "request" ? requestEl : responseEl}
      </pre>
    </div>
  )
}

/* ─── section with anchor ────────────────────────────── */
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="group flex items-center gap-2 text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        <a href={`#${id}`} className="opacity-0 group-hover:opacity-40 transition-opacity text-gray-400 hover:text-gray-600 text-base">
          #
        </a>
        {title}
      </h2>
      {children}
    </section>
  )
}

const RATE_LIMITS = [
  { plan: "Free",     limit: "100 / month",  burst: "5 / min",   priority: "Standard"  },
  { plan: "Pro",      limit: "Unlimited",    burst: "60 / min",  priority: "High"       },
  { plan: "Business", limit: "Unlimited",    burst: "300 / min", priority: "Dedicated"  },
]

/* ──────────────────────────── raw strings for copy ─── */
const RAW_AUTH = `# Include in every request
Authorization: Bearer sk_live_••••••••••••••••••••`

const RAW_REQUEST_BODY = `{
  "template_id": "tmpl_social_card_abc123",
  "modifications": {
    "name": "Sarah Johnson",
    "title": "Senior Engineer",
    "company": "Acme Corp"
  },
  "format": "png"
}`

const RAW_RESPONSE_200 = `{
  "success": true,
  "image_url": "https://res.cloudinary.com/demo/image/upload/v1/social_card.png",
  "template_id": "tmpl_social_card_abc123",
  "format": "png",
  "generated_at": "2026-02-25T14:30:00.000Z",
  "usage": { "used": 12, "limit": 100 }
}`

const RAW_CURL = `curl -X POST \\
  https://your-app.vercel.app/api/v1/images \\
  -H "Authorization: Bearer sk_live_••••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "template_id": "tmpl_social_card_abc123",
    "modifications": { "name": "Sarah Johnson", "title": "Senior Engineer" },
    "format": "png"
  }'`

const RAW_CURL_RES = RAW_RESPONSE_200

const RAW_NODE = `const response = await fetch("https://your-app.vercel.app/api/v1/images", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${process.env.CANVAS_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    template_id: "tmpl_social_card_abc123",
    modifications: { name: "Sarah Johnson", title: "Senior Engineer" },
  }),
});

const { image_url, generated_at } = await response.json();
console.log("Generated:", image_url);`

const RAW_NODE_RES = RAW_RESPONSE_200

const RAW_PYTHON = `import requests

response = requests.post(
    "https://your-app.vercel.app/api/v1/images",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "template_id": "tmpl_social_card_abc123",
        "modifications": {"name": "Sarah Johnson", "title": "Senior Engineer"},
    },
)
data = response.json()
print(f"Generated: {data['image_url']}")`

const RAW_PYTHON_RES = RAW_RESPONSE_200

/* ─────────────────────────────────────── page ───────── */
export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <span className="font-semibold text-gray-900">Renderify</span>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-gray-600 text-sm">Docs</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/auth/signin" className="inline-flex items-center gap-1.5 text-sm rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-1.5 transition-colors">
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12 flex gap-10">

        {/* ── SIDEBAR ───────────────────── */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-1 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Getting started</p>
            <a href="#authentication" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">Authentication</a>
            <a href="#generate-image" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">POST /api/v1/images</a>
            <a href="#response" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">Response format</a>
            <a href="#errors" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">Error codes</a>
            <a href="#rate-limits" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">Rate limits</a>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 mt-5">Examples</p>
            <a href="#curl" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">cURL</a>
            <a href="#node" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">Node.js</a>
            <a href="#python" className="block px-3 py-1.5 rounded-lg text-gray-600 hover:bg-violet-50 hover:text-violet-700 transition-colors">Python</a>
          </div>
        </aside>

        {/* ── MAIN ──────────────────────── */}
        <main className="flex-1 min-w-0 space-y-12">

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-600 mb-4">
              <Sparkles className="h-3 w-3" /> API Reference · v1
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">API Documentation</h1>
            <p className="text-gray-500 leading-relaxed max-w-2xl">
              The Renderify REST API lets you generate images from your visual templates programmatically.
              Send variable values in a POST request, get a CDN URL back — in under a second.
            </p>
          </div>

          {/* ── AUTHENTICATION ─────────── */}
          <Section id="authentication" title="Authentication">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              All API requests require a valid API key passed as a Bearer token in the{" "}
              <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header.
              Generate API keys from your{" "}
              <Link href="/dashboard/api-keys" className="text-violet-600 hover:underline">dashboard → API Keys</Link>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5 flex gap-3">
              <span className="text-lg leading-none">⚠</span>
              <p>API keys are shown only once at creation time. Store them securely — they cannot be recovered.</p>
            </div>
            <CodeBlock label="Authorization header" raw={RAW_AUTH}>
              <Cm c={"# Include in every request\n"} />
              <K c={"Authorization"} />{": Bearer "}<S c={"sk_live_••••••••••••••••••••"} />
            </CodeBlock>
          </Section>

          {/* ── GENERATE IMAGE ─────────── */}
          <Section id="generate-image" title="POST /api/v1/images">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              Generate an image from a saved template. Replace{" "}
              <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">{"{{variable}}"}</code>
              {" "}placeholders with the values you pass in{" "}
              <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">modifications</code>.
            </p>
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 mb-5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">POST</span>
              <code className="text-sm font-mono text-emerald-800">/api/v1/images</code>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 mt-5">Request body</h3>
            <div className="rounded-xl border border-gray-200 overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Parameter</th>
                    <th className="text-left px-4 py-2.5 font-medium">Type</th>
                    <th className="text-left px-4 py-2.5 font-medium">Required</th>
                    <th className="text-left px-4 py-2.5 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { param: "template_id",  type: "string",         req: "Yes", desc: "ID of the template to render. Visible in the editor URL." },
                    { param: "modifications",type: "object",          req: "No",  desc: "Key–value map of {{variable}} names to replacement strings." },
                    { param: "format",       type: '"png" | "jpeg"',  req: "No",  desc: 'Output format. Defaults to "png".' },
                    { param: "quality",      type: "number",          req: "No",  desc: "JPEG quality 1–100. Ignored for PNG. Defaults to 90." },
                  ].map(({ param, type, req, desc }) => (
                    <tr key={param} className="bg-white">
                      <td className="px-4 py-3 font-mono text-violet-700 text-xs">{param}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded ${req === "Yes" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>{req}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Request example</h3>
            <CodeBlock label="POST /api/v1/images · application/json" raw={RAW_REQUEST_BODY}>
              {"{\n"}
              {"  "}<K c={'"template_id"'} />{": "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
              {"  "}<K c={'"modifications"'} />{": {\n"}
              {"    "}<K c={'"name"'} />{": "}<S c={'"Sarah Johnson"'} />{",\n"}
              {"    "}<K c={'"title"'} />{": "}<S c={'"Senior Engineer"'} />{",\n"}
              {"    "}<K c={'"company"'} />{": "}<S c={'"Acme Corp"'} />{"\n"}
              {"  },\n"}
              {"  "}<K c={'"format"'} />{": "}<S c={'"png"'} />{"\n"}
              {"}"}
            </CodeBlock>
          </Section>

          {/* ── RESPONSE ───────────────── */}
          <Section id="response" title="Response format">
            <p className="text-gray-600 text-sm mb-4">
              On success the API returns <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">HTTP 200</code> with:
            </p>
            <CodeBlock label="200 OK · application/json" raw={RAW_RESPONSE_200}>
              {"{\n"}
              {"  "}<K c={'"success"'} />{": "}<N c={"true"} />{",\n"}
              {"  "}<K c={'"image_url"'} />{": "}<S c={'"https://res.cloudinary.com/demo/image/upload/v1/social_card.png"'} />{",\n"}
              {"  "}<K c={'"template_id"'} />{": "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
              {"  "}<K c={'"format"'} />{": "}<S c={'"png"'} />{",\n"}
              {"  "}<K c={'"generated_at"'} />{": "}<S c={'"2026-02-25T14:30:00.000Z"'} />{",\n"}
              {"  "}<K c={'"usage"'} />{": { "}<K c={'"used"'} />{": "}<N c={"12"} />{", "}<K c={'"limit"'} />{": "}<N c={"100"} />{" }\n"}
              {"}"}
            </CodeBlock>
          </Section>

          {/* ── ERROR CODES ────────────── */}
          <Section id="errors" title="Error codes">
            <p className="text-gray-600 text-sm mb-4">
              All errors return a consistent shape with an <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">error</code> field.
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden mb-5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium">Code</th>
                    <th className="text-left px-4 py-2.5 font-medium">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { status: "401", code: "unauthorized",    meaning: "Missing or invalid API key." },
                    { status: "403", code: "forbidden",       meaning: "API key does not have access to this template." },
                    { status: "404", code: "not_found",       meaning: "Template ID does not exist." },
                    { status: "422", code: "invalid_request", meaning: "Missing required field or invalid value." },
                    { status: "429", code: "rate_limited",    meaning: "Monthly quota or burst limit exceeded." },
                    { status: "500", code: "render_failed",   meaning: "Internal rendering error. Retry with exponential backoff." },
                  ].map(({ status, code, meaning }) => (
                    <tr key={code} className="bg-white">
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded ${status.startsWith("4") ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700"}`}>{status}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-violet-700">{code}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── RATE LIMITS ────────────── */}
          <Section id="rate-limits" title="Rate limits">
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Limits are applied per API key. Exceeding the burst limit returns <code className="bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-xs font-mono">429</code>.
              The monthly quota resets on the 1st of each calendar month.
            </p>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Plan</th>
                    <th className="text-left px-4 py-2.5 font-medium">Monthly limit</th>
                    <th className="text-left px-4 py-2.5 font-medium">Burst limit</th>
                    <th className="text-left px-4 py-2.5 font-medium">Queue priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {RATE_LIMITS.map(({ plan, limit, burst, priority }) => (
                    <tr key={plan} className={plan === "Pro" ? "bg-violet-50/40" : "bg-white"}>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {plan}
                        {plan === "Pro" && <span className="ml-2 text-[10px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Popular</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs">{limit}</td>
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs">{burst}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── CURL ───────────────────── */}
          <Section id="curl" title="cURL example">
            <ExampleTabs
              label="Terminal"
              requestRaw={RAW_CURL}
              responseRaw={RAW_CURL_RES}
              requestEl={<>
                <Cm c={"# Generate a personalised social card\n"} />
                <K c={"curl"} />{" -X POST \\\n"}
                {"  "}<S c={"https://your-app.vercel.app/api/v1/images"} />{" \\\n"}
                {"  -H "}<S c={'"Authorization: Bearer sk_live_••••••••••"'} />{" \\\n"}
                {"  -H "}<S c={'"Content-Type: application/json"'} />{" \\\n"}
                {"  -d "}<S c={"'{\n    \"template_id\": \"tmpl_social_card_abc123\",\n    \"modifications\": { \"name\": \"Sarah Johnson\", \"title\": \"Senior Engineer\" },\n    \"format\": \"png\"\n  }'"} />
              </>}
              responseEl={<>
                {"{\n"}
                {"  "}<K c={'"success"'} />{": "}<N c={"true"} />{",\n"}
                {"  "}<K c={'"image_url"'} />{": "}<S c={'"https://res.cloudinary.com/demo/image/upload/v1/social_card.png"'} />{",\n"}
                {"  "}<K c={'"template_id"'} />{": "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
                {"  "}<K c={'"format"'} />{": "}<S c={'"png"'} />{",\n"}
                {"  "}<K c={'"generated_at"'} />{": "}<S c={'"2026-02-25T14:30:00.000Z"'} />{",\n"}
                {"  "}<K c={'"usage"'} />{": { "}<K c={'"used"'} />{": "}<N c={"1"} />{", "}<K c={'"limit"'} />{": "}<N c={"100"} />{" }\n"}
                {"}"}
              </>}
            />
          </Section>

          {/* ── NODE ───────────────────── */}
          <Section id="node" title="Node.js example">
            <ExampleTabs
              label="generate.js"
              requestRaw={RAW_NODE}
              responseRaw={RAW_NODE_RES}
              requestEl={<>
                <K c={"const"} />{" response = "}<K c={"await"} />{" fetch("}<S c={'"https://your-app.vercel.app/api/v1/images"'} />{", {\n"}
                {"  method: "}<S c={'"POST"'} />{",\n"}
                {"  headers: {\n"}
                {"    "}<S c={'"Authorization"'} />{": "}<S c={"`Bearer ${process.env.CANVAS_API_KEY}`"} />{",\n"}
                {"    "}<S c={'"Content-Type"'} />{": "}<S c={'"application/json"'} />{",\n"}
                {"  },\n"}
                {"  body: JSON.stringify({\n"}
                {"    template_id: "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
                {"    modifications: { name: "}<S c={'"Sarah Johnson"'} />{", title: "}<S c={'"Senior Engineer"'} />{" },\n"}
                {"  }),\n"}
                {"});\n\n"}
                <K c={"const"} />{" { image_url, generated_at } = "}<K c={"await"} />{" response.json();\n"}
                {"console.log("}<S c={'"Generated:"'} />{", image_url);"}
              </>}
              responseEl={<>
                {"{\n"}
                {"  "}<K c={'"success"'} />{": "}<N c={"true"} />{",\n"}
                {"  "}<K c={'"image_url"'} />{": "}<S c={'"https://res.cloudinary.com/demo/image/upload/v1/social_card.png"'} />{",\n"}
                {"  "}<K c={'"template_id"'} />{": "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
                {"  "}<K c={'"format"'} />{": "}<S c={'"png"'} />{",\n"}
                {"  "}<K c={'"generated_at"'} />{": "}<S c={'"2026-02-25T14:30:00.000Z"'} />{",\n"}
                {"  "}<K c={'"usage"'} />{": { "}<K c={'"used"'} />{": "}<N c={"1"} />{", "}<K c={'"limit"'} />{": "}<N c={"100"} />{" }\n"}
                {"}"}
              </>}
            />
          </Section>

          {/* ── PYTHON ─────────────────── */}
          <Section id="python" title="Python example">
            <ExampleTabs
              label="generate.py"
              requestRaw={RAW_PYTHON}
              responseRaw={RAW_PYTHON_RES}
              requestEl={<>
                <K c={"import"} />{" requests\n\n"}
                {"response = requests.post(\n"}
                {"    "}<S c={'"https://your-app.vercel.app/api/v1/images"'} />{",\n"}
                {"    headers={\n"}
                {"        "}<S c={'"Authorization"'} />{": "}<S c={'f"Bearer {API_KEY}"'} />{",\n"}
                {"        "}<S c={'"Content-Type"'} />{": "}<S c={'"application/json"'} />{",\n"}
                {"    },\n"}
                {"    json={\n"}
                {"        "}<S c={'"template_id"'} />{": "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
                {"        "}<S c={'"modifications"'} />{": {"}<S c={'"name"'} />{": "}<S c={'"Sarah Johnson"'} />{", "}<S c={'"title"'} />{": "}<S c={'"Senior Engineer"'} />{"}\n"}
                {"    },\n"}
                {")\n"}
                {"data = response.json()\n"}
                <K c={"print"} />{"(f\"Generated: {data['image_url']}\")"}
              </>}
              responseEl={<>
                {"{\n"}
                {"  "}<K c={'"success"'} />{": "}<N c={"true"} />{",\n"}
                {"  "}<K c={'"image_url"'} />{": "}<S c={'"https://res.cloudinary.com/demo/image/upload/v1/social_card.png"'} />{",\n"}
                {"  "}<K c={'"template_id"'} />{": "}<S c={'"tmpl_social_card_abc123"'} />{",\n"}
                {"  "}<K c={'"format"'} />{": "}<S c={'"png"'} />{",\n"}
                {"  "}<K c={'"generated_at"'} />{": "}<S c={'"2026-02-25T14:30:00.000Z"'} />{",\n"}
                {"  "}<K c={'"usage"'} />{": { "}<K c={'"used"'} />{": "}<N c={"1"} />{", "}<K c={'"limit"'} />{": "}<N c={"100"} />{" }\n"}
                {"}"}
              </>}
            />
          </Section>

          {/* CTA */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-900 to-[#0a0018] p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to start generating?</h3>
            <p className="text-violet-300 text-sm mb-6">Get your Renderify API key from the dashboard and make your first call in minutes.</p>
            <Link href="/auth/signin" className="inline-flex items-center gap-2 rounded-full bg-white text-violet-700 font-bold px-6 py-2.5 hover:bg-violet-50 transition-colors text-sm shadow-lg">
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>

      <footer className="border-t border-gray-100 text-gray-400 text-sm text-center py-6 mt-12">
        © {new Date().getFullYear()} Renderify. <Link href="/" className="hover:text-gray-600 transition-colors">Back to home</Link>
      </footer>
    </div>
  )
}
