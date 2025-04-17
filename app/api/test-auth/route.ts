import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    await connectToDatabase()

    // Check if admin user exists
    const adminUser = await User.findOne({ email: "admin@example.com" })

    if (!adminUser) {
      // Create admin user if it doesn't exist
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      const newAdmin = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      })

      await newAdmin.save()

      return NextResponse.json({
        success: true,
        message: "Admin user created successfully",
        passwordHash: hashedPassword,
      })
    }

    // Test password match
    const testPassword = "admin123"
    const passwordMatch = await bcrypt.compare(testPassword, adminUser.password)

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      adminExists: true,
      passwordMatch: passwordMatch,
      passwordHash: adminUser.password,
    })
  } catch (error: any) {
    console.error("Error testing auth:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test auth",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
