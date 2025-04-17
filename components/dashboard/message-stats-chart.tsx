"use client"

import { useLanguage } from "@/contexts/language-context"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "@/components/ui/chart"

interface MessageStatsChartProps {
  data: {
    sent: number
    delivered: number
    read: number
    responded: number
    failed: number
  }
}

export function MessageStatsChart({ data }: MessageStatsChartProps) {
  const { t } = useLanguage()

  const chartData = [
    {
      name: t("messages.sent"),
      value: data.sent,
      fill: "#3B82F6",
    },
    {
      name: t("messages.delivered"),
      value: data.delivered,
      fill: "#10B981",
    },
    {
      name: t("messages.read"),
      value: data.read,
      fill: "#8B5CF6",
    },
    {
      name: t("messages.responded"),
      value: data.responded,
      fill: "#F59E0B",
    },
    {
      name: t("messages.failed"),
      value: data.failed,
      fill: "#EF4444",
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} messages`, ""]} labelFormatter={(label) => `${label} Messages`} />
        <Legend />
        {chartData.map((entry, index) => (
          <Bar key={`bar-${index}`} dataKey="value" name={entry.name} fill={entry.fill} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
