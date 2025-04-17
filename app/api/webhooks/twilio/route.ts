import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Message } from "@/models/message"
import { processWhatsAppResponse } from "@/lib/twilio"

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    // Parse form data from Twilio
    const formData = await req.formData()

    // Extract relevant fields
    const messageSid = formData.get("MessageSid") as string
    const messageStatus = formData.get("MessageStatus") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const body = formData.get("Body") as string

    console.log("Twilio webhook received:", { messageSid, messageStatus, from, to, body })

    // If this is a status update
    if (messageSid && messageStatus) {
      await Message.findOneAndUpdate({ messageId: messageSid }, { status: messageStatus })
    }

    // If this is a response message
    if (from && body) {
      // Process the response
      const result = await processWhatsAppResponse(from, body)

      // Return a TwiML response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`

      return new NextResponse(twiml, {
        headers: {
          "Content-Type": "text/xml",
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Twilio webhook error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
