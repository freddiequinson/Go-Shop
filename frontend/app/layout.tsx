import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { CartProvider } from "@/lib/cart-context"
import { AuthProvider } from "@/lib/contexts/auth-context"
import { OnboardingProvider } from "@/lib/contexts/onboarding-context"
import { Toaster } from "@/components/ui/toaster"
import FeedbackWidget from "@/components/FeedbackWidget"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

// Conditionally import Analytics only on Vercel
const Analytics = process.env.NEXT_PUBLIC_VERCEL_ENV 
  ? require("@vercel/analytics/next").Analytics 
  : () => null

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "go-shop - Fresh Groceries from the Market",
  description: "Get all your groceries delivered to your home",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className={`${inter.className} antialiased overflow-x-hidden`}>
        <ErrorBoundary>
          <AuthProvider>
            <OnboardingProvider>
              <CartProvider>
                {children}
                {process.env.NEXT_PUBLIC_VERCEL_ENV && <Analytics />}
                <Toaster />
                <FeedbackWidget />
              </CartProvider>
            </OnboardingProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
