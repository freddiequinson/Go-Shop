import { useState, useEffect } from "react"
import { Plus, Trash2, Star, MapPinned, Loader2, Edit2, X, Map } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyErrorMessage, getErrorTitle } from "@/lib/utils/error-messages"
import { userAddressesService } from "@/lib/api/services"
import type { UserAddressResponse, UserAddressCreate } from "@/lib/types"

const GHANA_REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Western",
  "Eastern",
  "Central",
  "Northern",
  "Upper East",
  "Upper West",
  "Volta",
  "Bono",
  "Bono East",
  "Ahafo",
  "Savannah",
  "North East",
  "Oti",
  "Western North",
]

export function AddressesTab() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<UserAddressResponse | null>(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [fullAddress, setFullAddress] = useState("")
  const [addressForm, setAddressForm] = useState<UserAddressCreate>({
    label: "",
    street: "",
    area: "",
    city: "",
    region: "",
    phone: "",
    latitude: "",
    longitude: "",
    additional_info: "",
    is_default: false,
  })

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const response = await userAddressesService.getAddresses()
      setAddresses(response.addresses || [])
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast({
        title: "Unable to Load Addresses",
        description: "We couldn't load your saved addresses. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingAddresses(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()

      if (data.address) {
        // Map Ghana regions from geocoding data
        const ghanaRegionMap: { [key: string]: string } = {
          "Greater Accra": "Greater Accra",
          "Accra": "Greater Accra",
          "Ashanti": "Ashanti",
          "Kumasi": "Ashanti",
          "Western": "Western",
          "Eastern": "Eastern",
          "Central": "Central",
          "Northern": "Northern",
          "Upper East": "Upper East",
          "Upper West": "Upper West",
          "Volta": "Volta",
          "Bono": "Bono",
          "Bono East": "Bono East",
          "Ahafo": "Ahafo",
          "Savannah": "Savannah",
          "North East": "North East",
          "Oti": "Oti",
          "Western North": "Western North",
        }

        const detectedRegion = data.address.state || data.address.region || ""
        const mappedRegion = ghanaRegionMap[detectedRegion] || ""

        const street = data.address.road || data.address.street || ""
        const area = data.address.suburb || data.address.neighbourhood || data.address.quarter || ""
        const city = data.address.city || data.address.town || data.address.village || ""
        
        // Build full address string
        const addressParts = [street, area, city, mappedRegion].filter(Boolean)
        const fullAddr = addressParts.join(", ")
        
        setFullAddress(fullAddr)
        setAddressForm((prev) => ({
          ...prev,
          street: street || "Address",
          area: area || city || "Area",
          city: city || "City",
          region: mappedRegion || "Greater Accra",
          latitude: lat.toString(),
          longitude: lng.toString(),
        }))

        toast({
          title: "Location captured",
          description: `Address filled from GPS coordinates`,
        })
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setAddressForm((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }))
      toast({
        title: "Location captured",
        description: "Coordinates saved. Please fill in address details manually.",
      })
    }
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Available",
        description: "Your browser doesn't support location services. Please enter your address manually.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Getting location...",
      description: "Please allow location access",
    })

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        await reverseGeocode(latitude, longitude)
      },
      (error) => {
        toast({
          title: "Location Access Denied",
          description: "Please enable location access in your browser settings to use this feature.",
          variant: "destructive",
        })
      }
    )
  }

  const handleSelectOnMap = () => {
    setShowMapModal(true)
  }

  const handleMapClick = async (lat: number, lng: number) => {
    await reverseGeocode(lat, lng)
    setShowMapModal(false)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()

    // Parse the full address if user typed it manually
    if (fullAddress && !addressForm.latitude) {
      // User typed address without GPS - split it
      const parts = fullAddress.split(",").map(p => p.trim())
      if (parts.length >= 1) {
        setAddressForm(prev => ({
          ...prev,
          street: parts[0] || "Address",
          area: parts[1] || parts[0] || "Area",
          city: parts[2] || parts[1] || "City",
          region: parts[3] || "Greater Accra",
        }))
      }
    }

    try {
      setSavingAddress(true)
      
      // Use account phone if no phone provided
      const finalForm = {
        ...addressForm,
        phone: addressForm.phone || user?.phone_number || "",
      }
      
      if (editingAddress) {
        // Update existing address
        const updated = await userAddressesService.updateAddress(editingAddress.id, finalForm)
        setAddresses((prev) => prev.map((addr) => (addr.id === updated.id ? updated : addr)))
        toast({
          title: "Success",
          description: "Address updated successfully",
        })
      } else {
        // Create new address
        const newAddress = await userAddressesService.createAddress(finalForm)
        setAddresses((prev) => [...prev, newAddress])
        toast({
          title: "Success",
          description: "Address added successfully",
        })
      }

      // Reset form
      setShowAddressForm(false)
      setEditingAddress(null)
      resetForm()
    } catch (error: any) {
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSavingAddress(false)
    }
  }

  const handleEditAddress = (address: UserAddressResponse) => {
    setEditingAddress(address)
    const fullAddr = `${address.street}, ${address.area}, ${address.city}, ${address.region}`
    setFullAddress(fullAddr)
    setAddressForm({
      label: address.label,
      street: address.street,
      area: address.area,
      city: address.city,
      region: address.region,
      phone: address.phone,
      latitude: address.latitude || "",
      longitude: address.longitude || "",
      additional_info: address.additional_info || "",
      is_default: address.is_default,
    })
    setShowAddressForm(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return

    try {
      await userAddressesService.deleteAddress(addressId)
      setAddresses((prev) => prev.filter((addr) => addr.id !== addressId))
      toast({
        title: "Success",
        description: "Address deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Unable to Delete",
        description: "We couldn't delete this address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await userAddressesService.setDefaultAddress(addressId)
      // Refresh addresses to get updated default status
      await fetchAddresses()
      toast({
        title: "Success",
        description: "Default address updated",
      })
    } catch (error) {
      toast({
        title: "Unable to Update",
        description: "We couldn't set this as your default address. Please try again.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFullAddress("")
    setAddressForm({
      label: "",
      street: "",
      area: "",
      city: "",
      region: "",
      phone: user?.phone_number || "",
      latitude: "",
      longitude: "",
      additional_info: "",
      is_default: false,
    })
  }

  const handleCancelForm = () => {
    setShowAddressForm(false)
    setEditingAddress(null)
    resetForm()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-[#303A4D]">Delivery Addresses</h3>
        {!showAddressForm && (
          <Button
            onClick={() => {
              setShowAddressForm(true)
              setEditingAddress(null)
              resetForm()
            }}
            className="bg-[#303A4D] hover:bg-[#303A4D]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Address
          </Button>
        )}
      </div>

      {showAddressForm && (
        <Card className="p-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-[#303A4D]">
              {editingAddress ? "Edit Address" : "New Address"}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancelForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <form onSubmit={handleSaveAddress} className="space-y-4">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="label" className="block text-sm font-medium text-gray-700">
                Label <span className="text-red-500">*</span>
              </Label>
              <Input
                id="label"
                value={addressForm.label}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))}
                required
                placeholder="e.g., Home, Office, Mom's House"
                className="w-full"
              />
            </div>

            {/* Full Address */}
            <div className="space-y-2">
              <Label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700">
                Delivery Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="fullAddress"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                required
                placeholder="Enter your full delivery address or use the location button below"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FED141] min-h-[80px]"
              />
              <p className="text-xs text-gray-500">
                Tip: Click "Get Current Location" below to auto-fill from GPS
              </p>
            </div>

            {/* Phone Number (Optional if user has one) */}
            {!user?.phone_number && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="0241234567"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Add a phone number to your account to skip this step next time
                </p>
              </div>
            )}

            {/* Additional Info (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="additional_info" className="block text-sm font-medium text-gray-700">
                Landmark / Special Instructions (Optional)
              </Label>
              <Input
                id="additional_info"
                value={addressForm.additional_info}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, additional_info: e.target.value }))
                }
                placeholder="e.g., Behind the church, Gate code: 1234"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  variant="outline"
                  className="flex-1"
                >
                  <MapPinned className="w-4 h-4 mr-2" />
                  Get Current Location
                </Button>
                <Button
                  type="button"
                  onClick={handleSelectOnMap}
                  variant="outline"
                  className="flex-1"
                >
                  <Map className="w-4 h-4 mr-2" />
                  Select on Map
                </Button>
              </div>
              {addressForm.latitude && addressForm.longitude && (
                <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                  <span>✓ Location captured</span>
                  <span className="text-xs text-gray-500">
                    ({parseFloat(addressForm.latitude).toFixed(6)}, {parseFloat(addressForm.longitude).toFixed(6)})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={addressForm.is_default}
                onChange={(e) =>
                  setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))
                }
                className="w-4 h-4 text-[#FED141] border-gray-300 rounded focus:ring-[#FED141]"
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Set as default address
              </Label>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-[#303A4D] hover:bg-[#303A4D]/90"
                disabled={savingAddress}
              >
                {savingAddress ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>{editingAddress ? "Update Address" : "Save Address"}</>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelForm}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Address List */}
      {loadingAddresses ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#303A4D]" />
        </div>
      ) : addresses.length === 0 ? (
        <Card className="p-8 bg-white text-center">
          <p className="text-gray-500">No addresses added yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Address" to create your first delivery address</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="p-4 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-[#303A4D]">{address.label}</h4>
                    {address.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FED141] text-[#303A4D] text-xs font-semibold rounded">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {address.street}, {address.area}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.city}, {address.region}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Phone: {address.phone}</p>
                  {address.additional_info && (
                    <p className="text-sm text-gray-500 mt-1 italic">{address.additional_info}</p>
                  )}
                  {address.latitude && address.longitude && (
                    <p className="text-xs text-gray-400 mt-1">
                      📍 GPS: {parseFloat(address.latitude).toFixed(6)},{" "}
                      {parseFloat(address.longitude).toFixed(6)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditAddress(address)}
                    className="text-[#303A4D]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {!address.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefaultAddress(address.id)}
                      className="text-[#FED141] border-[#FED141] hover:bg-[#FED141]/10"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-[#303A4D]">Select Location on Map</h3>
                <p className="text-sm text-gray-500">Click on the map to select your delivery location</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4">
              <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: "500px" }}>
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=-1.0,5.0,1.0,7.0&layer=mapnik&marker=${
                    addressForm.latitude || "5.6037"
                  },${addressForm.longitude || "-0.1870"}`}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Location Map"
                />
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> Click "Get Current Location" or manually enter coordinates below to set your location.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="map_lat" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </Label>
                    <Input
                      id="map_lat"
                      type="number"
                      step="any"
                      value={addressForm.latitude}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, latitude: e.target.value }))}
                      placeholder="5.6037"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="map_lng" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </Label>
                    <Input
                      id="map_lng"
                      type="number"
                      step="any"
                      value={addressForm.longitude}
                      onChange={(e) => setAddressForm((prev) => ({ ...prev, longitude: e.target.value }))}
                      placeholder="-0.1870"
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (addressForm.latitude && addressForm.longitude) {
                        reverseGeocode(parseFloat(addressForm.latitude), parseFloat(addressForm.longitude))
                        setShowMapModal(false)
                      } else {
                        toast({
                          title: "Invalid Coordinates",
                          description: "Please enter valid latitude and longitude values",
                          variant: "destructive",
                        })
                      }
                    }}
                    className="flex-1 bg-[#303A4D] hover:bg-[#303A4D]/90"
                  >
                    Use This Location
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMapModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
