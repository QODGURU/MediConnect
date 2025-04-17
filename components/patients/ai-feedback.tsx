"use client"

import { Brain, ThumbsUp, ThumbsDown, MessageCircle, Lightbulb } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface AIFeedbackProps {
  patient: any
  calls: any[]
}

export function AIFeedback({ patient, calls }: AIFeedbackProps) {
  const { t } = useLanguage()

  // If there's no AI analysis yet
  if (!patient.aiNotes && (!calls || calls.length === 0)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Brain className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p>No AI feedback available yet</p>
        <p className="text-sm mt-2">AI feedback will be generated after calls or messages with the patient</p>
      </div>
    )
  }

  // Determine sentiment based on status
  let sentiment = "neutral"
  let sentimentIcon = <MessageCircle className="h-5 w-5 text-gray-500" />

  if (["interested", "booked"].includes(patient.status)) {
    sentiment = "positive"
    sentimentIcon = <ThumbsUp className="h-5 w-5 text-green-500" />
  } else if (["not_interested", "wrong_number"].includes(patient.status)) {
    sentiment = "negative"
    sentimentIcon = <ThumbsDown className="h-5 w-5 text-red-500" />
  }

  // Generate recommendations based on status
  const recommendations = []

  if (patient.status === "not_answered") {
    recommendations.push("Try sending a WhatsApp message before calling")
    recommendations.push("Consider calling at a different time of day")
    recommendations.push("Check if the phone number is correct")
  } else if (patient.status === "interested") {
    recommendations.push("Follow up within 24 hours to convert to booking")
    recommendations.push("Send detailed information about services")
    recommendations.push("Offer a special promotion or discount")
  } else if (patient.status === "not_interested") {
    recommendations.push("Wait 2-3 weeks before attempting to re-engage")
    recommendations.push("Try a different approach or service offering")
    recommendations.push("Consider a special promotion for cold leads")
  } else if (patient.status === "follow_up") {
    recommendations.push("Call within 48 hours to maintain engagement")
    recommendations.push("Send additional information about services")
    recommendations.push("Address any concerns mentioned in previous calls")
  }

  return (
    <div className="space-y-6">
      <div className="border border-[#101B4C]/20 rounded-lg p-5 bg-[#101B4C]/5">
        <h3 className="text-lg font-medium text-[#101B4C] mb-3 flex items-center">
          <Brain className="mr-2 h-5 w-5" />
          {t("ai.analysis")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <div className="mr-3 mt-1">{sentimentIcon}</div>
            <div>
              <h4 className="font-medium text-[#101B4C]">{t("ai.sentiment")}</h4>
              <p className="text-gray-700 capitalize">{t(`ai.${sentiment}`)}</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="mr-3 mt-1">
              <MessageCircle className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h4 className="font-medium text-[#101B4C]">{t("ai.intent")}</h4>
              <p className="text-gray-700">
                {patient.statusReason || `Patient appears to be ${patient.status.replace(/_/g, " ")}`}
              </p>
            </div>
          </div>

          {patient.aiNotes && (
            <div className="mt-4 p-4 bg-white rounded-md border border-[#101B4C]/20">
              <p className="text-gray-700 whitespace-pre-wrap">{patient.aiNotes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border border-[#00FFC8]/30 rounded-lg p-5 bg-[#00FFC8]/5">
        <h3 className="text-lg font-medium text-[#101B4C] mb-3 flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-[#101B4C]" />
          {t("ai.recommendation")}
        </h3>

        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start p-3 bg-white rounded-md border border-[#00FFC8]/30">
              <Lightbulb className="h-4 w-4 text-[#101B4C] mr-2 mt-0.5 shrink-0" />
              <span className="text-gray-700">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
