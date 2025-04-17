import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Setting } from "@/models/setting"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getRetellCallStatus } from "@/lib/retell-ai"
import { Call } from "@/models/call"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const callId = url.searchParams.get("callId")

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 })
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

    // Get call status from Retell
    const callStatus = await getRetellCallStatus(settings.retellApiKey, callId)

    // Update call in database if it exists
    const call = await Call.findOne({ retellCallId: callId })
    if (call) {
      call.status = callStatus.status
      if (callStatus.duration) call.duration = callStatus.duration
      if (callStatus.transcript) call.notes = callStatus.transcript
      if (callStatus.recordingUrl) call.recordingUrl = callStatus.recordingUrl
      await call.save()
    }

    return NextResponse.json({
      success: true,
      status: callStatus.status,
      duration: callStatus.duration,
      transcript: callStatus.transcript,
      recordingUrl: callStatus.recordingUrl,
    })
  } catch (error: any) {
    console.error("Error getting call status:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to get call status",
        details: error.response?.data || error,
      },
      { status: 500 },
    )
  }
}
