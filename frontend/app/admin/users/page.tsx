"use client"

import { useEffect, useState } from "react"
import { Search, UserCheck, UserX, Shield, ShoppingBag, Store, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  username: string
  email: string
  full_name: string
  phone_number?: string
  location?: string
  user_type: string
  verification_status: string
  is_active: boolean
  premium_tier: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const [newUser, setNewUser] = useState({
    email: "",
    username: "",
    full_name: "",
    password: "",
    user_type: "buyer",
    phone_number: "",
    location: ""
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(Array.isArray(data) ? data : [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.email || !newUser.username || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUser)
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully"
        })
        setShowAddModal(false)
        setNewUser({
          email: "",
          username: "",
          full_name: "",
          password: "",
          user_type: "buyer",
          phone_number: "",
          location: ""
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return
    }
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/${userId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully"
        })
        fetchUsers()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail || "Failed to delete user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || user.user_type.toLowerCase() === filterType.toLowerCase()
    return matchesSearch && matchesType
  })

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  const stats = {
    total: users.length,
    buyers: users.filter(u => u.user_type.toLowerCase() === 'buyer').length,
    sellers: users.filter(u => u.user_type.toLowerCase() === 'seller').length,
    admins: users.filter(u => u.user_type.toLowerCase() === 'admin').length,
    active: users.filter(u => u.is_active).length,
    verified: users.filter(u => u.verification_status === 'VERIFIED').length
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-[#303A4D] mb-2">Users Management</h1>
          <p className="text-[#303A4D]/70">Manage all platform users</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] rounded-full px-6 py-3 font-bold flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Total Users</p>
          <p className="text-2xl font-bold text-[#303A4D]">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Buyers</p>
          <p className="text-2xl font-bold text-blue-600">{stats.buyers}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Sellers</p>
          <p className="text-2xl font-bold text-green-600">{stats.sellers}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Admins</p>
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-[#303A4D]/60 text-sm mb-1">Verified</p>
          <p className="text-2xl font-bold text-[#FED141]">{stats.verified}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#303A4D]/40 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="w-full bg-[#F4F2E6] rounded-2xl pl-12 pr-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
          >
            <option value="all">All User Types</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F2E6]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">User</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Tier</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#303A4D]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303A4D]/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#F4F2E6]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-[#303A4D]">{user.full_name || user.username}</p>
                      <p className="text-sm text-[#303A4D]/60">@{user.username}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-[#303A4D]">{user.email}</p>
                      <p className="text-sm text-[#303A4D]/60">{user.phone_number || 'N/A'}</p>
                      <p className="text-xs text-[#303A4D]/40">{user.location || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.user_type.toLowerCase() === 'buyer' && <ShoppingBag className="w-4 h-4 text-blue-600" />}
                      {user.user_type.toLowerCase() === 'seller' && <Store className="w-4 h-4 text-green-600" />}
                      {user.user_type.toLowerCase() === 'admin' && <Shield className="w-4 h-4 text-purple-600" />}
                      <span className="text-sm font-medium text-[#303A4D] capitalize">{user.user_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ml-2 ${
                        user.verification_status === 'VERIFIED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.verification_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FED141]/20 text-[#303A4D]">
                      {user.premium_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-[#303A4D]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleDeleteUser(user.id, user.full_name || user.username)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 rounded-full px-4 py-2 text-sm font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#303A4D]/60">No users found</p>
          </div>
        )}
      </div>
      
      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#303A4D]">Add New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#303A4D]/60 hover:text-[#303A4D]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-2">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-2">Username *</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-[#303A4D] mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-2">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    required
                    minLength={6}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-2">User Type *</label>
                  <select
                    value={newUser.user_type}
                    onChange={(e) => setNewUser({...newUser, user_type: e.target.value})}
                    className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newUser.phone_number}
                    onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                    className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    placeholder="0241234567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[#303A4D] mb-2">Location</label>
                  <input
                    type="text"
                    value={newUser.location}
                    onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                    className="w-full bg-[#F4F2E6] rounded-2xl px-4 py-3 text-[#303A4D] focus:outline-none focus:ring-2 focus:ring-[#FED141]"
                    placeholder="Accra, Ghana"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-[#303A4D] rounded-full py-3 font-bold"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#FED141] hover:bg-[#FED141]/90 text-[#303A4D] rounded-full py-3 font-bold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
