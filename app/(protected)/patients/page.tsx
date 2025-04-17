export const dynamic = "force-dynamic"

import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { PatientTable } from "@/components/patients/patient-table"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SearchParams } from "@/types/search-params"

interface PatientsPageProps {
  searchParams: SearchParams
}

export default async function PatientsPage({ searchParams }: PatientsPageProps) {
  try {
    const user = await requireAuth()
    await connectToDatabase()

    // Get search query from URL if present
    const searchQuery = searchParams?.search || ""
    const statusFilter = searchParams?.status || ""

    // Get patients based on user role
    const query: any = {}

    if (user.role === "admin") {
      // Admin sees all patients
    } else if (user.role === "clinic") {
      // Clinic sees patients in their clinic
      query.clinic = user.clinic
    } else {
      // Doctor sees only their patients
      query.$or = [{ addedBy: user.id }, { assignedDoctor: user.id }]
    }

    // Add search filter if present
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ]
    }

    // Add status filter if present
    if (statusFilter) {
      query.status = statusFilter
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to 100 patients for performance
      .populate("addedBy", "name")
      .populate("assignedDoctor", "name")
      .populate("clinic", "name")
      .lean()

    // Format data for the table
    const formattedPatients = patients.map((patient) => ({
      id: patient._id.toString(),
      name: patient.name,
      phone: patient.phone,
      email: patient.email || "N/A",
      status: patient.status,
      appointmentDate: formatDate(patient.appointmentDate),
      addedBy: patient.addedBy?.name || "Unknown",
      assignedDoctor: patient.assignedDoctor?.name || "Unassigned",
      clinic: patient.clinic?.name || "Unassigned",
      messageAttempts: patient.messageAttempts,
      callAttempts: patient.callAttempts,
      lastResponse: patient.lastResponse,
      lastResponseDate: patient.lastResponseDate,
    }))

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold brand-text-gradient">Patients</h1>
          <div className="flex space-x-2">
            <Link href="/patients/bulk-import">
              <Button variant="outline" className="border-[#101B4C] text-[#101B4C] hover:bg-[#00FFC8]/10">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
            <Link href="/patients/add">
              <Button className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </Link>
          </div>
        </div>

        <Suspense fallback={<div>Loading patients...</div>}>
          <PatientTable data={formattedPatients} />
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error("Patients page error:", error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold brand-text-gradient">Patients</h1>
          <div className="flex space-x-2">
            <Link href="/patients/bulk-import">
              <Button variant="outline" className="border-[#101B4C] text-[#101B4C] hover:bg-[#00FFC8]/10">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Button>
            </Link>
            <Link href="/patients/add">
              <Button className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Patient
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-red-50 text-red-700 rounded-t-lg">
            <CardTitle>Error Loading Patients</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>There was an error loading the patient data. Please try again later.</p>
            <p className="text-sm text-red-500 mt-2">
              {error instanceof Error ? error.message : "Unknown error occurred"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
