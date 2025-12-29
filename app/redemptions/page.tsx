'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/app/components/Navigation'
import { Download, Search, Filter, X, Copy, Gift } from 'lucide-react'
import { getRedemptions, getAllUsers } from '@/app/actions'

interface Redemption {
  id?: string
  userId: string
  userEmail?: string
  amount: string
  coinCost: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  redeemedCode?: string
  createdAt: number
  processedAt?: number
}

interface FirebaseRedemption {
  userId: string
  amount: string
  coinCost: number
  status: string
  createdAt: number
  processedAt?: number
  redeemedCode?: string
}

interface User {
  uid: string
  email: string | undefined
  emailVerified: boolean
  displayName: string | undefined
  photoURL: string | undefined
  phoneNumber: string | undefined
  disabled: boolean
  metadata: {
    creationTime: string
    lastSignInTime: string
  }
}

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [filteredRedemptions, setFilteredRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'user'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [redemptionsRes, usersRes] = await Promise.all([
        getRedemptions(),
        getAllUsers()
      ])

      // Build email map first
      const emailMap: Record<string, string> = {}
      if (usersRes.users && Array.isArray(usersRes.users)) {
        usersRes.users.forEach((user: User) => {
          if (user.uid && user.email) {
            emailMap[user.uid] = user.email
          }
        })
      }

      if (redemptionsRes.redemptions && typeof redemptionsRes.redemptions === 'object') {
        const redemptionsList: Redemption[] = []
        
        // redemptions structure: { redemptionId: { userId, amount, coinCost, status, createdAt, ... } }
        Object.entries(redemptionsRes.redemptions).forEach(([redemptionId, redemption]) => {
          if (redemption && typeof redemption === 'object' && 'userId' in redemption) {
            const firebaseRedemption = redemption as FirebaseRedemption
            redemptionsList.push({
              id: redemptionId,
              userId: firebaseRedemption.userId || '',
              userEmail: emailMap[firebaseRedemption.userId] || 'Unknown User',
              amount: firebaseRedemption.amount || 'N/A',
              coinCost: firebaseRedemption.coinCost || 0,
              status: (firebaseRedemption.status as 'pending' | 'processing' | 'completed' | 'rejected') || 'pending',
              redeemedCode: firebaseRedemption.redeemedCode,
              createdAt: firebaseRedemption.createdAt || Date.now(),
              processedAt: firebaseRedemption.processedAt
            })
          }
        })

        setRedemptions(redemptionsList)
      } else {
        setRedemptions([])
      }
    } catch (error) {
      console.error('Failed to load redemptions:', error)
      setRedemptions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = redemptions

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(r =>
        r.userEmail?.toLowerCase().includes(searchLower) ||
        r.userId.toLowerCase().includes(searchLower) ||
        r.amount?.toString().includes(searchLower)
      )
    }

    // Date filter
    const now = Date.now()
    if (dateFilter !== 'all') {
      filtered = filtered.filter(r => {
        const redemptionDate = new Date(r.createdAt)
        switch (dateFilter) {
          case 'today':
            return redemptionDate.toDateString() === new Date().toDateString()
          case 'week':
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000
            return r.createdAt >= weekAgo
          case 'month':
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000
            return r.createdAt >= monthAgo
          case 'older':
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
            return r.createdAt < thirtyDaysAgo
          default:
            return true
        }
      })
    }

    // Sorting
    const sortedRedemptions = [...filtered].sort((a, b) => {
      let compareValue = 0
      
      if (sortBy === 'date') {
        compareValue = a.createdAt - b.createdAt
      } else if (sortBy === 'amount') {
        const aAmount = parseInt(a.amount?.replace(/\D/g, '') || '0')
        const bAmount = parseInt(b.amount?.replace(/\D/g, '') || '0')
        compareValue = aAmount - bAmount
      } else if (sortBy === 'user') {
        compareValue = (a.userEmail || '').localeCompare(b.userEmail || '')
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredRedemptions(sortedRedemptions)
  }, [redemptions, search, statusFilter, dateFilter, sortBy, sortOrder])

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleExportRedemptions = () => {
    if (filteredRedemptions.length === 0) return
    
    const data = filteredRedemptions.map(r => ({
      'User Email': r.userEmail,
      'User ID': r.userId,
      'Amount': r.amount,
      'Coin Cost': r.coinCost,
      'Status': r.status,
      'Created': new Date(r.createdAt).toLocaleString(),
      'Processed': r.processedAt ? new Date(r.processedAt).toLocaleString() : 'N/A',
      'Code Used': r.redeemedCode || 'N/A'
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `redemptions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate stats
  const totalRedemptions = redemptions.length
  const completedRedemptions = redemptions.filter(r => r.status === 'completed').length
  const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length
  const processingRedemptions = redemptions.filter(r => r.status === 'processing').length
  const rejectedRedemptions = redemptions.filter(r => r.status === 'rejected').length

  const totalCoins = redemptions.reduce((sum, r) => sum + (r.coinCost || 0), 0)

  return (
    <div className="min-h-screen animated-gradient">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 md:px-10 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white shadow-lg">
              <Gift size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black gradient-text">Redemptions</h1>
              <p className="text-gray-400 text-sm">Track all user redemption activity</p>
            </div>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Redemptions</p>
                  <p className="text-3xl font-black text-white">{totalRedemptions}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Gift size={24} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Completed</p>
                  <p className="text-3xl font-black text-green-400">{completedRedemptions}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-green-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Processing</p>
                  <p className="text-3xl font-black text-blue-400">{processingRedemptions}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Pending</p>
                  <p className="text-3xl font-black text-yellow-400">{pendingRedemptions}</p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Rejected</p>
                  <p className="text-3xl font-black text-red-400">{rejectedRedemptions}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-red-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Coins</p>
                  <p className="text-3xl font-black text-purple-400">{totalCoins}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <span className="text-xl">🪙</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN TABLE CARD */}
        <div className="card overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
          <div className="relative">
            {/* Header */}
            <div className="p-8 border-b border-white/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white shadow-lg">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Redemption History</h2>
                  <p className="text-gray-400 text-sm">Complete transaction log from Firebase</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{filteredRedemptions.length}</p>
                <p className="text-sm text-gray-400">of {redemptions.length} redemptions</p>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="p-8 border-b border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex-1 max-w-md group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Search by email, user ID, or amount..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="custom-input w-full pl-12 group-hover:border-blue-500/50 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`ml-4 p-3 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-lg ${
                    showFilters
                      ? 'bg-gradient-to-r from-[#D62323] to-[#ff4757] text-white shadow-red-500/25'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white hover:shadow-lg'
                  }`}
                >
                  <Filter size={18} className={showFilters ? 'animate-pulse' : ''} />
                  <span className="text-sm hidden sm:inline">Filters</span>
                </button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'processing' | 'completed' | 'rejected')}
                        className="custom-input w-full group-hover:border-gray-500/50 transition-colors"
                      >
                        <option value="all" className="bg-slate-700">All Status</option>
                        <option value="completed" className="bg-slate-700">✅ Completed</option>
                        <option value="processing" className="bg-slate-700">🔄 Processing</option>
                        <option value="pending" className="bg-slate-700">⏳ Pending</option>
                        <option value="rejected" className="bg-slate-700">❌ Rejected</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                        Date Range
                      </label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="custom-input w-full group-hover:border-blue-500/50 transition-colors"
                      >
                        <option value="all" className="bg-slate-700">All Time</option>
                        <option value="today" className="bg-slate-700">📅 Today</option>
                        <option value="week" className="bg-slate-700">📊 This Week</option>
                        <option value="month" className="bg-slate-700">🗓️ This Month</option>
                        <option value="older" className="bg-slate-700">📚 Older than 30 days</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      Showing {filteredRedemptions.length} of {redemptions.length} redemptions
                    </span>
                    <button
                      onClick={() => {
                        setStatusFilter('all')
                        setDateFilter('all')
                        setSearch('')
                      }}
                      className="text-sm text-[#D62323] hover:text-red-400 transition-colors flex items-center gap-2 font-medium hover:bg-red-500/10 px-3 py-1 rounded-lg"
                    >
                      <X size={16} />
                      Clear Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-300 text-xs uppercase tracking-wider font-bold sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left">User</th>
                    <th className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-1 hover:text-white transition-colors group"
                      >
                        Amount
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-white transition-colors group"
                      >
                        Timestamp
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="spinner w-5 h-5"></div>
                          <span className="text-gray-400">Loading redemptions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-white/5 rounded-full">
                            <Gift size={32} className="text-gray-600" />
                          </div>
                          <div>
                            <span className="text-gray-400 text-sm block">No redemptions found</span>
                            <span className="text-gray-500 text-xs">Try adjusting your search or filters</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRedemptions.map((redemption, index) => (
                      <tr
                        key={redemption.id || index}
                        className="group hover:bg-white/5 transition-all duration-200 hover:shadow-md border-l-2 border-transparent hover:border-blue-500/30"
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-blue-400 truncate">
                              {redemption.userEmail}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {redemption.userId.substring(0, 12)}...
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-400 rounded-md text-sm font-bold border border-green-500/30">
                            {redemption.amount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs">
                            <div className="font-medium text-white">
                              {new Date(redemption.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500">
                              {new Date(redemption.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {redemption.status === 'completed' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="text-green-400 font-medium text-xs">Completed</span>
                            </div>
                          ) : redemption.status === 'processing' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                              <span className="text-blue-400 font-medium text-xs">Processing</span>
                            </div>
                          ) : redemption.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                              <span className="text-yellow-400 font-medium text-xs">Pending</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                              <span className="text-red-400 font-medium text-xs">Rejected</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              const text = `${redemption.userEmail} - ${redemption.amount} - ${redemption.status}`
                              navigator.clipboard.writeText(text)
                            }}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-md transition-all duration-200"
                            title="Copy details"
                          >
                            <Copy size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer with Export */}
            {filteredRedemptions.length > 0 && (
              <div className="p-6 border-t border-white/10 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-medium text-white">{filteredRedemptions.length}</span> of{' '}
                  <span className="font-medium text-white">{redemptions.length}</span> redemptions
                </div>
                <button
                  onClick={handleExportRedemptions}
                  disabled={filteredRedemptions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
