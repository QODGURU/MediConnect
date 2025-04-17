"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, LogIn } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { notifications } from "@/lib/notifications"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function Login() {
  const router = useRouter()
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("Attempting login with:", { email })

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      console.log("SignIn result:", result)

      if (result?.error) {
        setError(t("auth.invalidCredentials"))
        notifications.error(t("auth.loginFailed"), t("auth.invalidCredentials"))
        setLoading(false)
        return
      }

      if (result?.ok) {
        notifications.success(t("auth.loginSuccess"), t("auth.redirecting"))
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(t("auth.unknownError"))
        notifications.error(t("auth.loginFailed"), t("auth.unknownError"))
        setLoading(false)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError(t("auth.unknownError"))
      notifications.error(t("auth.loginFailed"), t("auth.unknownError"))
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen brand-gradient">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md shadow-xl border-white/20 bg-white">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-3xl font-bold brand-text-gradient">{t("app.name")}</CardTitle>
          <CardDescription className="text-[#101B4C]">{t("app.tagline")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
              />
            </div>
            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-[#101B4C]/20 focus:border-[#00FFC8] focus:ring-[#00FFC8] transition-all"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 brand-gradient hover:opacity-90 text-white transition-colors flex items-center justify-center gap-2"
              disabled={loading}
            >
              <LogIn className="h-5 w-5" />
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
