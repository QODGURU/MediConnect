"use client"

// Re-export all the necessary components from recharts
export {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({ config, className, children, ...props }: ChartContainerProps) {
  // Create CSS variables for colors
  const style = Object.entries(config).reduce(
    (acc, [key, value]) => {
      if (value.color) {
        acc[`--color-${key}`] = value.color
      }
      return acc
    },
    {} as Record<string, string>,
  )

  return (
    <div className={cn("w-full", className)} style={style} {...props}>
      {children}
    </div>
  )
}

interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
  content?: React.ReactNode
  defaultIndex?: number
  cursor?: boolean | object
}

export function ChartTooltip({ active, payload, label, content, defaultIndex, cursor, ...props }: ChartTooltipProps) {
  if (content) {
    return React.isValidElement(content) ? (
      React.cloneElement(content as React.ReactElement, {
        active,
        payload,
        label,
        defaultIndex,
        cursor,
        ...props,
      })
    ) : (
      <>{content}</>
    )
  }

  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-1 text-xs">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium">{entry.name}</span>
              <span>{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  labelKey?: string
  valueKey?: string
  formatter?: (value: any) => React.ReactNode
  indicator?: "dot" | "line"
  className?: string
  defaultIndex?: number
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelKey,
  valueKey,
  formatter,
  indicator = "dot",
  className,
  defaultIndex,
  ...props
}: ChartTooltipContentProps) {
  if (!active && defaultIndex !== undefined && payload && payload.length) {
    // If not active but defaultIndex is provided, show the default item
    const defaultPayload = payload[defaultIndex]
    if (defaultPayload) {
      return (
        <div className={cn("rounded-lg border bg-background p-2 shadow-sm", className)} {...props}>
          <div className="text-xs font-medium">{labelKey ? defaultPayload[labelKey] : label}</div>
          <div className="grid gap-1">
            <div className="flex items-center gap-1 text-xs">
              {indicator === "dot" ? (
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: defaultPayload.color }} />
              ) : (
                <div className="h-1 w-4" style={{ backgroundColor: defaultPayload.color }} />
              )}
              <span className="font-medium">{defaultPayload.name}</span>
              <span>{formatter ? formatter(defaultPayload.value) : defaultPayload.value}</span>
            </div>
          </div>
        </div>
      )
    }
  }

  if (active && payload && payload.length) {
    return (
      <div className={cn("rounded-lg border bg-background p-2 shadow-sm", className)} {...props}>
        <div className="text-xs font-medium">{labelKey ? payload[0][labelKey] : label}</div>
        <div className="grid gap-1">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-1 text-xs">
              {indicator === "dot" ? (
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              ) : (
                <div className="h-1 w-4" style={{ backgroundColor: entry.color }} />
              )}
              <span className="font-medium">{entry.name}</span>
              <span>{formatter ? formatter(entry.value) : entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
}
