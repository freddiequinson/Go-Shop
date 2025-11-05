"use client"

import { useState } from 'react'
import { 
  HelpCircle, Book, Video, MessageCircle, Search, ChevronDown, ChevronRight,
  Package, FileText, TrendingUp, DollarSign, Star, Truck, PlayCircle, 
  RefreshCw, Lightbulb, ExternalLink, CheckCircle
} from 'lucide-react'
import { useOnboarding } from '@/lib/contexts/onboarding-context'
import Link from 'next/link'

interface HelpSection {
  id: string
  title: string
  icon: any
  description: string
  articles: HelpArticle[]
}

interface HelpArticle {
  title: string
  content: string
  tourId?: string
  link?: string
}

export default function SupplierHelpPage() {
  const { resetTour, completedTours } = useOnboarding()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>(['business-workflows', 'getting-started'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const helpSections: HelpSection[] = [
    {
      id: 'business-workflows',
      title: '🔄 Supplier Business Workflows',
      icon: TrendingUp,
      description: 'Understanding how to work with GoShop as a supplier',
      articles: [
        {
          title: 'How to Submit an Offer',
          content: 'OFFER WORKFLOW: 1) GoShop creates a Supply Request for products they need. 2) You receive notification of open requests. 3) Review request details: product, quantity, delivery deadline. 4) Submit your offer with unit price, available quantity, and delivery timeline. 5) GoShop compares all supplier offers. 6) If accepted, you receive confirmation and delivery instructions. 7) Prepare and deliver products to GoShop warehouse. 8) Receive payment within 7 business days after delivery confirmation.',
          tourId: 'supplier-requests',
          link: '/supplier/requests'
        },
        {
          title: 'Managing Your Product Catalog',
          content: 'PRODUCT MANAGEMENT: 1) Add products to your catalog with clear descriptions and images. 2) Set competitive unit prices (per kg, liter, piece, etc.). 3) Keep stock quantities updated to avoid overselling. 4) Toggle products Active/Inactive based on availability. 5) Update prices regularly to stay competitive. 6) Products in your catalog help GoShop find you for relevant supply requests. Note: Your catalog is for reference - actual orders come through supply requests and offers.',
          tourId: 'supplier-products',
          link: '/supplier/products'
        },
        {
          title: 'Fulfilling Accepted Orders',
          content: 'FULFILLMENT WORKFLOW: 1) Check "My Offers" for accepted offers. 2) Prepare products according to exact specifications. 3) Ensure quality meets GoShop standards. 4) Package items securely for delivery. 5) Deliver to GoShop warehouse within agreed timeline. 6) GoShop creates Goods Received Note (GRN) to verify delivery. 7) Your delivery is marked complete. 8) Payment processed within 7 business days. On-time delivery and quality are crucial for maintaining good supplier rating.',
          tourId: 'supplier-offers',
          link: '/supplier/offers'
        },
        {
          title: 'Building Your Supplier Rating',
          content: 'RATING SYSTEM: Your supplier rating is calculated based on: 1) On-Time Delivery Rate (40%) - Deliver within agreed timeline. 2) Product Quality (30%) - Consistent quality matching specifications. 3) Pricing Competitiveness (20%) - Competitive but fair pricing. 4) Communication (10%) - Quick responses and proactive updates. Higher ratings lead to more supply request invitations and better business opportunities. Maintain 4+ stars to stay competitive.',
        }
      ]
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      description: 'Learn the basics of the supplier portal',
      articles: [
        {
          title: 'Supplier Dashboard Overview',
          content: 'Your dashboard shows: Pending supply requests you can bid on, Active offers you\'ve submitted, Accepted offers to fulfill, Completed deliveries, Total revenue earned, Your supplier rating and performance metrics. Use the dashboard to quickly access requests and track your business.',
          tourId: 'supplier-dashboard',
          link: '/supplier/dashboard'
        },
        {
          title: 'Getting Verified',
          content: 'To become a verified supplier: 1) Complete your profile with business details. 2) Upload business registration documents. 3) Provide tax ID and bank account details. 4) Submit for verification. 5) GoShop reviews within 2-3 business days. 6) Once verified, you can submit offers and receive payments. Verification builds trust and unlocks full supplier features.',
          link: '/supplier/profile'
        },
        {
          title: 'Interactive Tours',
          content: 'Each page has an interactive tour highlighting key features. Tours appear automatically on first visit. Restart any tour using the buttons below to refresh your knowledge.',
        }
      ]
    },
    {
      id: 'offers',
      title: 'Submitting Offers',
      icon: FileText,
      description: 'How to bid on supply requests',
      articles: [
        {
          title: 'Finding Supply Requests',
          content: 'Go to "Requests" page to see all open supply requests from GoShop. Filter by product type or deadline. Review request details including product specifications, required quantity, delivery location, and deadline. Only submit offers for products you can reliably supply.',
          tourId: 'supplier-requests',
          link: '/supplier/requests'
        },
        {
          title: 'Creating Competitive Offers',
          content: 'When submitting an offer: 1) Research market prices to stay competitive. 2) Factor in delivery costs and timeline. 3) Be realistic about available quantity. 4) Add special terms or notes if needed. 5) Submit early - early offers get more attention. 6) Don\'t underprice to win - maintain quality and sustainability.',
        },
        {
          title: 'Offer Status Tracking',
          content: 'Track your offers in "My Offers" page. Status types: PENDING - GoShop reviewing your offer. ACCEPTED - Congratulations! Prepare for delivery. REJECTED - Offer not selected (price, timing, or other factors). COMPLETED - Delivery confirmed and payment processed. Learn from rejected offers to improve future submissions.',
          tourId: 'supplier-offers',
          link: '/supplier/offers'
        }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Revenue',
      icon: DollarSign,
      description: 'Understanding supplier payments',
      articles: [
        {
          title: 'Payment Timeline',
          content: 'Payment process: 1) Deliver products to GoShop warehouse. 2) GoShop creates GRN to verify delivery. 3) Payment processed within 7 business days. 4) Funds transferred to your registered bank account. 5) View payment history in your dashboard. Always ensure your bank details are up to date in Settings.',
        },
        {
          title: 'Pricing Strategy',
          content: 'Set competitive prices: 1) Research current market rates. 2) Consider your costs (production, delivery, overhead). 3) Factor in GoShop\'s volume potential. 4) Price competitively but sustainably. 5) Update prices regularly based on market changes. Remember: Lowest price doesn\'t always win - quality and reliability matter.',
        },
        {
          title: 'Revenue Tracking',
          content: 'Monitor your earnings: 1) Dashboard shows total revenue. 2) View revenue by month/quarter. 3) Track average order value. 4) See payment status for each delivery. 5) Export reports for your accounting. Use this data to plan inventory and cash flow.',
        }
      ]
    },
    {
      id: 'quality',
      title: 'Quality & Performance',
      icon: Star,
      description: 'Maintaining high standards',
      articles: [
        {
          title: 'Quality Standards',
          content: 'GoShop expects: 1) Products matching exact specifications. 2) Fresh, undamaged goods. 3) Proper packaging and labeling. 4) Accurate quantities and weights. 5) Compliance with food safety standards. Quality issues lead to rejected deliveries and lower ratings. Always inspect products before delivery.',
        },
        {
          title: 'On-Time Delivery',
          content: 'Delivery best practices: 1) Confirm delivery timeline before accepting offer. 2) Prepare products in advance. 3) Coordinate with GoShop logistics. 4) Deliver within agreed window. 5) Notify immediately if delays expected. On-time delivery rate is 40% of your rating - it\'s crucial for success.',
        },
        {
          title: 'Communication',
          content: 'Stay connected: 1) Respond to supply requests within 24 hours. 2) Update GoShop on order preparation status. 3) Report any issues immediately. 4) Confirm delivery appointments. 5) Be professional and courteous. Good communication builds trust and long-term relationships.',
        }
      ]
    }
  ]

  const filteredSections = searchTerm
    ? helpSections.map(section => ({
        ...section,
        articles: section.articles.filter(article =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(section => section.articles.length > 0)
    : helpSections

  const availableTours = [
    { id: 'supplier-dashboard', name: 'Supplier Dashboard', link: '/supplier/dashboard' },
    { id: 'supplier-products', name: 'My Products', link: '/supplier/products' },
    { id: 'supplier-requests', name: 'Supply Requests', link: '/supplier/requests' },
    { id: 'supplier-offers', name: 'My Offers', link: '/supplier/offers' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[#F4F2E6] min-h-screen pt-20 lg:pt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-10 h-10 text-[#FED141]" />
          <h1 className="text-4xl font-bold text-[#303A4D]">Supplier Help Center</h1>
        </div>
        <p className="text-[#303A4D]/70 text-lg">
          Everything you need to succeed as a GoShop supplier
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#FED141] focus:outline-none text-lg"
          />
        </div>
      </div>

      {/* Video Tours Section */}
      <div className="mb-8 bg-gradient-to-r from-[#303A4D] to-[#303A4D]/90 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Video className="w-8 h-8 text-[#FED141]" />
          <h2 className="text-2xl font-bold">Interactive Video Tours</h2>
        </div>
        <p className="text-white/80 mb-6">
          Learn by doing! Each section has an interactive tour that guides you through key features.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableTours.map((tour) => {
            const isCompleted = completedTours.includes(tour.id)
            return (
              <div key={tour.id} className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <PlayCircle className="w-6 h-6 text-[#FED141]" />
                  {isCompleted && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                <h3 className="font-bold mb-2">{tour.name}</h3>
                <div className="flex gap-2">
                  <Link href={tour.link}>
                    <button className="text-sm px-3 py-1 bg-[#FED141] text-[#303A4D] rounded-lg hover:bg-[#FED141]/90 font-medium">
                      Start Tour
                    </button>
                  </Link>
                  {isCompleted && (
                    <button
                      onClick={() => resetTour(tour.id)}
                      className="text-sm px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const Icon = section.icon
          const isExpanded = expandedSections.includes(section.id)

          return (
            <div key={section.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#FED141]/10 rounded-xl">
                    <Icon className="w-6 h-6 text-[#FED141]" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-[#303A4D]">{section.title}</h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-4">
                  {section.articles.map((article, index) => (
                    <div key={index} className="pl-4 border-l-4 border-[#FED141]/30">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#303A4D]">{article.title}</h4>
                        {article.link && (
                          <Link href={article.link}>
                            <ExternalLink className="w-4 h-4 text-[#FED141]" />
                          </Link>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{article.content}</p>
                      {article.tourId && (
                        <button
                          onClick={() => {
                            if (article.link) {
                              window.location.href = article.link
                            }
                            if (article.tourId) {
                              resetTour(article.tourId)
                            }
                          }}
                          className="mt-2 text-sm text-[#FED141] hover:text-[#FED141]/80 font-medium flex items-center gap-1"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Start Interactive Tour
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contact Support */}
      <div className="mt-8 bg-gradient-to-r from-[#303A4D] to-[#303A4D]/90 rounded-2xl p-8 text-white">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-[#FED141] mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
          <p className="text-white/80 mb-6">
            Our supplier support team is here to assist you
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="bg-white/10 px-6 py-3 rounded-lg">
              <p className="text-sm text-white/70">Email</p>
              <p className="font-bold">suppliers@goshopghana.com</p>
            </div>
            <div className="bg-white/10 px-6 py-3 rounded-lg">
              <p className="text-sm text-white/70">Phone</p>
              <p className="font-bold">0241-293-754</p>
            </div>
            <div className="bg-white/10 px-6 py-3 rounded-lg">
              <p className="text-sm text-white/70">Hours</p>
              <p className="font-bold">Mon-Sat, 8AM-6PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
