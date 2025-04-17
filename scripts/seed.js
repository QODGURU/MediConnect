import { connectToDatabase } from "../lib/mongodb"
import { User } from "../models/user"
import { Setting } from "../models/setting"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

async function seedDatabase() {
  try {
    console.log("Connecting to database...")
    await connectToDatabase()
    console.log("Connected to database")

    // Check if admin already exists
    const adminExists = await User.findOne({ email: "admin@example.com" })

    if (!adminExists) {
      console.log("Creating admin user...")
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash("admin123", salt)

      console.log("Admin password hash:", hashedPassword) // Add this log to see the hash

      const admin = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      })

      await admin.save()
      console.log("Admin user created")
    } else {
      console.log("Admin user already exists")
    }

    // Create sample doctors if they don't exist
    const sampleDoctors = [
      { name: "Dr. John Smith", email: "john.smith@example.com" },
      { name: "Dr. Sarah Johnson", email: "sarah.johnson@example.com" },
      { name: "Dr. Michael Chen", email: "michael.chen@example.com" },
    ]

    for (const doctor of sampleDoctors) {
      const exists = await User.findOne({ email: doctor.email })

      if (!exists) {
        console.log(`Creating doctor: ${doctor.name}...`)
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash("doctor123", salt)

        const newDoctor = new User({
          name: doctor.name,
          email: doctor.email,
          password: hashedPassword,
          role: "doctor",
        })

        await newDoctor.save()
        console.log(`Doctor ${doctor.name} created`)
      } else {
        console.log(`Doctor ${doctor.name} already exists`)
      }
    }

    // Create default settings if they don't exist
    const settingsExist = await Setting.findOne({})

    if (!settingsExist) {
      console.log("Creating default settings...")
      const settings = new Setting({
        callStartTime: "09:00",
        callEndTime: "17:00",
        maxCallsPerDay: 50,
        retellApiKey: "your_retell_api_key_here", // Replace with actual key in production
      })

      await settings.save()
      console.log("Default settings created")
    } else {
      console.log("Settings already exist")
    }

    console.log("Database seeding completed successfully")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await mongoose.disconnect()
    console.log("Disconnected from database")
  }
}

seedDatabase()
