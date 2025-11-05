import React from "react"
import { CheckCircle, Clock, XCircle, AlertCircle, Package, Truck } from "lucide-react"

interface StatusBadgeProps {
  status: string
  type?: "request" | "offer" | "order" | "delivery"
  className?: string
}

export function StatusBadge({ status, type = "request", className = "" }: StatusBadgeProps) {
  const getStatusConfig = () => {
    const normalizedStatus = status.toLowerCase()

    // Common statuses
    const statusMap: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      // Request statuses
      sent: {
        color: "bg-blue-100 text-blue-700",
        icon: <Package className="w-3 h-3" />,
        label: "Sent"
      },
      responded: {
        color: "bg-purple-100 text-purple-700",
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Responded"
      },
      accepted: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Accepted"
      },
      completed: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Completed"
      },
      cancelled: {
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-3 h-3" />,
        label: "Cancelled"
      },
      // Offer statuses
      pending: {
        color: "bg-orange-100 text-orange-700",
        icon: <Clock className="w-3 h-3" />,
        label: "Pending"
      },
      rejected: {
        color: "bg-red-100 text-red-700",
        icon: <XCircle className="w-3 h-3" />,
        label: "Rejected"
      },
      withdrawn: {
        color: "bg-gray-100 text-gray-700",
        icon: <XCircle className="w-3 h-3" />,
        label: "Withdrawn"
      },
      // Delivery statuses
      in_transit: {
        color: "bg-blue-100 text-blue-700",
        icon: <Truck className="w-3 h-3" />,
        label: "In Transit"
      },
      delivered: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
        label: "Delivered"
      }
    }

    return statusMap[normalizedStatus] || {
      color: "bg-gray-100 text-gray-700",
      icon: <AlertCircle className="w-3 h-3" />,
      label: status
    }
  }

  const config = getStatusConfig()

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color} ${className}`}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
