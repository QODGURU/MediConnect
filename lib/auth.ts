import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export async function getSession() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export async function getCurrentUser() {
  try {
    const session = await getSession()

    if (!session?.user) {
      return null
    }

    return session.user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      redirect("/login")
    }

    return user
  } catch (error) {
    console.error("Error in requireAuth:", error)
    redirect("/login")
  }
}

export async function requireAdmin() {
  try {
    const user = await requireAuth()

    if (user.role !== "admin") {
      redirect("/dashboard")
    }

    return user
  } catch (error) {
    console.error("Error in requireAdmin:", error)
    redirect("/login")
  }
}
