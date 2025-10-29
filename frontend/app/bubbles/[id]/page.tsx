"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users, MapPin, MessageSquare, TrendingUp, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function BubbleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("feed")

  // Mock bubble data
  const bubble = {
    id: id,
    name: "Accra Fresh Market",
    type: "Market",
    location: "Greater Accra",
    members: 245,
    description:
      "Community for fresh produce lovers in Accra. Share deals, recipes, and connect with local farmers. We organize weekly market visits and bulk buying opportunities.",
    image: "/images/apple-inhand.jpg",
    isAdmin: false,
    posts: [
      {
        id: "1",
        author: "Ama Osei",
        avatar: "A",
        content: "Just got amazing tomatoes from the Makola Market! GH₵8/kg. Anyone interested in bulk buying?",
        timestamp: "2 hours ago",
        likes: 12,
        comments: 5,
      },
      {
        id: "2",
        author: "Kwame Mensah",
        avatar: "K",
        content: "Reminder: Our weekly market visit is this Friday at 8am. Meet at the main entrance!",
        timestamp: "5 hours ago",
        likes: 24,
        comments: 8,
      },
    ],
    members_list: [
      { id: "1", name: "Ama Osei", role: "Admin", avatar: "A" },
      { id: "2", name: "Kwame Mensah", role: "Member", avatar: "K" },
      { id: "3", name: "Abena Asante", role: "Member", avatar: "A" },
      { id: "4", name: "Kofi Boateng", role: "Member", avatar: "K" },
    ],
  }

  return (
    <div className="min-h-screen bg-[#F4F2E6]">
      {/* Header */}
      <header className="bg-[#FED141] border-b border-[#303A4D]/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/bubbles" className="flex items-center gap-2 text-[#303A4D] hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Bubbles</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#303A4D]">{bubble.name}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bubble Info Card */}
            <Card className="p-6 bg-white">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-[#FED141] flex items-center justify-center">
                  <Users className="w-10 h-10 text-[#303A4D]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-[#303A4D]">{bubble.name}</h2>
                    <span className="bg-[#FED141] text-[#303A4D] px-3 py-1 rounded-full text-sm font-medium">
                      {bubble.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#303A4D]/60 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {bubble.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {bubble.members} members
                    </div>
                  </div>
                  <p className="text-[#303A4D]/80">{bubble.description}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button className="flex-1 bg-[#303A4D] hover:bg-[#303A4D]/90 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Post Update
                </Button>
                {bubble.isAdmin && (
                  <Button variant="outline" className="border-[#303A4D]/20 bg-transparent">
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "feed"
                    ? "text-[#303A4D] border-b-2 border-[#FED141]"
                    : "text-[#303A4D]/60 hover:text-[#303A4D]"
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "members"
                    ? "text-[#303A4D] border-b-2 border-[#FED141]"
                    : "text-[#303A4D]/60 hover:text-[#303A4D]"
                }`}
              >
                Members
              </button>
            </div>

            {/* Feed Tab */}
            {activeTab === "feed" && (
              <div className="space-y-4">
                {bubble.posts.map((post) => (
                  <Card key={post.id} className="p-6 bg-white">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold text-lg">
                        {post.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-[#303A4D]">{post.author}</h4>
                          <span className="text-sm text-[#303A4D]/60">{post.timestamp}</span>
                        </div>
                        <p className="text-[#303A4D]/80 mb-4">{post.content}</p>
                        <div className="flex items-center gap-6 text-sm text-[#303A4D]/60">
                          <button className="flex items-center gap-2 hover:text-[#303A4D]">
                            <TrendingUp className="w-4 h-4" />
                            {post.likes} likes
                          </button>
                          <button className="flex items-center gap-2 hover:text-[#303A4D]">
                            <MessageSquare className="w-4 h-4" />
                            {post.comments} comments
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <Card className="p-6 bg-white">
                <h3 className="text-xl font-bold text-[#303A4D] mb-4">Members ({bubble.members})</h3>
                <div className="space-y-3">
                  {bubble.members_list.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-[#303A4D]">{member.name}</p>
                          <p className="text-sm text-[#303A4D]/60">{member.role}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-[#303A4D]/20 bg-transparent">
                        Message
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4">Activity</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-[#303A4D]/60 mb-1">Posts this week</p>
                  <p className="text-2xl font-bold text-[#303A4D]">24</p>
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60 mb-1">Active members</p>
                  <p className="text-2xl font-bold text-[#303A4D]">156</p>
                </div>
                <div>
                  <p className="text-sm text-[#303A4D]/60 mb-1">Group purchases</p>
                  <p className="text-2xl font-bold text-[#303A4D]">8</p>
                </div>
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold text-[#303A4D] mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#FED141]/10">
                  <p className="font-medium text-[#303A4D] mb-1">Weekly Market Visit</p>
                  <p className="text-sm text-[#303A4D]/60">Friday, 8:00 AM</p>
                </div>
                <div className="p-3 rounded-lg bg-[#FED141]/10">
                  <p className="font-medium text-[#303A4D] mb-1">Bulk Buying Session</p>
                  <p className="text-sm text-[#303A4D]/60">Sunday, 10:00 AM</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
