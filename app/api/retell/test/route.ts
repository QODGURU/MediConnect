import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Setting } from "@/models/setting"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { scheduleRetellCall } from "@/lib/retell-ai"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      phoneNumber,
      fromNumber,
      script,
      patientName,
      doctorName,
      appointmentDate,
      appointmentReason,
      ...otherVariables
    } = await req.json()

    if (!phoneNumber || !script) {
      return NextResponse.json({ error: "Phone number and script are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Get Retell API key from settings
    const settings = await Setting.findOne({})

    if (!settings || !settings.retellApiKey) {
      return NextResponse.json(
        { error: "Retell API key not configured. Please set it in Settings first." },
        { status: 400 },
      )
    }

    try {
      // Log the parameters being sent to Retell
      console.log("Making test call with parameters:", {
        phoneNumber,
        fromNumber,
        script,
        patientName,
        doctorName,
        appointmentDate,
        appointmentReason,
        ...otherVariables,
      })

      // Make the actual API call to Retell
      const result = await scheduleRetellCall(settings.retellApiKey, {
        phoneNumber,
        fromNumber,
        script,
        patientName: patientName || "Patient",
        doctorName: doctorName || "Dr. Smith",
        appointmentDate: appointmentDate || "your upcoming appointment",
        appointmentReason: appointmentReason || "your appointment",
        ...otherVariables,
        callbackUrl: `${process.env.NEXTAUTH_URL || req.headers.get("origin")}/api/retell-webhook`,
      })

      console.log("Retell API call result:", result)

      return NextResponse.json({
        success: true,
        callId: result.callId,
        status: result.status,
        message: "Test call initiated successfully",
      })
    } catch (callError: any) {
      console.error("Error from Retell API:", callError)
      throw callError
    }
  } catch (error: any) {
    console.error("Error making test call:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to make test call",
        details: error.response?.data || error,
      },
      { status: 500 },
    )
  }
}
