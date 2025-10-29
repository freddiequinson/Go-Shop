"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Users, MapPin, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/contexts/auth-context"
import { bubblesService } from "@/lib/api/services"

export default function BubblesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [bubbles, setBubbles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    const fetchBubbles = async () => {
      if (!isAuthenticated) return
      
      try {
        setLoading(true)
        const data = await bubblesService.getMyBubbles()
        setBubbles(data)
      } catch (error) {
        console.error('Error fetching bubbles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBubbles()
  }, [isAuthenticated])

  const hardcodedBubbles = [
    {
      id: "1",
      name: "Accra Fresh Market",
      type: "Market",
      location: "Greater Accra",
      members: 245,
      description: "Community for fresh produce lovers in Accra. Share deals, recipes, and connect with local farmers.",
      image: "/images/apple-inhand.jpg",
      isJoined: true,
    },
    {
      id: "2",
      name: "Kumasi Organic Growers",
      type: "Farmers",
      location: "Ashanti",
      members: 128,
      description: "Connect with organic farmers and enthusiasts in Kumasi. Learn sustainable farming practices.",
      image: "/images/tomato.jpg",
      isJoined: false,
    },
    {
      id: "3",
      name: "Tema Bulk Buyers",
      type: "Buyers Group",
      location: "Greater Accra",
      members: 89,
      description: "Join forces to buy in bulk and save money. Perfect for families and small businesses.",
      image: "/images/rice.jpg",
      isJoined: true,
    },
    {
      id: "4",
      name: "Cape Coast Seafood Lovers",
      type: "Market",
      location: "Central",
      members: 156,
      description: "Fresh seafood community. Get the best deals on fish, lobster, and more from local fishermen.",
      image: "/images/bags.jpg",
      isJoined: false,
    },
  ]

  const bubbleTypes = ["all", "Market", "Farmers", "Buyers Group", "Recipe Sharing"]

  const filteredBubbles = bubbles.filter((bubble) => {
    const matchesSearch =
      bubble.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bubble.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || bubble.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Profile</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">Bubbles</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-[#303A4D] to-[#303A4D]/80 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#FED141] flex items-center justify-center">
              <Users className="w-8 h-8 text-[#303A4D]" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">Join a Bubble</h2>
              <p className="text-white/80">Connect with communities, share experiences, and shop together</p>
            </div>
          </div>
          <Link href="/bubbles/create">
            <Button className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Create New Bubble
            </Button>
          </Link>
        </Card>

        {/* Search and Filters */}
        <Card className="p-4 mb-6 bg-white">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search bubbles by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#303A4D]/20"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-[#303A4D]/20 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            >
              {bubbleTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Bubbles Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBubbles.map((bubble) => (
            <Card key={bubble.id} className="overflow-hidden bg-white hover:shadow-lg transition-shadow">
              <div className="relative h-48 bg-gradient-to-br from-[#FED141]/20 to-[#FED141]/5">
                <div className="absolute inset-0 bg-[#303A4D]/10" />
                <div className="absolute top-4 right-4">
                  <span className="bg-[#FED141] text-[#303A4D] px-3 py-1 rounded-full text-sm font-medium">
                    {bubble.type}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-[#303A4D] mb-2">{bubble.name}</h3>

                <div className="flex items-center gap-2 text-sm text-[#303A4D]/60 mb-3">
                  <MapPin className="w-4 h-4" />
                  {bubble.location}
                </div>

                <p className="text-[#303A4D]/80 mb-4 line-clamp-2">{bubble.description}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-[#303A4D]">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{bubble.members} members</span>
                  </div>

                  {bubble.isJoined ? (
                    <Link href={`/bubbles/${bubble.id}`}>
                      <Button size="sm" className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                        View
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#303A4D]/20 hover:bg-[#FED141]/10 bg-transparent"
                    >
                      Join
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredBubbles.length === 0 && (
          <Card className="p-12 bg-white text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#303A4D] mb-2">No bubbles found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or create a new bubble</p>
            <Link href="/bubbles/create">
              <Button className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Bubble
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
