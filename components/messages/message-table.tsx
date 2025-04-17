"use client"

import { useState, useEffect } from "react"
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
import { MoreHorizontal, Search, MessageSquare, Check, X, Clock, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { StatusFilter, type StatusOption } from "@/components/filters/status-filter"

interface Message {
  id: string
  patientId: string
  patientName: string
  patientPhone: string
  content: string
  sentAt: string
  status: string
  messageType: string
  sentBy: string
  isFollowup: boolean
  followupAttempt: number
}

interface MessageTableProps {
  data: Message[]
}

export function MessageTable({ data }: MessageTableProps) {
  const { t, dir } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filteredData, setFilteredData] = useState<Message[]>(data)

  // Status options for the filter
  const statusOptions: StatusOption[] = [
    { value: "sent", label: t("messages.sent"), color: "bg-blue-500" },
    { value: "delivered", label: t("messages.delivered"), color: "bg-green-500" },
    { value: "read", label: t("messages.read"), color: "bg-green-700" },
    { value: "failed", label: t("messages.failed"), color: "bg-red-500" },
    { value: "queued", label: t("messages.queued"), color: "bg-gray-500" },
  ]

  // Filter data when search term or selected statuses change
  useEffect(() => {
    let filtered = data

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (message) =>
          message.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          message.patientPhone.includes(searchTerm) ||
          message.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((message) => selectedStatuses.includes(message.status))
    }

    setFilteredData(filtered)
  }, [data, searchTerm, selectedStatuses])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Send className="h-4 w-4 text-blue-500" />
      case "delivered":
        return <Check className="h-4 w-4 text-green-500" />
      case "read":
        return <Check className="h-4 w-4 text-green-700" />
      case "failed":
        return <X className="h-4 w-4 text-red-500" />
      case "queued":
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500">{t("messages.sent")}</Badge>
      case "delivered":
        return <Badge className="bg-green-500">{t("messages.delivered")}</Badge>
      case "read":
        return <Badge className="bg-green-700">{t("messages.read")}</Badge>
      case "failed":
        return <Badge variant="destructive">{t("messages.failed")}</Badge>
      case "queued":
        return <Badge variant="outline">{t("messages.queued")}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("messages.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <StatusFilter
          options={statusOptions}
          onChange={setSelectedStatuses}
          placeholder={t("messages.filterByStatus")}
        />
      </div>

      <div className="rounded-md border border-[#101B4C]/20 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#101B4C]/5">
              <TableHead>{t("patients.name")}</TableHead>
              <TableHead>{t("patients.phone")}</TableHead>
              <TableHead>{t("messages.content")}</TableHead>
              <TableHead>{t("messages.sentAt")}</TableHead>
              <TableHead>{t("messages.status")}</TableHead>
              <TableHead>{t("messages.type")}</TableHead>
              <TableHead>{t("messages.sentBy")}</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {t("messages.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((message) => (
                <TableRow key={message.id} className="hover:bg-[#00FFC8]/5">
                  <TableCell className="font-medium">{message.patientName}</TableCell>
                  <TableCell>{message.patientPhone}</TableCell>
                  <TableCell className="max-w-xs truncate">{message.content}</TableCell>
                  <TableCell>{message.sentAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(message.status)}
                      {getStatusBadge(message.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {message.messageType}
                    </Badge>
                  </TableCell>
                  <TableCell>{message.sentBy}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                        <DropdownMenuLabel>{t("messages.actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${message.patientId}`}>{t("patients.view")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/messages/send?patient=${message.patientId}`}>{t("messages.reply")}</Link>
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
