export const dynamic = "force-dynamic"

import { requireAuth } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import { Patient } from "@/models/patient"
import { Call } from "@/models/call"
import { Message } from "@/models/message"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, PhoneCall, MessageSquare, Star, Clock } from "lucide-react"
import { DashboardChart } from "@/components/dashboard/dashboard-chart"
import { PatientStatusChart } from "@/components/dashboard/patient-status-chart"
import { DoctorConversionChart } from "@/components/dashboard/doctor-conversion-chart"
import { LeadFunnelChart } from "@/components/dashboard/lead-funnel-chart"
import { MessageStatsChart } from "@/components/dashboard/message-stats-chart"
import { ResponseRateChart } from "@/components/dashboard/response-rate-chart"
import { AIInsights } from "@/components/dashboard/ai-insights"
import { Clinic } from "@/models/clinic"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function Dashboard() {
  const user = await requireAuth()
  await connectToDatabase()

  // Get counts based on user role
  let doctorCount = 0
  let clinicCount = 0
  let patientCount = 0
  let coldLeadsCount = 0
  let followUpsCount = 0
  let callsMade = 0
  let messagesSent = 0
  let messagesDelivered = 0
  let messagesRead = 0
  let messagesResponded = 0
  let messagesFailed = 0
  let interestedCount = 0
  let pendingCount = 0
  let bookedCount = 0
  let respondedCount = 0

  // Base query for filtering by user role
  let baseQuery = {}

  try {
    if (user.role === "admin") {
      // Admin sees everything
      doctorCount = await User.countDocuments({ role: "doctor" })
      clinicCount = await Clinic.countDocuments({})
      patientCount = await Patient.countDocuments({})
      coldLeadsCount = await Patient.countDocuments({ status: "not_answered" })
      followUpsCount = await Patient.countDocuments({ status: "follow_up" })
      callsMade = await Call.countDocuments({})
      messagesSent = await Message.countDocuments({})
      messagesDelivered = await Message.countDocuments({ status: "delivered" })
      messagesRead = await Message.countDocuments({ status: "read" })
      messagesResponded = await Message.countDocuments({ status: "read" }) // Approximation
      messagesFailed = await Message.countDocuments({ status: "failed" })
      interestedCount = await Patient.countDocuments({ status: "interested" })
      pendingCount = await Patient.countDocuments({ status: "pending" })
      bookedCount = await Patient.countDocuments({ status: "booked" })
      respondedCount = await Message.countDocuments({ status: { $in: ["delivered", "read"] } })
    } else if (user.role === "clinic") {
      // Clinic sees all patients and doctors in their clinic
      baseQuery = { clinic: user.clinic }

      doctorCount = await User.countDocuments({ role: "doctor", clinic: user.clinic })
      patientCount = await Patient.countDocuments(baseQuery)
      coldLeadsCount = await Patient.countDocuments({ ...baseQuery, status: "not_answered" })
      followUpsCount = await Patient.countDocuments({ ...baseQuery, status: "follow_up" })

      const patientIds = await Patient.find(baseQuery).distinct("_id")

      callsMade = await Call.countDocuments({
        patient: { $in: patientIds },
      })

      messagesSent = await Message.countDocuments({
        patient: { $in: patientIds },
      })

      messagesDelivered = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "delivered",
      })

      messagesRead = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "read",
      })

      messagesResponded = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "read",
      }) // Approximation

      messagesFailed = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "failed",
      })

      interestedCount = await Patient.countDocuments({ ...baseQuery, status: "interested" })
      pendingCount = await Patient.countDocuments({ ...baseQuery, status: "pending" })
      bookedCount = await Patient.countDocuments({ ...baseQuery, status: "booked" })
      respondedCount = await Message.countDocuments({
        patient: { $in: patientIds },
        status: { $in: ["delivered", "read"] },
      })
    } else {
      // Doctor sees only their patients
      baseQuery = {
        $or: [{ addedBy: user.id }, { assignedDoctor: user.id }],
      }

      patientCount = await Patient.countDocuments(baseQuery)
      coldLeadsCount = await Patient.countDocuments({
        ...baseQuery,
        status: "not_answered",
      })
      followUpsCount = await Patient.countDocuments({
        ...baseQuery,
        status: "follow_up",
      })

      const patientIds = await Patient.find(baseQuery).distinct("_id")

      callsMade = await Call.countDocuments({
        patient: { $in: patientIds },
      })

      messagesSent = await Message.countDocuments({
        patient: { $in: patientIds },
      })

      messagesDelivered = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "delivered",
      })

      messagesRead = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "read",
      })

      messagesResponded = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "read",
      }) // Approximation

      messagesFailed = await Message.countDocuments({
        patient: { $in: patientIds },
        status: "failed",
      })

      interestedCount = await Patient.countDocuments({ ...baseQuery, status: "interested" })
      pendingCount = await Patient.countDocuments({ ...baseQuery, status: "pending" })
      bookedCount = await Patient.countDocuments({ ...baseQuery, status: "booked" })
      respondedCount = await Message.countDocuments({
        patient: { $in: patientIds },
        status: { $in: ["delivered", "read"] },
      })
    }

    // Get patient status distribution for chart
    const patientStatusData = {
      interested: interestedCount,
      notInterested: await Patient.countDocuments({ ...baseQuery, status: "not_interested" }),
      pending: pendingCount,
      contacted: await Patient.countDocuments({ ...baseQuery, status: "called" }),
      booked: bookedCount,
    }

    // Get doctor conversion data
    let doctorConversionData = []

    if (user.role === "admin") {
      const doctors = await User.find({ role: "doctor" }).limit(10).lean()

      doctorConversionData = await Promise.all(
        doctors.map(async (doctor) => {
          const contacted = await Patient.countDocuments({ assignedDoctor: doctor._id })
          const interested = await Patient.countDocuments({ assignedDoctor: doctor._id, status: "interested" })
          const booked = await Patient.countDocuments({ assignedDoctor: doctor._id, status: "booked" })

          return {
            name: doctor.name,
            contacted,
            interested,
            booked,
          }
        }),
      )
    } else if (user.role === "clinic") {
      const doctors = await User.find({ role: "doctor", clinic: user.clinic }).limit(10).lean()

      doctorConversionData = await Promise.all(
        doctors.map(async (doctor) => {
          const contacted = await Patient.countDocuments({ assignedDoctor: doctor._id })
          const interested = await Patient.countDocuments({ assignedDoctor: doctor._id, status: "interested" })
          const booked = await Patient.countDocuments({ assignedDoctor: doctor._id, status: "booked" })

          return {
            name: doctor.name,
            contacted,
            interested,
            booked,
          }
        }),
      )
    }

    // Get recent calls for chart data
    const recentCalls = await Call.find(
      user.role === "admin"
        ? {}
        : user.role === "clinic"
          ? { patient: { $in: await Patient.find({ clinic: user.clinic }).distinct("_id") } }
          : { patient: { $in: await Patient.find(baseQuery).distinct("_id") } },
    )
      .sort({ callTime: -1 })
      .limit(30)
      .lean()

    // Process data for chart
    const callData = {
      completed: 0,
      failed: 0,
      noAnswer: 0,
    }

    recentCalls.forEach((call) => {
      if (call.status === "completed") callData.completed++
      else if (call.status === "failed") callData.failed++
      else if (call.status === "no_answer") callData.noAnswer++
    })

    // Lead funnel data
    const leadFunnelData = {
      totalPatients: patientCount,
      contacted: await Patient.countDocuments({
        ...baseQuery,
        status: { $in: ["called", "follow_up", "interested", "booked", "not_interested"] },
      }),
      responded: await Patient.countDocuments({
        ...baseQuery,
        status: { $in: ["follow_up", "interested", "booked", "not_interested"] },
      }),
      interested: interestedCount,
      booked: bookedCount,
    }

    // Message stats data
    const messageStatsData = {
      sent: messagesSent,
      delivered: messagesDelivered,
      read: messagesRead,
      responded: messagesResponded,
      failed: messagesFailed,
    }

    // Response rate data
    const responseRateData = {
      responded: messagesResponded,
      notResponded: messagesSent - messagesResponded,
    }

    // AI insights data
    const aiInsightsData = {
      totalAnalyzed: callsMade,
      sentimentDistribution: {
        positive: interestedCount + bookedCount,
        negative: await Patient.countDocuments({ ...baseQuery, status: "not_interested" }),
        neutral: pendingCount + coldLeadsCount,
      },
      topIntents: [
        { intent: "Book Appointment", count: bookedCount },
        { intent: "Request Information", count: interestedCount },
        { intent: "Not Interested", count: await Patient.countDocuments({ ...baseQuery, status: "not_interested" }) },
        {
          intent: "Call Back Later",
          count: (await Patient.countDocuments({ ...baseQuery, status: "call_back" })) || 0,
        },
        {
          intent: "Wrong Number",
          count: (await Patient.countDocuments({ ...baseQuery, status: "wrong_number" })) || 0,
        },
      ],
      recommendations: [
        "Follow up with interested patients within 24 hours to increase booking rate",
        "Send WhatsApp messages before calling to improve answer rate",
        "Adjust call times to match patient preferred times for better engagement",
        "Consider offering special promotions to cold leads to re-engage them",
      ],
    }

    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold brand-text-gradient">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-[#101B4C]/20 shadow-md hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#101B4C]">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-[#00FFC8]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#101B4C]">{patientCount}</div>
            </CardContent>
          </Card>

          <Card className="border-[#101B4C]/20 shadow-md hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#101B4C]">Calls Made</CardTitle>
              <PhoneCall className="h-4 w-4 text-[#00FFC8]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#101B4C]">{callsMade}</div>
            </CardContent>
          </Card>

          <Card className="border-[#101B4C]/20 shadow-md hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#101B4C]">Messages Sent</CardTitle>
              <MessageSquare className="h-4 w-4 text-[#00FFC8]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#101B4C]">{messagesSent}</div>
            </CardContent>
          </Card>

          <Card className="border-[#101B4C]/20 shadow-md hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#101B4C]">Interested</CardTitle>
              <Star className="h-4 w-4 text-[#00FFC8]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#101B4C]">{interestedCount}</div>
            </CardContent>
          </Card>

          <Card className="border-[#101B4C]/20 shadow-md hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#101B4C]">Booked</CardTitle>
              <Clock className="h-4 w-4 text-[#00FFC8]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#101B4C]">{bookedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="status" className="space-y-4">
          <TabsList className="bg-[#101B4C]/10 p-1">
            <TabsTrigger
              value="status"
              className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
            >
              Patient Status
            </TabsTrigger>
            <TabsTrigger
              value="funnel"
              className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
            >
              Lead Funnel
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
            >
              Message Stats
            </TabsTrigger>
            <TabsTrigger
              value="response"
              className="data-[state=active]:bg-[#101B4C] data-[state=active]:text-white text-[#101B4C]"
            >
              Response Rate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-[#101B4C]/20 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                  <CardTitle>Patient Status Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PatientStatusChart data={patientStatusData} />
                </CardContent>
              </Card>

              <Card className="border-[#101B4C]/20 shadow-md">
                <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                  <CardTitle>Call Statistics</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <DashboardChart data={callData} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="funnel">
            <Card className="border-[#101B4C]/20 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                <CardTitle>Lead Conversion Funnel</CardTitle>
                <CardDescription className="text-white/80">
                  Visualization of patient journey from initial contact to booking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LeadFunnelChart data={leadFunnelData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="border-[#101B4C]/20 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                <CardTitle>Message Statistics</CardTitle>
                <CardDescription className="text-white/80">
                  Breakdown of message delivery and engagement metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <MessageStatsChart data={messageStatsData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="response">
            <Card className="border-[#101B4C]/20 shadow-md">
              <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
                <CardTitle>Patient Response Rate</CardTitle>
                <CardDescription className="text-white/80">
                  Percentage of patients who responded to messages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ResponseRateChart data={responseRateData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AIInsights data={aiInsightsData} />

        {(user.role === "admin" || user.role === "clinic") && doctorConversionData.length > 0 && (
          <Card className="border-[#101B4C]/20 shadow-md">
            <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
              <CardTitle>Conversion Rate by Doctor</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DoctorConversionChart data={doctorConversionData} />
            </CardContent>
          </Card>
        )}
      </div>
    )
  } catch (error) {
    console.error("Dashboard error:", error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold brand-text-gradient">Dashboard</h1>
        <Card className="border-red-200 shadow-md">
          <CardHeader className="bg-red-50 text-red-700 rounded-t-lg">
            <CardTitle>Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>There was an error loading the dashboard data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
