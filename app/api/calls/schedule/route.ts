import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Call } from "@/models/call"
import { Setting } from "@/models/setting"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { scheduleRetellCall } from "@/lib/retell-ai"
import { Patient } from "@/models/patient"

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

    // Get patients to call based on request body or default to tomorrow's appointments
    const { date, doctorId, specificPatientIds, fromNumber } = await req.json().catch(() => ({}))

    const query: any = { status: "pending" }

    if (specificPatientIds && Array.isArray(specificPatientIds) && specificPatientIds.length > 0) {
      // If specific patient IDs are provided, use those
      query._id = { $in: specificPatientIds }
    } else if (date) {
      // If a specific date is provided
      const targetDate = new Date(date)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      query.appointmentDate = {
        $gte: targetDate,
        $lt: nextDay,
      }
    } else {
      // Default to tomorrow's appointments
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)

      const dayAfterTomorrow = new Date(tomorrow)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

      query.appointmentDate = {
        $gte: tomorrow,
        $lt: dayAfterTomorrow,
      }
    }

    // If doctor ID is provided, filter by assigned doctor
    if (doctorId) {
      query.assignedDoctor = doctorId
    }

    const patients = await Patient.find(query).limit(settings.maxCallsPerDay)

    if (patients.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No patients found matching the criteria",
        scheduledCalls: 0,
      })
    }

    // Schedule calls using Retell API
    const scheduledCalls = []
    const webhookUrl = `${process.env.NEXTAUTH_URL || req.headers.get("origin")}/api/retell-webhook`

    for (const patient of patients) {
      try {
        // Format appointment date for the script
        const appointmentDate = patient.appointmentDate
          ? new Date(patient.appointmentDate).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })
          : "your upcoming appointment"

        // Schedule call with Retell
        const callResult = await scheduleRetellCall(settings.retellApiKey, {
          phoneNumber: patient.phone,
          fromNumber: fromNumber, // Pass the fromNumber if provided
          script: patient.callScript,
          patientName: patient.name,
          appointmentDate,
          callbackUrl: webhookUrl,
        })

        // Create a call record
        const call = new Call({
          patient: patient._id,
          callTime: new Date(),
          status: "scheduled",
          retellCallId: callResult.callId,
        })

        await call.save()

        // Update patient status
        patient.status = "called"
        await patient.save()

        scheduledCalls.push({
          patientId: patient._id,
          name: patient.name,
          phone: patient.phone,
          callId: callResult.callId,
        })
      } catch (callError) {
        console.error(`Error scheduling call for patient ${patient._id}:`, callError)
      }
    }

    return NextResponse.json({
      success: true,
      scheduledCalls: scheduledCalls.length,
      calls: scheduledCalls,
    })
  } catch (error: any) {
    console.error("Error scheduling calls:", error)
    return NextResponse.json({ error: "Failed to schedule calls" }, { status: 500 })
  }
}
