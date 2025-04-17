"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, RefreshCw } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { notifications } from "@/lib/notifications"

export function ProcessMessages() {
  const { t } = useLanguage()
  const [processingNew, setProcessingNew] = useState(false)
  const [processingFollowups, setProcessingFollowups] = useState(false)

  const processNewPatients = async () => {
    setProcessingNew(true)
    try {
      const response = await fetch("/api/patients/process-new", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process new patients")
      }

      notifications.success(t("notification.success"), `Processed ${data.processed} new patients`)
    } catch (error: any) {
      notifications.error(t("notification.error"), error.message)
    } finally {
      setProcessingNew(false)
    }
  }

  const processFollowups = async () => {
    setProcessingFollowups(true)
    try {
      const response = await fetch("/api/patients/process-followups", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process follow-ups")
      }

      notifications.success(t("notification.success"), `Processed ${data.processed} follow-ups`)
    } catch (error: any) {
      notifications.error(t("notification.error"), error.message)
    } finally {
      setProcessingFollowups(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#101B4C]/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
          <CardTitle>Process WhatsApp Messages</CardTitle>
          <CardDescription className="text-white/80">Send messages to new patients and follow-ups</CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:justify-between">
          <Button
            onClick={processNewPatients}
            disabled={processingNew}
            className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white transition-colors"
          >
            {processingNew ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Process New Patients
              </>
            )}
          </Button>

          <Button
            onClick={processFollowups}
            disabled={processingFollowups}
            className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white transition-colors"
          >
            {processingFollowups ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Process Follow-ups
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
