import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get clinic ID from query parameters
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get("clinic")

    if (!clinicId) {
      return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 })
    }

    // Find doctors for the specified clinic
    const doctors = await User.find({ role: "doctor", clinic: clinicId }, { password: 0 }).lean()

    return NextResponse.json(doctors)
  } catch (error) {
    console.error("Error fetching doctors by clinic:", error)
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
  }
}
