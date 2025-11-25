"use client"

import { useState } from "react"
import { getApiBaseUrl } from "@/lib/api/url-helper"

export default function TestAPIPage() {
  const [status, setStatus] = useState<string>("Not started")
  const [details, setDetails] = useState<string>("")

  const testAPI = async () => {
    try {
      setStatus("Starting...")
      const apiBaseUrl = getApiBaseUrl()
      setDetails(`API URL: ${apiBaseUrl}`)
      
      setStatus("Fetching...")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${apiBaseUrl}/products/?page=1&per_page=3`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      setStatus(`Response received: ${response.status}`)
      
      if (!response.ok) {
        setDetails(`Error: HTTP ${response.status}`)
        return
      }
      
      setStatus("Parsing JSON...")
      const text = await response.text()
      setDetails(`Response size: ${text.length} bytes`)
      
      setStatus("Parsing complete")
      const data = JSON.parse(text)
      setDetails(`Products: ${data.products?.length || 0}`)
      
      setStatus("✅ SUCCESS!")
    } catch (err: any) {
      setStatus("❌ FAILED")
      setDetails(err.message || "Unknown error")
      console.error("Test error:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-4">
          <p className="text-sm text-gray-600 mb-4">
            This page tests the API call step-by-step to see where it fails on mobile.
          </p>
          
          <button
            onClick={testAPI}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700"
          >
            Test API Call
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="font-bold mb-2">Status:</h2>
          <p className="text-lg mb-4">{status}</p>
          
          <h2 className="font-bold mb-2">Details:</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{details}</p>
        </div>

        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <p className="text-sm text-yellow-900">
            <strong>Instructions:</strong> Click the button and watch what happens. 
            If it crashes before showing "SUCCESS", we know exactly where the problem is.
          </p>
        </div>
      </div>
    </div>
  )
}
