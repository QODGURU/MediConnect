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

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const clinic = searchParams.get("clinic")

    // Build query based on parameters
    const query: any = { role: "doctor" }

    if (clinic) {
      query.clinic = clinic
    }

    // Find doctors but don't return passwords
    const doctors = await User.find(query, { password: 0 }).lean()

    return NextResponse.json(doctors)
  } catch (error) {
    console.error("Error fetching doctors:", error)
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 })
  }
}
