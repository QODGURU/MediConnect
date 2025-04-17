import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import { Setting } from "@/models/setting"
import bcrypt from "bcryptjs"

// This route should be protected or removed in production
export async function GET() {
  try {
    await connectToDatabase()

    // Create admin user if it doesn't exist
    const adminExists = await User.findOne({ email: "admin@example.com" })

    if (!adminExists) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      const admin = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      })

      await admin.save()
    }

    // Create sample doctors
    const sampleDoctors = [
      { name: "Dr. John Smith", email: "john.smith@example.com" },
      { name: "Dr. Sarah Johnson", email: "sarah.johnson@example.com" },
      { name: "Dr. Michael Chen", email: "michael.chen@example.com" },
    ]

    for (const doctor of sampleDoctors) {
      const exists = await User.findOne({ email: doctor.email })

      if (!exists) {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash("doctor123", salt)

        const newDoctor = new User({
          name: doctor.name,
          email: doctor.email,
          password: hashedPassword,
          role: "doctor",
        })

        await newDoctor.save()
      }
    }

    // Create default settings
    const settingsExist = await Setting.findOne({})

    if (!settingsExist) {
      const settings = new Setting({
        callStartTime: "09:00",
        callEndTime: "17:00",
        maxCallsPerDay: 50,
        retellApiKey: "your_retell_api_key_here", // Replace with actual key in production
      })

      await settings.save()
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      credentials: {
        admin: { email: "admin@example.com", password: "admin123" },
        doctor: { email: "john.smith@example.com", password: "doctor123" },
      },
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ success: false, error: "Failed to seed database" }, { status: 500 })
  }
}
