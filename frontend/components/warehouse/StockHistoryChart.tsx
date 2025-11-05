"use client"

import { TrendingUp, TrendingDown, AlertTriangle, Package } from "lucide-react"
import { useState } from "react"

interface StockDataPoint {
  date: string
  stock_quantity: number
  movement_type?: "in" | "out" | "adjustment"
  notes?: string
}

interface StockHistoryChartProps {
  productName: string
  unitType: string
  currentStock: number
  minimumStock: number
  stockHistory: StockDataPoint[]
}

export default function StockHistoryChart({
  productName,
  unitType,
  currentStock,
  minimumStock,
  stockHistory
}: StockHistoryChartProps) {
  
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d")
  
  // Filter data based on selected period
  const filterDataByPeriod = (data: StockDataPoint[], period: string) => {
    const now = new Date()
    const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const cutoffDate = new Date(now.setDate(now.getDate() - daysAgo))
    
    return data.filter(point => new Date(point.date) >= cutoffDate)
  }

  const filteredData = filterDataByPeriod(stockHistory, selectedPeriod)
  
  // Calculate statistics
  const stockLevels = filteredData.map(d => d.stock_quantity)
  const maxStock = Math.max(...stockLevels, currentStock, minimumStock)
  const minStock = Math.min(...stockLevels, 0)
  const avgStock = stockLevels.length > 0 
    ? stockLevels.reduce((a, b) => a + b, 0) / stockLevels.length 
    : currentStock

  // Calculate trend
  const trend = stockLevels.length >= 2
    ? stockLevels[stockLevels.length - 1] - stockLevels[0]
    : 0

  // Stock status
  const stockStatus = currentStock <= minimumStock 
    ? { color: "text-red-600", label: "Critical", icon: AlertTriangle }
    : currentStock <= minimumStock * 1.5
    ? { color: "text-yellow-600", label: "Low", icon: TrendingDown }
    : { color: "text-green-600", label: "Healthy", icon: Package }

  const StatusIcon = stockStatus.icon

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#303A4D] mb-1">{productName}</h3>
          <p className="text-sm text-[#303A4D]/60">Stock Level History</p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                selectedPeriod === period
                  ? 'bg-[#FED141] text-[#303A4D]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
          <p className="text-xs text-blue-700 mb-1">Current Stock</p>
          <p className="text-2xl font-bold text-blue-900">{currentStock}</p>
          <p className="text-xs text-blue-600">{unitType}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-3 border-2 border-yellow-200">
          <p className="text-xs text-yellow-700 mb-1">Minimum Level</p>
          <p className="text-2xl font-bold text-yellow-900">{minimumStock}</p>
          <p className="text-xs text-yellow-600">{unitType}</p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-200">
          <p className="text-xs text-purple-700 mb-1">Average</p>
          <p className="text-2xl font-bold text-purple-900">{avgStock.toFixed(0)}</p>
          <p className="text-xs text-purple-600">{unitType}</p>
        </div>
        
        <div className={`${stockStatus.color.replace('text-', 'bg-').replace('-600', '-50')} rounded-lg p-3 border-2 ${stockStatus.color.replace('text-', 'border-').replace('-600', '-200')}`}>
          <p className={`text-xs ${stockStatus.color.replace('-600', '-700')} mb-1`}>Status</p>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${stockStatus.color}`} />
            <p className={`text-lg font-bold ${stockStatus.color.replace('-600', '-900')}`}>{stockStatus.label}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 mb-4">
        <div className="absolute inset-0 flex flex-col justify-between">
          {/* Y-axis labels */}
          {[maxStock, maxStock * 0.75, maxStock * 0.5, maxStock * 0.25, 0].map((value, i) => (
            <div key={i} className="flex items-center">
              <span className="text-xs text-gray-500 w-12 text-right pr-2">
                {value.toFixed(0)}
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          ))}
        </div>

        {/* Minimum stock line */}
        <div
          className="absolute left-12 right-0 border-t-2 border-dashed border-yellow-400"
          style={{
            bottom: `${(minimumStock / maxStock) * 100}%`
          }}
        >
          <span className="absolute -top-3 right-0 text-xs font-semibold text-yellow-600 bg-white px-2">
            Min Level
          </span>
        </div>

        {/* Stock level line */}
        <svg className="absolute left-12 right-0 top-0 bottom-0 w-full h-full">
          <defs>
            <linearGradient id="stockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {filteredData.length > 0 && (
            <>
              {/* Area under the line */}
              <path
                d={`
                  M 0,${256 - (filteredData[0].stock_quantity / maxStock) * 256}
                  ${filteredData.map((point, i) => {
                    const x = (i / (filteredData.length - 1)) * 100
                    const y = 256 - (point.stock_quantity / maxStock) * 256
                    return `L ${x}%,${y}`
                  }).join(' ')}
                  L 100%,256
                  L 0,256
                  Z
                `}
                fill="url(#stockGradient)"
              />
              
              {/* Line */}
              <path
                d={`
                  M 0,${256 - (filteredData[0].stock_quantity / maxStock) * 256}
                  ${filteredData.map((point, i) => {
                    const x = (i / (filteredData.length - 1)) * 100
                    const y = 256 - (point.stock_quantity / maxStock) * 256
                    return `L ${x}%,${y}`
                  }).join(' ')}
                `}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Data points */}
              {filteredData.map((point, i) => {
                const x = (i / (filteredData.length - 1)) * 100
                const y = 256 - (point.stock_quantity / maxStock) * 256
                
                return (
                  <g key={i}>
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                  </g>
                )
              })}
            </>
          )}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 pl-12">
        {filteredData.length > 0 && (
          <>
            <span>{new Date(filteredData[0].date).toLocaleDateString()}</span>
            <span>{new Date(filteredData[Math.floor(filteredData.length / 2)].date).toLocaleDateString()}</span>
            <span>{new Date(filteredData[filteredData.length - 1].date).toLocaleDateString()}</span>
          </>
        )}
      </div>

      {/* Trend Indicator */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {trend > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : trend < 0 ? (
              <TrendingDown className="w-5 h-5 text-red-600" />
            ) : (
              <Package className="w-5 h-5 text-gray-600" />
            )}
            <span className="text-sm font-semibold text-[#303A4D]">
              {trend > 0 ? "Stock Increasing" : trend < 0 ? "Stock Decreasing" : "Stock Stable"}
            </span>
          </div>
          <span className={`text-sm font-bold ${
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"
          }`}>
            {trend > 0 ? "+" : ""}{trend.toFixed(0)} {unitType}
          </span>
        </div>
        
        {currentStock <= minimumStock && (
          <div className="mt-3 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900">Action Required</p>
                <p className="text-xs text-red-700 mt-1">
                  Stock is at or below minimum level. Consider restocking immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Compact version for dashboard
export function CompactStockHistory({ 
  currentStock, 
  minimumStock,
  trend 
}: { 
  currentStock: number
  minimumStock: number
  trend: number
}) {
  const percentage = (currentStock / minimumStock) * 100

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">Stock Level</span>
          <span className="text-xs font-bold text-gray-800">{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${
              percentage <= 100 ? 'bg-red-500' : percentage <= 150 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      {trend !== 0 && (
        <div className={`flex items-center gap-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="text-xs font-bold">{Math.abs(trend)}</span>
        </div>
      )}
    </div>
  )
}
