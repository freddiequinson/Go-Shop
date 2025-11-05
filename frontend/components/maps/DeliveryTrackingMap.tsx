'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

interface DeliveryTrackingMapProps {
  customerLocation: { lat: number; lng: number }
  riderLocation: { lat: number; lng: number } | null
  customerAddress: string
}

function DeliveryTrackingMapComponent({
  customerLocation,
  riderLocation,
  customerAddress
}: DeliveryTrackingMapProps) {
  const mapRef = useRef<any>(null)
  const riderMarkerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      // CSS is loaded via CDN or global import

      // Fix Leaflet default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current) {
        // Initialize map
        const map = L.map('delivery-map').setView(
          [customerLocation.lat, customerLocation.lng],
          13
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add customer marker (house icon)
        const customerIcon = L.divIcon({
          html: `<div style="font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏠</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })

        L.marker([customerLocation.lat, customerLocation.lng], {
          icon: customerIcon
        })
          .addTo(map)
          .bindPopup(`<b>Delivery Address</b><br>${customerAddress}`)
          .openPopup()

        mapRef.current = map
        setMapLoaded(true)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [customerLocation, customerAddress])

  useEffect(() => {
    if (!mapLoaded || typeof window === 'undefined') return

    const updateRiderMarker = async () => {
      const L = (await import('leaflet')).default

      if (riderLocation && mapRef.current) {
        const riderIcon = L.divIcon({
          html: `<div style="font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏍️</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })

        if (riderMarkerRef.current) {
          // Update existing marker position with smooth animation
          riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng])
        } else {
          // Create new marker
          riderMarkerRef.current = L.marker(
            [riderLocation.lat, riderLocation.lng],
            { icon: riderIcon }
          )
            .addTo(mapRef.current)
            .bindPopup('<b>Rider Location</b><br>On the way to you!')
        }

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
          [customerLocation.lat, customerLocation.lng],
          [riderLocation.lat, riderLocation.lng]
        ])
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }

    updateRiderMarker()
  }, [riderLocation, customerLocation, mapLoaded])

  return (
    <div className="relative">
      <div
        id="delivery-map"
        className="w-full h-[450px] rounded-lg overflow-hidden border-2 border-gray-200"
        style={{ zIndex: 0 }}
      />
      {!riderLocation && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">Waiting for rider location...</p>
        </div>
      )}
    </div>
  )
}

// Export with dynamic import to avoid SSR issues
export default dynamic(() => Promise.resolve(DeliveryTrackingMapComponent), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] rounded-lg bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})
