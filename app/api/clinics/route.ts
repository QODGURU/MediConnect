// Create a new API route to fetch clinics
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Clinic } from "@/models/clinic"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const clinics = await Clinic.find({}).sort({ name: 1 }).lean()

    return NextResponse.json(clinics)
  } catch (error) {
    console.error("Error fetching clinics:", error)
    return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 })
  }
}
