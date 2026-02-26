import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import AuthSessionProvider from "@/components/AuthSessionProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Renderify - Image Generation API",
  description: "Generate personalised images at scale from visual templates via a simple REST API. The Placid.app alternative.",
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
