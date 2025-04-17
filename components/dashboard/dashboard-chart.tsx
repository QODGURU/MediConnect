"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "@/components/ui/chart"

interface DashboardChartProps {
  data: {
    completed: number
    failed: number
    noAnswer: number
  }
}

export function DashboardChart({ data }: DashboardChartProps) {
  const chartData = [
    {
      name: "Completed",
      total: data.completed,
    },
    {
      name: "Failed",
      total: data.failed,
    },
    {
      name: "No Answer",
      total: data.noAnswer,
    },
  ]

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
