"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Calendar, Truck, Clock, Package, MapPin, Phone, Loader2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { adminService } from "@/lib/api/services"
import { useToast } from "@/hooks/use-toast"
import OnboardingTour, { TourStep } from "@/components/onboarding/OnboardingTour"

export default function OrdersByDeliveryDate() {
  const { toast } = useToast()
  const [deliveryDates, setDeliveryDates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [dispatchingDate, setDispatchingDate] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  const getErrorMessage = (error: any, fallback: string): string => {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (typeof detail === 'object' && detail !== null) {
      return JSON.stringify(detail)
    }
    return fallback
  }

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchDeliveryDates()
  }, [statusFilter, dateFrom, dateTo])

  const fetchDeliveryDates = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (statusFilter) {
        params.status_filter = statusFilter
      }
      if (dateFrom) {
        params.date_from = dateFrom
      }
      if (dateTo) {
        params.date_to = dateTo
      }
      
      const data = await adminService.getOrdersByDeliveryDate(params)
      setDeliveryDates(data.delivery_dates)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to fetch delivery dates'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDispatch = async (date: string, orders: any[]) => {
    const orderIds = orders
      .filter(o => !o.is_dispatched)
      .map(o => o.order_id)
    
    if (orderIds.length === 0) {
      toast({
        title: 'No Orders to Dispatch',
        description: 'All orders for this date are already dispatched',
        variant: 'destructive'
      })
      return
    }

    if (!confirm(`Dispatch ${orderIds.length} orders for ${new Date(date).toLocaleDateString()}?`)) {
      return
    }

    try {
      setDispatchingDate(date)
      const result = await adminService.bulkDispatchOrders(orderIds)
      
      toast({
        title: 'Bulk Dispatch Complete',
        description: `${result.successful_count} orders dispatched successfully. ${result.failed_count} failed.`
      })
      
      fetchDeliveryDates()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to dispatch orders'),
        variant: 'destructive'
      })
    } finally {
      setDispatchingDate(null)
    }
  }

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date)
  }

  const formatCountdown = (hours: number) => {
    if (hours < 0) {
      const absHours = Math.abs(hours)
      const days = Math.floor(absHours / 24)
      const remainingHours = absHours % 24
      return `${days}d ${remainingHours}h overdue`
    }
    
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    
    if (days > 0) {
      return `${days}d ${remainingHours}h`
    }
    return `${remainingHours}h`
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-100 border-red-500 text-red-700'
      case 'urgent':
        return 'bg-orange-100 border-orange-500 text-orange-700'
      case 'soon':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700'
      default:
        return 'bg-green-100 border-green-500 text-green-700'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
      case 'urgent':
        return '🔴'
      case 'soon':
        return '🟡'
      default:
        return '🟢'
    }
  }

  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="by-date-header"]',
      title: 'Orders by Delivery Date',
      description: 'Plan deliveries by viewing orders grouped by delivery date. Optimize rider routes and warehouse picking for efficient fulfillment.',
      position: 'bottom'
    },
    {
      target: '[data-tour="date-filter"]',
      title: 'Filter by Date Range',
      description: 'Filter orders by delivery date range and status. Focus on upcoming deliveries or specific time periods.',
      position: 'bottom'
    },
    {
      target: '[data-tour="delivery-calendar"]',
      title: 'Delivery Calendar',
      description: 'See orders scheduled for each date with urgency indicators. Red = overdue, Orange = urgent (within 24h), Yellow = soon, Green = on schedule.',
      position: 'bottom'
    },
    {
      target: '[data-tour="bulk-dispatch"]',
      title: 'Bulk Dispatch',
      description: 'Dispatch all orders for a specific date at once. Assign riders and create pick lists for efficient fulfillment.',
      position: 'left'
    }
  ]

  return (
    <>
      <OnboardingTour tourId="orders-by-delivery-date" steps={tourSteps} />
      <div className="min-h-screen bg-[#F4F2E6]">
      <div className="w-full px-6 md:px-8 py-12">
        {/* Header */}
        <div data-tour="by-date-header" className="mb-8">
          <h1 className="text-5xl font-bold text-[#303A4D] mb-4">Orders by Delivery Date</h1>
          <p className="text-xl text-[#303A4D]/70">Manage orders organized by delivery schedule</p>
        </div>

        {/* Filters */}
        <Card data-tour="date-filter" className="p-6 mb-8 bg-white">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              >
                <option value="">All Orders</option>
                <option value="not_dispatched">Not Dispatched</option>
                <option value="dispatched">Dispatched</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-[#303A4D] mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>
          </div>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#303A4D]" />
          </div>
        ) : deliveryDates.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 mb-2">No orders found</p>
            <p className="text-sm text-gray-500">
              {statusFilter ? 'Try changing the filters above' : 'Orders will appear here once they are created'}
            </p>
          </Card>
        ) : (
          <div data-tour="delivery-calendar" className="space-y-4">
            {deliveryDates.map((dateGroup) => (
              <Card 
                key={dateGroup.date} 
                className={`overflow-hidden border-l-4 ${getUrgencyColor(dateGroup.urgency)}`}
              >
                {/* Date Header */}
                <div className="p-6 bg-white">
                  <div className="flex items-start gap-4">
                    {/* Countdown Circle */}
                    <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center ${getUrgencyColor(dateGroup.urgency)}`}>
                      <span className="text-3xl mb-1">{getUrgencyIcon(dateGroup.urgency)}</span>
                      <span className="text-xs font-bold">
                        {formatCountdown(dateGroup.countdown_hours)}
                      </span>
                    </div>

                    {/* Date Info */}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#303A4D] mb-2">
                        {new Date(dateGroup.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </h3>
                      
                      {/* Stats */}
                      <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-5 h-5 text-[#303A4D]" />
                          <span className="text-lg font-bold text-[#303A4D]">{dateGroup.total_orders}</span>
                          <span className="text-sm text-gray-600">total orders</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Truck className="w-5 h-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">{dateGroup.dispatched_orders}</span>
                          <span className="text-sm text-gray-600">dispatched</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="text-lg font-bold text-orange-600">{dateGroup.pending_dispatch}</span>
                          <span className="text-sm text-gray-600">pending</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div data-tour="bulk-dispatch" className="flex gap-3">
                        <Button
                          onClick={() => toggleExpand(dateGroup.date)}
                          variant="outline"
                          className="rounded-full"
                        >
                          {expandedDate === dateGroup.date ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-2" />
                              Hide Orders
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-2" />
                              View Orders ({dateGroup.orders.length})
                            </>
                          )}
                        </Button>

                        {dateGroup.pending_dispatch > 0 && (
                          <Button
                            onClick={() => handleBulkDispatch(dateGroup.date, dateGroup.orders)}
                            disabled={dispatchingDate === dateGroup.date}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                          >
                            {dispatchingDate === dateGroup.date ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Dispatching...
                              </>
                            ) : (
                              <>
                                <Truck className="w-4 h-4 mr-2" />
                                Dispatch All Pending
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Orders List */}
                {expandedDate === dateGroup.date && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="font-bold text-[#303A4D] mb-4">Orders for this date:</h4>
                    <div className="space-y-3">
                      {dateGroup.orders.map((order: any) => (
                        <div
                          key={order.order_id}
                          className="flex items-start gap-4 p-4 bg-white rounded-lg"
                        >
                          <div className="flex-1">
                            <Link
                              href={`/admin/orders/${order.order_id}`}
                              className="font-bold text-[#303A4D] hover:text-[#FED141] text-lg"
                            >
                              #{order.order_id.slice(0, 8)}
                            </Link>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">{order.user_name}</span>
                              {order.user_phone && ` • ${order.user_phone}`}
                            </p>
                            <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{order.delivery_address}</span>
                            </div>
                            {order.delivery_notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                Note: {order.delivery_notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-[#303A4D] text-lg">GH₵{order.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{order.items_count} items</p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {order.is_dispatched ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Dispatched
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  )
}
