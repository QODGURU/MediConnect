import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "doctor", "clinic"],
    required: true,
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: function () {
      return this.role === "doctor" || this.role === "clinic"
    },
  },
  specialty: {
    type: String,
    required: false,
  },
  clinicLocation: {
    type: String,
    required: false,
  },
  workingDays: {
    type: [String],
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    required: false,
  },
  workingHours: {
    start: {
      type: String,
      required: false,
    },
    end: {
      type: String,
      required: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
})

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

export const User = mongoose.models.User || mongoose.model("User", UserSchema)
