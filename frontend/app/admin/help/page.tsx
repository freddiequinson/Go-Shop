"use client"

import { useState } from 'react'
import { 
  HelpCircle, Book, Video, MessageCircle, Search, ChevronDown, ChevronRight,
  Package, Warehouse, ShoppingCart, Users, Truck, FileText, BarChart3, 
  Settings, Shield, PlayCircle, RefreshCw, Lightbulb, ExternalLink
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

export default function HelpPage() {
  const { resetTour, resetAllTours, completedTours, hasSkippedAll } = useOnboarding()
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
      title: '🔄 Go-Shop Business Workflows',
      icon: BarChart3,
      description: 'Understanding how Go-Shop operates from procurement to delivery',
      articles: [
        {
          title: 'How Suppliers Sell to Us',
          content: 'SUPPLIER WORKFLOW: 1) Suppliers create products in their catalog with pricing and stock. 2) Admin creates a Supply Request (direct to specific supplier or open to marketplace). 3) Suppliers submit Offers with their pricing and delivery terms. 4) Admin compares offers and accepts the best one. 5) Supplier delivers goods to our warehouse. 6) Admin creates Goods Received Note (GRN) to verify delivery. 7) Product automatically moves to warehouse inventory. This ensures quality control and competitive pricing.',
          link: '/admin/procurement/requests'
        },
        {
          title: 'Warehouse to Shop Publishing',
          content: 'PUBLISHING WORKFLOW: Products in warehouse are NOT automatically visible to customers. Admin must PUBLISH products to the shop. Why? Quality control, pricing verification, and stock confirmation. Steps: 1) Product arrives in warehouse (from supplier or admin-created). 2) Admin reviews product details, pricing, and stock. 3) Admin clicks "Publish to Shop" button. 4) Product becomes visible to customers on the website. 5) Customers can now search, view, and purchase the product. Unpublishing removes products from shop but keeps them in warehouse.',
          link: '/admin/warehouse'
        },
        {
          title: 'How Restocking Works',
          content: 'RESTOCK WORKFLOW: When warehouse stock runs low: 1) System generates stock alerts when quantity falls below reorder level. 2) Admin creates Restock Order specifying product and quantity needed. 3) Admin can create Supply Request to source from suppliers. 4) Suppliers submit offers, admin accepts best offer. 5) Goods delivered and GRN created. 6) Warehouse inventory automatically updated. 7) Product remains published if already in shop. This ensures continuous availability for customers.',
          link: '/admin/warehouse/restock'
        },
        {
          title: 'Order Fulfillment Process',
          content: 'ORDER WORKFLOW: 1) Customer places order on website and pays (Wallet or Paystack). 2) Order appears in admin Orders page with "Pending" status. 3) Admin reviews order details and customer delivery address. 4) Admin assigns order to available rider for delivery. 5) Rider picks up products from warehouse. 6) Rider delivers to customer using GPS tracking. 7) Customer receives order and can rate the experience. 8) Order marked as "Completed". Stock automatically deducted from warehouse inventory.',
          link: '/admin/orders'
        },
        {
          title: 'Rider Delivery System',
          content: 'RIDER WORKFLOW: 1) Admin adds riders with vehicle details and contact info. 2) When order is ready, admin assigns to available rider. 3) Rider receives delivery assignment with customer address and GPS coordinates. 4) Rider picks up products from warehouse. 5) Rider uses GPS to navigate to customer location. 6) Rider delivers order and collects any cash payments. 7) Rider marks delivery as complete. 8) Admin tracks rider performance: delivery time, completion rate, customer ratings. Top performers can be rewarded.',
          link: '/admin/riders'
        },
        {
          title: 'Procurement & Price Comparison',
          content: 'PROCUREMENT WORKFLOW: Go-Shop uses competitive procurement to get best prices. 1) Admin creates Supply Request for needed products. 2) Request can be Direct (to specific supplier) or Open (marketplace for all suppliers). 3) Multiple suppliers submit offers with their pricing. 4) Admin uses Price Comparison tool to see all offers side-by-side. 5) System calculates total cost, delivery time, and supplier ratings. 6) Admin accepts best offer based on price, quality, and delivery speed. 7) This ensures Go-Shop always gets competitive pricing and maintains quality standards.',
          link: '/admin/procurement/price-comparison'
        },
        {
          title: 'Inventory Management',
          content: 'INVENTORY WORKFLOW: 1) All products stored in warehouse with quantity tracking. 2) Each product has reorder level (minimum stock before alert). 3) Stock automatically deducted when orders are fulfilled. 4) Low stock alerts notify admin to restock. 5) Admin can view inventory by zone/location in warehouse. 6) Inventory movements tracked for audit (received, sold, damaged, returned). 7) Analytics show inventory turnover and stock value. This prevents stockouts and overstocking.',
          link: '/admin/warehouse'
        },
        {
          title: 'Product Lifecycle',
          content: 'COMPLETE PRODUCT FLOW: 1) CREATION: Admin creates product OR Supplier adds to catalog. 2) PROCUREMENT: If supplier product, admin creates supply request and accepts offer. 3) RECEIVING: Goods delivered, GRN created, moves to warehouse. 4) QUALITY CHECK: Admin reviews product before publishing. 5) PUBLISHING: Admin publishes to shop, customers can see it. 6) SELLING: Customers order, payment processed, stock deducted. 7) DELIVERY: Rider delivers to customer. 8) RESTOCKING: When low, repeat procurement process. This ensures quality and availability.',
        }
      ]
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Lightbulb,
      description: 'Learn the basics of the Go-Shop admin dashboard',
      articles: [
        {
          title: 'Dashboard Overview',
          content: 'The dashboard provides a quick overview of your store\'s performance including total products, orders, users, revenue, stock alerts, and active deliveries. Use the quick action cards to perform common tasks.',
          tourId: 'dashboard',
          link: '/admin'
        },
        {
          title: 'Navigation & Sidebar',
          content: 'The sidebar on the left contains all admin sections. Click on sections with arrows to expand and see sub-pages. The sidebar can be collapsed on desktop for more screen space.',
        },
        {
          title: 'Onboarding Tours',
          content: 'Each page has an interactive tour that highlights key features. Tours appear automatically on your first visit. You can restart any tour using the buttons below.',
        }
      ]
    },
    {
      id: 'products',
      title: 'Product Management',
      icon: Package,
      description: 'Managing your product catalog',
      articles: [
        {
          title: 'Adding Products',
          content: 'Go to Products > Add Product. Upload images (mark one as primary), enter product details, select unit type (kg, gram, liter, piece, pack), set pricing, and configure stock levels. You can optionally link to a supplier and set cost price for profit tracking.',
          tourId: 'products-add',
          link: '/admin/products/new'
        },
        {
          title: 'Product Categories',
          content: 'Organize products using hierarchical categories. Create parent categories (e.g., Groceries) and subcategories (e.g., Vegetables, Fruits). Products can be assigned to any category for better organization.',
          tourId: 'products-categories',
          link: '/admin/products/categories'
        },
        {
          title: 'Image Library',
          content: 'Upload and manage reusable product images. System images can be used across multiple products. Tag images for easy searching and organization.',
          tourId: 'products-images',
          link: '/admin/products/images'
        },
        {
          title: 'Publishing Products',
          content: 'Products must be published to appear in the shop. Unpublished products are drafts. Toggle publish status from the products list or warehouse inventory.',
        }
      ]
    },
    {
      id: 'warehouse',
      title: 'Warehouse & Inventory',
      icon: Warehouse,
      description: 'Stock management and warehouse operations',
      articles: [
        {
          title: 'Inventory Dashboard',
          content: 'View all warehouse inventory with real-time stock levels. Filter by low stock or out of stock items. Publish products to the shop directly from inventory. Sync with pending deliveries.',
          tourId: 'warehouse',
          link: '/admin/warehouse'
        },
        {
          title: 'Supplier Marketplace',
          content: 'Browse products from verified suppliers. View supplier stock, pricing, and ratings. Create direct orders from the marketplace. Track order status until delivery.',
          tourId: 'warehouse-marketplace',
          link: '/admin/warehouse/marketplace'
        },
        {
          title: 'Stock Alerts',
          content: 'Set reorder levels for products. Receive automatic alerts when stock falls below threshold. Configure alert thresholds per product.',
        },
        {
          title: 'Restock Orders',
          content: 'Create restock orders when inventory is low. Link to supply requests for procurement. Track restock order status from pending to completed.',
          tourId: 'warehouse-restock',
          link: '/admin/warehouse/restock'
        }
      ]
    },
    {
      id: 'orders',
      title: 'Order Management',
      icon: ShoppingCart,
      description: 'Processing customer orders',
      articles: [
        {
          title: 'Order Processing',
          content: 'View all customer orders with status tracking. Filter by pending, completed, or cancelled. Update order status as you process them. Assign riders for delivery.',
          tourId: 'orders',
          link: '/admin/orders'
        },
        {
          title: 'Order Details',
          content: 'Click any order to view full details including customer info, items ordered, delivery address, payment status, and delivery tracking.',
        },
        {
          title: 'Coupons & Discounts',
          content: 'Create discount coupons with percentage or fixed amount. Set expiry dates and usage limits. Track coupon redemptions.',
          link: '/admin/coupons'
        },
        {
          title: 'Gift Cards',
          content: 'Manage gift card inventory. Issue new gift cards, track balances, and view redemption history.',
          link: '/admin/gift-cards'
        }
      ]
    },
    {
      id: 'users',
      title: 'User Management',
      icon: Users,
      description: 'Managing customers and sellers',
      articles: [
        {
          title: 'User Accounts',
          content: 'View all registered users (buyers and sellers). Filter by user type. Activate or deactivate accounts. View user activity and order history.',
          tourId: 'users',
          link: '/admin/users'
        },
        {
          title: 'Activity Logs',
          content: 'Track user actions and system events. Monitor login attempts, order placements, and account changes. Useful for security and troubleshooting.',
          link: '/admin/users/activity'
        }
      ]
    },
    {
      id: 'suppliers',
      title: 'Supplier Management',
      icon: FileText,
      description: 'Working with suppliers',
      articles: [
        {
          title: 'Adding Suppliers',
          content: 'Register new suppliers with contact details, specialization categories, and verification status. Link suppliers to products for cost tracking.',
          tourId: 'suppliers-add',
          link: '/admin/suppliers/new'
        },
        {
          title: 'Supplier Performance',
          content: 'Track supplier metrics including delivery times, quality ratings, and order fulfillment rates. Use data to make informed sourcing decisions.',
          link: '/admin/suppliers/performance'
        },
        {
          title: 'Supply Requests',
          content: 'Create supply requests for products you need. Send direct requests to specific suppliers or open requests to the marketplace. Compare offers and accept the best one.',
          tourId: 'procurement-requests',
          link: '/admin/procurement/requests'
        }
      ]
    },
    {
      id: 'riders',
      title: 'Delivery & Riders',
      icon: Truck,
      description: 'Managing delivery operations',
      articles: [
        {
          title: 'Rider Management',
          content: 'Add and manage delivery riders. Track rider availability, vehicle details, and contact information. Monitor active and available riders.',
          tourId: 'riders',
          link: '/admin/riders'
        },
        {
          title: 'Delivery Assignments',
          content: 'Assign orders to available riders. Track delivery status in real-time. View rider locations and delivery progress.',
          tourId: 'riders-assignments',
          link: '/admin/riders/assignments'
        },
        {
          title: 'Rider Performance',
          content: 'Monitor rider metrics including completed deliveries, average delivery time, and customer ratings. Identify top performers.',
          link: '/admin/riders/performance'
        }
      ]
    },
    {
      id: 'procurement',
      title: 'Procurement',
      icon: FileText,
      description: 'Sourcing and purchasing',
      articles: [
        {
          title: 'Direct Orders',
          content: 'Place direct orders with specific suppliers. Track order status from pending to received. Manage delivery schedules.',
          tourId: 'procurement-direct',
          link: '/admin/procurement/direct-orders'
        },
        {
          title: 'Price Comparison',
          content: 'Compare prices from multiple suppliers for the same product. View historical pricing trends. Make data-driven purchasing decisions.',
          tourId: 'procurement-comparison',
          link: '/admin/procurement/price-comparison'
        },
        {
          title: 'Procurement Analytics',
          content: 'Track procurement metrics including total requests, cost savings, supplier response times, and top performing suppliers.',
          tourId: 'procurement-analytics',
          link: '/admin/procurement/analytics'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: BarChart3,
      description: 'Business insights and reporting',
      articles: [
        {
          title: 'Sales Analytics',
          content: 'View sales trends, revenue charts, and top-selling products. Filter by date range. Export reports for accounting.',
          tourId: 'analytics-sales',
          link: '/admin/analytics/sales'
        },
        {
          title: 'Warehouse Analytics',
          content: 'Track inventory turnover, stock movement patterns, and warehouse efficiency metrics.',
          tourId: 'analytics-warehouse',
          link: '/admin/warehouse/analytics'
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: Settings,
      description: 'System configuration',
      articles: [
        {
          title: 'General Settings',
          content: 'Configure store name, contact details, business hours, and other general settings.',
          link: '/admin/settings'
        },
        {
          title: 'Delivery Settings',
          content: 'Set delivery zones, fees, and time slots. Configure delivery radius and availability.',
          link: '/admin/delivery-settings'
        },
        {
          title: 'Database Cleanup',
          content: 'Manage database maintenance tasks. Clean up old logs, expired sessions, and temporary data.',
          link: '/admin/cleanup'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security & Audit',
      icon: Shield,
      description: 'Security and compliance',
      articles: [
        {
          title: 'Audit Logs',
          content: 'View comprehensive logs of all admin actions. Track who did what and when. Essential for security and compliance.',
          tourId: 'audit-logs',
          link: '/admin/audit-logs'
        },
        {
          title: 'Security Best Practices',
          content: 'Always log out when finished. Use strong passwords. Never share admin credentials. Review audit logs regularly for suspicious activity.',
        }
      ]
    }
  ]

  const filteredSections = helpSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.articles.length > 0)

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FED141] rounded-2xl">
          <HelpCircle className="w-10 h-10 text-[#303A4D]" />
        </div>
        <h1 className="text-4xl font-bold text-[#303A4D]">Help Center</h1>
        <p className="text-lg text-[#303A4D]/70 max-w-2xl mx-auto">
          Everything you need to know about managing your Go-Shop store
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#303A4D]/40" />
        <input
          type="text"
          placeholder="Search help articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-[#FED141] focus:outline-none text-[#303A4D]"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-[#FED141] to-[#FED141]/80 rounded-2xl p-6">
          <Video className="w-10 h-10 text-[#303A4D] mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">Video Tutorials</h3>
          <p className="text-[#303A4D]/80 mb-4">Watch step-by-step video guides</p>
          <button className="text-[#303A4D] font-semibold flex items-center gap-2 hover:gap-3 transition-all">
            Coming Soon
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#FED141] transition-colors">
          <MessageCircle className="w-10 h-10 text-[#303A4D] mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">Contact Support</h3>
          <p className="text-[#303A4D]/80 mb-4">Get help from our team</p>
          <a href="tel:0241293754" className="text-[#303A4D] font-semibold flex items-center gap-2 hover:gap-3 transition-all">
            Call 0241293754
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#FED141] transition-colors">
          <RefreshCw className="w-10 h-10 text-[#303A4D] mb-4" />
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">Tour Progress</h3>
          <p className="text-[#303A4D]/80 mb-4">
            {completedTours.length} tours completed
          </p>
          <p className="text-sm text-[#303A4D]/60">
            Use the "Start Tour" buttons below to replay any tour
          </p>
        </div>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id)
          const Icon = section.icon

          return (
            <div
              key={section.id}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-[#FED141] transition-colors"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FED141] rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#303A4D]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#303A4D]">{section.title}</h2>
                    <p className="text-sm text-[#303A4D]/60">{section.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-6 h-6 text-[#303A4D]" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-[#303A4D]" />
                )}
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-4">
                  {section.articles.map((article, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl p-5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-bold text-[#303A4D]">{article.title}</h3>
                        {article.tourId && (
                          <button
                            onClick={() => {
                              resetTour(article.tourId!)
                              if (article.link) {
                                window.location.href = article.link
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#FED141] text-[#303A4D] text-sm font-semibold rounded-lg hover:bg-[#FED141]/90 transition-colors whitespace-nowrap"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Start Tour
                          </button>
                        )}
                      </div>
                      <p className="text-[#303A4D]/80 leading-relaxed">{article.content}</p>
                      {article.link && !article.tourId && (
                        <Link
                          href={article.link}
                          className="inline-flex items-center gap-2 text-[#303A4D] font-semibold hover:gap-3 transition-all"
                        >
                          Go to page
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* No Results */}
      {filteredSections.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-[#303A4D] mb-2">No results found</h3>
          <p className="text-[#303A4D]/60">
            Try searching with different keywords or browse the sections above
          </p>
        </div>
      )}
    </div>
  )
}
