import Retell from "retell-sdk"
import { getSystemPrompt } from "./script-templates"

// Initialize the Retell client
let retellClient: Retell | null = null

// Function to get or initialize the Retell client
export function getRetellClient(apiKey: string): Retell {
  if (!retellClient || retellClient.apiKey !== apiKey) {
    retellClient = new Retell({
      apiKey,
    })
  }
  return retellClient
}

export interface RetellCallParams {
  phoneNumber: string
  script: string
  callbackUrl?: string
  fromNumber?: string
  // Call variables
  patientName?: string
  appointmentDate?: string
  doctorName?: string
  clinicName?: string
  callerName?: string
  appointmentReason?: string
  clinicPhone?: string
  condition?: string
  lastAppointmentDate?: string
  testType?: string
  testDate?: string
  medicationName?: string
  // Additional variables can be added as needed
  [key: string]: any
}

export interface RetellCallResponse {
  callId: string
  status: string
}

// Schedule a call using the Retell SDK
export async function scheduleRetellCall(apiKey: string, params: RetellCallParams): Promise<RetellCallResponse> {
  try {
    const client = getRetellClient(apiKey)

    // Determine the from number
    let fromNumber = params.fromNumber

    // If no fromNumber is provided, try to get one from the account
    if (!fromNumber) {
      try {
        const phoneNumbersResponse = await client.phoneNumber.list()
        if (phoneNumbersResponse.data && phoneNumbersResponse.data.length > 0) {
          fromNumber = phoneNumbersResponse.data[0].phone_number
        }
      } catch (error) {
        console.error("Error fetching phone numbers:", error)
        throw new Error(
          "Failed to fetch phone numbers from your Retell account. Please provide a fromNumber parameter.",
        )
      }

      if (!fromNumber) {
        throw new Error(
          "No phone numbers available in your Retell account. Please purchase a number from Retell or provide a fromNumber parameter.",
        )
      }
    }

    // Extract variables from params
    const {
      phoneNumber,
      script,
      callbackUrl,
      patientName = "Patient",
      appointmentDate = "your upcoming appointment",
      doctorName = "your doctor",
      clinicName = "Medical Clinic", // We'll keep this for internal reference but not use it in the script
      appointmentReason = "your appointment",
      clinicPhone = "our main office number",
      condition = "your condition",
      lastAppointmentDate = "your last visit",
      testType = "your recent tests",
      testDate = "recently",
      medicationName = "your medication",
      ...otherVariables
    } = params

    // Create dynamic variables for the call script
    const dynamicVariables: Record<string, string> = {
      patient_name: patientName,
      appointment_date: appointmentDate,
      doctor_name: doctorName,
      clinic_name: clinicName, // Keep this for any templates that might still use it
      caller_name: "Mayra", // Always set this to Mayra regardless of input
      appointment_reason: appointmentReason,
      clinic_phone: clinicPhone,
      condition: condition,
      last_appointment_date: lastAppointmentDate,
      test_type: testType,
      test_date: testDate,
      medication_name: medicationName,
      ...otherVariables,
    }

    console.log("Creating call with variables:", dynamicVariables)
    console.log("Script template:", script)

    // Create the phone call with proper configuration
    const response = await client.call.createPhoneCall({
      from_number: fromNumber,
      to_number: phoneNumber,
      llm: {
        provider: "openai",
        model: "gpt-4",
        temperature: 0.7,
        system_prompt: getSystemPrompt(),
      },
      agent_config: {
        voice_id: "eleven_labs:premade:josh", // Using a clear, professional voice
        first_response: `Hello, this is Mayra. Is this {{patient_name}}?`, // Updated to just use Mayra
        interruption_threshold: 0.8, // Allow for some interruptions
        end_call_after_silence: 5, // End call after 5 seconds of silence
      },
      webhook_url: callbackUrl, // Set the webhook URL directly

      // Include the script and variables in metadata
      metadata: {
        script: script,
        variables: dynamicVariables,
      },

      // This is the key parameter for dynamic variable substitution
      retell_llm_dynamic_variables: dynamicVariables,
    })

    console.log("Retell call initiated:", response)

    return {
      callId: response.call_id,
      status: response.call_status,
    }
  } catch (error: any) {
    console.error("Error scheduling call with Retell:", error)

    // Enhanced error handling
    if (error.response) {
      console.error("Retell API error response:", {
        status: error.response.status,
        data: error.response.data,
      })

      throw new Error(
        error.response.data?.message || error.response.data?.error || `Retell API error: ${error.response.status}`,
      )
    } else if (error.request) {
      console.error("No response received from Retell API")
      throw new Error("No response received from Retell API. Please check your internet connection.")
    } else {
      throw error // Throw the original error to preserve the message
    }
  }
}

// Get call status using the Retell SDK
export async function getRetellCallStatus(
  apiKey: string,
  callId: string,
): Promise<{
  status: string
  duration?: number
  transcript?: string
  recordingUrl?: string
  metadata?: any
}> {
  try {
    const client = getRetellClient(apiKey)

    const response = await client.call.retrieve(callId)

    return {
      status: response.call_status,
      duration:
        response.end_timestamp && response.start_timestamp
          ? Math.floor((response.end_timestamp - response.start_timestamp) / 1000)
          : undefined,
      transcript: response.transcript,
      recordingUrl: response.recording_url,
      metadata: response.metadata, // Include metadata in the response
    }
  } catch (error: any) {
    console.error("Error getting call status from Retell:", error)

    if (error.response) {
      throw new Error(
        error.response.data?.message || error.response.data?.error || `Retell API error: ${error.response.status}`,
      )
    } else if (error.request) {
      throw new Error("No response received from Retell API. Please check your internet connection.")
    } else {
      throw new Error(`Error setting up Retell API request: ${error.message}`)
    }
  }
}

// Validate Retell API key
export async function validateRetellApiKey(apiKey: string): Promise<boolean> {
  try {
    if (!apiKey || apiKey.trim() === "") {
      return false
    }

    const client = getRetellClient(apiKey)

    // Try to list phone numbers to validate the API key
    await client.phoneNumber.list()

    // If we get here, the API key is valid
    return true
  } catch (error: any) {
    console.error("Error validating Retell API key:", error)

    // If we get a 401 or 403, the key is invalid
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return false
    }

    // For other errors, we'll assume the key might be valid but there's a network issue
    throw new Error("Could not validate API key. Please check your internet connection.")
  }
}
