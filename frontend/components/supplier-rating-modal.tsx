"use client"

import { useState, useEffect } from "react"
import { Star, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SupplierRatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, feedback: string, locationId: string) => void
  supplierName: string
}

interface WarehouseLocation {
  id: string
  name: string
  code: string
}

export default function SupplierRatingModal({
  isOpen,
  onClose,
  onSubmit,
  supplierName
}: SupplierRatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [locations, setLocations] = useState<WarehouseLocation[]>([])

  useEffect(() => {
    if (isOpen) {
      fetchLocations()
    }
  }, [isOpen])

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch("http://localhost:8000/api/v1/warehouse/locations", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
        if (data.length > 0) {
          setSelectedLocation(data[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error)
    }
  }

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating")
      return
    }
    onSubmit(rating, feedback, selectedLocation)
    // Reset form
    setRating(0)
    setFeedback("")
  }

  const handleClose = () => {
    setRating(0)
    setFeedback("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rate Supplier</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            How was your experience with <span className="font-bold">{supplierName}</span>?
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Quality Rating</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-lg font-bold text-[#303A4D]">
                  {rating}.0
                </span>
              )}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 5 && "Excellent! 🌟"}
                {rating === 4 && "Very Good! 👍"}
                {rating === 3 && "Good ✓"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Needs Improvement"}
              </p>
            )}
          </div>

          {/* Warehouse Location */}
          <div>
            <Label className="text-base font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Storage Location
            </Label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Where will these goods be stored?
            </p>
          </div>

          {/* Feedback */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              Feedback <span className="text-gray-400 font-normal">(Optional)</span>
            </Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your experience with this supplier..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {feedback.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Skip Rating
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0}
            className="bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 disabled:opacity-50"
          >
            Submit Rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
