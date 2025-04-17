import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"

export async function GET() {
  try {
    await connectToDatabase()

    // Find users but don't return passwords
    const users = await User.find({}, { password: 0 }).lean()

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: users.length,
      users: users,
    })
  } catch (error) {
    console.error("Error connecting to database:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to database",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
