import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Call } from "@/models/call"
import { Setting } from "@/models/setting"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { scheduleRetellCall } from "@/lib/retell-ai"
import { Patient } from "@/models/patient"
import mongoose from "mongoose"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get settings
    const settings = await Setting.findOne({})
    if (!settings || !settings.retellApiKey) {
      return NextResponse.json({ error: "Retell API key not configured" }, { status: 400 })
    }

    const {
      phoneNumber,
      fromNumber,
      script,
      patientName,
      doctorName,
      clinicName,
      callerName,
      appointmentDate,
      appointmentReason,
      clinicPhone,
      ...otherVariables
    } = await req.json()

    if (!phoneNumber || !script) {
      return NextResponse.json({ error: "Phone number and script are required" }, { status: 400 })
    }

    // Log the parameters being sent to Retell
    console.log("Making immediate call with parameters:", {
      phoneNumber,
      fromNumber,
      script,
      patientName,
      doctorName,
      clinicName,
      callerName,
      appointmentDate,
      appointmentReason,
      clinicPhone,
      ...otherVariables,
    })

    // Create a temporary patient if needed
    let patientId = new mongoose.Types.ObjectId()
    let existingPatient = null

    // Try to find an existing patient with this phone number
    existingPatient = await Patient.findOne({ phone: phoneNumber })

    if (!existingPatient) {
      // Create a temporary patient record
      const tempPatient = new Patient({
        _id: patientId,
        name: patientName || "Unknown Patient",
        phone: phoneNumber,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : new Date(),
        callScript: script,
        addedBy: session.user.id,
        status: "pending",
      })
      await tempPatient.save()
      patientId = tempPatient._id
    } else {
      patientId = existingPatient._id
    }

    // Schedule call with Retell
    const webhookUrl = `${process.env.NEXTAUTH_URL || req.headers.get("origin")}/api/retell-webhook`

    const callResult = await scheduleRetellCall(settings.retellApiKey, {
      phoneNumber,
      fromNumber,
      script,
      patientName: patientName || "Patient",
      doctorName: doctorName || "Dr. Smith",
      clinicName: clinicName || "MedConnect",
      callerName: callerName || (session.user.role === "admin" ? "MedConnect" : doctorName || "Dr. Smith"),
      appointmentDate: appointmentDate || "your upcoming appointment",
      appointmentReason: appointmentReason || "your appointment",
      clinicPhone: clinicPhone || "our main office number",
      ...otherVariables,
      callbackUrl: webhookUrl,
    })

    // Create a call record
    const call = new Call({
      patient: patientId,
      callTime: new Date(),
      status: "scheduled",
      retellCallId: callResult.callId,
    })

    await call.save()

    // Update patient status
    if (existingPatient) {
      existingPatient.status = "called"
      await existingPatient.save()
    }

    return NextResponse.json({
      success: true,
      callId: callResult.callId,
      status: callResult.status,
      message: "Call initiated successfully",
    })
  } catch (error: any) {
    console.error("Error making immediate call:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to make call",
        details: error.response?.data || error.toString(),
      },
      { status: 500 },
    )
  }
}
