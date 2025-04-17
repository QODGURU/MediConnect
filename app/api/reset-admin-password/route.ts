import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    await connectToDatabase()

    // Create a new hashed password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash("admin123", salt)

    // Find admin user and update password
    const result = await User.updateOne({ email: "admin@example.com" }, { $set: { password: hashedPassword } })

    if (result.matchedCount === 0) {
      // Create admin user if it doesn't exist
      const newAdmin = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      })

      await newAdmin.save()

      return NextResponse.json({
        success: true,
        message: "Admin user created with password: admin123",
        passwordHash: hashedPassword,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Admin password reset to: admin123",
      passwordHash: hashedPassword,
      result,
    })
  } catch (error: any) {
    console.error("Error resetting admin password:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset admin password",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
