import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — Renderify",
  description: "Read the Renderify Terms of Service.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#060010] text-white/80">
      <div className="max-w-3xl mx-auto px-6 py-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition mb-10"
        >
          ← Back to home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <span className="font-bold text-white">Renderify</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-sm text-white/40">Last updated: January 2025</p>
        </div>

        {/* Body */}
        <div className="prose prose-sm prose-invert max-w-none space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Renderify ("Service"), you agree to be bound by these Terms
              of Service. If you do not agree to all of these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Renderify is a template-based image generation platform that allows users to create
              visual templates and generate personalised images at scale via a REST API. The Service
              includes a web-based editor, an API, and related dashboard tools.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Account Registration</h2>
            <p>
              To use the Service you must create an account. You are responsible for maintaining
              the confidentiality of your credentials and for all activity that occurs under your
              account. You agree to notify us immediately of any unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Generate, store, or transmit content that is illegal, harmful, or violates third-party rights.</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure.</li>
              <li>Reverse-engineer, decompile, or create derivative works from the Service.</li>
              <li>Exceed the rate limits or usage quotas assigned to your plan.</li>
              <li>Resell or sublicense access to the Service without prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. API Keys and Usage</h2>
            <p>
              API keys are personal and must not be shared publicly. You are responsible for all
              API usage made with your key. We reserve the right to revoke or rate-limit keys that
              are misused or that generate excessive load on our infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>
              You retain ownership of the templates and content you create. By using the Service,
              you grant Renderify a limited licence to process and store your content solely to
              provide the Service. Renderify retains all rights in the platform, editor, and API.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Billing and Payments</h2>
            <p>
              Paid plans are billed in advance on a monthly or annual basis. All fees are
              non-refundable except where required by applicable law. We reserve the right to
              change pricing with 30 days' notice to existing subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Termination</h2>
            <p>
              You may cancel your account at any time from the dashboard. We may suspend or
              terminate your account if you breach these terms. Upon termination, your access to
              the Service will cease and your data may be deleted after a reasonable retention period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE FULLEST
              EXTENT PERMITTED BY LAW, RENDERIFY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED,
              INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              IN NO EVENT SHALL RENDERIFY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR
              CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU
              PAID US IN THE PRECEDING 12 MONTHS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with applicable law. Any
              disputes shall be resolved through good-faith negotiation, and if necessary, binding
              arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of material changes
              by email or via an in-app notice. Continued use of the Service after changes take
              effect constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">13. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{" "}
              <a href="mailto:hello@renderify.app" className="text-violet-400 hover:text-violet-300">
                hello@renderify.app
              </a>.
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-white/5 flex gap-6 text-sm text-white/30">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <Link href="/privacy" className="hover:text-white/60 transition">Privacy Policy</Link>
          <Link href="/docs" className="hover:text-white/60 transition">Documentation</Link>
        </div>
      </div>
    </div>
  )
}
