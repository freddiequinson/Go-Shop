"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Save, Loader2, Calculator, ExternalLink, Plus, Trash2, DollarSign, Ruler, Map, Truck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/contexts/auth-context"
import apiClient from "@/lib/api/client"

interface DeliverySettings {
  id: string
  warehouse_name: string
  warehouse_latitude: number
  warehouse_longitude: number
  warehouse_address: string | null
  pricing_method: string
  flat_rate: number | null
  base_price: number | null
  price_per_km: number | null
  free_delivery_radius: number | null
  max_delivery_distance: number | null
  zone_prices: Record<string, number> | null
  yango_clid: string | null
  yango_apikey: string | null
  yango_ref: string | null
  is_active: boolean
  default_fare_class: string
  currency: string
  notes: string | null
}

interface TestPriceResult {
  price: number
  currency: string
  pricing_method: string
  distance?: number
  is_free_delivery: boolean
  price_breakdown?: Record<string, any>
  min_price?: number
  time?: number
  waiting_time?: number
  class_text?: string
  yango_link?: string
}

export default function DeliverySettingsPage() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestPriceResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    warehouse_name: "Main Warehouse",
    warehouse_latitude: "",
    warehouse_longitude: "",
    warehouse_address: "",
    pricing_method: "flat",
    flat_rate: "10.00",
    base_price: "5.00",
    price_per_km: "2.00",
    free_delivery_radius: "2.0",
    max_delivery_distance: "20.0",
    zone_prices: {} as Record<string, number>,
    yango_clid: "",
    yango_apikey: "",
    yango_ref: "goshopghana",
    default_fare_class: "econom",
    currency: "GHS",
    notes: ""
  })

  const [newZone, setNewZone] = useState({ name: "", price: "" })
  const [testLocation, setTestLocation] = useState({
    latitude: "",
    longitude: "",
    zone_name: ""
  })

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (isAuthLoading) {
      return
    }
    
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    if (user?.user_type?.toUpperCase() !== "ADMIN") {
      router.push("/")
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive"
      })
      return
    }
    
    loadSettings()
  }, [isAuthenticated, user, isAuthLoading])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get("/delivery-settings/")
      setSettings(response.data)
      setFormData({
        warehouse_name: response.data.warehouse_name || "Main Warehouse",
        warehouse_latitude: response.data.warehouse_latitude?.toString() || "",
        warehouse_longitude: response.data.warehouse_longitude?.toString() || "",
        warehouse_address: response.data.warehouse_address || "",
        pricing_method: response.data.pricing_method || "flat",
        flat_rate: response.data.flat_rate?.toString() || "10.00",
        base_price: response.data.base_price?.toString() || "5.00",
        price_per_km: response.data.price_per_km?.toString() || "2.00",
        free_delivery_radius: response.data.free_delivery_radius?.toString() || "2.0",
        max_delivery_distance: response.data.max_delivery_distance?.toString() || "20.0",
        zone_prices: response.data.zone_prices || {},
        yango_clid: response.data.yango_clid || "",
        yango_apikey: response.data.yango_apikey || "",
        yango_ref: response.data.yango_ref || "goshopghana",
        default_fare_class: response.data.default_fare_class || "econom",
        currency: response.data.currency || "GHS",
        notes: response.data.notes || ""
      })
      setIsEditing(false) // View mode when settings exist
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No settings yet, use defaults (first-time setup)
        setIsEditing(true) // Edit mode for first-time setup
      } else {
        console.error("Failed to load settings:", error)
        toast({
          title: "Error",
          description: "Failed to load delivery settings",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.warehouse_latitude || !formData.warehouse_longitude) {
      toast({
        title: "Validation Error",
        description: "Warehouse location (latitude and longitude) is required",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        warehouse_name: formData.warehouse_name,
        warehouse_latitude: parseFloat(formData.warehouse_latitude),
        warehouse_longitude: parseFloat(formData.warehouse_longitude),
        warehouse_address: formData.warehouse_address || null,
        pricing_method: formData.pricing_method,
        flat_rate: parseFloat(formData.flat_rate),
        base_price: parseFloat(formData.base_price),
        price_per_km: parseFloat(formData.price_per_km),
        free_delivery_radius: parseFloat(formData.free_delivery_radius),
        max_delivery_distance: parseFloat(formData.max_delivery_distance),
        zone_prices: Object.keys(formData.zone_prices).length > 0 ? formData.zone_prices : null,
        yango_clid: formData.yango_clid || null,
        yango_apikey: formData.yango_apikey || null,
        yango_ref: formData.yango_ref || "goshopghana",
        is_active: true,
        default_fare_class: formData.default_fare_class,
        currency: formData.currency,
        notes: formData.notes || null
      }

      if (settings) {
        await apiClient.put(`/delivery-settings/${settings.id}`, payload)
        toast({
          title: "Success",
          description: "Delivery settings updated successfully"
        })
      } else {
        await apiClient.post("/delivery-settings/", payload)
        toast({
          title: "Success",
          description: "Delivery settings created successfully"
        })
      }
      
      loadSettings()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestPrice = async () => {
    if (!testLocation.latitude || !testLocation.longitude) {
      toast({
        title: "Validation Error",
        description: "Please enter test destination coordinates",
        variant: "destructive"
      })
      return
    }

    try {
      setIsTesting(true)
      const response = await apiClient.post("/delivery-settings/calculate-price", {
        destination_latitude: parseFloat(testLocation.latitude),
        destination_longitude: parseFloat(testLocation.longitude),
        zone_name: testLocation.zone_name || null,
        fare_class: formData.default_fare_class
      })
      
      setTestResult(response.data)
      toast({
        title: "Price Calculated",
        description: response.data.is_free_delivery 
          ? "FREE DELIVERY!" 
          : `Delivery cost: ${response.data.currency} ${response.data.price.toFixed(2)}`
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to calculate price",
        variant: "destructive"
      })
      setTestResult(null)
    } finally {
      setIsTesting(false)
    }
  }

  const addZone = () => {
    if (!newZone.name || !newZone.price) {
      toast({
        title: "Validation Error",
        description: "Please enter zone name and price",
        variant: "destructive"
      })
      return
    }

    setFormData({
      ...formData,
      zone_prices: {
        ...formData.zone_prices,
        [newZone.name]: parseFloat(newZone.price)
      }
    })
    setNewZone({ name: "", price: "" })
    toast({
      title: "Zone Added",
      description: `${newZone.name} added successfully`
    })
  }

  const removeZone = (zoneName: string) => {
    const { [zoneName]: removed, ...rest } = formData.zone_prices
    setFormData({
      ...formData,
      zone_prices: rest
    })
    toast({
      title: "Zone Removed",
      description: `${zoneName} removed successfully`
    })
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            warehouse_latitude: position.coords.latitude.toString(),
            warehouse_longitude: position.coords.longitude.toString()
          })
          toast({
            title: "Location Captured",
            description: "Warehouse location set to your current position"
          })
        },
        (error) => {
          toast({
            title: "Error",
            description: "Failed to get current location",
            variant: "destructive"
          })
        }
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FED141]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <div className="bg-[#303A4D] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Delivery Settings</h1>
              <p className="text-white/70">
                {settings && !isEditing 
                  ? "View your current delivery configuration" 
                  : "Configure warehouse location and delivery pricing"}
              </p>
            </div>
            {settings && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D]"
              >
                Edit Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* View Mode - Show current settings */}
        {settings && !isEditing ? (
          <div className="space-y-6">
            {/* Current Settings Display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Warehouse Location
              </h2>
              <div className="space-y-3 text-gray-700">
                <div><span className="font-semibold">Name:</span> {settings.warehouse_name}</div>
                <div><span className="font-semibold">Coordinates:</span> {settings.warehouse_latitude}, {settings.warehouse_longitude}</div>
                {settings.warehouse_address && (
                  <div><span className="font-semibold">Address:</span> {settings.warehouse_address}</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing Configuration
              </h2>
              <div className="space-y-3 text-gray-700">
                <div><span className="font-semibold">Method:</span> {settings.pricing_method.replace('_', ' ').toUpperCase()}</div>
                {settings.pricing_method === 'flat' && settings.flat_rate && (
                  <div><span className="font-semibold">Flat Rate:</span> {settings.currency} {settings.flat_rate}</div>
                )}
                {settings.pricing_method === 'distance' && (
                  <>
                    <div><span className="font-semibold">Base Price:</span> {settings.currency} {settings.base_price}</div>
                    <div><span className="font-semibold">Price per KM:</span> {settings.currency} {settings.price_per_km}</div>
                    <div><span className="font-semibold">Free Delivery Radius:</span> {settings.free_delivery_radius} km</div>
                    <div><span className="font-semibold">Max Distance:</span> {settings.max_delivery_distance} km</div>
                  </>
                )}
                <div><span className="font-semibold">Currency:</span> {settings.currency}</div>
                <div><span className="font-semibold">Status:</span> <span className="text-green-600 font-semibold">{settings.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>
            </div>

            {settings.notes && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#303A4D] mb-4">Notes</h2>
                <p className="text-gray-700">{settings.notes}</p>
              </div>
            )}
          </div>
        ) : (
          /* Edit Mode - Show form */
          <>
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Warehouse Location Section */}
          <div>
            <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Warehouse Location
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Name
                </label>
                <input
                  type="text"
                  value={formData.warehouse_name}
                  onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="Main Warehouse"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.warehouse_latitude}
                    onChange={(e) => setFormData({ ...formData, warehouse_latitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    placeholder="5.6037"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.warehouse_longitude}
                    onChange={(e) => setFormData({ ...formData, warehouse_longitude: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    placeholder="-0.1870"
                  />
                </div>
              </div>

              <Button
                onClick={getCurrentLocation}
                variant="outline"
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warehouse Address (Optional)
                </label>
                <textarea
                  value={formData.warehouse_address}
                  onChange={(e) => setFormData({ ...formData, warehouse_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  rows={2}
                  placeholder="123 Main Street, Accra, Ghana"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Method Selection */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Choose Pricing Method
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={() => setFormData({ ...formData, pricing_method: "flat" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.pricing_method === "flat"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <DollarSign className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Flat Rate</div>
              <div className="text-xs text-gray-500">Simple fixed price</div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, pricing_method: "distance" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.pricing_method === "distance"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Ruler className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Distance-Based</div>
              <div className="text-xs text-gray-500">Price per km</div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, pricing_method: "zone" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.pricing_method === "zone"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Map className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Zone-Based</div>
              <div className="text-xs text-gray-500">By area</div>
            </button>

            <button
              onClick={() => setFormData({ ...formData, pricing_method: "yango" })}
              className={`p-4 rounded-lg border-2 transition-all ${
                formData.pricing_method === "yango"
                  ? "border-[#FED141] bg-[#FED141]/10"
                  : "border-gray-200 hover:border-[#FED141]/50"
              }`}
            >
              <Truck className="w-6 h-6 mx-auto mb-2" />
              <div className="font-bold">Yango API</div>
              <div className="text-xs text-gray-500">Real-time</div>
            </button>
          </div>

          {/* Flat Rate Settings */}
          {formData.pricing_method === "flat" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-3">Flat Rate Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Price (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.flat_rate}
                  onChange={(e) => setFormData({ ...formData, flat_rate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="10.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  All deliveries will cost this fixed amount
                </p>
              </div>
            </div>
          )}

          {/* Distance-Based Settings */}
          {formData.pricing_method === "distance" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-green-900 mb-3">Distance-Based Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    placeholder="5.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per KM (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_per_km}
                    onChange={(e) => setFormData({ ...formData, price_per_km: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    placeholder="2.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Delivery Radius (km) ⭐
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.free_delivery_radius}
                    onChange={(e) => setFormData({ ...formData, free_delivery_radius: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    placeholder="2.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    FREE delivery within this radius
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Delivery Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.max_delivery_distance}
                    onChange={(e) => setFormData({ ...formData, max_delivery_distance: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    placeholder="20.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum delivery distance
                  </p>
                </div>
              </div>

              <div className="bg-white rounded p-3 text-sm">
                <strong>Example:</strong> Customer 5km away = GHS {formData.base_price} + ({Math.max(0, 5 - parseFloat(formData.free_delivery_radius || "0"))}km × GHS {formData.price_per_km}) = GHS {(parseFloat(formData.base_price) + Math.max(0, 5 - parseFloat(formData.free_delivery_radius || "0")) * parseFloat(formData.price_per_km)).toFixed(2)}
              </div>
            </div>
          )}

          {/* Zone-Based Settings */}
          {formData.pricing_method === "zone" && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-purple-900 mb-3">Zone-Based Configuration</h3>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="Zone name (e.g., Accra Central)"
                />
                <input
                  type="number"
                  step="0.01"
                  value={newZone.price}
                  onChange={(e) => setNewZone({ ...newZone, price: e.target.value })}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="Price"
                />
                <Button onClick={addZone} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {Object.entries(formData.zone_prices).map(([zone, price]) => (
                  <div key={zone} className="flex items-center justify-between bg-white p-3 rounded">
                    <div>
                      <span className="font-medium">{zone}</span>
                      <span className="text-gray-500 ml-2">GHS {price.toFixed(2)}</span>
                    </div>
                    <Button
                      onClick={() => removeZone(zone)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {Object.keys(formData.zone_prices).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No zones added yet. Add zones above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Yango API Settings */}
          {formData.pricing_method === "yango" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-yellow-900 mb-3">Yango API Configuration</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mb-4">
                <strong>Note:</strong> Contact Yango at{" "}
                <a href="mailto:integration-support@yango.com" className="underline">
                  integration-support@yango.com
                </a>{" "}
                to get API credentials
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yango Client ID
                </label>
                <input
                  type="text"
                  value={formData.yango_clid}
                  onChange={(e) => setFormData({ ...formData, yango_clid: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="your-client-id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yango API Key
                </label>
                <input
                  type="password"
                  value={formData.yango_apikey}
                  onChange={(e) => setFormData({ ...formData, yango_apikey: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="your-api-key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Fare Class
                </label>
                <select
                  value={formData.default_fare_class}
                  onChange={(e) => setFormData({ ...formData, default_fare_class: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                >
                  <option value="econom">Economy</option>
                  <option value="business">Comfort</option>
                  <option value="comfortplus">Comfort+</option>
                  <option value="minivan">Minivan</option>
                  <option value="vip">Business</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Test Price Calculator */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#303A4D] mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Test Price Calculator
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Destination Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={testLocation.latitude}
                  onChange={(e) => setTestLocation({ ...testLocation, latitude: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="5.6500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Destination Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={testLocation.longitude}
                  onChange={(e) => setTestLocation({ ...testLocation, longitude: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                  placeholder="-0.2000"
                />
              </div>
            </div>

            {formData.pricing_method === "zone" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Name
                </label>
                <select
                  value={testLocation.zone_name}
                  onChange={(e) => setTestLocation({ ...testLocation, zone_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                >
                  <option value="">Select zone...</option>
                  {Object.keys(formData.zone_prices).map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={handleTestPrice}
              disabled={isTesting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Test Price
                    </>
                  )}
                </Button>

            {testResult && (
              <div className={`border-2 rounded-lg p-4 ${
                testResult.is_free_delivery 
                  ? "bg-green-50 border-green-200" 
                  : "bg-blue-50 border-blue-200"
              }`}>
                <h3 className="font-bold mb-2">
                  {testResult.is_free_delivery ? "🎉 FREE DELIVERY!" : "Test Result:"}
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Method:</strong> {testResult.pricing_method}</p>
                  <p><strong>Price:</strong> {testResult.currency} {testResult.price.toFixed(2)}</p>
                  {testResult.distance && (
                    <p><strong>Distance:</strong> {testResult.distance.toFixed(2)} km</p>
                  )}
                  {testResult.price_breakdown && (
                    <div className="mt-2 p-2 bg-white rounded text-xs">
                      <strong>Breakdown:</strong>
                      <pre className="mt-1">{JSON.stringify(testResult.price_breakdown, null, 2)}</pre>
                    </div>
                  )}
                  {testResult.yango_link && (
                    <a
                      href={testResult.yango_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2"
                    >
                      Open in Yango App <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#FED141] text-[#303A4D] hover:bg-[#FED141]/90 font-bold"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
