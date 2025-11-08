"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Award, MapPin, Activity, DollarSign } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getApiBaseUrl } from '@/lib/api/url-helper'

interface UserAnalyticsData {
  overview: {
    total_users: number
    active_users: number
    new_users_this_month: number
    premium_users: number
    activity_rate: number
    users_by_type: Record<string, number>
    users_by_verification: Record<string, number>
  }
  topCustomers: Array<{
    id: string
    full_name: string
    email: string
    username: string
    premium_tier: string
    member_since: string
    total_orders: number
    total_spent: number
  }>
  signupSources: Array<{
    source: string
    count: number
    percentage: number
  }>
  growthTrend: Array<{
    date: string
    signups: number
  }>
  locations: Array<{
    location: string
    count: number
  }>
  engagement: {
    total_users: number
    users_with_orders: number
    active_last_7_days: number
    active_last_30_days: number
    conversion_rate: number
    engagement_rate_7d: number
    engagement_rate_30d: number
  }
}

const COLORS = ['#FED141', '#303A4D', '#F1B424', '#4A5568', '#68D391', '#FC8181', '#63B3ED', '#F6AD55']

export default function UserAnalytics() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserAnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const baseUrl = getApiBaseUrl()

      // Fetch all analytics data
      const [overview, topCustomers, signupSources, growthTrend, locations, engagement] = await Promise.all([
        fetch(`${baseUrl}/admin/user-analytics/overview`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${baseUrl}/admin/user-analytics/top-customers?limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${baseUrl}/admin/user-analytics/signup-sources`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${baseUrl}/admin/user-analytics/growth-trend?days=30`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${baseUrl}/admin/user-analytics/location-distribution`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${baseUrl}/admin/user-analytics/engagement-metrics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      ])

      setData({
        overview,
        topCustomers: topCustomers.top_customers || [],
        signupSources: signupSources.signup_sources || [],
        growthTrend: growthTrend.trend_data || [],
        locations: locations.locations || [],
        engagement
      })
    } catch (err) {
      console.error('Error fetching user analytics:', err)
      setError('Failed to load user analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FED141]"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 p-8">
        {error || 'Failed to load analytics'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.new_users_this_month} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.active_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.activity_rate}% activity rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.premium_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((data.overview.premium_users / data.overview.total_users) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.engagement.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.engagement.users_with_orders} users made purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth Trend (Last 30 Days)</CardTitle>
          <CardDescription>Daily new user signups</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.growthTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Legend />
              <Line type="monotone" dataKey="signups" stroke="#FED141" strokeWidth={2} name="New Signups" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Customers</CardTitle>
          <CardDescription>Customers with highest total spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topCustomers.map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FED141] text-[#303A4D] font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{customer.full_name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-[#303A4D]">GH₵{customer.total_spent.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{customer.total_orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signup Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Signup Sources</CardTitle>
            <CardDescription>How users found GoShop Ghana</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.signupSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ source, percentage }) => `${source}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.signupSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {data.signupSources.map((source, index) => (
                <div key={source.source} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{source.source}</span>
                  </div>
                  <span className="font-semibold">{source.count} ({source.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>User distribution by location</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.locations.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#FED141" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>User activity and engagement rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Last 7 Days</p>
              <p className="text-2xl font-bold text-green-600">{data.engagement.active_last_7_days}</p>
              <p className="text-xs text-gray-500">{data.engagement.engagement_rate_7d}% of total users</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Active Last 30 Days</p>
              <p className="text-2xl font-bold text-blue-600">{data.engagement.active_last_30_days}</p>
              <p className="text-xs text-gray-500">{data.engagement.engagement_rate_30d}% of total users</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Users with Orders</p>
              <p className="text-2xl font-bold text-purple-600">{data.engagement.users_with_orders}</p>
              <p className="text-xs text-gray-500">{data.engagement.conversion_rate}% conversion rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
