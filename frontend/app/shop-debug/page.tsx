"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ShoppingBag, User } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/auth-context"
import { useCart } from "@/lib/cart-context"

/**
 * SIMPLIFIED DEBUG VERSION OF SHOP PAGE
 * This version removes all complex features to isolate the crash
 */
export default function ShopDebugPage() {
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  // Test hooks
  let authError = null
  let cartError = null
  let authData = null
  let cartData = null

  try {
    authData = useAuth()
  } catch (error: any) {
    authError = error.message
  }

  try {
    cartData = useCart()
  } catch (error: any) {
    cartError = error.message
  }

  useEffect(() => {
    setMounted(true)
    const info: string[] = []
    
    info.push("Component mounted")
    
    try {
      info.push(`Window defined: ${typeof window !== 'undefined'}`)
      info.push(`Navigator: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'undefined'}`)
      info.push(`Screen size: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'undefined'}`)
      info.push(`Auth hook: ${authError ? `Failed - ${authError}` : 'Success'}`)
      info.push(`Cart hook: ${cartError ? `Failed - ${cartError}` : 'Success'}`)
    } catch (error: any) {
      info.push(`Error in useEffect: ${error.message}`)
    }
    
    setDebugInfo(info)
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F2E6] p-4">
      {/* Simple Header */}
      <div className="bg-[#FED141] p-4 rounded-lg mb-4">
        <h1 className="text-2xl font-bold text-[#303A4D]">Shop Debug Page</h1>
        <p className="text-sm text-[#303A4D]/70">Testing mobile compatibility</p>
      </div>

      {/* Debug Info */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h2 className="font-bold text-lg mb-2 text-green-600">✓ Page Loaded Successfully!</h2>
        <p className="text-sm text-gray-600 mb-4">
          If you can see this, the basic page structure works.
        </p>

        <div className="space-y-2">
          <div className="p-3 bg-blue-50 rounded">
            <p className="font-semibold text-sm">Auth Hook Status:</p>
            <p className="text-xs">{authError ? `❌ Error: ${authError}` : '✓ Working'}</p>
          </div>

          <div className="p-3 bg-blue-50 rounded">
            <p className="font-semibold text-sm">Cart Hook Status:</p>
            <p className="text-xs">{cartError ? `❌ Error: ${cartError}` : '✓ Working'}</p>
          </div>

          <div className="p-3 bg-blue-50 rounded">
            <p className="font-semibold text-sm">User Agent:</p>
            <p className="text-xs break-all">
              {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}
            </p>
          </div>

          <div className="p-3 bg-blue-50 rounded">
            <p className="font-semibold text-sm">Screen:</p>
            <p className="text-xs">
              {typeof window !== 'undefined' 
                ? `${window.innerWidth}x${window.innerHeight}` 
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Debug Log */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs">
        <h3 className="font-bold mb-2 text-white">Debug Log:</h3>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {debugInfo.map((info, i) => (
            <div key={i}>{info}</div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex gap-2">
        <Link href="/" className="flex-1">
          <button className="w-full bg-[#303A4D] text-white py-3 rounded-lg font-semibold">
            ← Back to Home
          </button>
        </Link>
        <Link href="/shop" className="flex-1">
          <button className="w-full bg-[#FED141] text-[#303A4D] py-3 rounded-lg font-semibold">
            Try Real Shop Page →
          </button>
        </Link>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <h3 className="font-bold text-yellow-900 mb-2">📱 Testing Instructions:</h3>
        <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
          <li>If this page loads, the basic React/Next.js setup works</li>
          <li>Check the debug log above for any errors</li>
          <li>Take a screenshot and send it to the developer</li>
          <li>Try clicking "Try Real Shop Page" to see where it crashes</li>
        </ol>
      </div>
    </div>
  )
}
