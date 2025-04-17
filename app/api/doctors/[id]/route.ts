import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const doctor = await User.findById(params.id).lean()

    if (!doctor || doctor.role !== "doctor") {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    // Don't send password
    const { password, ...doctorData } = doctor

    return NextResponse.json(doctorData)
  } catch (error) {
    console.error("Error fetching doctor:", error)
    return NextResponse.json({ error: "Failed to fetch doctor" }, { status: 500 })
  }
}
