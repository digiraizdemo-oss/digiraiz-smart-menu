"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  QrCode,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Bell,
  Search,
  Sparkles,
  ShieldCheck,
} from "lucide-react"

const sidebarLinks = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/restaurants", icon: Store, label: "Restaurants" },
  { href: "/admin/menus", icon: UtensilsCrossed, label: "Menus" },
  { href: "/admin/qr-codes", icon: QrCode, label: "QR Codes" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
         <div className="border-b border-sidebar-border p-6">
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
      <UtensilsCrossed className="h-6 w-6 text-white" />
    </div>

    <div>
      <h1 className="text-xl font-bold tracking-tight">
        DigiRaiz
      </h1>

      <p className="text-xs opacity-70">
        Smart Menu
      </p>
    </div>
  </div>

  <div className="mt-5 rounded-xl bg-sidebar-accent p-3">
    <div className="flex items-center gap-2">
      <ShieldCheck className="h-4 w-4 text-green-500" />

      <div>
        <p className="text-sm font-semibold">
          Super Admin
        </p>

        <p className="text-xs opacity-60">
          Full Access
        </p>
      </div>
    </div>
  </div>
</div>
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/admin" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
  "group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300",
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl"
                      : "hover:bg-sidebar-accent hover:translate-x-1 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-xl">
  <div className="flex h-20 items-center justify-between px-8">

    <div className="flex items-center gap-4">

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      <div>

        <h2 className="text-2xl font-bold">
          {sidebarLinks.find(
            (l) =>
              l.href === pathname ||
              (l.href !== "/admin" &&
                pathname.startsWith(l.href))
          )?.label || "Dashboard"}
        </h2>

        <p className="text-sm text-muted-foreground">
          Welcome back to DigiRaiz Smart Menu
        </p>

      </div>

    </div>

    <div className="flex items-center gap-4">

      <div className="hidden lg:flex items-center gap-2 rounded-xl border bg-gray-50 px-4 py-2">

        <Search className="h-4 w-4 text-gray-400" />

        <input
          placeholder="Search..."
          className="bg-transparent outline-none text-sm w-48"
        />

      </div>

      <Button variant="ghost" size="icon">
        <Bell className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-2 shadow-sm">

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold">

          SA

        </div>

        <div className="hidden md:block">

          <p className="text-sm font-semibold">
            Super Admin
          </p>

          <p className="text-xs text-muted-foreground">
            Administrator
          </p>

        </div>

      </div>

    </div>

  </div>
</header>

        {/* Page content */}
       <main className="bg-gray-50 min-h-screen p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
