import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { formatDate } from "@/lib/utils"
import { ColdLeadsTable } from "@/components/patients/cold-leads-table"
import { Suspense } from "react"
import type { SearchParams } from "@/types/search-params"

interface ColdLeadsPageProps {
  searchParams: SearchParams
}

export default async function ColdLeadsPage({ searchParams }: ColdLeadsPageProps) {
  const user = await requireAuth()
  await connectToDatabase()

  // Get search query from URL if present
  const searchQuery = searchParams.search || ""
  const reasonFilter = searchParams.reason || ""

  // Get cold leads (patients who didn't answer)
  const query: any = { status: "not_answered" }

  if (user.role === "admin") {
    // Admin sees all cold leads
  } else if (user.role === "clinic") {
    // Clinic sees cold leads for their clinic
    query.clinic = user.clinic
  } else {
    // Doctor sees cold leads for their patients
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
          { statusReason: { $regex: searchQuery, $options: "i" } },
        ],
      },
    ]
  }

  // Add reason filter if present
  if (reasonFilter) {
    query.statusReason = reasonFilter
  }

  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
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
    statusReason: patient.statusReason || "No response",
    appointmentDate: formatDate(patient.appointmentDate),
    addedBy: patient.addedBy?.name || "Unknown",
    assignedDoctor: patient.assignedDoctor?.name || "Unassigned",
    clinic: patient.clinic?.name || "Unassigned",
    followupAttempts: {
      calls: patient.followupAttempts?.calls || 0,
      messages: patient.followupAttempts?.messages || 0,
    },
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold brand-text-gradient">Cold Leads</h1>
      <p className="text-muted-foreground">
        Patients who did not answer the automated calls or messages after multiple attempts.
      </p>

      <Suspense fallback={<div>Loading cold leads...</div>}>
        <ColdLeadsTable data={formattedPatients} />
      </Suspense>
    </div>
  )
}
