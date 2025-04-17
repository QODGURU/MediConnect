import mongoose from "mongoose"

const CallSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  callTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "failed", "no_answer"],
    default: "scheduled",
  },
  duration: {
    type: Number,
    default: 0,
  },
  retellCallId: {
    type: String,
  },
  notes: {
    type: String,
  },
  recordingUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const Call = mongoose.models.Call || mongoose.model("Call", CallSchema)
