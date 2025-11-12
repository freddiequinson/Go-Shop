"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  MessageSquare, Star, Search, Filter, Eye, Trash2, 
  CheckCircle, Clock, AlertCircle, XCircle, Loader2, TrendingUp
} from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Feedback {
  id: string
  user_name: string | null
  user_email: string | null
  type: string
  rating: number | null
  subject: string
  message: string
  page_url: string | null
  survey_responses: string | null
  status: string
  admin_notes: string | null
  is_anonymous: boolean
  created_at: string
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [stats, setStats] = useState<any>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchFeedbacks()
    fetchStats()
  }, [statusFilter, typeFilter])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const params: any = { page: 1, per_page: 100 }
      if (statusFilter !== 'all') params.status = statusFilter
      if (typeFilter !== 'all') params.type = typeFilter

      const response = await apiClient.get('/feedback/', { params })
      setFeedbacks(response.data.feedbacks)
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load feedback',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/feedback/stats/summary')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, status: string, notes?: string) => {
    try {
      setUpdatingStatus(true)
      await apiClient.patch(`/feedback/${feedbackId}`, {
        status,
        admin_notes: notes || adminNotes
      })
      
      toast({
        title: 'Success',
        description: 'Feedback updated successfully'
      })
      
      fetchFeedbacks()
      fetchStats()
      setShowDetailModal(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feedback',
        variant: 'destructive'
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    try {
      await apiClient.delete(`/feedback/${feedbackId}`)
      toast({
        title: 'Success',
        description: 'Feedback deleted successfully'
      })
      fetchFeedbacks()
      fetchStats()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete feedback',
        variant: 'destructive'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'reviewed': return 'bg-yellow-100 text-yellow-700'
      case 'in_progress': return 'bg-purple-100 text-purple-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      case 'closed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-700'
      case 'feature': return 'bg-blue-100 text-blue-700'
      case 'complaint': return 'bg-orange-100 text-orange-700'
      case 'praise': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.user_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#303A4D] mb-2">User Feedback</h1>
        <p className="text-gray-600">Manage and respond to user feedback</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-[#303A4D]">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-[#303A4D]" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reviewed</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.reviewed}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Rating</p>
                <p className="text-2xl font-bold text-[#FED141]">{stats.average_rating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-[#FED141] fill-[#FED141]" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature Request</option>
            <option value="general">General</option>
            <option value="complaint">Complaint</option>
            <option value="praise">Praise</option>
          </select>
        </div>
      </Card>

      {/* Feedback List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#303A4D]" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No feedback found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                      {feedback.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(feedback.type)}`}>
                      {feedback.type.toUpperCase()}
                    </span>
                    {feedback.rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: feedback.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-[#FED141] text-[#FED141]" />
                        ))}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#303A4D] mb-2">{feedback.subject}</h3>
                  <p className="text-gray-600 mb-3 line-clamp-2">{feedback.message}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>From: {feedback.user_name || 'Anonymous'}</span>
                    <span>•</span>
                    <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                    {feedback.page_url && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-xs">{feedback.page_url}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFeedback(feedback)
                      setAdminNotes(feedback.admin_notes || '')
                      setShowDetailModal(true)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFeedback(feedback.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status)}`}>
                  {selectedFeedback.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedFeedback.type)}`}>
                  {selectedFeedback.type.toUpperCase()}
                </span>
                {selectedFeedback.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: selectedFeedback.rating }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#FED141] text-[#FED141]" />
                    ))}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-[#303A4D] mb-2">User Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">{selectedFeedback.user_name || 'Anonymous'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{selectedFeedback.user_email || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Page:</span>
                    <span className="ml-2 font-medium text-blue-600 truncate">{selectedFeedback.page_url || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 font-medium">{new Date(selectedFeedback.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Content */}
              <div>
                <h4 className="font-semibold text-[#303A4D] mb-2">Subject</h4>
                <p className="text-lg">{selectedFeedback.subject}</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#303A4D] mb-2">Message</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              {/* Survey Responses */}
              {selectedFeedback.survey_responses && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-[#303A4D] mb-3">Survey Responses</h4>
                  <div className="space-y-2">
                    {Object.entries(JSON.parse(selectedFeedback.survey_responses)).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{key.replace('_', ' ')}:</span>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < (value as number) ? 'fill-[#FED141] text-[#FED141]' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h4 className="font-semibold text-[#303A4D] mb-2">Admin Notes</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  rows={4}
                />
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'reviewed')}
                  disabled={updatingStatus}
                  variant="outline"
                  className="bg-yellow-50 hover:bg-yellow-100"
                >
                  Mark as Reviewed
                </Button>
                <Button
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'in_progress')}
                  disabled={updatingStatus}
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100"
                >
                  In Progress
                </Button>
                <Button
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved')}
                  disabled={updatingStatus}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100"
                >
                  Mark as Resolved
                </Button>
                <Button
                  onClick={() => updateFeedbackStatus(selectedFeedback.id, 'closed')}
                  disabled={updatingStatus}
                  variant="outline"
                  className="bg-gray-50 hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
