"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "@/components/ui/chart"

interface DoctorData {
  name: string
  contacted: number
  interested: number
  booked: number
}

interface DoctorConversionChartProps {
  data: DoctorData[]
}

export function DoctorConversionChart({ data }: DoctorConversionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="contacted" name="Contacted" fill="#3b82f6" />
        <Bar dataKey="interested" name="Interested" fill="#8b5cf6" />
        <Bar dataKey="booked" name="Booked" fill="#10b981" />
      </BarChart>
    </ResponsiveContainer>
  )
}
