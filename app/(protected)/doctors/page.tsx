import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { User } from "@/models/user"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { DoctorTable } from "@/components/doctors/doctor-table"

export default async function DoctorsPage() {
  await requireAdmin()
  await connectToDatabase()

  const doctors = await User.find({ role: "doctor" }).sort({ createdAt: -1 }).lean()

  // Format data for the table
  const formattedDoctors = doctors.map((doctor) => ({
    id: doctor._id.toString(),
    name: doctor.name,
    email: doctor.email,
    createdAt: new Date(doctor.createdAt).toLocaleDateString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Doctors</h1>
        <Link href="/doctors/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </Link>
      </div>

      <DoctorTable data={formattedDoctors} />
    </div>
  )
}
