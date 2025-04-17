"use client"

import { formatDate } from "@/lib/utils"
import { MessageSquare, Check, X, Clock, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"

interface Message {
  _id: string
  patient: string
  content: string
  sentAt: string
  status: string
  messageType: string
  twilioMessageId?: string
  sentBy?: {
    _id: string
    name: string
  }
  isFollowup: boolean
  followupAttempt: number
}

interface MessageHistoryProps {
  messages: Message[]
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  const { t } = useLanguage()

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p>No message history available</p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Send className="h-4 w-4 text-blue-500" />
      case "delivered":
        return <Check className="h-4 w-4 text-green-500" />
      case "read":
        return <Check className="h-4 w-4 text-green-700" />
      case "failed":
        return <X className="h-4 w-4 text-red-500" />
      case "queued":
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500">{t("messages.sent")}</Badge>
      case "delivered":
        return <Badge className="bg-green-500">{t("messages.delivered")}</Badge>
      case "read":
        return <Badge className="bg-green-700">{t("messages.read")}</Badge>
      case "failed":
        return <Badge variant="destructive">{t("messages.failed")}</Badge>
      case "queued":
        return <Badge variant="outline">{t("messages.queued")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message._id.toString()}
          className="border border-blue-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">
                {message.isFollowup ? `Follow-up Message (Attempt ${message.followupAttempt})` : "Message"} on{" "}
                {formatDate(message.sentAt)}
              </span>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              {getStatusIcon(message.status)}
              <span className="ml-2">{getStatusBadge(message.status)}</span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">Sent by:</span> {message.sentBy?.name || "System"}
          </div>
        </div>
      ))}
    </div>
  )
}
