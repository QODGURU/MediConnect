import mongoose from "mongoose"

const MessageSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["queued", "sent", "delivered", "read", "failed"],
    default: "queued",
  },
  messageType: {
    type: String,
    enum: ["whatsapp", "sms"],
    default: "whatsapp",
  },
  twilioMessageId: {
    type: String,
    required: false,
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  isFollowup: {
    type: Boolean,
    default: false,
  },
  followupAttempt: {
    type: Number,
    default: 0,
  },
  responseContent: {
    type: String,
    default: null,
  },
  responseType: {
    type: String,
    enum: ["yes", "no", "other", null],
    default: null,
  },
  responseDate: {
    type: Date,
    default: null,
  },
})

export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema)
