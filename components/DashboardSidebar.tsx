"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard, FileText, Key, Settings, LogOut,
  TrendingUp, Image as ImageIcon, Menu, X, Webhook,
} from "lucide-react"

const NAV_LINKS = [
  { href: "/dashboard",           icon: LayoutDashboard, label: "Home" },
  { href: "/dashboard/templates", icon: FileText,         label: "Templates" },
  { href: "/dashboard/images",    icon: ImageIcon,        label: "Images" },
  { href: "/dashboard/api-keys",  icon: Key,              label: "API Keys" },
  { href: "/dashboard/usage",     icon: TrendingUp,       label: "Usage" },
  { href: "/dashboard/webhooks",  icon: Webhook,          label: "Webhooks" },
  { href: "/dashboard/settings",  icon: Settings,         label: "Settings" },
]

interface Props {
  email: string
}

export default function DashboardSidebar({ email }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function close() { setOpen(false) }

  const sidebarContent = (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0" />
          <h1 className="text-xl font-bold">Renderify</h1>
        </div>
        <p className="text-xs text-muted-foreground truncate">{email}</p>
      </div>

      <nav className="space-y-1 flex-1">
        {NAV_LINKS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link key={href} href={href} onClick={close}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? "font-semibold text-violet-700" : ""}`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 pt-8 border-t">
        <Link href="/api/auth/signout" onClick={close}>
          <Button variant="ghost" className="w-full justify-start text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-background sticky top-0 z-20">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          <span className="font-bold text-sm">Renderify</span>
        </div>
      </div>

      {/* ── Mobile backdrop ────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden
        />
      )}

      {/* ── Desktop sidebar (always visible) ──────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r bg-muted/40 flex-col p-6 min-h-screen">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer (slide-over) ─────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-background border-r flex flex-col p-6 shadow-2xl
          transition-transform duration-300 ease-in-out lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <span className="font-bold">Renderify</span>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  )
}
