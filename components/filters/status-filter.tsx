"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { Check, ChevronsUpDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export type StatusOption = {
  value: string
  label: string
  color?: string
}

interface StatusFilterProps {
  options: StatusOption[]
  onChange: (selectedStatuses: string[]) => void
  defaultSelected?: string[]
  placeholder?: string
}

export function StatusFilter({ options, onChange, defaultSelected = [], placeholder }: StatusFilterProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(defaultSelected)
  const onChangeTimeout = React.useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSelectedStatuses(defaultSelected)
  }, [defaultSelected])

  const handleSelect = useCallback(
    (value: string) => {
      const newSelectedStatuses = selectedStatuses.includes(value)
        ? selectedStatuses.filter((status) => status !== value)
        : [...selectedStatuses, value]

      setSelectedStatuses(newSelectedStatuses)

      // Use setTimeout to debounce the onChange call
      if (onChangeTimeout.current) {
        clearTimeout(onChangeTimeout.current)
      }

      onChangeTimeout.current = setTimeout(() => {
        onChange(newSelectedStatuses)
      }, 300)
    },
    [selectedStatuses, onChange],
  )

  useEffect(() => {
    return () => {
      if (onChangeTimeout.current) {
        clearTimeout(onChangeTimeout.current)
      }
    }
  }, [])

  const getStatusBadge = (status: StatusOption) => {
    let className = "bg-gray-500"

    if (status.color) {
      className = status.color
    } else {
      switch (status.value) {
        case "pending":
          className = "bg-gray-500"
          break
        case "called":
          className = "bg-green-500"
          break
        case "not_answered":
          className = "bg-red-500"
          break
        case "follow_up":
          className = "bg-blue-500"
          break
        case "interested":
          className = "bg-purple-500"
          break
        case "not_interested":
          className = "bg-orange-500"
          break
        case "booked":
          className = "bg-[#00FFC8] text-[#101B4C]"
          break
        case "wrong_number":
          className = "bg-red-500"
          break
        case "busy":
          className = "bg-yellow-500"
          break
        case "call_back":
          className = "bg-blue-500"
          break
      }
    }

    return <Badge className={className}>{status.label}</Badge>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="border-[#101B4C]/20 hover:border-[#101B4C] hover:bg-[#00FFC8]/5 flex items-center"
        >
          <Filter className="mr-2 h-4 w-4 text-[#101B4C]" />
          {placeholder || t("patients.filterByStatus")}
          {selectedStatuses.length > 0 && <Badge className="ml-2 bg-[#101B4C]">{selectedStatuses.length}</Badge>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={t("patients.search")} />
          <CommandEmpty>{t("patients.noResults")}</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {options.map((status) => (
                <CommandItem key={status.value} value={status.value} onSelect={() => handleSelect(status.value)}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedStatuses.includes(status.value) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {getStatusBadge(status)}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
