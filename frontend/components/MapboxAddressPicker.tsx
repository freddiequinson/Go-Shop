"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl'
import type { MapRef } from 'react-map-gl'
import { MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
const GHANA_CENTER: [number, number] = [-0.1870, 5.6037] // Accra, Ghana

interface MapboxAddressPickerProps {
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

export default function MapboxAddressPicker({
  onAddressSelect,
  initialLatitude,
  initialLongitude,
}: MapboxAddressPickerProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewport, setViewport] = useState({
    latitude: initialLatitude ? parseFloat(initialLatitude) : GHANA_CENTER[1],
    longitude: initialLongitude ? parseFloat(initialLongitude) : GHANA_CENTER[0],
    zoom: 14,
  })
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(
    initialLatitude && initialLongitude
      ? { latitude: parseFloat(initialLatitude), longitude: parseFloat(initialLongitude) }
      : null
  )
  const [address, setAddress] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=GH`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const fullAddress = feature.place_name

        // Extract address components
        let street = ''
        let area = ''
        let city = ''
        let region = ''

        feature.context?.forEach((ctx: any) => {
          if (ctx.id.startsWith('place')) {
            city = ctx.text
          } else if (ctx.id.startsWith('region')) {
            region = ctx.text
          } else if (ctx.id.startsWith('locality')) {
            area = ctx.text
          }
        })

        // Use the main text as street if available
        if (feature.text) {
          street = feature.text
        }

        // Fallback values
        if (!street) street = fullAddress.split(',')[0]
        if (!area) area = city
        if (!city) city = 'Accra'
        if (!region) region = 'Greater Accra'

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          searchQuery
        )}.json?access_token=${MAPBOX_TOKEN}&country=GH&limit=1`
      )
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center

        setMarker({ latitude: lat, longitude: lng })
        setViewport({ ...viewport, latitude: lat, longitude: lng, zoom: 15 })
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 })

        await reverseGeocode(lat, lng)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsGeocoding(false)
    }
  }

  // Handle map click
  const handleMapClick = useCallback(
    (event: any) => {
      const { lngLat } = event
      setMarker({ latitude: lngLat.lat, longitude: lngLat.lng })
      reverseGeocode(lngLat.lat, lngLat.lng)
    },
    []
  )

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGeocoding(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setMarker({ latitude, longitude })
          setViewport({ ...viewport, latitude, longitude, zoom: 15 })
          mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 15 })
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

      {/* Map */}
      <div className="relative h-[400px] rounded-lg overflow-hidden border-2 border-gray-200">
        <Map
          ref={mapRef}
          {...viewport}
          onMove={(evt) => setViewport(evt.viewState)}
          onClick={handleMapClick}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
        >
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />

          {marker && (
            <Marker latitude={marker.latitude} longitude={marker.longitude} anchor="bottom">
              <div className="text-red-500">
                <MapPin className="w-8 h-8 drop-shadow-lg" fill="currentColor" />
              </div>
            </Marker>
          )}
        </Map>

        {isGeocoding && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading address...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Address Display */}
      {address && (
        <div className="p-4 bg-[#FED141]/10 border-2 border-[#FED141] rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-[#303A4D] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-[#303A4D]">Selected Address:</p>
              <p className="text-sm text-[#303A4D]/80">{address}</p>
              {marker && (
                <p className="text-xs text-[#303A4D]/60 mt-1">
                  Coordinates: {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
                </p>
              )}
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
