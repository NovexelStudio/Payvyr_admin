'use client'

import { getRedeemCodes } from './actions'
import Navigation from './components/Navigation'
import { Ticket, Users, TrendingUp, BarChart3, ArrowRight, Activity, Zap, Shield } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface RedeemCode {
  id: string
  code: string
  amount: string
  used: boolean
  used_by?: string
  created_at: string
}

export default function DashboardPage() {
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCodes = async () => {
      const data = await getRedeemCodes()
      setCodes(data)
      setLoading(false)
    }
    fetchCodes()
  }, [])

  // Calculate basic stats
  const totalCodes = codes.length
  const usedCodes = codes.filter(c => c.used).length
  const availableCodes = totalCodes - usedCodes
  const usageRate = totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen animated-gradient">
      <Navigation />

      <main className="p-4 md:p-10 font-sans text-gray-100">
        <div className="max-w-7xl mx-auto">

          {/* HEADER */}
          <div className="mb-12">
            <h1 className="text-5xl font-black tracking-tight gradient-text mb-4">
              Dashboard
            </h1>
            <p className="text-gray-400 text-lg">Welcome to your admin control center</p>
            <div className="w-24 h-1 bg-gradient-to-r from-[#D62323] to-[#ff4757] rounded-full mt-4"></div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Ticket size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Total Codes</p>
                  <p className="text-3xl font-bold text-white">{totalCodes}</p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
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
                  <p className="text-xs text-green-400 mt-1">+2.5% from last week</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Zap size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Available</p>
                  <p className="text-3xl font-bold text-white">{availableCodes}</p>
                  <p className="text-xs text-purple-400 mt-1">Ready to use</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white group-hover:scale-110 transition-transform">
                  <Shield size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">System Status</p>
                  <p className="text-3xl font-bold text-green-400">Online</p>
                  <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Link href="/users" className="group card hover-lift">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Users size={28} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-blue-400 transition-colors" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">User Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed">View all users, ban/unban accounts, and manage access permissions.</p>
              <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
                <span>Manage Users</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link href="/codes" className="group card hover-lift">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-gradient-to-br from-[#D62323] to-[#ff4757] rounded-xl text-white group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <Ticket size={28} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-[#D62323] transition-colors" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Code Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Add new codes, view usage statistics, and clean up used codes.</p>
              <div className="mt-4 flex items-center gap-2 text-[#D62323] text-sm font-medium">
                <span>Manage Codes</span>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link href="/analytics" className="group card hover-lift">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white group-hover:scale-110 transition-all duration-300 shadow-lg">
                  <BarChart3 size={28} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-purple-400 transition-colors" size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Detailed insights, trends, and system performance metrics.</p>
              <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm font-medium">
                <span>View Analytics</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="card">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
                <p className="text-gray-400 text-sm">Latest code redemptions and system events</p>
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner"></div>
                  <span className="ml-3 text-gray-400">Loading recent activity...</span>
                </div>
              ) : codes.slice(0, 5).map((code, index) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-6 bg-white/5 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/10"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${code.used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      <Ticket size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-lg">{code.code}</p>
                      <p className="text-sm text-gray-400">{code.amount} • {code.used ? 'Redeemed' : 'Available'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {new Date(code.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(code.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/codes"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D62323] to-[#ff4757] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover-lift"
              >
                <span>View All Codes</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
