'use client'

import { useEffect, useRef, useState } from 'react'

interface RiderDeliveryMapProps {
  riderLocation: { lat: number; lng: number }
  customerLocation: { lat: number; lng: number }
  customerAddress: string
}

function RiderDeliveryMapComponent({
  riderLocation,
  customerLocation,
  customerAddress
}: RiderDeliveryMapProps) {
  const mapRef = useRef<any>(null)
  const riderMarkerRef = useRef<any>(null)
  const customerMarkerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapRef.current) return // Prevent double initialization

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100))

        const mapContainer = document.getElementById('rider-delivery-map')
        if (!mapContainer) {
          console.error('Map container not found')
          return
        }

        if (!mapRef.current) {
        const map = L.map('rider-delivery-map').setView(
          [riderLocation.lat, riderLocation.lng],
          14
        )

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map)

        // Add rider marker (motorcycle icon)
        const riderIcon = L.divIcon({
          html: `<div style="font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏍️</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })

        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], {
          icon: riderIcon
        })
          .addTo(map)
          .bindPopup('<b>Your Location</b>')
          .openPopup()

        // Add customer marker (house icon)
        const customerIcon = L.divIcon({
          html: `<div style="font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏠</div>`,
          className: 'custom-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 40]
        })

        customerMarkerRef.current = L.marker(
          [customerLocation.lat, customerLocation.lng],
          { icon: customerIcon }
        )
          .addTo(map)
          .bindPopup(`<b>Customer Location</b><br>${customerAddress}`)

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
          [riderLocation.lat, riderLocation.lng],
          [customerLocation.lat, customerLocation.lng]
        ])
        map.fitBounds(bounds, { padding: [50, 50] })

        mapRef.current = map
        setMapLoaded(true)
        }
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update rider marker position when location changes
  useEffect(() => {
    if (!mapLoaded || !riderMarkerRef.current || !mapRef.current) return

    const updateRiderPosition = async () => {
      try {
        riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng])
        
        // Recenter map to show both markers
        if (mapRef.current) {
          const L = (await import('leaflet')).default
          const bounds = L.latLngBounds([
            [riderLocation.lat, riderLocation.lng],
            [customerLocation.lat, customerLocation.lng]
          ])
          mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
      } catch (error) {
        console.error('Error updating rider position:', error)
      }
    }

    updateRiderPosition()
  }, [riderLocation.lat, riderLocation.lng, mapLoaded, customerLocation])

  return (
    <div className="relative">
      <div
        id="rider-delivery-map"
        className="w-full h-[450px] rounded-lg overflow-hidden border-2 border-gray-200"
        style={{ zIndex: 0 }}
      />
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-semibold text-[#303A4D]">🏍️ You | 🏠 Customer</p>
      </div>
    </div>
  )
}

export default RiderDeliveryMapComponent
