"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus, Edit, Trash2, Thermometer } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Location {
  id: string
  name: string
  code: string
  zone_type: string
  capacity: number | null
  current_utilization: number
  temperature_min: number | null
  temperature_max: number | null
  humidity_level: string | null
  description: string | null
  is_active: boolean
  utilization_percentage: number
}

const ZONE_TYPES = [
  { value: "cold_room", label: "Cold Room" },
  { value: "freezer", label: "Freezer" },
  { value: "dry_storage", label: "Dry Storage" },
  { value: "ambient", label: "Ambient" },
  { value: "refrigerated", label: "Refrigerated" }
]

export default function WarehouseLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    zone_type: "dry_storage",
    capacity: "",
    temperature_min: "",
    temperature_max: "",
    humidity_level: "",
    description: "",
    is_active: true
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/locations/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error)
      toast({
        title: "Error",
        description: "Failed to load warehouse locations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem("access_token")
    const url = editingLocation
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/locations/${editingLocation.id}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/locations/`
    
    const method = editingLocation ? "PUT" : "POST"
    
    const payload = {
      name: formData.name,
      code: formData.code,
      zone_type: formData.zone_type,
      capacity: formData.capacity ? parseFloat(formData.capacity) : null,
      temperature_min: formData.temperature_min ? parseFloat(formData.temperature_min) : null,
      temperature_max: formData.temperature_max ? parseFloat(formData.temperature_max) : null,
      humidity_level: formData.humidity_level || null,
      description: formData.description || null,
      is_active: formData.is_active
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Location ${editingLocation ? 'updated' : 'created'} successfully`
        })
        setShowModal(false)
        resetForm()
        fetchLocations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to save location",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save location",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      code: location.code,
      zone_type: location.zone_type,
      capacity: location.capacity?.toString() || "",
      temperature_min: location.temperature_min?.toString() || "",
      temperature_max: location.temperature_max?.toString() || "",
      humidity_level: location.humidity_level || "",
      description: location.description || "",
      is_active: location.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return

    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/warehouse/locations/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Location deleted successfully"
        })
        fetchLocations()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to delete location",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete location",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      zone_type: "dry_storage",
      capacity: "",
      temperature_min: "",
      temperature_max: "",
      humidity_level: "",
      description: "",
      is_active: true
    })
    setEditingLocation(null)
  }

  const getZoneColor = (zoneType: string) => {
    switch (zoneType) {
      case "cold_room": return "bg-blue-100 text-blue-700"
      case "freezer": return "bg-cyan-100 text-cyan-700"
      case "dry_storage": return "bg-yellow-100 text-yellow-700"
      case "ambient": return "bg-green-100 text-green-700"
      case "refrigerated": return "bg-purple-100 text-purple-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600"
    if (percentage >= 70) return "text-orange-600"
    return "text-green-600"
  }

  if (loading) {
    return <div className="p-8 text-center">Loading locations...</div>
  }

  return (
    <div className="p-8 bg-[#F4F2E6] min-h-screen">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Warehouse Locations</h1>
          <p className="text-[#303A4D]/70">Manage storage zones and capacity</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <Card key={location.id} className="p-6 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#303A4D]">{location.name}</h3>
                  <p className="text-sm text-gray-500">{location.code}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(location)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(location.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Zone Type Badge */}
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getZoneColor(location.zone_type)}`}>
                {ZONE_TYPES.find(z => z.value === location.zone_type)?.label || location.zone_type}
              </span>
            </div>

            {/* Capacity */}
            {location.capacity && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Capacity</span>
                  <span className={`font-bold ${getUtilizationColor(location.utilization_percentage)}`}>
                    {location.utilization_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      location.utilization_percentage >= 90 ? 'bg-red-600' :
                      location.utilization_percentage >= 70 ? 'bg-orange-600' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(location.utilization_percentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {location.current_utilization} / {location.capacity} units
                </p>
              </div>
            )}

            {/* Temperature */}
            {(location.temperature_min || location.temperature_max) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Thermometer className="w-4 h-4" />
                <span>
                  {location.temperature_min}°C - {location.temperature_max}°C
                </span>
              </div>
            )}

            {/* Status */}
            <div className="mt-4 pt-4 border-t">
              <span className={`text-xs font-medium ${location.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {location.is_active ? '● Active' : '● Inactive'}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl">
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              {editingLocation ? 'Update location details' : 'Create a new warehouse storage location'}
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Cold Room A"
                  required
                />
              </div>

              <div>
                <Label htmlFor="code">Location Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CR-A-01"
                  required
                  disabled={!!editingLocation}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="zone_type">Zone Type *</Label>
              <Select
                value={formData.zone_type}
                onValueChange={(value) => setFormData({ ...formData, zone_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_TYPES.map((zone) => (
                    <SelectItem key={zone.value} value={zone.value}>
                      {zone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capacity">Capacity (units)</Label>
              <Input
                id="capacity"
                type="number"
                step="0.01"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g., 1000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="temp_min">Min Temperature (°C)</Label>
                <Input
                  id="temp_min"
                  type="number"
                  step="0.1"
                  value={formData.temperature_min}
                  onChange={(e) => setFormData({ ...formData, temperature_min: e.target.value })}
                  placeholder="e.g., 2"
                />
              </div>

              <div>
                <Label htmlFor="temp_max">Max Temperature (°C)</Label>
                <Input
                  id="temp_max"
                  type="number"
                  step="0.1"
                  value={formData.temperature_max}
                  onChange={(e) => setFormData({ ...formData, temperature_max: e.target.value })}
                  placeholder="e.g., 8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="humidity">Humidity Level</Label>
              <Input
                id="humidity"
                value={formData.humidity_level}
                onChange={(e) => setFormData({ ...formData, humidity_level: e.target.value })}
                placeholder="e.g., Low, Medium, High"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
              >
                {editingLocation ? 'Update' : 'Create'} Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
