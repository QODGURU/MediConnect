import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { Call } from "@/models/call"
import { formatDate } from "@/lib/utils"
import { PatientTable } from "@/components/patients/patient-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CallHistory } from "@/components/calls/call-history"
import { ProcessFollowUps } from "@/components/followups/process-followups"
import { Suspense } from "react"
import type { SearchParams } from "@/types/search-params"

interface FollowUpsPageProps {
  searchParams: SearchParams
}

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const user = await requireAuth()
  await connectToDatabase()

  // Get search query from URL if present
  const searchQuery = searchParams.search || ""
  const statusFilter = searchParams.status || ""

  // Get follow-ups (patients who answered and need follow-up)
  const query: any = { status: "follow_up" }

  if (user.role === "admin") {
    // Admin sees all follow-ups
  } else if (user.role === "clinic") {
    // Clinic sees follow-ups for their clinic
    query.clinic = user.clinic
  } else {
    // Doctor sees follow-ups for their patients
    query.$or = [{ addedBy: user.id }, { assignedDoctor: user.id }]
  }

  // Add search filter if present
  if (searchQuery) {
    query.$and = [
      query,
      {
        $or: [
          { name: { $regex: searchQuery, $options: "i" } },
          { phone: { $regex: searchQuery, $options: "i" } },
          { email: { $regex: searchQuery, $options: "i" } },
        ],
      },
    ]
  }

  // Add additional status filter if present (for filtering by sub-status)
  if (statusFilter && statusFilter !== "follow_up") {
    query.statusReason = statusFilter
  }

  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .populate("addedBy", "name")
    .populate("assignedDoctor", "name")
    .populate("clinic", "name")
    .lean()

  // Get recent calls for these patients
  const patientIds = patients.map((patient) => patient._id)
  const recentCalls = await Call.find({
    patient: { $in: patientIds },
    status: "completed",
  })
    .sort({ callTime: -1 })
    .limit(10)
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
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold brand-text-gradient">Follow Ups</h1>
        {(user.role === "admin" || user.role === "clinic") && <ProcessFollowUps />}
      </div>
      <p className="text-muted-foreground">Patients who answered the call and require follow-up.</p>

      <div className="grid gap-6 md:grid-cols-1">
        <Card className="border-[#101B4C]/20 shadow-md">
          <CardHeader className="bg-[#101B4C]/10 border-b border-[#101B4C]/20">
            <CardTitle className="text-[#101B4C]">Recent Call Recordings</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <CallHistory calls={recentCalls} />
          </CardContent>
        </Card>

        <Suspense fallback={<div>Loading patients...</div>}>
          <PatientTable data={formattedPatients} />
        </Suspense>
      </div>
    </div>
  )
}
