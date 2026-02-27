import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthSessionProvider from "@/components/AuthSessionProvider"

const inter = Inter({ subsets: ["latin"] })

const BASE_URL = "https://renderify.app"
const OG_IMAGE = `${BASE_URL}/og-image.png`

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Renderify — Template-based Image Generation API",
    template: "%s — Renderify",
  },
  description:
    "Generate personalised images at scale from visual templates via a simple REST API. The fastest Placid.app alternative.",
  keywords: ["image generation", "API", "template", "personalisation", "dynamic images", "Placid alternative"],
  authors: [{ name: "Renderify" }],
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Renderify",
    title: "Renderify — Template-based Image Generation API",
    description:
      "Generate personalised images at scale from visual templates via a simple REST API.",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Renderify — Template-based Image Generation API",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@renderify",
    title: "Renderify — Template-based Image Generation API",
    description:
      "Generate personalised images at scale from visual templates via a simple REST API.",
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Oswald:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  )
}
