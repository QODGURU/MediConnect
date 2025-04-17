import { requireAdmin } from "@/lib/auth"
import { ImmediateCall } from "@/components/calls/immediate-call"

export default async function CallsPage() {
  await requireAdmin()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-800">Make Calls</h1>
      <p className="text-muted-foreground">Make immediate calls to patients using Retell AI.</p>

      <ImmediateCall />
    </div>
  )
}
