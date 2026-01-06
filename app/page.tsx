'use client'

import { getRedeemCodes } from './actions'
import Navigation from '../components/Navigation'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const data = await getRedeemCodes()
        setCodes(data)
      } catch (err) {
        console.error('Failed to fetch codes:', err)
        setError('Failed to load redeem codes')
      } finally {
        setLoading(false)
      }
    }
    fetchCodes()
  }, [])

  // Calculate basic stats
  const totalCodes = codes.length
  const usedCodes = codes.filter(c => c.used).length
  const availableCodes = totalCodes - usedCodes
  const usageRate = totalCodes > 0 ? ((usedCodes / totalCodes) * 100).toFixed(1) : '0'

  if (error) {
    return (
      <div className="min-h-screen animated-gradient">
        <Navigation />
        <main className="p-6 md:p-8 font-sans text-gray-100">
          <div className="max-w-6xl mx-auto text-center">
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-red-400">Error</h2>
              <p className="text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-gradient">
      <Navigation />

      <main className="p-6 md:p-8 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto">

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight gradient-text mb-3">
              Dashboard
            </h1>
            <p className="text-gray-400 text-base">Welcome to your admin control center</p>
            <div className="w-20 h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full mt-4"></div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg text-white group-hover:scale-105 transition-transform shadow-sm">
                  <Ticket size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Total Codes</p>
                  <p className="text-2xl font-bold text-white">{totalCodes}</p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg text-white group-hover:scale-105 transition-transform shadow-sm">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Usage Rate</p>
                  <p className="text-2xl font-bold text-white">{usageRate}%</p>
                  <p className="text-xs text-emerald-400 mt-1">+2.5% from last week</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg text-white group-hover:scale-105 transition-transform shadow-sm">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Available</p>
                  <p className="text-2xl font-bold text-white">{availableCodes}</p>
                  <p className="text-xs text-purple-400 mt-1">Ready to use</p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-600 to-green-700 rounded-lg text-white group-hover:scale-105 transition-transform shadow-sm">
                  <Shield size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">System Status</p>
                  <p className="text-2xl font-bold text-green-400">Online</p>
                  <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Link href="/users" className="group card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                  <Users size={24} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-blue-400 transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed">View all users, ban/unban accounts, and manage access permissions.</p>
              <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-medium">
                <span>Manage Users</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link href="/codes" className="group card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-600 to-red-700 rounded-lg text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                  <Ticket size={24} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-red-400 transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Code Management</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Add new codes, view usage statistics, and clean up used codes.</p>
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm font-medium">
                <span>Manage Codes</span>
                <ArrowRight size={14} />
              </div>
            </Link>

            <Link href="/analytics" className="group card hover-lift">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg text-white group-hover:scale-105 transition-all duration-300 shadow-sm">
                  <BarChart3 size={24} />
                </div>
                <ArrowRight className="text-gray-400 group-hover:text-purple-400 transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Detailed insights, trends, and system performance metrics.</p>
              <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm font-medium">
                <span>View Analytics</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg text-white">
                <Activity size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <p className="text-gray-400 text-sm">Latest code redemptions and system events</p>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner"></div>
                  <span className="ml-3 text-gray-400">Loading recent activity...</span>
                </div>
              ) : codes.slice(0, 5).map((code, index) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/8 transition-all duration-300 border border-white/5 hover:border-white/10"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${code.used ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      <Ticket size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{code.code}</p>
                      <p className="text-xs text-gray-400">{code.amount} • {code.used ? 'Redeemed' : 'Available'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
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

            <div className="mt-6 text-center">
              <Link
                href="/codes"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white px-5 py-2.5 rounded-lg font-medium hover:shadow-lg transition-all duration-300 hover-lift text-sm"
              >
                <span>View All Codes</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
