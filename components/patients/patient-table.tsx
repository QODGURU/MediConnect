"use client"

import type React from "react"

import { useState, useMemo } from "react"
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
import { MoreHorizontal, Search } from "lucide-react"
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
  appointmentDate: string
  addedBy: string
  assignedDoctor?: string
  clinic?: string
}

interface PatientTableProps {
  data: Patient[]
}

export function PatientTable({ data }: PatientTableProps) {
  const { t, dir } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  // Status options for the filter
  const statusOptions: StatusOption[] = [
    { value: "pending", label: t("status.pending") },
    { value: "called", label: t("status.called") },
    { value: "not_answered", label: t("status.notAnswered") },
    { value: "follow_up", label: t("status.followUp") },
    { value: "interested", label: t("status.interested") },
    { value: "not_interested", label: t("status.notInterested") },
    { value: "booked", label: t("status.booked") },
    { value: "wrong_number", label: t("status.wrongNumber") },
    { value: "busy", label: t("status.busy") },
    { value: "call_back", label: t("status.callBack") },
  ]

  // Handle status filter change
  const handleStatusFilterChange = (statuses: string[]) => {
    setSelectedStatuses(statuses)

    try {
      // Update URL with selected statuses
      const params = new URLSearchParams(searchParams?.toString() || "")

      if (statuses.length > 0) {
        params.set("status", statuses.join(","))
      } else {
        params.delete("status")
      }

      if (searchTerm) {
        params.set("search", searchTerm)
      }

      router.push(`?${params.toString()}`)
    } catch (error) {
      console.error("Error updating URL:", error)
    }
  }

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    try {
      // Update URL with search term
      const params = new URLSearchParams(searchParams?.toString() || "")

      if (value) {
        params.set("search", value)
      } else {
        params.delete("search")
      }

      if (selectedStatuses.length > 0) {
        params.set("status", selectedStatuses.join(","))
      }

      router.push(`?${params.toString()}`)
    } catch (error) {
      console.error("Error updating URL:", error)
    }
  }

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    return data.filter((patient) => {
      // Apply search filter
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())

      // Apply status filter
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(patient.status)

      return matchesSearch && matchesStatus
    })
  }, [data, searchTerm, selectedStatuses])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">{t("status.pending")}</Badge>
      case "called":
        return <Badge className="bg-green-500">{t("status.called")}</Badge>
      case "not_answered":
        return <Badge variant="destructive">{t("status.notAnswered")}</Badge>
      case "follow_up":
        return <Badge className="bg-blue-500">{t("status.followUp")}</Badge>
      case "interested":
        return <Badge className="bg-purple-500">{t("status.interested")}</Badge>
      case "not_interested":
        return <Badge className="bg-orange-500">{t("status.notInterested")}</Badge>
      case "booked":
        return <Badge className="bg-[#00FFC8] text-[#101B4C]">{t("status.booked")}</Badge>
      case "wrong_number":
        return <Badge variant="destructive">{t("status.wrongNumber")}</Badge>
      case "busy":
        return <Badge className="bg-yellow-500">{t("status.busy")}</Badge>
      case "call_back":
        return <Badge className="bg-blue-500">{t("status.callBack")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!data || !Array.isArray(data)) {
    return <div>No patient data available</div>
  }

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
            options={statusOptions}
            onChange={handleStatusFilterChange}
            defaultSelected={selectedStatuses}
            placeholder={t("patients.filterByStatus")}
          />
        </div>
      </div>

      <div className="rounded-md border border-[#101B4C]/20 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#101B4C]/5">
              <TableHead>{t("patients.name")}</TableHead>
              <TableHead>{t("patients.phone")}</TableHead>
              <TableHead>{t("patients.status")}</TableHead>
              <TableHead>{t("patients.appointmentDate")}</TableHead>
              <TableHead>{t("patients.addedBy")}</TableHead>
              {data[0]?.assignedDoctor && <TableHead>{t("patients.doctor")}</TableHead>}
              {data[0]?.clinic && <TableHead>{t("patients.clinic")}</TableHead>}
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    data[0]?.assignedDoctor && data[0]?.clinic ? 8 : data[0]?.assignedDoctor || data[0]?.clinic ? 7 : 6
                  }
                  className="text-center"
                >
                  {t("patients.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-[#00FFC8]/5">
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{getStatusBadge(patient.status)}</TableCell>
                  <TableCell>{patient.appointmentDate}</TableCell>
                  <TableCell>{patient.addedBy}</TableCell>
                  {patient.assignedDoctor && <TableCell>{patient.assignedDoctor}</TableCell>}
                  {patient.clinic && <TableCell>{patient.clinic}</TableCell>}
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
                          <Link href={`/messages/send?patient=${patient.id}`}>{t("messages.send")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/calls/make?patient=${patient.id}`}>{t("calls.make")}</Link>
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
