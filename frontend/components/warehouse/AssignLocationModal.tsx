"use client"

import { useState, useEffect } from "react"
import { X, MapPin, Thermometer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Location {
  id: string
  name: string
  code: string
  zone_type: string
  temperature_min?: number
  temperature_max?: number
  capacity?: number
  current_utilization?: number
  is_active: boolean
}

interface AssignLocationModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  currentLocationId?: string
  currentLocationName?: string
  onSuccess: () => void
}

const zoneIcons: Record<string, string> = {
  COLD_ROOM: '❄️',
  FREEZER: '🧊',
  REFRIGERATED: '🌡️',
  DRY_STORAGE: '📦',
  AMBIENT: '🌤️'
}

const zoneColors: Record<string, string> = {
  COLD_ROOM: 'bg-sky-100 text-sky-900 border-sky-200',
  FREEZER: 'bg-blue-100 text-blue-900 border-blue-200',
  REFRIGERATED: 'bg-cyan-100 text-cyan-900 border-cyan-200',
  DRY_STORAGE: 'bg-amber-100 text-amber-900 border-amber-200',
  AMBIENT: 'bg-yellow-100 text-yellow-900 border-yellow-200'
}

export default function AssignLocationModal({
  isOpen,
  onClose,
  productId,
  productName,
  currentLocationId,
  currentLocationName,
  onSuccess
}: AssignLocationModalProps) {
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState(currentLocationId || "")
  const [shelfBin, setShelfBin] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchLocations()
    }
  }, [isOpen])

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/locations/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter only active locations
        const activeLocations = data.filter((loc: Location) => loc.is_active)
        setLocations(activeLocations)
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error)
      toast({
        title: "Error",
        description: "Failed to load warehouse locations",
        variant: "destructive"
      })
    } finally {
      setLoadingLocations(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLocationId) {
      toast({
        title: "Location Required",
        description: "Please select a warehouse location",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/inventory/${productId}/assign-location`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            warehouse_location_id: selectedLocationId,
            location_in_warehouse: shelfBin || undefined,
            notes: notes || undefined
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success!",
          description: `Product assigned to ${data.location_name}${shelfBin ? ` (${shelfBin})` : ''}`,
        })
        onSuccess()
        onClose()
        // Reset form
        setShelfBin("")
        setNotes("")
      } else {
        const error = await response.json()
        toast({
          title: "Assignment Failed",
          description: error.detail || "Failed to assign warehouse location",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Assignment error:", error)
      toast({
        title: "Error",
        description: "Failed to assign warehouse location",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#303A4D]">Assign Warehouse Location</h2>
              <p className="text-sm text-[#303A4D]/70">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#F4F2E6] flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-[#303A4D]" />
          </button>
        </div>

        {/* Current Location */}
        {currentLocationName && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Current Location</p>
            <p className="text-lg font-bold text-gray-900">{currentLocationName}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Selection */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-3">
              Select Warehouse Location *
            </label>
            {loadingLocations ? (
              <div className="text-center py-8 text-[#303A4D]/60">
                Loading locations...
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-8 text-[#303A4D]/60">
                No active warehouse locations found
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {locations.map((location) => {
                  const isSelected = selectedLocationId === location.id
                  const zoneColor = zoneColors[location.zone_type] || 'bg-gray-100 text-gray-900 border-gray-200'
                  const zoneIcon = zoneIcons[location.zone_type] || '📍'
                  
                  return (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => setSelectedLocationId(location.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[#FED141] bg-[#FED141]/10 ring-2 ring-[#FED141]/50'
                          : 'border-gray-200 hover:border-[#FED141]/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 ${zoneColor}`}>
                          {zoneIcon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#303A4D] truncate">{location.name}</p>
                          <p className="text-xs text-[#303A4D]/60">Code: {location.code}</p>
                          {location.temperature_min !== undefined && location.temperature_max !== undefined && (
                            <div className="flex items-center gap-1 mt-1">
                              <Thermometer className="w-3 h-3 text-[#303A4D]/60" />
                              <p className="text-xs text-[#303A4D]/60">
                                {location.temperature_min}°C - {location.temperature_max}°C
                              </p>
                            </div>
                          )}
                          {location.capacity && (
                            <p className="text-xs text-[#303A4D]/60 mt-1">
                              Capacity: {location.current_utilization || 0}/{location.capacity}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Shelf/Bin Location */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Shelf/Bin Location (Optional)
            </label>
            <input
              type="text"
              value={shelfBin}
              onChange={(e) => setShelfBin(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              placeholder="e.g., A-12-3, Shelf 5, Bin 42"
            />
            <p className="text-xs text-[#303A4D]/60 mt-2">
              Specific shelf or bin number within the location
            </p>
          </div>

          {/* Selected Location Preview */}
          {selectedLocation && (
            <div className={`rounded-2xl p-4 border-2 ${zoneColors[selectedLocation.zone_type] || 'bg-gray-100 border-gray-200'}`}>
              <p className="font-bold mb-2">Selected Location:</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{zoneIcons[selectedLocation.zone_type] || '📍'}</span>
                <div>
                  <p className="font-bold">{selectedLocation.name}</p>
                  <p className="text-sm opacity-80">
                    {selectedLocation.code}
                    {shelfBin && ` • ${shelfBin}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[#303A4D] font-bold mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-[80px]"
              placeholder="Add any notes about this location assignment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white hover:bg-[#F4F2E6] text-[#303A4D] rounded-full py-3 font-bold border-2 border-[#303A4D]"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-3 font-bold"
              disabled={loading || !selectedLocationId}
            >
              {loading ? "Assigning..." : "Assign Location"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
