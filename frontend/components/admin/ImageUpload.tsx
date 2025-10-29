"use client"

import { useState, useRef } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import { imageUtils } from "@/lib/utils/imageUtils"
import Image from "next/image"

interface ImageUploadProps {
  onUpload: (base64: string) => void
  maxSizeMB?: number
  compress?: boolean
  preview?: boolean
  className?: string
}

export default function ImageUpload({ 
  onUpload, 
  maxSizeMB = 5,
  compress = true,
  preview = true,
  className = ''
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Validate image
      const validation = imageUtils.validateImage(file, maxSizeMB)
      if (!validation.valid) {
        setError(validation.error || 'Invalid image')
        setUploading(false)
        return
      }

      // Convert to base64
      let base64: string
      if (compress) {
        base64 = await imageUtils.compressImage(file)
      } else {
        base64 = await imageUtils.fileToBase64(file)
      }

      // Set preview
      if (preview) {
        setPreviewUrl(base64)
      }

      // Call upload callback
      onUpload(base64)
    } catch (err) {
      setError('Failed to process image')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full border-2 border-dashed border-[#303A4D]/20 rounded-3xl p-8 hover:border-[#FED141] transition-colors"
        >
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-[#FED141] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#303A4D]/60">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#FED141]/20 rounded-2xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-[#303A4D]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#303A4D]">Click to upload image</p>
                  <p className="text-sm text-[#303A4D]/60">
                    PNG, JPG, GIF up to {maxSizeMB}MB
                  </p>
                </div>
              </>
            )}
          </div>
        </button>
      ) : (
        <div className="relative">
          <div className="relative w-full h-64 bg-[#F4F2E6] rounded-3xl overflow-hidden">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
