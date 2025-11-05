"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { userAddressesService } from '@/lib/api/services'
import type { UserAddressResponse, UserAddressCreate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Plus, Edit, Trash2, Star, Loader2, X } from 'lucide-react'
// import MapboxAddressPicker from '@/components/MapboxAddressPicker'
import Link from 'next/link'

export default function AddressesPage() {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([])
  const [defaultAddressId, setDefaultAddressId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState<UserAddressCreate>({
    label: '',
    street: '',
    area: '',
    city: '',
    region: '',
    phone: '',
    latitude: '',
    longitude: '',
    additional_info: '',
    is_default: false,
  })

  // Ghana regions
  const ghanaRegions = [
    'Greater Accra',
    'Ashanti',
    'Western',
    'Eastern',
    'Central',
    'Northern',
    'Upper East',
    'Upper West',
    'Volta',
    'Bono',
    'Bono East',
    'Ahafo',
    'Savannah',
    'North East',
    'Oti',
    'Western North',
  ]

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses()
    }
  }, [isAuthenticated])

  const loadAddresses = async () => {
    try {
      const data = await userAddressesService.getAddresses()
      setAddresses(data.addresses)
      setDefaultAddressId(data.default_address_id || null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load addresses',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressSelect = (addressData: any) => {
    setFormData({
      ...formData,
      street: addressData.street,
      area: addressData.area,
      city: addressData.city,
      region: addressData.region,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingId) {
        await userAddressesService.updateAddress(editingId, formData)
        toast({
          title: 'Success',
          description: 'Address updated successfully',
        })
      } else {
        await userAddressesService.createAddress(formData)
        toast({
          title: 'Success',
          description: 'Address added successfully',
        })
      }

      // Reset form
      setFormData({
        label: '',
        street: '',
        area: '',
        city: '',
        region: '',
        phone: '',
        latitude: '',
        longitude: '',
        additional_info: '',
        is_default: false,
      })
      setShowAddForm(false)
      setEditingId(null)
      loadAddresses()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save address',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: UserAddressResponse) => {
    setFormData({
      label: address.label,
      street: address.street,
      area: address.area,
      city: address.city,
      region: address.region,
      phone: address.phone,
      latitude: address.latitude || '',
      longitude: address.longitude || '',
      additional_info: address.additional_info || '',
      is_default: address.is_default,
    })
    setEditingId(address.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      await userAddressesService.deleteAddress(id)
      toast({
        title: 'Success',
        description: 'Address deleted successfully',
      })
      loadAddresses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete address',
        variant: 'destructive',
      })
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await userAddressesService.setDefaultAddress(id)
      toast({
        title: 'Success',
        description: 'Default address updated',
      })
      loadAddresses()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to set default address',
        variant: 'destructive',
      })
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F4F2E6] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-[#303A4D] mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to manage your delivery addresses.</p>
          <Link href="/login">
            <Button className="bg-[#303A4D] hover:bg-[#3B4559]">Sign In</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#303A4D]">Delivery Addresses</h1>
              <p className="text-[#303A4D]/70 mt-1">Manage your saved delivery locations</p>
            </div>
            {!showAddForm && (
              <Button
                onClick={() => {
                  setShowAddForm(true)
                  setEditingId(null)
                  setFormData({
                    label: '',
                    street: '',
                    area: '',
                    city: '',
                    region: '',
                    phone: '',
                    latitude: '',
                    longitude: '',
                    additional_info: '',
                    is_default: false,
                  })
                }}
                className="bg-[#303A4D] hover:bg-[#3B4559]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Address
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="p-6 mb-8 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#303A4D]">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingId(null)
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Map Picker - Temporarily disabled for deployment */}
              {/* <div>
                <MapboxAddressPicker
                  onAddressSelect={handleAddressSelect}
                  initialLatitude={formData.latitude}
                  initialLongitude={formData.longitude}
                />
              </div> */}

              {/* Address Label */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Address Label *</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Home, Office, Mom's House"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Address Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street/House Number *</Label>
                  <Input
                    id="street"
                    placeholder="e.g., House No. 123, Oxford Street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Area/Neighborhood *</Label>
                  <Input
                    id="area"
                    placeholder="e.g., Osu, Cantonments"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Accra"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <select
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    required
                  >
                    <option value="">Select Region</option>
                    {ghanaRegions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                <Label htmlFor="additional_info">Additional Information (Optional)</Label>
                <Textarea
                  id="additional_info"
                  placeholder="e.g., Gate code: 1234, Behind the church, White building"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Set as Default */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Set as default delivery address
                </Label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#303A4D] hover:bg-[#3B4559] flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingId ? 'Update Address' : 'Save Address'}</>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Addresses List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#303A4D]" />
          </div>
        ) : addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-[#303A4D] mb-2">No Addresses Yet</h3>
            <p className="text-gray-600 mb-6">Add your first delivery address to get started</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#303A4D] hover:bg-[#3B4559]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={`p-6 relative ${
                  address.id === defaultAddressId ? 'border-2 border-[#FED141]' : ''
                }`}
              >
                {address.id === defaultAddressId && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-[#FED141] text-[#303A4D] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Default
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[#303A4D] mb-2">{address.label}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{address.street}</p>
                    <p>
                      {address.area}, {address.city}
                    </p>
                    <p>{address.region}</p>
                    <p className="font-medium text-[#303A4D]">{address.phone}</p>
                    {address.additional_info && (
                      <p className="text-xs italic mt-2">{address.additional_info}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {address.id !== defaultAddressId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      className="flex-1"
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(address.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
