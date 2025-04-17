import mongoose from "mongoose"

// Make sure all models are imported here to ensure they're registered before use
import "../models/user"
import "../models/patient"
import "../models/clinic"
import "../models/call"
import "../models/message"
import "../models/setting"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    console.log("Connecting to MongoDB...")
    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log("Connected to MongoDB successfully")
        return mongoose
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err)
        throw err
      })
  }

  try {
    cached.conn = await cached.promise
    return cached.conn
  } catch (e) {
    cached.promise = null
    throw e
  }
}
