"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import RiderSidebar from "@/components/rider/RiderSidebar"

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and is a rider
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      router.push('/login')
      return
    }

    const user = JSON.parse(userStr)
    if (user.user_type?.toUpperCase() !== 'RIDER') {
      router.push('/')
      return
    }
  }, [router])

  return (
    <div className="flex min-h-screen bg-[#F4F2E6]">
      <RiderSidebar />
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  )
}
