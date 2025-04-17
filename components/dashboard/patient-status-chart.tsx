"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "@/components/ui/chart"

interface PatientStatusChartProps {
  data: {
    interested: number
    notInterested: number
    pending: number
    contacted: number
    booked: number
  }
}

export function PatientStatusChart({ data }: PatientStatusChartProps) {
  const chartData = [
    { name: "Interested", value: data.interested, color: "#1e40af" },
    { name: "Not Interested", value: data.notInterested, color: "#10b981" },
    { name: "Pending", value: data.pending, color: "#8b5cf6" },
    { name: "Contacted", value: data.contacted, color: "#f59e0b" },
    { name: "Booked", value: data.booked, color: "#ef4444" },
  ].filter((item) => item.value > 0)

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
