import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { Call } from "@/models/call"
import { Patient } from "@/models/patient"
import { analyzePatientResponse } from "@/lib/followup-system"

// This endpoint would be called by Retell AI when a call is completed
export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Validate webhook signature (in a real implementation)
    // const signature = req.headers.get('x-retell-signature');
    // validateSignature(signature, data);

    await connectToDatabase()

    // Update call status
    const call = await Call.findOne({ retellCallId: data.callId })

    if (!call) {
      return NextResponse.json({ success: false, error: "Call not found" }, { status: 404 })
    }

    call.status = data.status
    call.duration = data.duration || 0
    call.notes = data.transcript || ""

    // Save recording URL if available
    if (data.recording_url) {
      call.recordingUrl = data.recording_url
    }

    await call.save()

    // Update patient status based on call outcome
    const patient = await Patient.findById(call.patient)

    if (patient) {
      if (data.status === "completed" && data.transcript) {
        // Use AI to analyze the patient's response
        const analysis = await analyzePatientResponse(patient._id, data.transcript)

        // Status is already updated by the analysis function
        console.log(`AI analysis for patient ${patient._id}: ${analysis.status} - ${analysis.statusReason}`)
      } else if (data.status === "no_answer") {
        patient.status = "not_answered"
        await patient.save()
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing Retell webhook:", error)
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 })
  }
}
