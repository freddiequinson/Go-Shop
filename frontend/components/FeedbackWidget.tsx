"use client"

import { useState, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/contexts/auth-context'
import { apiClient } from '@/lib/api/client'

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [feedbackType, setFeedbackType] = useState('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  
  // Survey questions
  const [easeOfUse, setEaseOfUse] = useState('')
  const [mostLiked, setMostLiked] = useState('')
  const [improvements, setImprovements] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState('')
  
  const { toast } = useToast()
  const { user } = useAuth()

  // Show tooltip periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true)
        setTimeout(() => setShowTooltip(false), 5000)
      }
    }, 10000) // Show after 10 seconds

    return () => clearTimeout(timer)
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subject || !message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in subject and message',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const feedbackData = {
        type: feedbackType,
        subject,
        message,
        page_url: window.location.href,
        survey_responses: showSurvey ? {
          ease_of_use: easeOfUse,
          most_liked: mostLiked,
          improvements: improvements,
          would_recommend: wouldRecommend
        } : null,
        is_anonymous: false,
        user_email: user?.email || null,
        user_name: user?.full_name || null
      }

      await apiClient.post('/feedback/', feedbackData)

      toast({
        title: '✅ Feedback Submitted!',
        description: 'Thank you for helping us improve GoShop Ghana!',
      })

      // Reset form
      setSubject('')
      setMessage('')
      setFeedbackType('general')
      setShowSurvey(false)
      setEaseOfUse('')
      setMostLiked('')
      setImprovements('')
      setWouldRecommend('')
      setIsOpen(false)

    } catch (error: any) {
      console.error('Feedback submission error:', error)
      
      let errorMessage = 'Failed to submit feedback. Please try again.'
      
      if (error.response?.data?.detail) {
        // Handle array of validation errors
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ')
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail
        } else {
          errorMessage = JSON.stringify(error.response.data.detail)
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: 'Error Submitting Feedback',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 left-6 z-50">
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div className="absolute bottom-full left-0 mb-2 bg-[#303A4D] text-white px-4 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap animate-bounce">
              Share your feedback!
            <div className="absolute bottom-0 left-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-[#303A4D]"></div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FED141] to-[#F1B424] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all duration-300 border-2 border-white group"
          aria-label="Give feedback"
        >
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-[#303A4D] group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Feedback Modal */}
      {isOpen && (
        <Card className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 max-h-[80vh] sm:max-h-[600px] overflow-y-auto bg-white shadow-2xl z-50 rounded-2xl scrollbar-hide">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#303A4D]">Share Your Feedback</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Type of Feedback
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="complaint">Complaint</option>
                  <option value="praise">Praise</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary..."
                  required
                  maxLength={200}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-[#303A4D] mb-2">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more..."
                  required
                  rows={4}
                  maxLength={2000}
                />
              </div>

              {/* Survey Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSurvey(!showSurvey)}
                  className="text-sm text-[#303A4D] hover:underline"
                >
                  {showSurvey ? '− Hide' : '+ Add'} Quick Survey (Optional)
                </button>
              </div>

              {/* Survey Questions */}
              {showSurvey && (
                <div className="space-y-3 p-4 bg-[#F4F2E6] rounded-lg">
                  <p className="text-sm font-medium text-[#303A4D] mb-3">Quick Survey (Optional)</p>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      How easy was it to use the site?
                    </label>
                    <select
                      value={easeOfUse}
                      onChange={(e) => setEaseOfUse(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="very_easy">Very Easy</option>
                      <option value="easy">Easy</option>
                      <option value="neutral">Neutral</option>
                      <option value="difficult">Difficult</option>
                      <option value="very_difficult">Very Difficult</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      What did you like most?
                    </label>
                    <Input
                      value={mostLiked}
                      onChange={(e) => setMostLiked(e.target.value)}
                      placeholder="e.g., Fast checkout, great products..."
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      What can we improve?
                    </label>
                    <Input
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      placeholder="Your suggestions..."
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Would you recommend us?
                    </label>
                    <select
                      value={wouldRecommend}
                      onChange={(e) => setWouldRecommend(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FED141] focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="definitely">Definitely</option>
                      <option value="probably">Probably</option>
                      <option value="not_sure">Not Sure</option>
                      <option value="probably_not">Probably Not</option>
                      <option value="definitely_not">Definitely Not</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#303A4D] hover:bg-[#3B4559] text-white rounded-full py-6"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-center text-gray-500 mt-4">
              Your feedback helps us make GoShop Ghana better for everyone!
            </p>
          </div>
        </Card>
      )}
    </>
  )
}
