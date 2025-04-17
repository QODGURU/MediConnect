import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { sendWhatsAppMessage } from "@/lib/twilio"
import { requireAuth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    await connectToDatabase()

    const { patientId, templateType, customMessage } = await req.json()

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const result = await sendWhatsAppMessage(patientId, templateType, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
