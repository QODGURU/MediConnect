import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Setting } from "@/models/setting"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    let settings = await Setting.findOne({}).lean()

    if (!settings) {
      settings = {
        callStartTime: "09:00",
        callEndTime: "17:00",
        maxCallsPerDay: 50,
        retellApiKey: "",
      }
    }

    // Don't expose the full API key in the response
    if (settings.retellApiKey) {
      settings.retellApiKey =
        settings.retellApiKey.substring(0, 8) +
        "..." +
        (settings.retellApiKey.length > 16 ? settings.retellApiKey.substring(settings.retellApiKey.length - 4) : "")
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    await connectToDatabase()

    // Validate input
    if (!data.callStartTime || !data.callEndTime || !data.maxCallsPerDay || !data.retellApiKey) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Find existing settings or create new
    let settings = await Setting.findOne({})

    if (settings) {
      settings.callStartTime = data.callStartTime
      settings.callEndTime = data.callEndTime
      settings.maxCallsPerDay = data.maxCallsPerDay
      settings.retellApiKey = data.retellApiKey
      settings.updatedBy = session.user.id
      settings.updatedAt = new Date()
      await settings.save()
    } else {
      settings = new Setting({
        callStartTime: data.callStartTime,
        callEndTime: data.callEndTime,
        maxCallsPerDay: data.maxCallsPerDay,
        retellApiKey: data.retellApiKey,
        updatedBy: session.user.id,
      })
      await settings.save()
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
