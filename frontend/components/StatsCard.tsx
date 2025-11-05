import React from "react"
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  bgColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  onClick?: () => void
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  bgColor = "bg-blue-50",
  trend,
  subtitle,
  onClick
}: StatsCardProps) {
  return (
    <Card
      className={`p-6 bg-white hover:shadow-lg transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-[#303A4D]">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </Card>
  )
}
