"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Phone, CheckCircle2, Play, Loader2, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { notifications } from "@/lib/notifications"
import { DEFAULT_APPOINTMENT_REMINDER } from "@/lib/script-templates"

export function RetellTest() {
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("+12567829484") // Default to the provided number
  const [fromNumber, setFromNumber] = useState("")
  const [patientName, setPatientName] = useState("Test Patient")
  const [doctorName, setDoctorName] = useState("Dr. Smith")
  const [script, setScript] = useState(DEFAULT_APPOINTMENT_REMINDER)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)
    setRecordingUrl(null)
    setCallStatus(null)
    setIsPolling(false)

    if (!phoneNumber) {
      setError("Phone number is required")
      setLoading(false)
      return
    }

    if (!script) {
      setError("Script is required")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/retell/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          fromNumber: fromNumber || undefined, // Only include if provided
          script,
          patientName,
          doctorName,
          appointmentDate: "tomorrow at 2 PM",
          appointmentReason: "your annual check-up",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to make test call")
      }

      setResult(data)
      setCallStatus(data.status)
      notifications.success(`Test call initiated successfully! Call ID: ${data.callId}`)

      // Poll for call status and recording URL
      if (data.callId) {
        setIsPolling(true)
        pollForCallStatus(data.callId)
      }
    } catch (error: any) {
      setError(error.message || "An unknown error occurred")
      notifications.error("Error", error.message || "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Function to poll for call status and get recording URL
  const pollForCallStatus = async (callId: string) => {
    try {
      // Wait 5 seconds before first poll
      await new Promise((resolve) => setTimeout(resolve, 5000))

      let attempts = 0
      const maxAttempts = 24 // Poll for up to 2 minutes (24 * 5 seconds)

      const checkStatus = async () => {
        attempts++

        const response = await fetch(`/api/retell/call-status?callId=${callId}`)
        const data = await response.json()

        setCallStatus(data.status)

        if (data.recordingUrl) {
          setRecordingUrl(data.recordingUrl)
          setIsPolling(false)
          return true
        }

        if (data.status === "completed" || data.status === "failed" || data.status === "no_answer") {
          // Call is finished but no recording yet, try one more time
          await new Promise((resolve) => setTimeout(resolve, 5000))
          const finalCheck = await fetch(`/api/retell/call-status?callId=${callId}`)
          const finalData = await finalCheck.json()

          if (finalData.recordingUrl) {
            setRecordingUrl(finalData.recordingUrl)
          }
          setIsPolling(false)
          return true
        }

        if (attempts >= maxAttempts) {
          setIsPolling(false)
          return true
        }

        // Continue polling
        setTimeout(checkStatus, 5000)
        return false
      }

      await checkStatus()
    } catch (error) {
      console.error("Error polling for call status:", error)
      setIsPolling(false)
    }
  }

  return (
    <Card className="bg-white border-blue-200 shadow-lg">
      <CardHeader className="bg-blue-700 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold">Test Retell AI Integration</CardTitle>
        <CardDescription className="text-blue-100">
          Send a test call to verify your Retell AI integration is working correctly.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <p className="font-medium">Important: Variable Format</p>
            <p className="mt-1">
              Make sure your script uses variables in the format {"{variable_name}"}, such as {"{patient_name}"} and{" "}
              {"{appointment_date}"}. These will be replaced with actual values during the call.
            </p>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive" className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Test call initiated successfully!
              <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                Call ID: {result.callId}
                <br />
                Status: {callStatus || result.status}{" "}
                {isPolling && <Loader2 className="inline-block h-3 w-3 animate-spin ml-1" />}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {recordingUrl && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center">
              <Play className="h-4 w-4 mr-2 text-blue-600" />
              Call Recording
            </h4>
            <audio controls className="w-full" src={recordingUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber" className="text-blue-800 font-medium">
              To Phone Number
            </Label>
            <Input
              id="phoneNumber"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
            />
            <p className="text-xs text-gray-500">Enter the full phone number with country code (e.g., +1 for US)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromNumber" className="text-blue-800 font-medium">
              From Phone Number (Optional)
            </Label>
            <Input
              id="fromNumber"
              placeholder="+1234567890"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
              className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
            />
            <p className="text-xs text-gray-500">
              If you don't have a phone number in your Retell account, specify a number here
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patientName" className="text-blue-800 font-medium">
                Patient Name
              </Label>
              <Input
                id="patientName"
                placeholder="Test Patient"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorName" className="text-blue-800 font-medium">
                Doctor Name
              </Label>
              <Input
                id="doctorName"
                placeholder="Dr. Smith"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="script" className="text-blue-800 font-medium">
              Test Script
            </Label>
            <Textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="min-h-[150px] border-blue-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
              required
            />
            <p className="text-xs text-gray-500">
              Use variables like {"{patient_name}"}, {"{doctor_name}"}, {"{appointment_date}"}, etc. in your script.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end bg-gray-50 p-4 rounded-b-lg border-t border-blue-100">
        <Button
          onClick={handleSubmit}
          disabled={loading || isPolling}
          className="bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center"
        >
          {loading || isPolling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {loading ? "Sending..." : "Monitoring Call..."}
            </>
          ) : (
            <>
              <Phone className="mr-2 h-4 w-4" />
              Send Test Call
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
