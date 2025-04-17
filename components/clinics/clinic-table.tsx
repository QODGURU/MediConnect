"use client"

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
import { MoreHorizontal, Search, Users, UserCog } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface Clinic {
  id: string
  name: string
  email: string
  phone: string
  address: string
  doctorCount: number
  patientCount: number
  createdAt: string
}

interface ClinicTableProps {
  data: Clinic[]
}

export function ClinicTable({ data }: ClinicTableProps) {
  const { t, dir } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(
    (clinic) =>
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.phone.includes(searchTerm),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("clinics.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border border-[#101B4C]/20 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#101B4C]/5">
              <TableHead>{t("clinics.name")}</TableHead>
              <TableHead>{t("clinics.email")}</TableHead>
              <TableHead>{t("clinics.phone")}</TableHead>
              <TableHead>{t("clinics.address")}</TableHead>
              <TableHead>
                <div className="flex items-center">
                  <UserCog className="h-4 w-4 mr-2" />
                  {t("doctors.title")}
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {t("patients.title")}
                </div>
              </TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  {t("clinics.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((clinic) => (
                <TableRow key={clinic.id} className="hover:bg-[#00FFC8]/5">
                  <TableCell className="font-medium">{clinic.name}</TableCell>
                  <TableCell>{clinic.email}</TableCell>
                  <TableCell>{clinic.phone}</TableCell>
                  <TableCell>{clinic.address}</TableCell>
                  <TableCell>{clinic.doctorCount}</TableCell>
                  <TableCell>{clinic.patientCount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
                        <DropdownMenuLabel>{t("clinics.actions")}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/clinics/${clinic.id}`}>{t("clinics.view")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clinics/${clinic.id}/edit`}>{t("clinics.edit")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/clinics/${clinic.id}/doctors`}>{t("doctors.manage")}</Link>
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
