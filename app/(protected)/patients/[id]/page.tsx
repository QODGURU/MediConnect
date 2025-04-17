import { notFound } from "next/navigation"
import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { Call } from "@/models/call"
import { Message } from "@/models/message"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { CallHistory } from "@/components/calls/call-history"
import { MessageHistory } from "@/components/messages/message-history"
import { AIFeedback } from "@/components/patients/ai-feedback"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function PatientDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()
  await connectToDatabase()

  const patient = await Patient.findById(params.id)
    .populate("addedBy", "name")
    .populate("assignedDoctor", "name")
    .populate("clinic", "name")
    .lean()

  if (!patient) {
    notFound()
  }

  // Check if the user has access to this patient
  if (
    user.role !== "admin" &&
    user.role !== "clinic" &&
    patient.addedBy._id.toString() !== user.id &&
    patient.assignedDoctor?._id.toString() !== user.id
  ) {
    notFound()
  }

  // Get call history
  const calls = await Call.find({ patient: params.id }).sort({ callTime: -1 }).lean()

  // Get message history
  const messages = await Message.find({ patient: params.id }).sort({ sentAt: -1 }).lean()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "called":
        return <Badge className="bg-green-500">Called</Badge>
      case "not_answered":
        return <Badge variant="destructive">Not Answered</Badge>
      case "follow_up":
        return <Badge className="bg-blue-500">Follow Up</Badge>
      case "interested":
        return <Badge className="bg-purple-500">Interested</Badge>
      case "not_interested":
        return <Badge className="bg-orange-500">Not Interested</Badge>
      case "booked":
        return <Badge className="bg-[#00FFC8] text-[#101B4C]">Booked</Badge>
      case "wrong_number":
        return <Badge variant="destructive">Wrong Number</Badge>
      case "busy":
        return <Badge className="bg-yellow-500">Busy</Badge>
      case "call_back":
        return <Badge className="bg-blue-500">Call Back Later</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold brand-text-gradient">Patient Details</h1>
        <div className="flex space-x-2">
          <Link href={`/patients/${params.id}/edit`}>
            <Button variant="outline" className="border-[#101B4C] text-[#101B4C] hover:bg-[#00FFC8]/10">
              Edit Patient
            </Button>
          </Link>
          <Link href="/patients">
            <Button variant="ghost" className="text-[#101B4C] hover:bg-[#00FFC8]/10">
              Back to Patients
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-[#101B4C]/20 shadow-md">
          <CardHeader className="bg-[#101B4C]/10 border-b border-[#101B4C]/20">
            <CardTitle className="text-[#101B4C]">Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Name</p>
                <p className="text-gray-800">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Status</p>
                <p>{getStatusBadge(patient.status)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Phone</p>
                <p className="text-gray-800">{patient.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Email</p>
                <p className="text-gray-800">{patient.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Age</p>
                <p className="text-gray-800">{patient.age || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Gender</p>
                <p className="text-gray-800 capitalize">{patient.gender || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Appointment Date</p>
                <p className="text-gray-800">{formatDate(patient.appointmentDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Added By</p>
                <p className="text-gray-800">{patient.addedBy?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Assigned Doctor</p>
                <p className="text-gray-800">{patient.assignedDoctor?.name || "Unassigned"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#101B4C]">Clinic</p>
                <p className="text-gray-800">{patient.clinic?.name || "Unassigned"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#101B4C]/20 shadow-md">
          <CardHeader className="bg-[#101B4C]/10 border-b border-[#101B4C]/20">
            <CardTitle className="text-[#101B4C]">Call Script</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="rounded-md bg-gray-50 p-4 border border-gray-200">
              <p className="whitespace-pre-wrap text-gray-800">{patient.callScript}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#101B4C]/20 shadow-md">
        <CardHeader className="bg-[#101B4C]/10 border-b border-[#101B4C]/20">
          <CardTitle className="text-[#101B4C]">Communication History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="calls">
            <TabsList className="mb-4 bg-[#101B4C]/10 p-1">
              <TabsTrigger
                value="calls"
                className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
              >
                Call History
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
              >
                Message History
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
              >
                AI Feedback
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calls">
              <CallHistory calls={calls} />
            </TabsContent>

            <TabsContent value="messages">
              <MessageHistory messages={messages} />
            </TabsContent>

            <TabsContent value="ai">
              <AIFeedback patient={patient} calls={calls} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Link href={`/messages/send?patient=${params.id}`}>
          <Button className="bg-[#101B4C] hover:bg-[#101B4C]/90 text-white">Send Message</Button>
        </Link>
        <Link href={`/calls/make?patient=${params.id}`}>
          <Button className="bg-[#00FFC8] hover:bg-[#00FFC8]/90 text-[#101B4C]">Make Call</Button>
        </Link>
      </div>
    </div>
  )
}
