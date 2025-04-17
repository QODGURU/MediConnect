import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import bcrypt from "bcryptjs"

// IMPORTANT: Delete this file after use - it's for troubleshooting only
export async function GET() {
  try {
    await connectToDatabase()

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash("admin123", salt)

    const result = await User.updateOne({ email: "admin@example.com" }, { $set: { password: hashedPassword } })

    return NextResponse.json({
      success: true,
      message: "Admin password reset",
      result,
    })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset password",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
