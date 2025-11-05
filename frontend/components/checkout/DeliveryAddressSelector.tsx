"use client"

import { useState, useEffect } from 'react'
import { userAddressesService } from '@/lib/api/services'
import type { UserAddressResponse } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Plus, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeliveryAddressSelectorProps {
  selectedAddressId: string | null
  onAddressSelect: (address: UserAddressResponse) => void
}

export default function DeliveryAddressSelector({
  selectedAddressId,
  onAddressSelect,
}: DeliveryAddressSelectorProps) {
  const router = useRouter()
  const [addresses, setAddresses] = useState<UserAddressResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = async () => {
    try {
      const data = await userAddressesService.getAddresses()
      setAddresses(data.addresses)
      
      // Auto-select default address if none selected
      if (!selectedAddressId && data.default_address_id) {
        const defaultAddress = data.addresses.find(a => a.id === data.default_address_id)
        if (defaultAddress) {
          onAddressSelect(defaultAddress)
        }
      }
    } catch (error) {
      console.error('Failed to load addresses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
        <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
      </div>
    )
  }

  if (addresses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-bold text-[#303A4D] mb-2">No Saved Addresses</h3>
        <p className="text-gray-600 mb-6">Add a delivery address to continue</p>
        <Button
          onClick={() => router.push('/profile/addresses')}
          className="bg-[#303A4D] hover:bg-[#3B4559]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[#303A4D]">Select Delivery Address</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/profile/addresses')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="grid gap-4">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedAddressId === address.id
                ? 'border-2 border-[#FED141] bg-[#FED141]/5'
                : 'border-2 border-transparent'
            }`}
            onClick={() => onAddressSelect(address)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selectedAddressId === address.id
                    ? 'border-[#FED141] bg-[#FED141]'
                    : 'border-gray-300'
                }`}
              >
                {selectedAddressId === address.id && <Check className="w-4 h-4 text-[#303A4D]" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-[#303A4D]">{address.label}</h4>
                  {address.is_default && (
                    <span className="text-xs bg-[#FED141] text-[#303A4D] px-2 py-0.5 rounded-full font-bold">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{address.street}</p>
                  <p>
                    {address.area}, {address.city}
                  </p>
                  <p>{address.region}</p>
                  <p className="font-medium text-[#303A4D]">{address.phone}</p>
                  {address.additional_info && (
                    <p className="text-xs italic text-gray-500 mt-2">{address.additional_info}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
