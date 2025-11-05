import Link from "next/link"
import { User, Mail, Phone, MapPin, Calendar, Edit2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { UserResponse } from "@/lib/types"

interface ProfileSidebarProps {
  user: UserResponse
  onLogout: () => void
}

export function ProfileSidebar({ user, onLogout }: ProfileSidebarProps) {
  return (
    <Card className="lg:col-span-1 p-6 bg-white h-fit">
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-[#FED141] flex items-center justify-center mb-4 relative overflow-hidden">
          {user.profile_picture_url ? (
            <img
              src={user.profile_picture_url}
              alt={user.full_name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <User className="w-12 h-12 text-[#303A4D]" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-[#303A4D] mb-1">{user.full_name}</h2>
        <p className="text-gray-600 mb-2">
          {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
        </p>
        <span className="inline-block px-3 py-1 bg-[#FED141] text-[#303A4D] text-xs font-semibold rounded-full mb-4">
          {user.premium_tier.toUpperCase()}
        </span>

        <div className="w-full space-y-2">
          <Link href="/profile/edit" className="w-full block">
            <Button className="w-full bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-start gap-3 text-sm">
          <Mail className="w-5 h-5 text-[#303A4D] mt-0.5" />
          <div>
            <p className="text-gray-500">Email</p>
            <p className="text-[#303A4D] font-medium break-all">{user.email}</p>
          </div>
        </div>

        {user.phone_number && (
          <div className="flex items-start gap-3 text-sm">
            <Phone className="w-5 h-5 text-[#303A4D] mt-0.5" />
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="text-[#303A4D] font-medium">{user.phone_number}</p>
            </div>
          </div>
        )}

        {user.location && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="w-5 h-5 text-[#303A4D] mt-0.5" />
            <div>
              <p className="text-gray-500">Location</p>
              <p className="text-[#303A4D] font-medium">{user.location}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 text-sm">
          <Calendar className="w-5 h-5 text-[#303A4D] mt-0.5" />
          <div>
            <p className="text-gray-500">Member Since</p>
            <p className="text-[#303A4D] font-medium">
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
