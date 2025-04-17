"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { Brain, Lightbulb, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react"

interface AIInsightsProps {
  data: {
    totalAnalyzed: number
    sentimentDistribution: {
      positive: number
      negative: number
      neutral: number
    }
    topIntents: {
      intent: string
      count: number
    }[]
    recommendations: string[]
  }
}

export function AIInsights({ data }: AIInsightsProps) {
  const { t } = useLanguage()

  return (
    <Card className="border-[#101B4C]/20 shadow-md">
      <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <Brain className="mr-2 h-5 w-5" />
          {t("ai.insights")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#101B4C]">{t("ai.sentiment")}</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center justify-center p-3 bg-green-50 rounded-lg border border-green-100">
                <ThumbsUp className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-sm text-green-700">{t("ai.positive")}</span>
                <span className="text-xl font-bold text-green-700">{data.sentimentDistribution.positive}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-red-50 rounded-lg border border-red-100">
                <ThumbsDown className="h-8 w-8 text-red-500 mb-2" />
                <span className="text-sm text-red-700">{t("ai.negative")}</span>
                <span className="text-xl font-bold text-red-700">{data.sentimentDistribution.negative}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <MessageCircle className="h-8 w-8 text-gray-500 mb-2" />
                <span className="text-sm text-gray-700">{t("ai.neutral")}</span>
                <span className="text-xl font-bold text-gray-700">{data.sentimentDistribution.neutral}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#101B4C]">{t("ai.intent")}</h3>
            <div className="space-y-2">
              {data.topIntents.map((intent, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <span className="text-sm text-blue-700">{intent.intent}</span>
                  <span className="text-sm font-bold text-blue-700">{intent.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium text-[#101B4C] mb-3">{t("ai.recommendation")}</h3>
          <div className="space-y-2">
            {data.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start p-3 bg-[#00FFC8]/10 rounded-lg border border-[#00FFC8]/30">
                <Lightbulb className="h-5 w-5 text-[#101B4C] mr-2 mt-0.5 shrink-0" />
                <span className="text-sm text-[#101B4C]">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
