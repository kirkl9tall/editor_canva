import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — Renderify",
  description: "Read the Renderify Privacy Policy.",
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-white/40">Last updated: January 2025</p>
        </div>

        {/* Body */}
        <div className="prose prose-sm prose-invert max-w-none space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Renderify ("we", "us", or "our") is committed to protecting your personal data.
              This Privacy Policy explains what information we collect, how we use it, and your
              rights in relation to it when you use our Service at{" "}
              <a href="https://renderify.app" className="text-violet-400 hover:text-violet-300">renderify.app</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Information We Collect</h2>
            <p>We collect the following categories of information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Account data:</strong> Name, email address, and password hash when you register.</li>
              <li><strong className="text-white/80">Usage data:</strong> API call counts, template IDs accessed, timestamps, and IP addresses for rate limiting and analytics.</li>
              <li><strong className="text-white/80">Content data:</strong> Templates, generated images, and API keys you create within the Service.</li>
              <li><strong className="text-white/80">Payment data:</strong> Billing information processed by our payment provider (Stripe). We never store raw card details.</li>
              <li><strong className="text-white/80">Log data:</strong> Browser type, operating system, referring URL, and error reports for debugging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, operate, and maintain the Service.</li>
              <li>Process payments and manage your subscription.</li>
              <li>Send transactional emails (receipts, password resets, API key alerts).</li>
              <li>Monitor usage for security, abuse prevention, and rate limiting.</li>
              <li>Improve the Service based on aggregated, anonymised analytics.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Cookies and Tracking</h2>
            <p>
              We use session cookies for authentication (NextAuth.js) and minimal first-party
              analytics. We do not use third-party advertising trackers. You can disable cookies
              in your browser, but this may affect your ability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only with trusted sub-processors
              necessary to operate the Service, including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Stripe</strong> — payment processing.</li>
              <li><strong className="text-white/80">Cloud infrastructure providers</strong> — hosting and database storage, with data-processing agreements in place.</li>
              <li><strong className="text-white/80">Law enforcement</strong> — only when required by applicable law or legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your account and content data for as long as your account is active or as
              needed to provide the Service. If you delete your account, we will delete or
              anonymise your personal data within 30 days, except where retention is required
              by law (e.g., billing records for tax purposes).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Security</h2>
            <p>
              We implement industry-standard security measures, including TLS encryption in
              transit, bcrypt password hashing, and access controls on all data stores. However,
              no method of transmission over the internet is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have rights to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Access</strong> the personal data we hold about you.</li>
              <li><strong className="text-white/80">Rectify</strong> inaccurate data.</li>
              <li><strong className="text-white/80">Erase</strong> your data ("right to be forgotten").</li>
              <li><strong className="text-white/80">Restrict or object</strong> to certain processing.</li>
              <li><strong className="text-white/80">Portability</strong> — receive your data in a machine-readable format.</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, email us at{" "}
              <a href="mailto:privacy@renderify.app" className="text-violet-400 hover:text-violet-300">
                privacy@renderify.app
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>
              The Service is not directed at children under 16. We do not knowingly collect
              personal data from children. If you believe a child has provided us with their data,
              please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of
              significant changes via email or an in-app notice. The "Last updated" date at the
              top of this page reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your data, please
              contact us at{" "}
              <a href="mailto:privacy@renderify.app" className="text-violet-400 hover:text-violet-300">
                privacy@renderify.app
              </a>.
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-white/5 flex gap-6 text-sm text-white/30">
          <Link href="/" className="hover:text-white/60 transition">Home</Link>
          <Link href="/terms" className="hover:text-white/60 transition">Terms of Service</Link>
          <Link href="/docs" className="hover:text-white/60 transition">Documentation</Link>
        </div>
      </div>
    </div>
  )
}
