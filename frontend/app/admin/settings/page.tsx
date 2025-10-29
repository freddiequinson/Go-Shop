"use client"

import { useState } from "react"
import { Save, Bell, Shield, Database, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "GoShop Ghana",
    siteEmail: "admin@goshopghana.com",
    lowStockThreshold: "10",
    orderNotifications: true,
    emailNotifications: true,
    maintenanceMode: false,
    autoApproveOrders: false
  })

  const handleSave = () => {
    // Save settings logic
    alert("Settings saved successfully!")
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Settings</h1>
        <p className="text-[#303A4D]/70">Manage system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-6 h-6 text-[#FED141]" />
            <h2 className="text-2xl font-bold text-[#303A4D]">General Settings</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[#303A4D] font-bold mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-2">Site Email</label>
              <input
                type="email"
                value={settings.siteEmail}
                onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>

            <div>
              <label className="block text-[#303A4D] font-bold mb-2">Low Stock Threshold</label>
              <input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: e.target.value })}
                className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-[#FED141]" />
            <h2 className="text-2xl font-bold text-[#303A4D]">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.orderNotifications}
                onChange={(e) => setSettings({ ...settings, orderNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-[#303A4D]"
              />
              <span className="text-[#303A4D] font-medium">Order Notifications</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-[#303A4D]"
              />
              <span className="text-[#303A4D] font-medium">Email Notifications</span>
            </label>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[#FED141]" />
            <h2 className="text-2xl font-bold text-[#303A4D]">System</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-[#303A4D]"
              />
              <span className="text-[#303A4D] font-medium">Maintenance Mode</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoApproveOrders}
                onChange={(e) => setSettings({ ...settings, autoApproveOrders: e.target.checked })}
                className="w-5 h-5 rounded border-2 border-[#303A4D]"
              />
              <span className="text-[#303A4D] font-medium">Auto-approve Orders</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Button
          onClick={handleSave}
          className="bg-[#FED141] hover:bg-[#F1B424] text-[#303A4D] rounded-full px-8 py-4 font-bold text-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
