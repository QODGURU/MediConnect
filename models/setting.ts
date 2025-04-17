import mongoose from "mongoose"

const SettingSchema = new mongoose.Schema({
  // Call settings
  callStartTime: {
    type: String,
    default: "09:00", // 9 AM
  },
  callEndTime: {
    type: String,
    default: "17:00", // 5 PM
  },
  maxCallsPerDay: {
    type: Number,
    default: 50,
  },
  retellApiKey: {
    type: String,
    required: true,
  },

  // Message settings
  twilioAccountSid: {
    type: String,
    required: false,
  },
  twilioAuthToken: {
    type: String,
    required: false,
  },
  twilioPhoneNumber: {
    type: String,
    required: false,
  },
  whatsappEnabled: {
    type: Boolean,
    default: false,
  },
  whatsappBeforeCall: {
    type: Boolean,
    default: true,
  },
  whatsappReminderTemplate: {
    type: String,
    default:
      "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply YES to confirm or NO to cancel.",
  },
  whatsappConfirmationTemplate: {
    type: String,
    default:
      "Thank you for confirming your appointment with Dr. {{doctor_name}} on {{appointment_date}}. We look forward to seeing you!",
  },
  whatsappFollowUpTemplate: {
    type: String,
    default:
      "Hello {{patient_name}}, we noticed you haven't confirmed your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply YES to confirm or NO to cancel.",
  },

  // Follow-up settings
  sendMessageBeforeCall: {
    type: Boolean,
    default: true,
  },
  messageTemplate: {
    type: String,
    default:
      "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply to confirm.",
  },
  maxFollowupCalls: {
    type: Number,
    default: 3,
  },
  maxFollowupMessages: {
    type: Number,
    default: 2,
  },
  daysBeforeFollowup: {
    type: Number,
    default: 1,
  },

  // General settings
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // Clinic-specific settings
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: false,
  },
})

export const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema)
