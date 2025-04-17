"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, FileSpreadsheet, Upload, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Papa from "papaparse"

export default function BulkImportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [csvData, setCsvData] = useState<any[]>([])
  const [manualData, setManualData] = useState("")
  const [defaultCallScript, setDefaultCallScript] = useState(
    "Hello {{patient_name}}, this is a reminder about your upcoming appointment at our clinic. Your appointment is scheduled for {{appointment_date}} with Dr. {{doctor_name}}. Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please call our office. Thank you!",
  )
  const [activeTab, setActiveTab] = useState("csv")
  const [error, setError] = useState("")
  const [previewData, setPreviewData] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("")
    const file = e.target.files?.[0]
    if (!file) return

    setFile(file)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          setError(`CSV parsing error: ${results.errors[0].message}`)
          return
        }

        // Validate required fields
        const data = results.data as any[]
        const missingFields = []

        if (!data[0]?.name) missingFields.push("name")
        if (!data[0]?.phone) missingFields.push("phone")
        if (!data[0]?.appointmentDate) missingFields.push("appointmentDate")

        if (missingFields.length > 0) {
          setError(`CSV is missing required fields: ${missingFields.join(", ")}`)
          return
        }

        setCsvData(data)
        setPreviewData(data.slice(0, 5)) // Preview first 5 rows
      },
      error: (error) => {
        setError(`Failed to parse CSV: ${error.message}`)
      },
    })
  }

  const handleManualDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setManualData(e.target.value)

    try {
      // Try to parse as JSON
      if (e.target.value.trim()) {
        const parsed = JSON.parse(e.target.value)
        if (Array.isArray(parsed)) {
          setPreviewData(parsed.slice(0, 5))
        }
      } else {
        setPreviewData([])
      }
      setError("")
    } catch (err) {
      setPreviewData([])
      // Don't show error while typing
    }
  }

  const parseManualData = () => {
    try {
      const parsed = JSON.parse(manualData)
      if (!Array.isArray(parsed)) {
        throw new Error("Data must be an array of patients")
      }

      // Validate required fields
      const missingFields = []
      if (parsed.length > 0) {
        if (!parsed[0]?.name) missingFields.push("name")
        if (!parsed[0]?.phone) missingFields.push("phone")
        if (!parsed[0]?.appointmentDate) missingFields.push("appointmentDate")

        if (missingFields.length > 0) {
          throw new Error(`Data is missing required fields: ${missingFields.join(", ")}`)
        }
      }

      return parsed
    } catch (error: any) {
      setError(error.message)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    let patientsToImport = []

    if (activeTab === "csv") {
      if (csvData.length === 0) {
        setError("Please upload a CSV file first")
        return
      }
      patientsToImport = csvData
    } else {
      const parsed = parseManualData()
      if (!parsed) return
      patientsToImport = parsed
    }

    if (patientsToImport.length === 0) {
      setError("No patients to import")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/patients/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patients: patientsToImport,
          defaultCallScript,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to import patients")
      }

      toast({
        title: "Success",
        description: `Successfully imported ${data.count} patients`,
      })

      router.push("/patients")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "An unknown error occurred")
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        age: "35",
        gender: "male",
        dateOfBirth: "1988-01-15",
        appointmentDate: "2023-12-01T10:00:00",
        preferredCallTime: "09:00",
        preferredCallDay: "monday",
        treatment: "Annual checkup",
        clinicLocation: "Main Street Clinic",
        notes: "New patient",
        medicalHistory: "Hypertension",
        allergies: "Penicillin",
        medications: "Lisinopril 10mg daily",
        insuranceProvider: "Blue Cross",
        insuranceNumber: "BC123456789",
        emergencyContactName: "Jane Doe",
        emergencyContactPhone: "+1987654321",
        referralSource: "Website",
      },
    ]

    // Convert to CSV
    const csv = Papa.unparse(templateData)

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "patient_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Patients</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="csv">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV Upload
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Upload className="mr-2 h-4 w-4" />
            Manual JSON
          </TabsTrigger>
        </TabsList>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file with patient data. The file should have columns for name, phone, email (optional),
                  and appointmentDate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-end mb-4">
                    <Button type="button" variant="outline" onClick={downloadTemplate} className="flex items-center">
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                  </div>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                    <Input id="csvFile" type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    <Label htmlFor="csvFile" className="cursor-pointer flex flex-col items-center justify-center">
                      <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-2" />
                      <span className="text-sm font-medium">{file ? file.name : "Click to upload CSV file"}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {file ? `${(file.size / 1024).toFixed(2)} KB` : "CSV files only"}
                      </span>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual JSON Input</CardTitle>
                <CardDescription>
                  Enter patient data as JSON array. Each patient should have name, phone, email (optional), and
                  appointmentDate.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder='[
  {
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "appointmentDate": "2023-12-01T10:00:00",
    "age": "35",
    "gender": "male",
    "dateOfBirth": "1988-01-15",
    "preferredCallTime": "09:00",
    "preferredCallDay": "monday",
    "treatment": "Annual checkup",
    "clinicLocation": "Main Street Clinic",
    "notes": "New patient",
    "medicalHistory": "Hypertension",
    "allergies": "Penicillin",
    "medications": "Lisinopril 10mg daily",
    "insuranceProvider": "Blue Cross",
    "insuranceNumber": "BC123456789",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+1987654321",
    "referralSource": "Website"
  }
]'
                    value={manualData}
                    onChange={handleManualDataChange}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  Showing first {previewData.length} records of {activeTab === "csv" ? csvData.length : "your data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-4 py-2 text-left">Name</th>
                        <th className="border px-4 py-2 text-left">Phone</th>
                        <th className="border px-4 py-2 text-left">Email</th>
                        <th className="border px-4 py-2 text-left">Appointment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((patient, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">{patient.name}</td>
                          <td className="border px-4 py-2">{patient.phone}</td>
                          <td className="border px-4 py-2">{patient.email || "N/A"}</td>
                          <td className="border px-4 py-2">{patient.appointmentDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Default Call Script</CardTitle>
              <CardDescription>
                This script will be used for patients that don't have a specific call script.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={defaultCallScript}
                onChange={(e) => setDefaultCallScript(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import Patients"}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}
