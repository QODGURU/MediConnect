import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { Setting } from "@/models/setting"
import { sendWhatsAppMessage } from "@/lib/twilio"
import { requireAuth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    await requireAuth()
    await connectToDatabase()

    const settings = await Setting.findOne({}).lean()

    if (!settings || !settings.whatsappEnabled) {
      return NextResponse.json({ error: "WhatsApp integration not enabled" }, { status: 400 })
    }

    // Find patients who need follow-up
    const followUpDays = settings.daysBeforeFollowup || 1
    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() - followUpDays)

    const patients = await Patient.find({
      $or: [
        { status: "not_answered", lastMessageDate: { $lt: followUpDate } },
        { status: "follow_up", lastMessageDate: { $lt: followUpDate } },
      ],
      messageAttempts: { $lt: settings.maxFollowupMessages },
    }).limit(10)

    const results = []

    for (const patient of patients) {
      const result = await sendWhatsAppMessage(patient._id.toString(), "followUp")
      results.push({
        patientId: patient._id,
        name: patient.name,
        success: result.success,
        error: result.error,
      })
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error: any) {
    console.error("Error processing follow-ups:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
