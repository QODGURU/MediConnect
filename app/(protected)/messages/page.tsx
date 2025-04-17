import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Message } from "@/models/message"
import { Patient } from "@/models/patient"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { MessageTable } from "@/components/messages/message-table"
import { Suspense } from "react"
import type { SearchParams } from "@/types/search-params"
// Import the ProcessMessages component
import { ProcessMessages } from "@/components/messages/process-messages"

interface MessagesPageProps {
  searchParams: SearchParams
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const user = await requireAuth()
  await connectToDatabase()

  // Get search query from URL if present
  const searchQuery = searchParams.search || ""
  const statusFilter = searchParams.status || ""

  // Get messages based on user role
  const query: any = {}

  if (user.role === "admin") {
    // Admin sees all messages
  } else if (user.role === "clinic") {
    // Clinic sees messages for their clinic's patients
    const clinicPatientIds = await Patient.find({ clinic: user.clinic }).distinct("_id")
    query.patient = { $in: clinicPatientIds }
  } else {
    // Doctor sees messages for their patients
    const doctorPatientIds = await Patient.find({
      $or: [{ addedBy: user.id }, { assignedDoctor: user.id }],
    }).distinct("_id")
    query.patient = { $in: doctorPatientIds }
  }

  // Add search filter if present
  if (searchQuery) {
    // We need to join with patients to search by patient name or phone
    const matchingPatients = await Patient.find({
      $or: [{ name: { $regex: searchQuery, $options: "i" } }, { phone: { $regex: searchQuery, $options: "i" } }],
    }).distinct("_id")

    query.$or = [{ patient: { $in: matchingPatients } }, { content: { $regex: searchQuery, $options: "i" } }]
  }

  // Add status filter if present
  if (statusFilter) {
    query.status = statusFilter
  }

  const messages = await Message.find(query)
    .sort({ sentAt: -1 })
    .populate("patient", "name phone")
    .populate("sentBy", "name")
    .limit(100)
    .lean()

  // Format data for the table
  const formattedMessages = messages.map((message) => ({
    id: message._id.toString(),
    patientId: message.patient._id.toString(),
    patientName: message.patient.name,
    patientPhone: message.patient.phone,
    content: message.content,
    sentAt: new Date(message.sentAt).toLocaleString(),
    status: message.status,
    messageType: message.messageType,
    sentBy: message.sentBy?.name || "System",
    isFollowup: message.isFollowup,
    followupAttempt: message.followupAttempt,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold brand-text-gradient">Messages</h1>
        <Link href="/messages/send">
          <Button className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </Link>
      </div>

      <ProcessMessages />

      <Suspense fallback={<div>Loading messages...</div>}>
        <MessageTable data={formattedMessages} />
      </Suspense>
    </div>
  )
}
