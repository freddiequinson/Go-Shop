"use client"

import { Card } from '@/components/ui/card'
import { Calendar, Clock, Check, Zap, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import apiClient from '@/lib/api/client'

interface DeliveryDatePickerProps {
  selectedDate: string | null
  selectedTimeSlot: string | null
  isExpress: boolean
  onDateSelect: (date: string) => void
  onTimeSlotSelect: (slot: string) => void
  onExpressToggle: (express: boolean) => void
}

interface DeliveryDate {
  id: string
  date: string
  is_available: boolean
  max_orders: number
  current_orders: number
}

export default function DeliveryDatePicker({
  selectedDate,
  selectedTimeSlot,
  isExpress,
  onDateSelect,
  onTimeSlotSelect,
  onExpressToggle,
}: DeliveryDatePickerProps) {
  const [deliveryDates, setDeliveryDates] = useState<DeliveryDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryDates()
  }, [])

  const fetchDeliveryDates = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/delivery-dates/')
      
      // Calculate minimum delivery date (48 hours from now)
      const now = new Date()
      const minDeliveryDate = new Date(now.getTime() + (48 * 60 * 60 * 1000))
      
      // Filter only available dates that are at least 48 hours away
      const availableDates = response.data
        .filter((d: DeliveryDate) => {
          const deliveryDate = new Date(d.date)
          return d.is_available && deliveryDate >= minDeliveryDate
        })
        .sort((a: DeliveryDate, b: DeliveryDate) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      
      setDeliveryDates(availableDates)
      setError(null)
    } catch (error) {
      console.error('Failed to fetch delivery dates:', error)
      setError('Failed to load delivery dates. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Transform backend dates to display format
  const formatDates = () => {
    return deliveryDates.map(deliveryDate => {
      const date = new Date(deliveryDate.date)
      return {
        value: deliveryDate.date.split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        isAvailable: deliveryDate.is_available,
        spotsLeft: deliveryDate.max_orders - deliveryDate.current_orders,
      }
    })
  }

  const timeSlots = [
    { value: 'morning', label: 'Morning', time: '8:00 AM - 12:00 PM', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon', time: '12:00 PM - 4:00 PM', icon: '☀️' },
    { value: 'evening', label: 'Evening', time: '4:00 PM - 8:00 PM', icon: '🌆' },
  ]

  const dates = formatDates()

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#303A4D]">Delivery Schedule</h3>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery dates...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* No Dates Available */}
      {!loading && !error && dates.length === 0 && (
        <div className="p-8 text-center bg-yellow-50 border-2 border-yellow-200 rounded-xl">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="font-bold text-yellow-800 mb-2">No Delivery Dates Available</p>
          <p className="text-sm text-yellow-700 mb-2">
            No delivery slots are available that are at least 48 hours from now.
          </p>
          <p className="text-xs text-yellow-600">
            The admin may need to add more delivery dates, or all current dates are within the 48-hour preparation window. Please check back later or contact support.
          </p>
        </div>
      )}

      {/* Show content only if dates are loaded */}
      {!loading && !error && dates.length > 0 && (
        <>

      {/* Express Delivery Option */}
      <Card
        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
          isExpress
            ? 'border-2 border-[#FED141] bg-[#FED141]/5'
            : 'border-2 border-gray-200'
        }`}
        onClick={() => onExpressToggle(!isExpress)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              isExpress
                ? 'border-[#FED141] bg-[#FED141]'
                : 'border-gray-300'
            }`}
          >
            {isExpress && <Check className="w-4 h-4 text-[#303A4D]" />}
          </div>
          <Zap className={`w-5 h-5 ${isExpress ? 'text-[#FED141]' : 'text-gray-400'}`} />
          <div className="flex-1">
            <h4 className="font-bold text-[#303A4D]">Express Delivery</h4>
            <p className="text-sm text-gray-600">Same-day delivery (+GH₵10.00)</p>
          </div>
          {isExpress && (
            <span className="text-sm font-bold text-[#FED141]">+GH₵10.00</span>
          )}
        </div>
      </Card>

      {/* Date Selection */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-[#303A4D]" />
          <h4 className="font-bold text-[#303A4D]">Select Delivery Date</h4>
        </div>
        <p className="text-sm text-[#303A4D]/60 mb-4">
          ℹ️ Delivery dates must be at least 48 hours from now to ensure proper preparation
        </p>
        <div className="grid grid-cols-7 gap-2">
          {dates.map((date) => (
            <Card
              key={date.value}
              className={`p-3 cursor-pointer transition-all text-center hover:shadow-md ${
                selectedDate === date.value
                  ? 'border-2 border-[#FED141] bg-[#FED141]/10'
                  : 'border-2 border-transparent'
              }`}
              onClick={() => onDateSelect(date.value)}
            >
              <div className="text-xs text-gray-600 mb-1">{date.dayName}</div>
              <div className="text-2xl font-bold text-[#303A4D] mb-1">{date.dayNumber}</div>
              <div className="text-xs text-gray-600">{date.monthName}</div>
              {selectedDate === date.value && (
                <Check className="w-4 h-4 text-[#FED141] mx-auto mt-2" />
              )}
            </Card>
          ))}
        </div>
        {selectedDate && (
          <p className="text-sm text-gray-600 mt-2">
            Selected: {dates.find(d => d.value === selectedDate)?.fullDate}
          </p>
        )}
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#303A4D]" />
            <h4 className="font-bold text-[#303A4D]">Select Time Slot</h4>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {timeSlots.map((slot) => (
              <Card
                key={slot.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedTimeSlot === slot.value
                    ? 'border-2 border-[#FED141] bg-[#FED141]/10'
                    : 'border-2 border-transparent'
                }`}
                onClick={() => onTimeSlotSelect(slot.value)}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{slot.icon}</div>
                  <h5 className="font-bold text-[#303A4D] mb-1">{slot.label}</h5>
                  <p className="text-sm text-gray-600">{slot.time}</p>
                  {selectedTimeSlot === slot.value && (
                    <Check className="w-5 h-5 text-[#FED141] mx-auto mt-2" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Info */}
      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
        <p className="text-sm text-green-800">
          <strong>Free Delivery:</strong> All orders come with free delivery! 
          {isExpress && ' Express delivery ensures same-day arrival for an additional GH₵10.'}
          {!isExpress && ' Standard delivery takes 1-3 business days.'}
        </p>
      </div>
      </>
      )}
    </div>
  )
}
