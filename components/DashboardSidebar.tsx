"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import InfinityLogo from "@/components/InfinityLogo"
import {
  LayoutDashboard, FileText, Key, Settings, LogOut,
  TrendingUp, Image as ImageIcon, Menu, X, Webhook,
} from "lucide-react"

const NAV_SECTIONS = [
  {
    label: "Workspace",
    links: [
      { href: "/dashboard",           icon: LayoutDashboard, label: "Home" },
      { href: "/dashboard/templates", icon: FileText,         label: "Templates" },
      { href: "/dashboard/images",    icon: ImageIcon,        label: "Images" },
    ],
  },
  {
    label: "Developer",
    links: [
      { href: "/dashboard/api-keys",  icon: Key,              label: "API Keys" },
      { href: "/dashboard/usage",     icon: TrendingUp,       label: "Usage" },
      { href: "/dashboard/webhooks",  icon: Webhook,          label: "Webhooks" },
    ],
  },
  {
    label: "Account",
    links: [
      { href: "/dashboard/settings",  icon: Settings,         label: "Settings" },
    ],
  },
]

interface Props {
  email: string
}

export default function DashboardSidebar({ email }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function close() { setOpen(false) }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <InfinityLogo size={28} />
          <h1 className="text-xl font-black tracking-tight">Renderify</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-black text-white uppercase">{email?.[0] ?? "U"}</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{email}</p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 space-y-5">
        {NAV_SECTIONS.map(({ label: sectionLabel, links }) => (
          <div key={sectionLabel}>
            <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 px-3">
              {sectionLabel}
            </span>
            <div className="space-y-0.5">
              {links.map(({ href, icon: Icon, label: linkLabel }) => {
                const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                return (
                  <Link key={href} href={href} onClick={close}>
                    <span
                      className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-black transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? "text-violet-600"
                          : "text-gray-700 hover:text-gray-900"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${isActive ? "text-violet-500" : "text-gray-400"}`} />
                      {linkLabel}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link href="/api/auth/signout" onClick={close}>
          <span className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-black text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sign Out
          </span>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-white sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
          <InfinityLogo size={22} />
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
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-100 bg-white flex-col p-6 min-h-screen">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer (slide-over) ─────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 flex flex-col p-6 shadow-2xl
          transition-transform duration-300 ease-in-out lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <InfinityLogo size={24} />
            <span className="font-bold">Renderify</span>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  )
}
