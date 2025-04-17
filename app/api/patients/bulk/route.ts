import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    await connectToDatabase()

    if (!Array.isArray(data.patients) || data.patients.length === 0) {
      return NextResponse.json({ error: "No patients provided" }, { status: 400 })
    }

    const defaultCallScript = data.defaultCallScript || "Hello, this is a reminder about your upcoming appointment."

    // Validate and prepare patients for insertion
    const patientsToInsert = data.patients.map((patient: any) => ({
      name: patient.name,
      phone: patient.phone,
      email: patient.email || "",
      appointmentDate: new Date(patient.appointmentDate),
      callScript: patient.callScript || defaultCallScript,
      addedBy: session.user.id,
      status: "pending",
      createdAt: new Date(),
    }))

    // Insert all patients
    const result = await Patient.insertMany(patientsToInsert)

    return NextResponse.json({
      success: true,
      count: result.length,
      message: `Successfully added ${result.length} patients`,
    })
  } catch (error) {
    console.error("Error adding bulk patients:", error)
    return NextResponse.json(
      {
        error: "Failed to add patients",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
