import { connectToDatabase } from "@/lib/mongodb"
import { Patient } from "@/models/patient"
import { Setting } from "@/models/setting"
import { Call } from "@/models/call"
import { sendWhatsAppMessage } from "@/lib/twilio"
import { scheduleRetellCall } from "@/lib/retell-ai"

// Process follow-ups for patients
export async function processFollowUps() {
  try {
    await connectToDatabase()

    // Get settings
    const settings = await Setting.findOne({})
    if (!settings) {
      throw new Error("Settings not found")
    }

    // Get patients who need follow-up
    const patients = await Patient.find({
      status: { $in: ["pending", "not_answered"] },
      "followupAttempts.calls": { $lt: settings.maxFollowupCalls },
      "followupAttempts.messages": { $lt: settings.maxFollowupMessages },
    })
      .populate("assignedDoctor", "name")
      .lean()

    console.log(`Found ${patients.length} patients for follow-up`)

    for (const patient of patients) {
      // Check if we should send a message first
      if (settings.sendMessageBeforeCall && patient.followupAttempts.messages < settings.maxFollowupMessages) {
        await sendFollowUpMessage(patient, settings)
      }
      // If we've sent messages but no response, or if messages are disabled, make a call
      else if (patient.followupAttempts.calls < settings.maxFollowupCalls) {
        await makeFollowUpCall(patient, settings)
      }
    }

    // Move patients to cold leads if they've exhausted all follow-up attempts
    await Patient.updateMany(
      {
        status: { $in: ["pending", "not_answered"] },
        "followupAttempts.calls": { $gte: settings.maxFollowupCalls },
        "followupAttempts.messages": { $gte: settings.maxFollowupMessages },
      },
      {
        $set: {
          status: "not_answered",
          statusReason: "Max follow-up attempts reached",
        },
      },
    )

    return {
      success: true,
      message: `Processed follow-ups for ${patients.length} patients`,
    }
  } catch (error: any) {
    console.error("Error processing follow-ups:", error)
    return {
      success: false,
      error: error.message || "Failed to process follow-ups",
    }
  }
}

// Send a follow-up message to a patient
async function sendFollowUpMessage(patient: any, settings: any) {
  try {
    // Format appointment date
    const appointmentDate = patient.appointmentDate
      ? new Date(patient.appointmentDate).toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })
      : "your upcoming appointment"

    // Replace variables in the message template
    const messageContent = settings.messageTemplate
      .replace(/{{patient_name}}/g, patient.name)
      .replace(/{{appointment_date}}/g, appointmentDate)
      .replace(/{{doctor_name}}/g, patient.assignedDoctor ? patient.assignedDoctor.name : "your doctor")

    // Send the message
    const result = await sendWhatsAppMessage(
      patient.phone,
      messageContent,
      patient._id.toString(),
      undefined,
      true,
      patient.followupAttempts.messages + 1,
    )

    if (result.success) {
      // Update patient follow-up attempts
      await Patient.findByIdAndUpdate(patient._id, {
        $inc: { "followupAttempts.messages": 1 },
      })

      console.log(`Sent follow-up message to ${patient.name} (${patient.phone})`)
      return true
    } else {
      console.error(`Failed to send follow-up message to ${patient.name}:`, result.error)
      return false
    }
  } catch (error) {
    console.error(`Error sending follow-up message to ${patient.name}:`, error)
    return false
  }
}

// Make a follow-up call to a patient
async function makeFollowUpCall(patient: any, settings: any) {
  try {
    if (!settings.retellApiKey) {
      throw new Error("Retell API key not configured")
    }

    // Format appointment date
    const appointmentDate = patient.appointmentDate
      ? new Date(patient.appointmentDate).toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })
      : "your upcoming appointment"

    // Schedule call with Retell
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/retell-webhook`

    const callResult = await scheduleRetellCall(settings.retellApiKey, {
      phoneNumber: patient.phone,
      script: patient.callScript,
      patientName: patient.name,
      doctorName: patient.assignedDoctor ? patient.assignedDoctor.name : "your doctor",
      appointmentDate,
      callbackUrl: webhookUrl,
    })

    // Create a call record
    const call = new Call({
      patient: patient._id,
      callTime: new Date(),
      status: "scheduled",
      retellCallId: callResult.callId,
      isFollowup: true,
      followupAttempt: patient.followupAttempts.calls + 1,
    })

    await call.save()

    // Update patient follow-up attempts
    await Patient.findByIdAndUpdate(patient._id, {
      $inc: { "followupAttempts.calls": 1 },
      $set: { status: "called" },
    })

    console.log(`Made follow-up call to ${patient.name} (${patient.phone})`)
    return true
  } catch (error) {
    console.error(`Error making follow-up call to ${patient.name}:`, error)
    return false
  }
}

// Analyze patient response using AI
export async function analyzePatientResponse(patientId: string, transcript: string) {
  try {
    await connectToDatabase()

    // Simple keyword-based analysis for now
    // In a real implementation, you would use a more sophisticated AI model
    const lowerTranscript = transcript.toLowerCase()

    let status = "follow_up"
    let statusReason = ""

    if (lowerTranscript.includes("not interested") || lowerTranscript.includes("don't want")) {
      status = "not_interested"
      statusReason = "Patient explicitly declined"
    } else if (lowerTranscript.includes("interested") || lowerTranscript.includes("tell me more")) {
      status = "interested"
      statusReason = "Patient expressed interest"
    } else if (
      lowerTranscript.includes("book") ||
      lowerTranscript.includes("schedule") ||
      lowerTranscript.includes("confirm")
    ) {
      status = "booked"
      statusReason = "Patient confirmed appointment"
    } else if (lowerTranscript.includes("wrong number") || lowerTranscript.includes("wrong person")) {
      status = "wrong_number"
      statusReason = "Wrong number"
    } else if (lowerTranscript.includes("busy") || lowerTranscript.includes("call later")) {
      status = "call_back"
      statusReason = "Patient requested callback"
    }

    // Update patient status and add AI notes
    await Patient.findByIdAndUpdate(patientId, {
      status,
      statusReason,
      aiNotes: `AI analysis: ${statusReason || "No clear intent detected"}\n\nTranscript: ${transcript}`,
    })

    return {
      success: true,
      status,
      statusReason,
    }
  } catch (error: any) {
    console.error("Error analyzing patient response:", error)
    return {
      success: false,
      error: error.message || "Failed to analyze patient response",
    }
  }
}
