"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Star, ThumbsUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { reviewsService } from "@/lib/api/services/reviews.service"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { getUserFriendlyErrorMessage, getErrorTitle } from "@/lib/utils/error-messages"

interface Review {
  id: string
  reviewer_id: string
  reviewer_name?: string
  rating: number
  title?: string
  comment: string
  created_at: string
  helpful_count?: number
  is_verified_purchase: boolean
  images?: string[]
}

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [reviewTitle, setReviewTitle] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [averageRating, setAverageRating] = useState(0)
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([])

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const data = await reviewsService.getProductReviews(productId as any)
      setReviews(data.reviews as any || [])
      setAverageRating((data as any).avg_rating || 0)
      
      // Calculate rating distribution
      const ratingDist = (data as any).rating_distribution || {}
      const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: ratingDist[star] || 0,
        percentage: data.reviews?.length > 0 
          ? ((ratingDist[star] || 0) / data.reviews.length) * 100 
          : 0,
      }))
      setRatingDistribution(distribution)
    } catch (error) {
      console.error("Failed to fetch reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to submit a review",
        variant: "destructive",
      })
      return
    }

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating",
        variant: "destructive",
      })
      return
    }
    
    try {
      setSubmitting(true)
      await reviewsService.createReview({
        product_id: productId as any,
        rating: rating,
        content: reviewComment,
        review_type: 'product' as any,
        ...(reviewTitle && { title: reviewTitle })
      } as any)

      toast({
        title: "Success!",
        description: "Your review has been submitted",
      })
      
      setShowReviewForm(false)
      setRating(0)
      setReviewTitle("")
      setReviewComment("")
      fetchReviews() // Refresh reviews
    } catch (error: any) {
      console.error("Failed to submit review:", error)
      toast({
        title: getErrorTitle(error),
        description: getUserFriendlyErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleVoteHelpful = async (reviewId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to vote",
        variant: "destructive",
      })
      return
    }

    try {
      await reviewsService.voteReview(reviewId as any, true)
      toast({
        title: "Thank you!",
        description: "Your vote has been recorded",
      })
      fetchReviews() // Refresh to show updated count
    } catch (error) {
      console.error("Failed to vote:", error)
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive",
      })
    }
  }

  const displayReviews = reviews.length > 0 ? reviews : []

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-[#303A4D]/60">Loading reviews...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card className="p-8 bg-white">
        <h2 className="text-3xl font-bold text-[#303A4D] mb-6">Customer Reviews</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl font-bold text-[#303A4D]">{averageRating.toFixed(1)}</span>
              <div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${star <= Math.round(averageRating) ? "fill-[#FED141] text-[#FED141]" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-[#303A4D]/60">Based on {displayReviews.length} reviews</p>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-[#303A4D] w-12">{star} star</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FED141]" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-[#303A4D]/60 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="mt-6 bg-[#303A4D] hover:bg-[#303A4D]/90 text-white"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card className="p-6 bg-white">
          <h3 className="text-xl font-bold text-[#303A4D] mb-4">Write Your Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#303A4D] mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating) ? "fill-[#FED141] text-[#FED141]" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="reviewTitle" className="block text-sm font-medium text-[#303A4D] mb-2">
                Review Title
              </label>
              <input
                id="reviewTitle"
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full px-4 py-2 border border-[#303A4D]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Sum up your experience"
                required
              />
            </div>

            <div>
              <label htmlFor="reviewComment" className="block text-sm font-medium text-[#303A4D] mb-2">
                Your Review
              </label>
              <textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-[#303A4D]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                placeholder="Share your thoughts about this product"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button 
                type="submit" 
                className="bg-[#303A4D] hover:bg-[#303A4D]/90 text-white"
                disabled={submitting || rating === 0}
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReviewForm(false)}
                className="border-[#303A4D]/20 bg-transparent"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {displayReviews.length > 0 ? (
          displayReviews.map((review) => (
            <Card key={review.id} className="p-6 bg-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FED141] flex items-center justify-center text-[#303A4D] font-bold text-lg">
                  {review.reviewer_name ? review.reviewer_name.charAt(0) : 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-[#303A4D]">{review.reviewer_name || 'Anonymous'}</h4>
                    {review.is_verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-[#FED141] text-[#FED141]" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-[#303A4D]/60">
                      {new Date(review.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {review.title && <h5 className="font-semibold text-[#303A4D] mb-2">{review.title}</h5>}
                  <p className="text-[#303A4D]/80 mb-4">{review.comment}</p>

                  <button 
                    onClick={() => handleVoteHelpful(review.id)}
                    className="flex items-center gap-2 text-sm text-[#303A4D]/60 hover:text-[#303A4D] transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Helpful ({review.helpful_count || 0})
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 bg-white text-center">
            <p className="text-[#303A4D]/60">No reviews yet. Be the first to review this product!</p>
          </Card>
        )}
      </div>
    </div>
  )
}
