import { NextResponse } from "next/server"
import { processFollowUps } from "@/lib/followup-system"

// This endpoint would be called by a cron job
export async function GET(req: Request) {
  try {
    // Verify the request is from a trusted source
    const authHeader = req.headers.get("Authorization")

    // In a real implementation, you would validate the auth header
    // For now, we'll just check if it exists
    if (!authHeader) {
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
