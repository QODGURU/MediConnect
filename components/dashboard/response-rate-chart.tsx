"use client"

import { useLanguage } from "@/contexts/language-context"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "@/components/ui/chart"

interface ResponseRateChartProps {
  data: {
    responded: number
    notResponded: number
  }
}

export function ResponseRateChart({ data }: ResponseRateChartProps) {
  const { t } = useLanguage()

  const chartData = [
    {
      name: t("messages.responded"),
      value: data.responded,
      color: "#10B981",
    },
    {
      name: t("messages.notResponded"),
      value: data.notResponded,
      color: "#EF4444",
    },
  ]

  const COLORS = chartData.map((item) => item.color)

  const RADIAN = Math.PI / 180
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} patients`, ""]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
