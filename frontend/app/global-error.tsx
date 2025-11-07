"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html>
      <body style={{ 
        margin: 0, 
        padding: 0, 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#F4F2E6',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '40px'
          }}>
            ⚠️
          </div>
          
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#303A4D',
            marginBottom: '16px'
          }}>
            Something went wrong!
          </h1>
          
          <p style={{
            color: '#6B7280',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            We're experiencing technical difficulties. Please try refreshing the page or come back later.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              onClick={reset}
              style={{
                backgroundColor: '#FED141',
                color: '#303A4D',
                border: 'none',
                borderRadius: '9999px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1B424'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#FED141'}
            >
              🔄 Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: '#303A4D',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3B4559'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#303A4D'}
            >
              🏠 Go Home
            </button>
          </div>

          <p style={{
            fontSize: '14px',
            color: '#9CA3AF',
            marginTop: '24px'
          }}>
            Error ID: {error.digest || 'Unknown'}
          </p>
        </div>
      </body>
    </html>
  )
}
