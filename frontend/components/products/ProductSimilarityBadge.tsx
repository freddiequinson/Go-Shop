"use client"

import { CheckCircle, TrendingUp, Package, Sparkles } from "lucide-react"

interface ProductSimilarityBadgeProps {
  similarity: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  animated?: boolean
}

export default function ProductSimilarityBadge({
  similarity,
  size = "md",
  showLabel = true,
  animated = true
}: ProductSimilarityBadgeProps) {
  
  // Determine badge style based on similarity score
  const getBadgeConfig = (score: number) => {
    if (score >= 90) {
      return {
        color: "bg-green-100 text-green-700 border-green-300",
        icon: CheckCircle,
        label: "Exact Match",
        gradient: "from-green-400 to-green-600",
        glow: "shadow-green-500/50"
      }
    } else if (score >= 70) {
      return {
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
        icon: TrendingUp,
        label: "Close Match",
        gradient: "from-yellow-400 to-yellow-600",
        glow: "shadow-yellow-500/50"
      }
    } else if (score >= 50) {
      return {
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: Sparkles,
        label: "Similar",
        gradient: "from-blue-400 to-blue-600",
        glow: "shadow-blue-500/50"
      }
    } else {
      return {
        color: "bg-gray-100 text-gray-700 border-gray-300",
        icon: Package,
        label: "Partial Match",
        gradient: "from-gray-400 to-gray-600",
        glow: "shadow-gray-500/50"
      }
    }
  }

  const config = getBadgeConfig(similarity)
  const Icon = config.icon

  // Size configurations
  const sizeClasses = {
    sm: {
      container: "px-2 py-0.5 text-xs",
      icon: "w-3 h-3",
      score: "text-xs",
      ring: "w-8 h-8",
      ringStroke: "stroke-[3]"
    },
    md: {
      container: "px-3 py-1 text-sm",
      icon: "w-4 h-4",
      score: "text-sm",
      ring: "w-12 h-12",
      ringStroke: "stroke-[4]"
    },
    lg: {
      container: "px-4 py-2 text-base",
      icon: "w-5 h-5",
      score: "text-base",
      ring: "w-16 h-16",
      ringStroke: "stroke-[5]"
    }
  }

  const sizes = sizeClasses[size]

  return (
    <div className="flex items-center gap-2">
      {/* Circular Progress Ring */}
      <div className="relative">
        <svg className={sizes.ring} viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <path
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${similarity}, 100`}
            strokeLinecap="round"
            className={`${config.gradient.split(' ')[0].replace('from-', 'text-')} transition-all duration-1000 ${
              animated ? 'animate-pulse' : ''
            }`}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        {/* Center percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${sizes.score} ${config.color.split(' ')[1]}`}>
            {similarity}%
          </span>
        </div>
      </div>

      {/* Badge with label */}
      {showLabel && (
        <span
          className={`
            ${config.color} 
            ${sizes.container}
            font-bold 
            border-2 
            rounded-full 
            flex 
            items-center 
            gap-1
            ${animated ? 'animate-bounce' : ''}
            transition-all
            hover:scale-105
            ${similarity >= 90 ? `shadow-lg ${config.glow}` : ''}
          `}
        >
          <Icon className={sizes.icon} />
          {config.label}
        </span>
      )}
    </div>
  )
}

// Variant: Compact inline badge
export function CompactSimilarityBadge({ similarity }: { similarity: number }) {
  const getColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 70) return "bg-yellow-500"
    if (score >= 50) return "bg-blue-500"
    return "bg-gray-500"
  }

  return (
    <div className="flex items-center gap-1">
      <div className={`w-2 h-2 rounded-full ${getColor(similarity)} animate-pulse`} />
      <span className="text-xs font-semibold text-gray-600">{similarity}%</span>
    </div>
  )
}

// Variant: Horizontal bar
export function SimilarityBar({ similarity }: { similarity: number }) {
  const getColor = (score: number) => {
    if (score >= 90) return "bg-green-500"
    if (score >= 70) return "bg-yellow-500"
    if (score >= 50) return "bg-blue-500"
    return "bg-gray-500"
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-600">Match Quality</span>
        <span className="text-xs font-bold text-gray-800">{similarity}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor(similarity)} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${similarity}%` }}
        />
      </div>
    </div>
  )
}
