import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: "danger" | "success" | "warning" | "info"
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "info",
  isLoading = false
}: ConfirmDialogProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm()
  }

  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <XCircle className="w-12 h-12 text-red-500" />,
          buttonClass: "bg-red-600 hover:bg-red-700 text-white"
        }
      case "success":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-500" />,
          buttonClass: "bg-green-600 hover:bg-green-700 text-white"
        }
      case "warning":
        return {
          icon: <AlertTriangle className="w-12 h-12 text-orange-500" />,
          buttonClass: "bg-orange-600 hover:bg-orange-700 text-white"
        }
      default:
        return {
          icon: <Info className="w-12 h-12 text-blue-500" />,
          buttonClass: "bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
        }
    }
  }

  const config = getVariantConfig()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">{config.icon}</div>
          
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            <DialogDescription className="text-base">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-3 mt-6 w-full">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 ${config.buttonClass}`}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
