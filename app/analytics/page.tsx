'use client'

import { getRedeemCodes, getAllUsers } from '../actions'
import Navigation from '../../components/Navigation'
import { BarChart3, Users, Ticket, TrendingUp, Calendar, DollarSign, PieChart, Activity, Target, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RedeemCode {
  id: string
  code: string
  amount: string
  used: boolean
  used_by?: string
  created_at: string
}

interface User {
  uid: string
  email?: string
  disabled: boolean
  metadata?: {
    creationTime: string
    lastSignInTime?: string
  }
}

export default function AnalyticsPage() {
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [codesData, usersData] = await Promise.all([
        getRedeemCodes(),
        getAllUsers()
      ])
      setCodes(codesData)
      if (usersData.users) {
        setUsers(usersData.users)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Calculate analytics
  const totalCodes = codes.length
  const usedCodes = codes.filter(c => c.used).length
  const usageRate = totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(1) : '0'

  const totalUsers = users.length
  const bannedUsers = users.filter(u => u.disabled).length
  const activeUsers = totalUsers - bannedUsers

  // Amount breakdown
  const amountStats = codes.reduce((acc, c) => {
    // Standardize the display by replacing R with ₹ if present in the raw data
    const displayAmount = c.amount.replace('R', '₹')
    acc[displayAmount] = (acc[displayAmount] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const usedByAmount = codes.filter(c => c.used).reduce((acc, c) => {
    const displayAmount = c.amount.replace('R', '₹')
    acc[displayAmount] = (acc[displayAmount] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate revenue (Handles both 'R' and '₹' prefixes during calculation)
  const potentialRevenue = codes.reduce((sum, c) => {
    const value = parseInt(c.amount.replace(/[R₹]/g, '')) || 0
    return sum + value
  }, 0)

  const actualRevenue = codes.filter(c => c.used).reduce((sum, c) => {
    const value = parseInt(c.amount.replace(/[R₹]/g, '')) || 0
    return sum + value
  }, 0)

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentCodes = codes.filter(c => new Date(c.created_at) > sevenDaysAgo)
  const recentUsedCodes = codes.filter(c => c.used && new Date(c.created_at) > sevenDaysAgo)

  // User registration trends
  const recentUsers = users.filter(u =>
    u.metadata?.creationTime && new Date(u.metadata.creationTime) > sevenDaysAgo
  )

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-gradient">
      <Navigation />

      <main className="p-4 md:p-10 font-sans text-gray-100">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover-lift"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-text">Analytics<span className="text-[#D62323]">&Insights</span></h1>
                <p className="text-gray-400 text-sm md:text-lg mt-2">Comprehensive data analysis and system insights</p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#D62323] to-[#ff4757] rounded-full mt-4"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-bold border border-blue-500/30">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              Real-time Data
            </div>
          </div>

          {/* KEY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Total Codes</p>
                  <p className="text-3xl font-bold text-white">{totalCodes}</p>
                  <p className="text-xs text-blue-400 mt-1">+{recentCodes.length} this week</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Usage Rate</p>
                  <p className="text-3xl font-bold text-white">{usageRate}%</p>
                  <p className="text-xs text-green-400 mt-1">{usedCodes} redeemed</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Users size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-white">{totalUsers}</p>
                  <p className="text-xs text-purple-400 mt-1">{activeUsers} active</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <DollarSign size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-white">₹{actualRevenue}</p>
                  <p className="text-xs text-orange-400 mt-1">of ₹{potentialRevenue} potential</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

            {/* REVENUE ANALYSIS */}
            <div className="card">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Revenue Analysis</h2>
                  <p className="text-gray-400 text-sm">Financial performance metrics</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Target size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Potential Revenue</p>
                      <p className="text-xl font-bold text-white">₹{potentialRevenue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total value of all codes</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Zap size={20} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Actual Revenue</p>
                      <p className="text-xl font-bold text-white">₹{actualRevenue}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Redeemed codes value</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <TrendingUp size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Conversion Rate</p>
                      <p className="text-xl font-bold text-white">{usageRate}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-400">Revenue efficiency</p>
                  </div>
                </div>
              </div>
            </div>

            {/* USER STATISTICS */}
            <div className="card">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white">
                  <Users size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">User Statistics</h2>
                  <p className="text-gray-400 text-sm">User base analysis and health</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Users size={20} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Active Users</p>
                      <p className="text-xl font-bold text-white">{activeUsers}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{((activeUsers / totalUsers) * 100).toFixed(1)}% of total</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Users size={20} className="text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Banned Users</p>
                      <p className="text-xl font-bold text-white">{bannedUsers}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{((bannedUsers / totalUsers) * 100).toFixed(1)}% of total</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                      <Calendar size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">New Users (7d)</p>
                      <p className="text-xl font-bold text-white">{recentUsers.length}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-cyan-400">Recent registrations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CODE DISTRIBUTION */}
          <div className="card mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl text-white">
                <PieChart size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Code Distribution</h2>
                <p className="text-gray-400 text-sm">Breakdown by amount and usage status</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(amountStats).map(([amount, total], index) => {
                const used = usedByAmount[amount] || 0
                const unused = total - used
                const usagePercent = total > 0 ? ((used / total) * 100).toFixed(1) : '0'

                return (
                  <div
                    key={amount}
                    className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover-lift"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold text-white">{amount}</p>
                      <p className="text-sm text-gray-400">Value</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Total</span>
                        <span className="text-sm font-bold text-white">{total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-400">Used</span>
                        <span className="text-sm font-bold text-green-400">{used}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-400">Available</span>
                        <span className="text-sm font-bold text-blue-400">{unused}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${usagePercent}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-center text-gray-400 mt-2">{usagePercent}% redeemed</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RECENT ACTIVITY SUMMARY */}
          <div className="card">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl text-white">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Recent Activity (7 Days)</h2>
                <p className="text-gray-400 text-sm">Latest system activity and trends</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Ticket size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Codes Created</p>
                    <p className="text-2xl font-bold text-white">{recentCodes.length}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">New codes added this week</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp size={20} className="text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Codes Redeemed</p>
                    <p className="text-2xl font-bold text-white">{recentUsedCodes.length}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Codes used this week</p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Users size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">New Users</p>
                    <p className="text-2xl font-bold text-white">{recentUsers.length}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Users registered this week</p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}