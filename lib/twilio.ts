import { Setting } from "@/models/setting"
import { Patient } from "@/models/patient"
import { Message } from "@/models/message"
import twilio from "twilio"

// Function to get Twilio client from settings
export async function getTwilioClient() {
  const settings = await Setting.findOne({}).lean()

  if (!settings || !settings.twilioAccountSid || !settings.twilioAuthToken) {
    throw new Error("Twilio settings not configured")
  }

  return twilio(settings.twilioAccountSid, settings.twilioAuthToken)
}

// Function to format phone number for WhatsApp
export function formatPhoneForWhatsApp(phone: string) {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "")

  // Ensure it has a country code
  if (digits.startsWith("1")) {
    return `+${digits}`
  } else {
    // Default to US if no country code
    return `+1${digits}`
  }
}

// Function to replace template variables
export function replaceTemplateVariables(template: string, data: any) {
  return template
    .replace(/{{patient_name}}/g, data.patientName || "")
    .replace(/{{doctor_name}}/g, data.doctorName || "")
    .replace(/{{appointment_date}}/g, data.appointmentDate || "")
    .replace(/{{clinic_name}}/g, data.clinicName || "")
}

// Function to send WhatsApp message
export async function sendWhatsAppMessage(
  patientId: string,
  templateType: "reminder" | "confirmation" | "followUp",
  userId?: string,
) {
  try {
    // Get settings
    const settings = await Setting.findOne({}).lean()
    if (!settings || !settings.whatsappEnabled || !settings.twilioPhoneNumber) {
      throw new Error("WhatsApp not enabled or configured")
    }

    // Get patient
    const patient = await Patient.findById(patientId).populate("assignedDoctor").populate("clinic").lean()
    if (!patient) {
      throw new Error("Patient not found")
    }

    // Check message attempts limit
    if (patient.messageAttempts >= settings.maxFollowupMessages) {
      throw new Error("Maximum message attempts reached")
    }

    // Get template based on type
    let template = ""
    switch (templateType) {
      case "reminder":
        template = settings.whatsappReminderTemplate
        break
      case "confirmation":
        template = settings.whatsappConfirmationTemplate
        break
      case "followUp":
        template = settings.whatsappFollowUpTemplate
        break
    }

    // Format appointment date if exists
    let formattedAppointmentDate = ""
    if (patient.appointmentDate) {
      const date = new Date(patient.appointmentDate)
      formattedAppointmentDate = date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    }

    // Replace template variables
    const messageContent = replaceTemplateVariables(template, {
      patientName: patient.name,
      doctorName: patient.assignedDoctor?.name || "your doctor",
      appointmentDate: formattedAppointmentDate,
      clinicName: patient.clinic?.name || "our clinic",
    })

    // Format phone number
    const to = formatPhoneForWhatsApp(patient.phone)

    // Get Twilio client
    const client = await getTwilioClient()

    // Send message
    const twilioMessage = await client.messages.create({
      body: messageContent,
      from: `whatsapp:${settings.twilioPhoneNumber}`,
      to: `whatsapp:${to}`,
    })

    // Create message record
    const message = new Message({
      patient: patientId,
      content: messageContent,
      sentBy: userId || null,
      messageId: twilioMessage.sid,
      status: "queued",
      type: templateType,
    })

    await message.save()

    // Update patient
    await Patient.findByIdAndUpdate(patientId, {
      $inc: { messageAttempts: 1 },
      lastMessageDate: new Date(),
    })

    return {
      success: true,
      messageId: twilioMessage.sid,
      message: "Message sent successfully",
    }
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

// Function to process WhatsApp response
export async function processWhatsAppResponse(from: string, body: string, messageId?: string) {
  try {
    // Format phone number to match our database format
    const formattedPhone = from.replace("whatsapp:", "").replace("+", "")

    // Find patient by phone
    const patient = await Patient.findOne({
      phone: { $regex: formattedPhone, $options: "i" },
    })

    if (!patient) {
      console.error("Patient not found for phone:", from)
      return {
        success: false,
        error: "Patient not found",
      }
    }

    // Normalize response
    const normalizedResponse = body.trim().toLowerCase()
    let responseType = ""

    // Determine response type
    if (normalizedResponse.includes("yes") || normalizedResponse.includes("confirm") || normalizedResponse === "1") {
      responseType = "yes"
      // Update patient status to interested or booked
      await Patient.findByIdAndUpdate(patient._id, {
        status: "booked",
        lastResponse: "yes",
        lastResponseDate: new Date(),
      })

      // Send confirmation message
      await sendWhatsAppMessage(patient._id.toString(), "confirmation")
    } else if (
      normalizedResponse.includes("no") ||
      normalizedResponse.includes("cancel") ||
      normalizedResponse === "2"
    ) {
      responseType = "no"
      // Update patient status to not interested
      await Patient.findByIdAndUpdate(patient._id, {
        status: "not_interested",
        lastResponse: "no",
        lastResponseDate: new Date(),
      })
    } else {
      responseType = "other"
      // Update patient status to follow up
      await Patient.findByIdAndUpdate(patient._id, {
        status: "follow_up",
        lastResponse: "other",
        lastResponseDate: new Date(),
      })

      // Schedule a call if call attempts are below limit
      const settings = await Setting.findOne({}).lean()
      if (settings && patient.callAttempts < settings.maxFollowupCalls) {
        // Logic to schedule a call would go here
        // This would integrate with the existing Retell AI call system
      }
    }

    // Update message status if messageId is provided
    if (messageId) {
      await Message.findOneAndUpdate({ messageId }, { status: "read", responseContent: body, responseType })
    }

    return {
      success: true,
      responseType,
      patientId: patient._id,
    }
  } catch (error: any) {
    console.error("Error processing WhatsApp response:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}
