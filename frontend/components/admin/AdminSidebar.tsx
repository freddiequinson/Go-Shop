"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, Package, Warehouse, Users, Truck, 
  ShoppingCart, BarChart3, Settings, Image, FileText,
  ChevronDown, ChevronRight, Boxes, Menu, X, Shield, Calendar, Tag, Gift, TrendingUp, HelpCircle, MessageSquare
} from "lucide-react"
import { useState } from "react"

interface MenuItem {
  title: string
  href?: string
  icon: any
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Products",
    icon: Package,
    children: [
      { title: "All Products", href: "/admin/products", icon: Package },
      { title: "Add Product", href: "/admin/products/new", icon: Package },
      { title: "Categories", href: "/admin/products/categories", icon: Boxes },
      { title: "Image Library", href: "/admin/products/images", icon: Image }
    ]
  },
  {
    title: "Warehouse",
    icon: Warehouse,
    children: [
      { title: "Dashboard", href: "/admin/warehouse/dashboard", icon: LayoutDashboard },
      { title: "Inventory", href: "/admin/warehouse", icon: Warehouse },
      { title: "Supplier Marketplace", href: "/admin/warehouse/marketplace", icon: ShoppingCart }
    ]
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    children: [
      { title: "All Orders", href: "/admin/orders", icon: ShoppingCart },
      { title: "By Products", href: "/admin/orders/by-products", icon: Package },
      { title: "By Delivery Date", href: "/admin/orders/by-delivery-date", icon: Calendar },
      { title: "Coupons", href: "/admin/coupons", icon: Tag },
      { title: "Gift Cards", href: "/admin/gift-cards", icon: Gift }
    ]
  },
  {
    title: "Users",
    icon: Users,
    children: [
      { title: "All Users", href: "/admin/users", icon: Users },
      { title: "Buyers", href: "/admin/users?type=buyer", icon: Users },
      { title: "Sellers", href: "/admin/users?type=seller", icon: Users },
      { title: "Activity Logs", href: "/admin/users/activity", icon: FileText }
    ]
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare
  },
  {
    title: "Suppliers",
    icon: Boxes,
    children: [
      { title: "All Suppliers", href: "/admin/suppliers", icon: Boxes },
      { title: "Add Supplier", href: "/admin/suppliers/new", icon: Boxes },
      { title: "Performance", href: "/admin/suppliers/performance", icon: BarChart3 }
    ]
  },
  {
    title: "Riders",
    icon: Truck,
    children: [
      { title: "All Riders", href: "/admin/riders", icon: Truck },
      { title: "Add Rider", href: "/admin/riders/new", icon: Truck },
      { title: "Assignments", href: "/admin/riders/assignments", icon: Truck },
      { title: "Performance", href: "/admin/riders/performance", icon: BarChart3 }
    ]
  },
  {
    title: "Procurement",
    icon: FileText,
    children: [
      { title: "Direct Orders", href: "/admin/procurement/direct-orders", icon: ShoppingCart },
      { title: "Supply Requests", href: "/admin/procurement/requests", icon: FileText },
      { title: "Price Comparison", href: "/admin/procurement/price-comparison", icon: BarChart3 },
      { title: "Analytics", href: "/admin/procurement/analytics", icon: BarChart3 }
    ]
  },
  {
    title: "Analytics",
    icon: BarChart3,
    children: [
      { title: "Business Analytics", href: "/admin/analytics", icon: BarChart3 },
      { title: "Sales Analytics", href: "/admin/analytics/sales", icon: TrendingUp },
      { title: "Warehouse", href: "/admin/warehouse/analytics", icon: Warehouse }
    ]
  },
  {
    title: "Audit Logs",
    icon: Shield,
    children: [
      { title: "View Logs", href: "/admin/audit-logs", icon: Shield },
      { title: "Analytics", href: "/admin/audit-logs/analytics", icon: Shield }
    ]
  },
  {
    title: "Feedback",
    href: "/admin/feedback",
    icon: MessageSquare
  },
  {
    title: "Help",
    href: "/admin/help",
    icon: HelpCircle
  },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { title: "General Settings", href: "/admin/settings", icon: Settings },
      { title: "Delivery Settings", href: "/admin/delivery-settings", icon: Settings },
      { title: "Delivery Dates", href: "/admin/delivery-dates", icon: Calendar },
      { title: "Database Cleanup", href: "/admin/cleanup", icon: Settings }
    ]
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(["Products"])
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false)

  const toggleExpand = (title: string) => {
    // Close all other dropdowns when opening a new one
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [title]
    )
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed(!isDesktopCollapsed)
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const active = isActive(item.href)
    const collapsed = isDesktopCollapsed

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpand(item.title)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 text-[#303A4D] hover:bg-[#FED141]/20 transition-colors rounded-lg ${
              level > 0 && !collapsed ? "pl-8" : ""
            }`}
            title={item.title}
          >
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <item.icon className="w-5 h-5" />
              {!collapsed && <span className="font-medium">{item.title}</span>}
            </div>
            {!collapsed && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            )}
          </button>
          {!collapsed && isExpanded && item.children && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        onClick={closeMobileSidebar}
        className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
          active
            ? "bg-[#FED141] text-[#303A4D] font-bold"
            : "text-[#303A4D] hover:bg-[#FED141]/20"
        } ${level > 0 && !collapsed ? "pl-8" : ""}`}
        title={item.title}
      >
        <item.icon className="w-5 h-5" />
        {!collapsed && <span className={active ? "font-bold" : "font-medium"}>{item.title}</span>}
      </Link>
    )
  }

  return (
    <>
      {/* Overlay - shows ONLY when sidebar is open on mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Mobile toggle button - always visible on mobile */}
      <button
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#FED141] p-3 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6 text-[#303A4D]" /> : <Menu className="w-6 h-6 text-[#303A4D]" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen bg-white border-r-4 border-[#303A4D] overflow-y-auto transition-all duration-300 z-40
        ${
          // Mobile: slide in from left
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }
        lg:translate-x-0
        ${
          // Desktop: collapsible width
          isDesktopCollapsed ? 'lg:w-20' : 'lg:w-64'
        }
        w-64
      `}>
        <div className={`${isDesktopCollapsed ? 'lg:p-2 p-6' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-6">
            {!isDesktopCollapsed && <h2 className="text-xl lg:text-2xl font-bold text-[#303A4D]">Admin Panel</h2>}
            {/* Desktop collapse button */}
            <button
              onClick={toggleDesktopSidebar}
              className="hidden lg:block p-2 hover:bg-[#FED141]/20 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              {isDesktopCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          </div>
          <nav className="space-y-2">
            {menuItems.map(item => renderMenuItem(item))}
          </nav>
        </div>
      </aside>
    </>
  )
}
