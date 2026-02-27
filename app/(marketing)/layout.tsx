import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Renderify — Generate Images at Scale with a Simple API",
  description:
    "Create visual templates in the Renderify editor and generate thousands of personalised images via a REST API. No-code friendly, developer first.",
  openGraph: {
    title: "Renderify — Generate Images at Scale with a Simple API",
    description:
      "Create visual templates and generate thousands of personalised images via a REST API.",
    url: "https://renderify.app",
  },
  twitter: {
    title: "Renderify — Generate Images at Scale with a Simple API",
    description:
      "Create visual templates and generate thousands of personalised images via a REST API.",
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
