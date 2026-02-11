"use client"

import { useEffect, useState } from "react"
import { Gift, Plus, Search, Edit, Trash2, Calendar, Package, Eye, EyeOff, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getApiBaseUrl } from "@/lib/api/url-helper"

interface SeasonalEvent {
  id: string
  name: string
  description: string | null
  color_code: string
  promo_image_url: string | null
  lottie_animation: string | null
  start_date: string
  end_date: string
  show_popup: boolean
  is_active: boolean
  is_current: boolean
  packages_count: number
}

export default function AdminPackages() {
  const router = useRouter()
  const [events, setEvents] = useState<SeasonalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/events`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event and all its packages?")) return
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/events/${eventId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        setEvents(events.filter(e => e.id !== eventId))
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const toggleEventActive = async (event: SeasonalEvent) => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${getApiBaseUrl()}/packages/admin/events/${event.id}`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: !event.is_active })
      })
      
      if (response.ok) {
        setEvents(events.map(e => 
          e.id === event.id ? { ...e, is_active: !e.is_active } : e
        ))
      }
    } catch (error) {
      console.error("Failed to toggle event:", error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seasonal Packages</h1>
          <p className="text-gray-500 mt-1">Manage promotional events and package deals</p>
        </div>
        <Link
          href="/admin/packages/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Event
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#93C90F]/20 focus:border-[#93C90F]"
        />
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-500 mb-4">Create your first seasonal event to start adding packages</p>
          <Link
            href="/admin/packages/events/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#93C90F] text-white rounded-lg hover:bg-[#7ab00d] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Color Header */}
              <div 
                className="h-3"
                style={{ backgroundColor: event.color_code }}
              />
              
              <div className="p-5">
                {/* Status Badges */}
                <div className="flex items-center gap-2 mb-3">
                  {event.is_current && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Active Now
                    </span>
                  )}
                  {!event.is_active && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      Disabled
                    </span>
                  )}
                  {event.show_popup && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Popup
                    </span>
                  )}
                </div>

                {/* Event Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>
                
                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>
                )}

                {/* Date Range */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.start_date)} - {formatDate(event.end_date)}</span>
                </div>

                {/* Packages Count */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <Package className="w-4 h-4" />
                  <span>{event.packages_count} package{event.packages_count !== 1 ? 's' : ''}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleEventActive(event)}
                      className={`p-2 rounded-lg transition-colors ${
                        event.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={event.is_active ? 'Disable' : 'Enable'}
                    >
                      {event.is_active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <Link
                      href={`/admin/packages/events/${event.id}/edit`}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <Link
                    href={`/admin/packages/events/${event.id}`}
                    className="flex items-center gap-1 text-sm font-medium text-[#93C90F] hover:text-[#7ab00d]"
                  >
                    Manage Packages
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
