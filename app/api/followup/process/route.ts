import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { processFollowUps } from "@/lib/followup-system"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "clinic")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await processFollowUps()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to process follow-ups",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error processing follow-ups:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
