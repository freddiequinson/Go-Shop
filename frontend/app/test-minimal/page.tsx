"use client"

export default function TestMinimalPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Ultra Minimal Test Page
      </h1>
      <p className="text-lg text-gray-700 mb-4">
        If this page crashes on mobile, the issue is NOT in the shop code.
      </p>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">
          This page has:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
          <li>No API calls</li>
          <li>No images</li>
          <li>No hooks (except implicit ones)</li>
          <li>No context providers (they're in layout, but not used)</li>
          <li>Just plain HTML and CSS</li>
        </ul>
      </div>
      <div className="mt-8 p-4 bg-blue-100 rounded">
        <p className="text-blue-900 font-semibold">
          Test Instructions:
        </p>
        <ol className="list-decimal list-inside mt-2 space-y-1 text-blue-800">
          <li>Open this page on your mobile phone</li>
          <li>If it loads and stays stable → Issue is in shop page code</li>
          <li>If it crashes/refreshes → Issue is in layout/providers/build</li>
        </ol>
      </div>
    </div>
  )
}
