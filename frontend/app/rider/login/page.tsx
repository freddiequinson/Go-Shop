"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Truck, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function RiderLogin() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/rider/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("user", JSON.stringify(data.rider))
        
        toast({
          title: "Success",
          description: "Logged in successfully"
        })
        
        router.push("/rider")
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Invalid credentials",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 bg-white">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FED141] rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-[#303A4D]" />
          </div>
          <h1 className="text-3xl font-bold text-[#303A4D] mb-2">Go-Shop Rider</h1>
          <p className="text-[#303A4D]/60">Login to your rider account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#303A4D] mb-2">
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#303A4D] mb-2">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] font-bold py-6"
            disabled={loading}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
            ) : (
              <>Login</>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-[#303A4D]/60 mt-6">
          Contact admin if you need help accessing your account
        </p>
      </Card>
    </div>
  )
}
