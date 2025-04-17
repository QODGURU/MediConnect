"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addPatient } from "@/app/actions"
import { notifications } from "@/lib/notifications"
import { useLanguage } from "@/contexts/language-context"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { z } from "zod"

// Define validation schema
const patientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  age: z
    .string()
    .refine((val) => !val || !isNaN(Number(val)), "Age must be a number")
    .optional()
    .or(z.literal("")),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  preferredCallTime: z.string().optional(),
  preferredCallDay: z.string().optional(),
  treatment: z.string().optional(),
  callScript: z.string().min(10, "Call script must be at least 10 characters"),
  clinicLocation: z.string().optional(),
  notes: z.string().optional(),
  assignedDoctor: z.string().optional(),
  clinic: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  referralSource: z.string().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

export default function AddPatientPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [clinics, setClinics] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormData, string>>>({})

  const [formData, setFormData] = useState<PatientFormData>({
    name: "",
    phone: "",
    email: "",
    age: "",
    gender: "",
    dateOfBirth: "",
    appointmentDate: "",
    preferredCallTime: "",
    preferredCallDay: "",
    treatment: "",
    callScript: `Hello {{patient_name}}, this is Mayra. I'm calling to remind you about your appointment scheduled for {{appointment_date}} with Dr. {{doctor_name}}. Please arrive 15 minutes early to complete any necessary paperwork. If you need to reschedule, please call our office. Would you like me to repeat any of this information?`,
    clinicLocation: "",
    notes: "",
    assignedDoctor: "",
    clinic: "",
    medicalHistory: "",
    allergies: "",
    medications: "",
    insuranceProvider: "",
    insuranceNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    referralSource: "",
  })

  // Fetch clinics
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch("/api/clinics")
        if (response.ok) {
          const data = await response.json()
          setClinics(data)
        }
      } catch (error) {
        console.error("Error fetching clinics:", error)
      }
    }

    fetchClinics()
  }, [])

  // Fetch all doctors initially
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch("/api/doctors")
        if (response.ok) {
          const data = await response.json()
          setDoctors(data)
        }
      } catch (error) {
        console.error("Error fetching doctors:", error)
      }
    }

    fetchDoctors()
  }, [])

  // Fetch doctors by clinic when clinic changes
  useEffect(() => {
    if (formData.clinic) {
      const fetchDoctorsByClinic = async () => {
        setLoadingDoctors(true)
        try {
          const response = await fetch(`/api/doctors/by-clinic?clinic=${formData.clinic}`)
          if (response.ok) {
            const data = await response.json()
            setDoctors(data)
          }
        } catch (error) {
          console.error("Error fetching doctors by clinic:", error)
        } finally {
          setLoadingDoctors(false)
        }
      }

      fetchDoctorsByClinic()
    }
  }, [formData.clinic])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name as keyof PatientFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is edited
    if (errors[name as keyof PatientFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const validateForm = () => {
    try {
      patientSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof PatientFormData, string>> = {}
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof PatientFormData
          newErrors[path] = err.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      notifications.error("Validation Error", "Please fix the errors in the form")
      return
    }

    setLoading(true)

    // Create a copy of form data to clean up
    const submissionData = { ...formData }

    // Remove placeholder values
    if (submissionData.clinic === "no-clinics") {
      submissionData.clinic = ""
    }

    if (submissionData.assignedDoctor === "no-doctors") {
      submissionData.assignedDoctor = ""
    }

    notifications
      .promise(
        addPatient(submissionData).then(() => {
          router.push("/patients")
          router.refresh()
        }),
        {
          loading: t("notification.info"),
          success: t("notification.success"),
          error: (error) => error.message || t("notification.error"),
        },
      )
      .finally(() => {
        setLoading(false)
      })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 brand-text-gradient">{t("patients.add")}</h1>

      <Card className="border-[#101B4C]/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
          <CardTitle>{t("patients.title")}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold text-[#101B4C]">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t("patients.name")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      {t("patients.phone")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t("patients.email")} ({t("form.optional")})
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">{t("patients.age")}</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      min="0"
                      max="120"
                      value={formData.age}
                      onChange={handleChange}
                      className={errors.age ? "border-red-500" : ""}
                    />
                    {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">{t("patients.gender")}</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t("gender.male")}</SelectItem>
                        <SelectItem value="female">{t("gender.female")}</SelectItem>
                        <SelectItem value="other">{t("gender.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold text-[#101B4C]">Medical Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory">Medical History</Label>
                    <Textarea
                      id="medicalHistory"
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleChange}
                      placeholder="Previous conditions, surgeries, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="Medications, food, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      name="medications"
                      value={formData.medications}
                      onChange={handleChange}
                      placeholder="Name, dosage, frequency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="treatment">Reason for Visit / Treatment</Label>
                    <Input id="treatment" name="treatment" value={formData.treatment} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* Appointment & Contact Information */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold text-[#101B4C]">Appointment & Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointmentDate">
                      {t("patients.appointmentDate")} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="datetime-local"
                      value={formData.appointmentDate}
                      onChange={handleChange}
                      className={errors.appointmentDate ? "border-red-500" : ""}
                    />
                    {errors.appointmentDate && <p className="text-red-500 text-sm">{errors.appointmentDate}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredCallDay">{t("settings.preferredCallDay")}</Label>
                    <Select
                      value={formData.preferredCallDay}
                      onValueChange={(value) => handleSelectChange("preferredCallDay", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("form.select")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">{t("days.monday")}</SelectItem>
                        <SelectItem value="tuesday">{t("days.tuesday")}</SelectItem>
                        <SelectItem value="wednesday">{t("days.wednesday")}</SelectItem>
                        <SelectItem value="thursday">{t("days.thursday")}</SelectItem>
                        <SelectItem value="friday">{t("days.friday")}</SelectItem>
                        <SelectItem value="saturday">{t("days.saturday")}</SelectItem>
                        <SelectItem value="sunday">{t("days.sunday")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredCallTime">{t("settings.preferredCallTime")}</Label>
                    <Input
                      id="preferredCallTime"
                      name="preferredCallTime"
                      type="time"
                      value={formData.preferredCallTime}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clinicLocation">{t("clinics.address")}</Label>
                    <Input
                      id="clinicLocation"
                      name="clinicLocation"
                      value={formData.clinicLocation}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold text-[#101B4C]">Insurance Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                    <Input
                      id="insuranceProvider"
                      name="insuranceProvider"
                      value={formData.insuranceProvider}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="insuranceNumber">Insurance/Policy Number</Label>
                    <Input
                      id="insuranceNumber"
                      name="insuranceNumber"
                      value={formData.insuranceNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Assignment & Referral */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold text-[#101B4C]">Assignment & Referral</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {session?.user?.role === "admin" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="clinic">{t("patients.clinic")}</Label>
                        <Select value={formData.clinic} onValueChange={(value) => handleSelectChange("clinic", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("form.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {clinics.length === 0 ? (
                              <SelectItem value="no-clinics" disabled>
                                No clinics available
                              </SelectItem>
                            ) : (
                              clinics.map((clinic: any) => (
                                <SelectItem key={clinic._id} value={clinic._id}>
                                  {clinic.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="assignedDoctor">{t("patients.doctor")}</Label>
                        <Select
                          value={formData.assignedDoctor}
                          onValueChange={(value) => handleSelectChange("assignedDoctor", value)}
                          disabled={loadingDoctors}
                        >
                          <SelectTrigger>
                            {loadingDoctors ? (
                              <div className="flex items-center">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </div>
                            ) : (
                              <SelectValue placeholder={t("form.select")} />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.length === 0 ? (
                              <SelectItem value="no-doctors" disabled>
                                {formData.clinic ? "No doctors in this clinic" : "Please select a clinic first"}
                              </SelectItem>
                            ) : (
                              doctors.map((doctor: any) => (
                                <SelectItem key={doctor._id} value={doctor._id}>
                                  {doctor.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="referralSource">Referral Source</Label>
                    <Input
                      id="referralSource"
                      name="referralSource"
                      value={formData.referralSource}
                      onChange={handleChange}
                      placeholder="How did the patient hear about us?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">{t("patients.notes")}</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Call Script */}
              <div className="space-y-4 md:col-span-2">
                <h2 className="text-xl font-semibold text-[#101B4C]">Call Script</h2>
                <div className="space-y-2">
                  <Label htmlFor="callScript">
                    {t("calls.script")} <span className="text-red-500">*</span>
                  </Label>
                  <div className="text-sm text-muted-foreground mb-2">{t("settings.scriptVariables")}</div>
                  <Textarea
                    id="callScript"
                    name="callScript"
                    value={formData.callScript}
                    onChange={handleChange}
                    placeholder={t("settings.scriptPlaceholder")}
                    className="min-h-[150px]"
                    className={errors.callScript ? "border-red-500 min-h-[150px]" : "min-h-[150px]"}
                  />
                  {errors.callScript && <p className="text-red-500 text-sm">{errors.callScript}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} className="btn-brand-outline">
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={loading} className="btn-brand">
                {loading ? t("form.submitting") : t("form.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
