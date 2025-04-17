import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    // Build query based on user role and filters
    const query: any = {}

    if (session.user.role !== "admin") {
      query.addedBy = session.user.id
    }

    if (status) {
      query.status = status
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    const patients = await Patient.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Add a limit for performance
      .populate("addedBy", "name")
      .lean()

    return NextResponse.json(patients)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    await connectToDatabase()

    // Validate required fields
    if (!data.name || !data.phone || !data.appointmentDate || !data.callScript) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newPatient = new Patient({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      appointmentDate: new Date(data.appointmentDate),
      callScript: data.callScript,
      addedBy: session.user.id,
      status: "pending",
    })

    await newPatient.save()

    return NextResponse.json({ success: true, patient: newPatient })
  } catch (error) {
    console.error("Error adding patient:", error)
    return NextResponse.json({ error: "Failed to add patient" }, { status: 500 })
  }
}
