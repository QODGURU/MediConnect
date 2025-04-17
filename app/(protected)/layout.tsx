export const dynamic = "force-dynamic"

import type React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { requireAuth } from "@/lib/auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 md:ml-64 rtl:md:ml-0 rtl:md:mr-64 transition-none">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
