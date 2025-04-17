"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Search, Phone, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useRouter, useSearchParams } from "next/navigation"
import { StatusFilter, type StatusOption } from "@/components/filters/status-filter"

interface Patient {
  id: string
  name: string
  phone: string
  email: string
  status: string
  statusReason: string
  appointmentDate: string
  addedBy: string
  assignedDoctor: string
  clinic: string
  followupAttempts: {
    calls: number
    messages: number
  }
}

interface ColdLeadsTableProps {
  data: Patient[]
}

export function ColdLeadsTable({ data }: ColdLeadsTableProps) {
  const { t, dir } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])

  // Get unique reasons from the data
  const uniqueReasons = Array.from(new Set(data.map((patient) => patient.statusReason)))

  // Reason options for the filter
  const reasonOptions: StatusOption[] = uniqueReasons.map((reason) => ({
    value: reason,
    label: reason,
  }))

  // Handle reason filter change
  const handleReasonFilterChange = (reasons: string[]) => {
    setSelectedReasons(reasons)

    // Update URL with selected reasons
    const params = new URLSearchParams(searchParams.toString())

    if (reasons.length > 0) {
      params.set("reason", reasons.join(","))
    } else {
      params.delete("reason")
    }

    if (searchTerm) {
      params.set("search", searchTerm)
    }

    router.push(`?${params.toString()}`)
  }

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    // Update URL with search term
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    if (selectedReasons.length > 0) {
      params.set("reason", selectedReasons.join(","))
    }

    router.push(`?${params.toString()}`)
  }

  const filteredData = data.filter((patient) => {
    // Apply search filter
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.statusReason.toLowerCase().includes(searchTerm.toLowerCase())

    // Apply reason filter
    const matchesReason = selectedReasons.length === 0 || selectedReasons.includes(patient.statusReason)

    return matchesSearch && matchesReason
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("patients.search")}
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-sm"
            />
          </div>
          <StatusFilter
            options={reasonOptions}
            onChange={handleReasonFilterChange}
            defaultSelected={selectedReasons}
            placeholder={t("coldleads.filterByReason")}
          />
        </div>
      </div>

      <div className="rounded-md border border-[#101B4C]/20 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#101B4C]/5">
              <TableHead>{t("patients.name")}</TableHead>
              <TableHead>{t("patients.phone")}</TableHead>
              <TableHead>{t("coldleads.reason")}</TableHead>
              <TableHead>{t("patients.appointmentDate")}</TableHead>
              <TableHead>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {t("calls.attempts")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("messages.attempts")}
                </div>
              </TableHead>
              <TableHead>{t("patients.doctor")}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {t("patients.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-[#00FFC8]/5">
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {patient.statusReason}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.appointmentDate}</TableCell>
                  <TableCell>{patient.followupAttempts.calls}</TableCell>
                  <TableCell>{patient.followupAttempts.messages}</TableCell>
                  <TableCell>{patient.assignedDoctor}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                        <DropdownMenuLabel>{t("patients.actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${patient.id}`}>{t("patients.view")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${patient.id}/edit`}>{t("patients.edit")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/calls/make?patient=${patient.id}`}>{t("calls.make")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/messages/send?patient=${patient.id}`}>{t("messages.send")}</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
