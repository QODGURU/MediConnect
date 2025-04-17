import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SessionProvider } from "@/components/session-provider"
import { SonnerProvider } from "@/components/sonner-provider"
import { LanguageProvider } from "@/contexts/language-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MedConnect - Doctor Patient Platform",
  description: "A platform for doctors to manage patients and appointments",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <LanguageProvider>
            {children}
            <SonnerProvider />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  )
}

import "./globals.css"


import './globals.css'