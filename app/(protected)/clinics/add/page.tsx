"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { addClinic } from "@/app/actions"
import { useLanguage } from "@/contexts/language-context"

export default function AddClinicPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await addClinic(formData)

      toast({
        title: t("notification.success"),
        description: t("clinics.addSuccess"),
      })

      router.push("/clinics")
      router.refresh()
    } catch (error: any) {
      toast({
        title: t("notification.error"),
        description: error.message || t("clinics.addError"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6 brand-text-gradient">{t("clinics.add")}</h1>

      <Card className="border-[#101B4C]/20 shadow-md">
        <CardHeader className="bg-gradient-to-r from-[#101B4C] to-[#00FFC8] text-white rounded-t-lg">
          <CardTitle>{t("clinics.information")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("clinics.name")}</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("clinics.email")}</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("clinics.phone")}</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t("clinics.address")}</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">{t("clinics.website")}</Label>
              <Input id="website" name="website" value={formData.website} onChange={handleChange} />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
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
