import mongoose from "mongoose"

const PatientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  age: {
    type: Number,
    required: false,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: false,
  },
  dateOfBirth: {
    type: Date,
    required: false,
  },
  callScript: {
    type: String,
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  preferredCallTime: {
    type: String,
    required: false,
  },
  preferredCallDay: {
    type: String,
    enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    required: false,
  },
  treatment: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: [
      "pending",
      "called",
      "not_answered",
      "follow_up",
      "interested",
      "not_interested",
      "booked",
      "wrong_number",
      "busy",
      "call_back",
    ],
    default: "pending",
  },
  statusReason: {
    type: String,
    required: false,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: false,
  },
  clinicLocation: {
    type: String,
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  followupAttempts: {
    calls: {
      type: Number,
      default: 0,
    },
    messages: {
      type: Number,
      default: 0,
    },
  },
  aiNotes: {
    type: String,
    required: false,
  },
  // New fields
  medicalHistory: {
    type: String,
    required: false,
  },
  allergies: {
    type: String,
    required: false,
  },
  medications: {
    type: String,
    required: false,
  },
  insuranceProvider: {
    type: String,
    required: false,
  },
  insuranceNumber: {
    type: String,
    required: false,
  },
  emergencyContactName: {
    type: String,
    required: false,
  },
  emergencyContactPhone: {
    type: String,
    required: false,
  },
  referralSource: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  messageAttempts: {
    type: Number,
    default: 0,
  },
  callAttempts: {
    type: Number,
    default: 0,
  },
  lastMessageDate: {
    type: Date,
    default: null,
  },
  lastCallDate: {
    type: Date,
    default: null,
  },
  lastResponseDate: {
    type: Date,
    default: null,
  },
  lastResponse: {
    type: String,
    default: null,
  },
})

export const Patient = mongoose.models.Patient || mongoose.model("Patient", PatientSchema)
