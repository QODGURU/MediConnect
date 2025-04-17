"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { updatePatient, deletePatient } from "@/app/actions"

export default function EditPatientPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [patient, setPatient] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    appointmentDate: "",
    callScript: "",
    status: "",
  })

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch patient")

        const data = await response.json()
        setPatient(data)

        // Format date for input
        const appointmentDate = new Date(data.appointmentDate)
        const formattedDate = appointmentDate.toISOString().slice(0, 16)

        setFormData({
          name: data.name,
          phone: data.phone,
          email: data.email || "",
          appointmentDate: formattedDate,
          callScript: data.callScript,
          status: data.status,
        })
      } catch (error) {
        console.error("Error fetching patient:", error)
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive",
        })
        router.push("/patients")
      }
    }

    fetchPatient()
  }, [params.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updatePatient(params.id, formData)
      toast({
        title: "Success",
        description: "Patient updated successfully",
      })
      router.push(`/patients/${params.id}`)
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this patient?")) {
      return
    }

    setDeleting(true)

    try {
      await deletePatient(params.id)
      toast({
        title: "Success",
        description: "Patient deleted successfully",
      })
      router.push("/patients")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      })
      setDeleting(false)
    }
  }

  if (!patient) {
    return <div className="text-center py-10">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Patient</h1>

      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date</Label>
              <Input
                id="appointmentDate"
                name="appointmentDate"
                type="datetime-local"
                value={formData.appointmentDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="called">Called</SelectItem>
                  <SelectItem value="not_answered">Not Answered</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callScript">Call Script</Label>
              <Textarea
                id="callScript"
                name="callScript"
                value={formData.callScript}
                onChange={handleChange}
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Patient"}
              </Button>

              <div className="space-x-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
