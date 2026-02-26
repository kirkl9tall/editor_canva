import { ReactNode } from "react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardSidebar from "@/components/DashboardSidebar"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <DashboardSidebar email={session.user.email ?? ""} />
      <main className="flex-1 p-6 lg:p-8 min-w-0">{children}</main>
    </div>
  )
}
