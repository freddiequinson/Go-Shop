"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Send } from "lucide-react"

export default function TestNotificationsPage() {
  const [emailData, setEmailData] = useState({
    email: "",
    name: "",
  })
  const [smsData, setSmsData] = useState({
    phone: "",
    name: "",
  })
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isSendingSMS, setIsSendingSMS] = useState(false)
  const { toast } = useToast()

  const handleSendEmail = async () => {
    if (!emailData.email || !emailData.name) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and name",
        variant: "destructive",
      })
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/test/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailData.email,
          name: emailData.name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "✅ Email sent!",
          description: `Welcome email sent to ${emailData.email}`,
        })
      } else {
        // Handle validation errors
        let errorMessage = "Failed to send email"
        if (typeof data.detail === 'string') {
          errorMessage = data.detail
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => err.msg).join(', ')
        }
        
        toast({
          title: "❌ Email failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Network error. Check if backend is running.",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleSendSMS = async () => {
    if (!smsData.phone || !smsData.name) {
      toast({
        title: "Missing fields",
        description: "Please enter both phone and name",
        variant: "destructive",
      })
      return
    }

    setIsSendingSMS(true)
    try {
      const response = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1'}/test/send-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: smsData.phone,
          name: smsData.name,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "✅ SMS sent!",
          description: `Welcome SMS sent to ${smsData.phone}`,
        })
      } else {
        // Handle validation errors
        let errorMessage = "Failed to send SMS"
        if (typeof data.detail === 'string') {
          errorMessage = data.detail
        } else if (Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => err.msg).join(', ')
        }
        
        toast({
          title: "❌ SMS failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Network error. Check if backend is running.",
        variant: "destructive",
      })
    } finally {
      setIsSendingSMS(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4698CA] to-[#303A4D] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🧪 Test Notifications</h1>
        <p className="text-white/80 mb-8">Test email and SMS sending functionality</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Email Test Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#4698CA] rounded-full flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
              <h2 className="text-2xl font-bold text-[#303A4D]">Test Email</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#303A4D] mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={emailData.email}
                  onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                  placeholder="test@example.com"
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="emailName" className="block text-sm font-medium text-[#303A4D] mb-2">
                  Recipient Name
                </label>
                <input
                  id="emailName"
                  type="text"
                  value={emailData.name}
                  onChange={(e) => setEmailData({ ...emailData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#4698CA] transition-colors"
                />
              </div>

              <Button
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="w-full bg-[#4698CA] hover:bg-[#3B7BA8] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
              >
                {isSendingEmail ? "Sending..." : "Send Test Email"}
                <Send className="ml-2 w-5 h-5" />
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>What gets sent:</strong> Welcome email with FREE delivery offer, quality promise, and contact info.
                </p>
              </div>
            </div>
          </div>

          {/* SMS Test Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#93C90F] rounded-full flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <h2 className="text-2xl font-bold text-[#303A4D]">Test SMS</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#303A4D] mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={smsData.phone}
                  onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                  placeholder="+233 24 123 4567"
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#93C90F] transition-colors"
                />
                <p className="text-xs text-[#303A4D]/60 mt-1">
                  Ghana format: 0241234567, +233241234567, or 233241234567
                </p>
              </div>

              <div>
                <label htmlFor="smsName" className="block text-sm font-medium text-[#303A4D] mb-2">
                  Recipient Name
                </label>
                <input
                  id="smsName"
                  type="text"
                  value={smsData.name}
                  onChange={(e) => setSmsData({ ...smsData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-[#F4F2E6] border-2 border-transparent rounded-2xl px-4 py-3 text-[#303A4D] placeholder:text-[#303A4D]/40 focus:outline-none focus:border-[#93C90F] transition-colors"
                />
              </div>

              <Button
                onClick={handleSendSMS}
                disabled={isSendingSMS}
                className="w-full bg-[#93C90F] hover:bg-[#7BAF0C] text-white rounded-full py-6 text-lg font-bold h-auto disabled:opacity-50"
              >
                {isSendingSMS ? "Sending..." : "Send Test SMS"}
                <Send className="ml-2 w-5 h-5" />
              </Button>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-sm text-green-800">
                  <strong>What gets sent:</strong> Welcome SMS with FREE delivery offer and www.goshopghana.com link.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-3xl p-6 text-white">
          <h3 className="text-xl font-bold mb-3">📋 How to Use:</h3>
          <ol className="space-y-2 text-white/90">
            <li><strong>1.</strong> Make sure your backend server is running</li>
            <li><strong>2.</strong> Enter your email/phone and name</li>
            <li><strong>3.</strong> Click "Send Test Email" or "Send Test SMS"</li>
            <li><strong>4.</strong> Check your inbox/phone for the message</li>
            <li><strong>5.</strong> Check backend terminal for detailed logs</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-2xl">
            <p className="text-sm">
              <strong>⚠️ Note:</strong> Check your backend terminal for detailed logs showing exactly what happened (success or error messages).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
