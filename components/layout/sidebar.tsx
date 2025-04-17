"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Users,
  UserCog,
  PhoneCall,
  PhoneMissed,
  Settings,
  LogOut,
  Menu,
  X,
  Phone,
  Building2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/contexts/language-context"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { t, dir } = useLanguage()

  const isAdmin = session?.user?.role === "admin"
  const isClinic = session?.user?.role === "clinic"

  const routes = [
    {
      icon: LayoutDashboard,
      label: t("nav.dashboard"),
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      icon: Users,
      label: t("nav.patients"),
      href: "/patients",
      active: pathname === "/patients",
    },
    {
      icon: PhoneCall,
      label: t("nav.followUps"),
      href: "/follow-ups",
      active: pathname === "/follow-ups",
    },
    {
      icon: PhoneMissed,
      label: t("nav.coldLeads"),
      href: "/cold-leads",
      active: pathname === "/cold-leads",
    },
    {
      icon: MessageSquare,
      label: t("messages.title"),
      href: "/messages",
      active: pathname === "/messages",
    },
  ]

  // Admin-only routes
  if (isAdmin) {
    routes.push(
      {
        icon: Phone,
        label: t("calls.title"),
        href: "/calls",
        active: pathname === "/calls",
      },
      {
        icon: UserCog,
        label: t("doctors.title"),
        href: "/doctors",
        active: pathname === "/doctors",
      },
      {
        icon: Building2,
        label: t("clinics.title"),
        href: "/clinics",
        active: pathname === "/clinics",
      },
      {
        icon: Settings,
        label: t("settings.title"),
        href: "/settings",
        active: pathname === "/settings",
      },
    )
  }

  // Clinic-only routes
  if (isClinic) {
    routes.push(
      {
        icon: UserCog,
        label: t("doctors.title"),
        href: "/clinic/doctors",
        active: pathname === "/clinic/doctors",
      },
      {
        icon: Settings,
        label: t("settings.title"),
        href: "/clinic/settings",
        active: pathname === "/clinic/settings",
      },
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-white border-[#101B4C] text-[#101B4C]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <div
        className={`fixed inset-y-0 ${dir === "rtl" ? "right-0" : "left-0"} z-40 w-64 bg-gradient-to-b from-[#101B4C] to-[#00FFC8] transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : dir === "rtl" ? "translate-x-full" : "-translate-x-full"
        }`}
        style={{ direction: dir }}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white">{t("app.name")}</h2>
          <p className="text-sm text-[#00FFC8] mt-1">
            {isAdmin ? "Admin Portal" : isClinic ? "Clinic Portal" : "Doctor Portal"}
          </p>
        </div>

        <div className="px-3 py-2">
          <div className="space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={`flex items-center px-3 py-3 text-sm rounded-md transition-colors hover-scale ${
                  route.active ? "bg-white/20 text-white" : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <route.icon className={`${dir === "rtl" ? "ml-3" : "mr-3"} h-5 w-5`} />
                {route.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 w-full p-4 border-t border-white/20">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className={`${dir === "rtl" ? "ml-2" : "mr-2"} h-4 w-4`} />
            {t("nav.signOut")}
          </Button>
        </div>
      </div>
    </>
  )
}
