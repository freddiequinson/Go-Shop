"use client"

import { Download } from "lucide-react"
import { exportUtils } from "@/lib/utils/exportUtils"

interface ExportButtonProps {
  data: any[]
  filename?: string
  format?: 'csv' | 'json'
  label?: string
  className?: string
}

export default function ExportButton({ 
  data, 
  filename = 'export', 
  format = 'csv',
  label = 'Export',
  className = ''
}: ExportButtonProps) {
  const handleExport = () => {
    if (format === 'csv') {
      exportUtils.toCSV(data, `${filename}.csv`)
    } else {
      exportUtils.toJSON(data, `${filename}.json`)
    }
  }

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-4 py-2 bg-[#303A4D] text-white rounded-full font-bold hover:bg-[#303A4D]/90 transition-colors ${className}`}
    >
      <Download className="w-4 h-4" />
      {label}
    </button>
  )
}
