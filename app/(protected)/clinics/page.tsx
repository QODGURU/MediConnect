import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { Clinic } from "@/models/clinic"
import { User } from "@/models/user"
import { Patient } from "@/models/patient"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ClinicTable } from "@/components/clinics/clinic-table"

export default async function ClinicsPage() {
  await requireAdmin()
  await connectToDatabase()

  const clinics = await Clinic.find({}).sort({ createdAt: -1 }).lean()

  // Get doctor and patient counts for each clinic
  const formattedClinics = await Promise.all(
    clinics.map(async (clinic) => {
      const doctorCount = await User.countDocuments({ clinic: clinic._id, role: "doctor" })
      const patientCount = await Patient.countDocuments({ clinic: clinic._id })

      return {
        id: clinic._id.toString(),
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone,
        address: clinic.address || "N/A",
        doctorCount,
        patientCount,
        createdAt: new Date(clinic.createdAt).toLocaleDateString(),
      }
    }),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold brand-text-gradient">Clinics</h1>
        <Link href="/clinics/add">
          <Button className="btn-brand">
            <Plus className="mr-2 h-4 w-4" />
            Add Clinic
          </Button>
        </Link>
      </div>

      <ClinicTable data={formattedClinics} />
    </div>
  )
}
