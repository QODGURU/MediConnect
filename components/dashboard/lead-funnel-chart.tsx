"use client"

import { useLanguage } from "@/contexts/language-context"
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from "@/components/ui/chart"

interface LeadFunnelChartProps {
  data: {
    totalPatients: number
    contacted: number
    responded: number
    interested: number
    booked: number
  }
}

export function LeadFunnelChart({ data }: LeadFunnelChartProps) {
  const { t } = useLanguage()

  const chartData = [
    {
      name: t("dashboard.totalPatients"),
      value: data.totalPatients,
      fill: "#101B4C",
    },
    {
      name: t("dashboard.callsMade"),
      value: data.contacted,
      fill: "#2563EB",
    },
    {
      name: t("messages.title"),
      value: data.responded,
      fill: "#3B82F6",
    },
    {
      name: t("status.interested"),
      value: data.interested,
      fill: "#60A5FA",
    },
    {
      name: t("status.booked"),
      value: data.booked,
      fill: "#00FFC8",
    },
  ].filter((item) => item.value > 0)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <FunnelChart>
        <Tooltip formatter={(value) => [`${value} ${t("patients.title").toLowerCase()}`, ""]} />
        <Funnel
          dataKey="value"
          data={chartData}
          isAnimationActive
          width={400}
          paddingAngle={3}
          labelFormatter={(entry) => entry.name}
        >
          <LabelList
            position="right"
            fill="#101B4C"
            stroke="none"
            dataKey="name"
            fontSize={12}
            style={{ fontWeight: 500 }}
          />
          <LabelList
            position="center"
            fill="#ffffff"
            stroke="none"
            dataKey="value"
            fontSize={14}
            style={{ fontWeight: "bold", textShadow: "0px 0px 2px rgba(0,0,0,0.5)" }}
          />
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  )
}
