"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"

interface ExpiryCountdownProps {
  createdAt: string
  shelfLifeDays: number
}

interface TimeLeft {
  weeks: number
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  isExpiringSoon: boolean
}

export default function ExpiryCountdown({ createdAt, shelfLifeDays }: ExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(createdAt)
      const expiryDate = new Date(created.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000)
      const now = new Date()
      const difference = expiryDate.getTime() - now.getTime()

      if (difference <= 0) {
        return {
          weeks: 0,
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          isExpiringSoon: false
        }
      }

      const seconds = Math.floor((difference / 1000) % 60)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const totalDays = Math.floor(difference / (1000 * 60 * 60 * 24))
      const weeks = Math.floor(totalDays / 7)
      const days = totalDays % 7

      // Consider expiring soon if less than 20% of shelf life remains
      const isExpiringSoon = difference < (shelfLifeDays * 24 * 60 * 60 * 1000 * 0.2)

      return {
        weeks,
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        isExpiringSoon
      }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [createdAt, shelfLifeDays])

  if (!timeLeft) {
    return <div className="animate-pulse">Loading...</div>
  }

  if (timeLeft.isExpired) {
    return (
      <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <div>
            <h3 className="text-xl font-bold text-red-900">EXPIRED</h3>
            <p className="text-sm text-red-700">This product has passed its shelf life</p>
          </div>
        </div>
        <p className="text-red-800 font-medium">⚠️ Remove from inventory immediately</p>
      </div>
    )
  }

  const bgColor = timeLeft.isExpiringSoon 
    ? 'bg-gradient-to-r from-orange-100 to-red-100 border-orange-400' 
    : 'bg-gradient-to-r from-green-100 to-blue-100 border-green-400'

  const textColor = timeLeft.isExpiringSoon ? 'text-orange-900' : 'text-green-900'
  const accentColor = timeLeft.isExpiringSoon ? 'text-orange-600' : 'text-green-600'

  return (
    <div className={`${bgColor} border-2 rounded-2xl p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <Clock className={`w-6 h-6 ${accentColor}`} />
        <div>
          <h3 className={`text-lg font-bold ${textColor}`}>
            {timeLeft.isExpiringSoon ? '⚠️ Expiring Soon' : '✅ Fresh Product'}
          </h3>
          <p className={`text-sm ${textColor}/70`}>Time until expiry</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {/* Weeks */}
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <div className={`text-3xl font-bold ${textColor}`}>{timeLeft.weeks}</div>
          <div className={`text-xs ${textColor}/60 font-medium`}>Weeks</div>
        </div>

        {/* Days */}
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <div className={`text-3xl font-bold ${textColor}`}>{timeLeft.days}</div>
          <div className={`text-xs ${textColor}/60 font-medium`}>Days</div>
        </div>

        {/* Hours */}
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <div className={`text-3xl font-bold ${textColor}`}>{timeLeft.hours}</div>
          <div className={`text-xs ${textColor}/60 font-medium`}>Hours</div>
        </div>

        {/* Minutes */}
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <div className={`text-3xl font-bold ${textColor}`}>{timeLeft.minutes}</div>
          <div className={`text-xs ${textColor}/60 font-medium`}>Mins</div>
        </div>

        {/* Seconds */}
        <div className="bg-white/80 rounded-xl p-3 text-center">
          <div className={`text-3xl font-bold ${textColor} tabular-nums`}>{String(timeLeft.seconds).padStart(2, '0')}</div>
          <div className={`text-xs ${textColor}/60 font-medium`}>Secs</div>
        </div>
      </div>

      {timeLeft.isExpiringSoon && (
        <div className="mt-4 bg-orange-200 rounded-xl p-3">
          <p className="text-sm text-orange-900 font-medium">
            ⚠️ Action Required: This product is nearing expiry. Consider discounting or removing from sale.
          </p>
        </div>
      )}
    </div>
  )
}
