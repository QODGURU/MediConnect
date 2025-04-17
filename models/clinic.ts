import mongoose from "mongoose"

const ClinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  website: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Check if the model exists before creating it to prevent the "Schema hasn't been registered" error
export const Clinic = mongoose.models.Clinic || mongoose.model("Clinic", ClinicSchema)
