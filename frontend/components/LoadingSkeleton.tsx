import React from "react"
import { Card } from "@/components/ui/card"

interface LoadingSkeletonProps {
  type?: "card" | "table" | "list" | "stats" | "form"
  count?: number
}

export function LoadingSkeleton({ type = "card", count = 3 }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (type === "stats") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {skeletons.map((i) => (
          <Card key={i} className="p-6 bg-white animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (type === "table") {
    return (
      <Card className="p-6 bg-white">
        <div className="space-y-4">
          {skeletons.map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-24 h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (type === "list") {
    return (
      <div className="space-y-4">
        {skeletons.map((i) => (
          <Card key={i} className="p-6 bg-white animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (type === "form") {
    return (
      <Card className="p-6 bg-white">
        <div className="space-y-6 animate-pulse">
          {skeletons.map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      </Card>
    )
  }

  // Default: card grid
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {skeletons.map((i) => (
        <Card key={i} className="p-6 bg-white animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
            <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </Card>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return <LoadingSkeleton type="card" count={6} />
}

export function StatsSkeleton() {
  return <LoadingSkeleton type="stats" count={4} />
}

export function TableSkeleton() {
  return <LoadingSkeleton type="table" count={5} />
}

export function ListSkeleton() {
  return <LoadingSkeleton type="list" count={4} />
}

export function FormSkeleton() {
  return <LoadingSkeleton type="form" count={5} />
}
