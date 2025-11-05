import React, { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  backLink?: string
  action?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  badge?: ReactNode
  children?: ReactNode
}

export function PageHeader({
  title,
  description,
  backLink,
  action,
  badge,
  children
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backLink && (
        <Link href={backLink}>
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#303A4D]">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-[#303A4D]/70 text-sm sm:text-base">{description}</p>
          )}
        </div>

        {action && (
          <Button
            onClick={action.onClick}
            className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold whitespace-nowrap"
          >
            {action.icon}
            {action.label}
          </Button>
        )}
      </div>

      {children}
    </div>
  )
}
