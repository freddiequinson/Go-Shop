"use client"

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Import Leaflet types
import type { LatLngExpression } from 'leaflet'

// Dynamically import the entire map to avoid SSR issues
const DynamicMap = dynamic(() => import('./LeafletMap'), { ssr: false })

const GHANA_CENTER: [number, number] = [5.6037, -0.1870] // Accra, Ghana

interface OpenStreetMapAddressPickerProps {
  onAddressSelect: (address: {
    street: string
    area: string
    city: string
    region: string
    latitude: string
    longitude: string
    fullAddress: string
  }) => void
  initialLatitude?: string
  initialLongitude?: string
}


export default function OpenStreetMapAddressPicker({
  onAddressSelect,
  initialLatitude,
  initialLongitude,
}: OpenStreetMapAddressPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    initialLatitude && initialLongitude
      ? [parseFloat(initialLatitude), parseFloat(initialLongitude)]
      : GHANA_CENTER
  )
  const [address, setAddress] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [isMapExpanded, setIsMapExpanded] = useState(true)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()

      if (data && data.address) {
        const fullAddress = data.display_name
        const addr = data.address

        // Extract address components
        const street = addr.road || addr.suburb || addr.neighbourhood || addr.hamlet || ''
        const area = addr.suburb || addr.neighbourhood || addr.city_district || ''
        const city = addr.city || addr.town || addr.village || 'Accra'
        const region = addr.state || addr.region || 'Greater Accra'

        setAddress(fullAddress)

        onAddressSelect({
          street,
          area,
          city,
          region,
          latitude: lat.toString(),
          longitude: lng.toString(),
          fullAddress,
        })
        
        // Auto-collapse map after location is selected
        setIsMapExpanded(false)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      setAddress('Unable to fetch address')
    } finally {
      setIsGeocoding(false)
    }
  }

  // Forward geocode search query to coordinates
  const searchAddress = async () => {
    if (!searchQuery.trim()) return

    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery + ', Ghana'
        )}&limit=1`
      )
      const data = await response.json()

      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        setPosition([lat, lng])
        await reverseGeocode(lat, lng)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsGeocoding(false)
    }
  }

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGeocoding(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setPosition([latitude, longitude])
          reverseGeocode(latitude, longitude)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setIsGeocoding(false)
          alert('Unable to get your location. Please enable location services.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng])
    reverseGeocode(lat, lng)
  }

  if (!isClient) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-100 rounded-lg">
        <Loader2 className="w-8 h-8 animate-spin text-[#303A4D]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="space-y-2">
        <Label>Search Address</Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search for a location in Ghana..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
            className="flex-1"
          />
          <Button onClick={searchAddress} disabled={isGeocoding || !searchQuery.trim()}>
            {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </div>
      </div>

      {/* Current Location Button */}
      <Button onClick={getCurrentLocation} disabled={isGeocoding} variant="outline" className="w-full">
        {isGeocoding ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Getting location...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Use Current Location
          </>
        )}
      </Button>

      {/* Map Toggle Button */}
      <Button 
        onClick={() => setIsMapExpanded(!isMapExpanded)} 
        variant="outline" 
        className="w-full border-2 border-[#FED141] hover:bg-[#FED141]/10"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {isMapExpanded ? 'Hide Map' : 'Show Map to Select Location'}
      </Button>

      {/* Map */}
      {isMapExpanded && (
        <div className="relative h-[400px] rounded-lg overflow-hidden border-2 border-gray-200">
          <DynamicMap position={position} onMapClick={handleMapClick} />

          {isGeocoding && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[1000]">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading address...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Address Display */}
      {address && (
        <div className="p-4 bg-[#FED141]/10 border-2 border-[#FED141] rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-[#303A4D] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[#303A4D]">Selected Address:</p>
              <p className="text-sm text-[#303A4D]/80">{address}</p>
              <p className="text-xs text-[#303A4D]/60 mt-1">
                Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600">
        💡 Click anywhere on the map to select a delivery location, or search for an address above.
      </p>
    </div>
  )
}
