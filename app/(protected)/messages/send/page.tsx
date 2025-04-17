"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { Send, Loader2 } from "lucide-react"

export default function SendMessagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState("")
  const [message, setMessage] = useState("")
  const [templates, setTemplates] = useState([
    {
      id: "appointment",
      name: "Appointment Reminder",
      content:
        "Hello {{patient_name}}, this is a reminder about your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please reply to confirm.",
    },
    {
      id: "followup",
      name: "Follow-up",
      content:
        "Hello {{patient_name}}, we're following up on your recent appointment with Dr. {{doctor_name}}. How are you feeling? Please let us know if you have any questions.",
    },
    {
      id: "reschedule",
      name: "Reschedule Request",
      content:
        "Hello {{patient_name}}, we need to reschedule your appointment with Dr. {{doctor_name}} on {{appointment_date}}. Please call us to arrange a new time.",
    },
  ])

  // Check if patient ID is provided in URL
  useEffect(() => {
    const patientId = searchParams.get("patient")
    if (patientId) {
      setSelectedPatient(patientId)
      fetchPatientDetails(patientId)
    }
  }, [searchParams])

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch("/api/patients")
        if (!response.ok) throw new Error("Failed to fetch patients")

        const data = await response.json()
        setPatients(data)
      } catch (error) {
        console.error("Error fetching patients:", error)
        toast({
          title: t("notification.error"),
          description: t("patients.fetchError"),
          variant: "destructive",
        })
      }
    }

    fetchPatients()
  }, [t, toast])

  // Fetch patient details to pre-fill template
  const fetchPatientDetails = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) throw new Error("Failed to fetch patient details")

      const patient = await response.json()

      // Pre-fill message with appointment template
      const template = templates.find((t) => t.id === "appointment")
      if (template) {
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

        const content = template.content
          .replace(/{{patient_name}}/g, patient.name)
          .replace(/{{appointment_date}}/g, appointmentDate)
          .replace(/{{doctor_name}}/g, patient.assignedDoctor?.name || "your doctor")

        setMessage(content)
      }
    } catch (error) {
      console.error("Error fetching patient details:", error)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template && selectedPatient) {
      // Fetch patient details to fill template
      fetchPatientDetails(selectedPatient)
    } else if (template) {
      setMessage(template.content)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPatient) {
      toast({
        title: t("notification.error"),
        description: t("messages.selectPatient"),
        variant: "destructive",
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: t("notification.error"),
        description: t("messages.enterMessage"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: selectedPatient,
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t("messages.sendError"))
      }

      toast({
        title: t("notification.success"),
        description: t("messages.sendSuccess"),
      })

      router.push("/messages")
      router.refresh()
    } catch (error: any) {
      toast({
        title: t("notification.error"),
        description: error.message || t("messages.sendError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 brand-text-gradient">{t("messages.send")}</h1>

      <Card className="border-[#101B4C]/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
          <CardTitle>{t("messages.send")}</CardTitle>
          <CardDescription className="text-white/80">{t("messages.sendDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient">{t("patients.select")}</Label>
              <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                <SelectTrigger>
                  <SelectValue placeholder={t("patients.select")} />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: any) => (
                    <SelectItem key={patient._id} value={patient._id}>
                      {patient.name} ({patient.phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">{t("messages.template")}</Label>
              <Select onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder={t("messages.selectTemplate")} />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("messages.content")}</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[200px]"
                placeholder={t("messages.contentPlaceholder")}
                required
              />
              <p className="text-xs text-gray-500">{t("messages.contentHelp")}</p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()} className="btn-brand-outline">
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={loading} className="btn-brand">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("messages.sending")}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t("messages.send")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
