"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function ProcessFollowUps() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { t } = useLanguage()

  const handleProcessFollowUps = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/followup/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("followups.processError"))
      }

      toast({
        title: t("notification.success"),
        description: data.message || t("followups.processSuccess"),
      })

      // Refresh the page to show updated data
      router.refresh()
    } catch (error: any) {
      toast({
        title: t("notification.error"),
        description: error.message || t("followups.processError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleProcessFollowUps}
      disabled={loading}
      className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t("followups.processing")}
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t("followups.process")}
        </>
      )}
    </Button>
  )
}
