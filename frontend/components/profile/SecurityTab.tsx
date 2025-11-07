import { useState } from "react"
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyErrorMessage, getErrorTitle } from "@/lib/utils/error-messages"
import { usersService } from "@/lib/api/services"

export function SecurityTab() {
  const { toast } = useToast()
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    const newPassword = passwordData.new_password
    const confirmPassword = passwordData.confirm_password

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both password fields match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Your new password must be at least 6 characters long for security",
        variant: "destructive",
      })
      return
    }

    try {
      setChangingPassword(true)
      await usersService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      })

      toast({
        title: "Success",
        description: "Password changed successfully",
      })

      // Reset form
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      })
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <Card className="p-6 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="w-6 h-6 text-[#303A4D]" />
        <h3 className="text-xl font-bold text-[#303A4D]">Change Password</h3>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showPasswords.current ? "text" : "password"}
              value={passwordData.current_password}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, current_password: e.target.value }))
              }
              required
              className="pr-10 w-full"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.current ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="new_password"
              type={showPasswords.new ? "text" : "password"}
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, new_password: e.target.value }))
              }
              required
              className="pr-10 w-full"
            />
            <button
              type="button"
              onClick={() => setShowPasswords((prev) => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.new ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Must be at least 6 characters</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirm_password"
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData((prev) => ({ ...prev, confirm_password: e.target.value }))
              }
              required
              className="pr-10 w-full"
            />
            <button
              type="button"
              onClick={() =>
                setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90"
          disabled={changingPassword}
        >
          {changingPassword ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changing Password...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
      </form>
    </Card>
  )
}
