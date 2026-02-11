"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Calendar, Palette, Upload, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { getApiBaseUrl } from "@/lib/api/url-helper"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

const LOTTIE_ANIMATIONS = [
  { value: "", label: "None", file: null },
  { value: "Stream of Hearts.lottie", label: "Stream of Hearts", file: "/animations/Stream of Hearts.lottie" },
  { value: "Rose.lottie", label: "Rose", file: "/animations/Rose.lottie" },
  { value: "Valentine's Day.lottie", label: "Valentine's Day", file: "/animations/Valentine's Day.lottie" },
]

const COLOR_PRESETS = [
  { name: "Valentine Red", value: "#DC2626" },
  { name: "Rose Pink", value: "#EC4899" },
  { name: "Christmas Green", value: "#16A34A" },
  { name: "Christmas Red", value: "#B91C1C" },
  { name: "Easter Purple", value: "#7C3AED" },
  { name: "Easter Yellow", value: "#EAB308" },
  { name: "Independence Gold", value: "#D97706" },
]

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [animationIndex, setAnimationIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color_code: "#DC2626",
    promo_image_url: "",
    lottie_animation: "",
    start_date: "",
    end_date: "",
    show_popup: true,
    is_active: true,
  })

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setFetching(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/events/${eventId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const event = await response.json()
        // Format dates for datetime-local input
        const formatDate = (dateStr: string) => {
          const date = new Date(dateStr)
          return date.toISOString().slice(0, 16)
        }
        
        setFormData({
          name: event.name || "",
          description: event.description || "",
          color_code: event.color_code || "#DC2626",
          promo_image_url: event.promo_image_url || "",
          lottie_animation: event.lottie_animation || "",
          start_date: formatDate(event.start_date),
          end_date: formatDate(event.end_date),
          show_popup: event.show_popup ?? true,
          is_active: event.is_active ?? true,
        })
        
        // Set animation index
        const animIdx = LOTTIE_ANIMATIONS.findIndex(a => a.value === event.lottie_animation)
        setAnimationIndex(animIdx >= 0 ? animIdx : 0)
      } else {
        setError("Failed to load event")
      }
    } catch (err) {
      setError("An error occurred while loading the event")
    } finally {
      setFetching(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const token = localStorage.getItem("access_token")
      
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        
        const response = await fetch(`${getApiBaseUrl()}/admin/upload-image`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image: base64,
            folder: "events"
          })
        })

        if (response.ok) {
          const data = await response.json()
          setFormData(prev => ({ ...prev, promo_image_url: data.url }))
        } else {
          setFormData(prev => ({ ...prev, promo_image_url: base64 }))
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Upload failed:", err)
      setUploading(false)
    }
  }

  const selectAnimation = (index: number) => {
    setAnimationIndex(index)
    setFormData(prev => ({ ...prev, lottie_animation: LOTTIE_ANIMATIONS[index].value }))
  }

  const nextAnimation = () => {
    const next = (animationIndex + 1) % LOTTIE_ANIMATIONS.length
    selectAnimation(next)
  }

  const prevAnimation = () => {
    const prev = (animationIndex - 1 + LOTTIE_ANIMATIONS.length) % LOTTIE_ANIMATIONS.length
    selectAnimation(prev)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.name || !formData.start_date || !formData.end_date) {
      setError("Please fill in all required fields")
      return
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setError("End date must be after start date")
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...formData,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
        })
      })

      if (response.ok) {
        router.push(`/admin/packages/events/${eventId}`)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to update event")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/admin/packages/events/${eventId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-500 mt-1">Update the seasonal event details</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Event Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Valentine's Day 2026"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the event..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
          />
        </div>

        {/* Color Selection with Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Palette className="w-4 h-4 inline mr-2" />
            Theme Color *
          </label>
          
          {/* Color Preview Box */}
          <div 
            className="mb-4 p-4 rounded-xl border-2 flex items-center gap-4"
            style={{ 
              borderColor: formData.color_code,
              backgroundColor: `${formData.color_code}15`
            }}
          >
            <div 
              className="w-16 h-16 rounded-lg shadow-sm"
              style={{ backgroundColor: formData.color_code }}
            />
            <div>
              <p className="font-medium text-gray-900">Selected Color</p>
              <p className="text-sm font-mono" style={{ color: formData.color_code }}>
                {formData.color_code}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-3">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color_code: color.value })}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  formData.color_code === color.value 
                    ? 'border-gray-900 scale-110 ring-2 ring-offset-2' 
                    : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Custom:</span>
            <input
              type="color"
              value={formData.color_code}
              onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={formData.color_code}
              onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
              placeholder="#DC2626"
              className="w-28 px-3 py-1 border border-gray-200 rounded-lg text-sm font-mono"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Start Date *
            </label>
            <input
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
              required
            />
          </div>
        </div>

        {/* Lottie Animation Carousel */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Animation
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={prevAnimation}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 flex flex-col items-center">
              <div 
                className="w-32 h-32 rounded-xl flex items-center justify-center border-2 transition-all"
                style={{ 
                  borderColor: formData.color_code,
                  backgroundColor: `${formData.color_code}10`
                }}
              >
                {LOTTIE_ANIMATIONS[animationIndex].file ? (
                  <DotLottieReact
                    src={LOTTIE_ANIMATIONS[animationIndex].file}
                    loop
                    autoplay
                    style={{ width: 100, height: 100 }}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No Animation</span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">
                {LOTTIE_ANIMATIONS[animationIndex].label}
              </p>
              <div className="flex gap-1 mt-2">
                {LOTTIE_ANIMATIONS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectAnimation(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === animationIndex ? 'bg-gray-800 w-4' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            <button
              type="button"
              onClick={nextAnimation}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Promo Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Upload className="w-4 h-4 inline mr-2" />
            Promo Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {formData.promo_image_url ? (
            <div className="relative inline-block">
              <img
                src={formData.promo_image_url}
                alt="Promo"
                className="w-48 h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, promo_image_url: "" })}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gray-400 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-sm text-gray-500">Uploading...</span>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload</span>
                </>
              )}
            </button>
          )}
          <p className="text-xs text-gray-500 mt-2">Optional: Add a promotional banner image</p>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.show_popup}
              onChange={(e) => setFormData({ ...formData, show_popup: e.target.checked })}
              className="w-4 h-4 text-[#93C90F] rounded focus:ring-[#93C90F]"
            />
            <span className="text-sm text-gray-700">Show popup on landing page</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[#93C90F] rounded focus:ring-[#93C90F]"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <Link
            href={`/admin/packages/events/${eventId}`}
            className="px-6 py-2 text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
