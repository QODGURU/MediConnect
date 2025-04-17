"use client"

import { useSession } from "next-auth/react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/contexts/language-context"

export function Header() {
  const { data: session } = useSession()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-end">
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-[#101B4C] text-[#101B4C] hover:bg-[#00FFC8]/10">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[#101B4C]">
              <DropdownMenuLabel className="text-[#101B4C]">{t("notification.info")}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#101B4C]/20" />
              <DropdownMenuItem className="text-[#101B4C]">{t("notification.info")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#101B4C] to-[#00FFC8] flex items-center justify-center text-white font-medium">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="text-sm">
              <div className="font-medium text-[#101B4C]">{session?.user?.name}</div>
              <div className="text-xs text-[#101B4C]/80 capitalize">{session?.user?.role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
