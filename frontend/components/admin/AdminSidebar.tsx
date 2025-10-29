"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, Package, Warehouse, Users, Truck, 
  ShoppingCart, BarChart3, Settings, Image, FileText,
  ChevronDown, ChevronRight, Boxes, Menu, X, Shield
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
      { title: "Inventory", href: "/admin/warehouse", icon: Warehouse },
      { title: "Stock Alerts", href: "/admin/warehouse/alerts", icon: Warehouse },
      { title: "Restock Orders", href: "/admin/warehouse/restock", icon: Warehouse },
      { title: "Movements", href: "/admin/warehouse/movements", icon: Warehouse },
      { title: "Analytics", href: "/admin/warehouse/analytics", icon: BarChart3 }
    ]
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    children: [
      { title: "All Orders", href: "/admin/orders", icon: ShoppingCart },
      { title: "Pending", href: "/admin/orders?status=pending", icon: ShoppingCart },
      { title: "In Progress", href: "/admin/orders?status=in_progress", icon: ShoppingCart },
      { title: "Completed", href: "/admin/orders?status=completed", icon: ShoppingCart }
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
    title: "Analytics",
    icon: BarChart3,
    children: [
      { title: "Sales Report", href: "/admin/analytics/sales", icon: BarChart3 },
      { title: "Product Analytics", href: "/admin/analytics/products", icon: Package },
      { title: "Customer Insights", href: "/admin/analytics/customers", icon: Users },
      { title: "Revenue Report", href: "/admin/analytics/revenue", icon: BarChart3 }
    ]
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: Shield
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(["Products"])
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleExpand = (title: string) => {
    // Close all other dropdowns when opening a new one
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [title]
    )
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + "/")
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const active = isActive(item.href)

    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleExpand(item.title)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 text-[#303A4D] hover:bg-[#FED141]/20 transition-colors rounded-lg ${
              level > 0 && !isCollapsed ? "pl-8" : ""
            }`}
            title={item.title}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
              <item.icon className="w-5 h-5" />
              {!isCollapsed && <span className="font-medium">{item.title}</span>}
            </div>
            {!isCollapsed && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            )}
          </button>
          {!isCollapsed && isExpanded && item.children && (
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
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg transition-colors ${
          active
            ? "bg-[#FED141] text-[#303A4D] font-bold"
            : "text-[#303A4D] hover:bg-[#FED141]/20"
        } ${level > 0 && !isCollapsed ? "pl-8" : ""}`}
        title={item.title}
      >
        <item.icon className="w-5 h-5" />
        {!isCollapsed && <span className={active ? "font-bold" : "font-medium"}>{item.title}</span>}
      </Link>
    )
  }

  return (
    <>
      {/* Overlay to close sidebar when clicking outside (mobile/collapsed) */}
      {isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#FED141] p-2 rounded-lg shadow-lg"
      >
        {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-white border-r-4 border-[#303A4D] h-screen sticky top-0 overflow-y-auto transition-all duration-300 z-40`}>
        <div className={`${isCollapsed ? 'p-2' : 'p-6'}`}>
          <div className="flex items-center justify-between mb-6">
            {!isCollapsed && <h2 className="text-2xl font-bold text-[#303A4D]">Admin Panel</h2>}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-2 hover:bg-[#FED141]/20 rounded-lg transition-colors"
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
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
