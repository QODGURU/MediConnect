"use server"

import { revalidatePath } from "next/cache"
import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { User } from "@/models/user"
import { Call } from "@/models/call"
import { Setting } from "@/models/setting"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { Clinic } from "@/models/clinic"

// Patient actions
export async function addPatient(data: {
  name: string
  phone: string
  email?: string
  gender?: string
  dateOfBirth?: string
  appointmentDate: string
  preferredCallTime?: string
  preferredCallDay?: string
  treatment?: string
  callScript: string
  clinicLocation?: string
  notes?: string
  assignedDoctor?: string
  clinic?: string
  age?: string
  medicalHistory?: string
  allergies?: string
  medications?: string
  insuranceProvider?: string
  insuranceNumber?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  referralSource?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  await connectToDatabase()

  const newPatient = new Patient({
    name: data.name,
    phone: data.phone,
    email: data.email,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    appointmentDate: new Date(data.appointmentDate),
    preferredCallTime: data.preferredCallTime,
    preferredCallDay: data.preferredCallDay,
    treatment: data.treatment,
    callScript: data.callScript,
    clinicLocation: data.clinicLocation,
    notes: data.notes,
    assignedDoctor: data.assignedDoctor || null,
    clinic: data.clinic || null,
    addedBy: user.id,
    status: "pending",
    age: data.age ? Number.parseInt(data.age) : undefined,
    medicalHistory: data.medicalHistory,
    allergies: data.allergies,
    medications: data.medications,
    insuranceProvider: data.insuranceProvider,
    insuranceNumber: data.insuranceNumber,
    emergencyContactName: data.emergencyContactName,
    emergencyContactPhone: data.emergencyContactPhone,
    referralSource: data.referralSource,
    followupAttempts: {
      calls: 0,
      messages: 0,
    },
  })

  await newPatient.save()
  revalidatePath("/patients")
  return { success: true }
}

export async function updatePatient(
  id: string,
  data: {
    name: string
    phone: string
    email: string
    appointmentDate: string
    callScript: string
    status: string
  },
) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  await connectToDatabase()

  await Patient.findByIdAndUpdate(id, {
    name: data.name,
    phone: data.phone,
    email: data.email,
    appointmentDate: new Date(data.appointmentDate),
    callScript: data.callScript,
    status: data.status,
  })

  revalidatePath("/patients")
  revalidatePath(`/patients/${id}`)
  return { success: true }
}

export async function deletePatient(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")

  await connectToDatabase()

  await Patient.findByIdAndDelete(id)
  await Call.deleteMany({ patient: id })

  revalidatePath("/patients")
  return { success: true }
}

// Doctor actions (admin only)
export async function addDoctor(data: {
  name: string
  email: string
  password: string
  clinic?: string // Make clinic optional in the type but we'll require it
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  const existingUser = await User.findOne({ email: data.email })
  if (existingUser) throw new Error("Email already in use")

  // Validate clinic
  if (!data.clinic) {
    throw new Error("Clinic is required")
  }

  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(data.password, salt)

  const newDoctor = new User({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    role: "doctor",
    clinic: data.clinic, // Add clinic to the doctor
  })

  await newDoctor.save()
  revalidatePath("/doctors")
  return { success: true }
}

export async function updateDoctor(
  id: string,
  data: {
    name: string
    email: string
    password?: string
  },
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  const updateData: any = {
    name: data.name,
    email: data.email,
  }

  if (data.password) {
    const salt = await bcrypt.genSalt(10)
    updateData.password = await bcrypt.hash(data.password, salt)
  }

  await User.findByIdAndUpdate(id, updateData)
  revalidatePath("/doctors")
  revalidatePath(`/doctors/${id}`)
  return { success: true }
}

export async function deleteDoctor(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  // Reassign patients to admin
  await Patient.updateMany({ addedBy: id }, { addedBy: user.id })
  await User.findByIdAndDelete(id)

  revalidatePath("/doctors")
  return { success: true }
}

// Clinic actions (admin only)
export async function addClinic(data: {
  name: string
  email: string
  phone: string
  address?: string
  website?: string
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  const existingClinic = await Clinic.findOne({ email: data.email })
  if (existingClinic) throw new Error("Email already in use")

  const newClinic = new Clinic({
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    website: data.website,
  })

  await newClinic.save()
  revalidatePath("/clinics")
  return { success: true }
}

export async function updateClinic(
  id: string,
  data: {
    name: string
    email: string
    phone: string
    address?: string
    website?: string
  },
) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  await Clinic.findByIdAndUpdate(id, {
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    website: data.website,
  })

  revalidatePath("/clinics")
  revalidatePath(`/clinics/${id}`)
  return { success: true }
}

export async function deleteClinic(id: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  // Reassign doctors and patients to admin
  await User.updateMany({ clinic: id }, { clinic: null })
  await Patient.updateMany({ clinic: id }, { clinic: null })
  await Clinic.findByIdAndDelete(id)

  revalidatePath("/clinics")
  return { success: true }
}

// Settings actions (admin only)
export async function updateSettings(data: {
  callStartTime: string
  callEndTime: string
  maxCallsPerDay: number
  retellApiKey: string
}) {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  // Find existing settings or create new
  let settings = await Setting.findOne({})

  if (settings) {
    settings.callStartTime = data.callStartTime
    settings.callEndTime = data.callEndTime
    settings.maxCallsPerDay = data.maxCallsPerDay
    settings.retellApiKey = data.retellApiKey
    settings.updatedBy = user.id
    settings.updatedAt = new Date()
    await settings.save()
  } else {
    settings = new Setting({
      callStartTime: data.callStartTime,
      callEndTime: data.callEndTime,
      maxCallsPerDay: data.maxCallsPerDay,
      retellApiKey: data.retellApiKey,
      updatedBy: user.id,
    })
    await settings.save()
  }

  revalidatePath("/settings")
  return { success: true }
}

// Retell AI integration
export async function scheduleRetellCalls() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") throw new Error("Unauthorized")

  await connectToDatabase()

  // Get settings
  const settings = await Setting.findOne({})
  if (!settings || !settings.retellApiKey) {
    throw new Error("Retell API key not configured")
  }

  // Get patients to call (pending status and appointment date is tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfterTomorrow = new Date(tomorrow)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

  const patients = await Patient.find({
    status: "pending",
    appointmentDate: {
      $gte: tomorrow,
      $lt: dayAfterTomorrow,
    },
  }).limit(settings.maxCallsPerDay)

  // Schedule calls using Retell API (simplified for this example)
  // In a real implementation, you would integrate with Retell's API
  for (const patient of patients) {
    // Create a call record
    const call = new Call({
      patient: patient._id,
      callTime: new Date(),
      status: "scheduled",
    })

    await call.save()

    // Update patient status
    patient.status = "called"
    await patient.save()
  }

  revalidatePath("/dashboard")
  return { success: true, scheduledCalls: patients.length }
}

// Update call status (would be called by a webhook from Retell in real implementation)
export async function updateCallStatus(
  callId: string,
  status: "completed" | "failed" | "no_answer",
  duration?: number,
) {
  await connectToDatabase()

  const call = await Call.findById(callId)
  if (!call) throw new Error("Call not found")

  call.status = status
  if (duration) call.duration = duration
  await call.save()

  // Update patient status based on call outcome
  const patient = await Patient.findById(call.patient)
  if (patient) {
    if (status === "completed") {
      patient.status = "follow_up"
    } else if (status === "no_answer") {
      patient.status = "not_answered"
    }
    await patient.save()
  }

  revalidatePath("/dashboard")
  revalidatePath("/follow-ups")
  revalidatePath("/cold-leads")
  return { success: true }
}
