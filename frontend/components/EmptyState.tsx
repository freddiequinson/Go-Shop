import React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`p-12 bg-white text-center ${className}`}>
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-[#303A4D] mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}
