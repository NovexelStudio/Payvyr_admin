'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { Download, Search, Filter, X, Copy, Gift, UserX, ChevronDown, ChevronRight } from 'lucide-react'
import { getRedemptions, getAllUsers, banUser } from '@/app/actions'

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

interface GroupedUser {
  userId: string
  userEmail: string
  redemptions: Redemption[]
  totalRedemptions: number
  totalCoinsSpent: number
  completedCount: number
  pendingCount: number
  rejectedCount: number
  processingCount: number
  lastRedemption: number
}

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [filteredRedemptions, setFilteredRedemptions] = useState<(Redemption | GroupedUser)[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'user'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [groupByUser, setGroupByUser] = useState(true)
  const [groupedRedemptionsArray, setGroupedRedemptionsArray] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
    // Group redemptions by user
    const groupedData = redemptions.reduce((groups, redemption) => {
      const userId = redemption.userId
      if (!groups[userId]) {
        groups[userId] = {
          userId,
          userEmail: redemption.userEmail || 'Unknown User',
          redemptions: [],
          totalRedemptions: 0,
          totalCoinsSpent: 0,
          completedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
          processingCount: 0,
          lastRedemption: redemption.createdAt
        }
      }

      groups[userId].redemptions.push(redemption)
      groups[userId].totalRedemptions++
      groups[userId].totalCoinsSpent += redemption.coinCost || 0

      if (redemption.status === 'completed') groups[userId].completedCount++
      else if (redemption.status === 'pending') groups[userId].pendingCount++
      else if (redemption.status === 'rejected') groups[userId].rejectedCount++
      else if (redemption.status === 'processing') groups[userId].processingCount++

      if (redemption.createdAt > groups[userId].lastRedemption) {
        groups[userId].lastRedemption = redemption.createdAt
      }

      return groups
    }, {} as Record<string, {
      userId: string
      userEmail: string
      redemptions: Redemption[]
      totalRedemptions: number
      totalCoinsSpent: number
      completedCount: number
      pendingCount: number
      rejectedCount: number
      processingCount: number
      lastRedemption: number
    }>)

    const groupedArray = Object.values(groupedData)

    setGroupedRedemptionsArray(groupedArray)

    let filtered: (Redemption | GroupedUser)[] = groupByUser ? groupedArray : redemptions

    // Status filter (for individual redemptions when not grouped)
    if (!groupByUser && statusFilter !== 'all') {
      filtered = (filtered as Redemption[]).filter(r => r.status === statusFilter)
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      if (groupByUser) {
        filtered = (filtered as GroupedUser[]).filter(user =>
          user.userEmail?.toLowerCase().includes(searchLower) ||
          user.userId.toLowerCase().includes(searchLower)
        )
      } else {
        filtered = (filtered as Redemption[]).filter(r =>
          r.userEmail?.toLowerCase().includes(searchLower) ||
          r.userId.toLowerCase().includes(searchLower) ||
          r.amount?.toString().includes(searchLower)
        )
      }
    }

    // Date filter
    const now = Date.now()
    if (dateFilter !== 'all') {
      filtered = filtered.filter(item => {
        const itemDate = groupByUser ? (item as GroupedUser).lastRedemption : (item as Redemption).createdAt
        switch (dateFilter) {
          case 'today':
            return new Date(itemDate).toDateString() === new Date().toDateString()
          case 'week':
            const weekAgo = now - 7 * 24 * 60 * 60 * 1000
            return itemDate >= weekAgo
          case 'month':
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000
            return itemDate >= monthAgo
          case 'older':
            const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
            return itemDate < thirtyDaysAgo
          default:
            return true
        }
      })
    }

    // Sorting
    const sortedData = [...filtered].sort((a, b) => {
      let compareValue = 0

      if (sortBy === 'date') {
        const aDate = groupByUser ? (a as GroupedUser).lastRedemption : (a as Redemption).createdAt
        const bDate = groupByUser ? (b as GroupedUser).lastRedemption : (b as Redemption).createdAt
        compareValue = aDate - bDate
      } else if (sortBy === 'amount') {
        if (groupByUser) {
          compareValue = (a as GroupedUser).totalCoinsSpent - (b as GroupedUser).totalCoinsSpent
        } else {
          const aAmount = parseInt((a as Redemption).amount?.replace(/\D/g, '') || '0')
          const bAmount = parseInt((b as Redemption).amount?.replace(/\D/g, '') || '0')
          compareValue = aAmount - bAmount
        }
      } else if (sortBy === 'user') {
        compareValue = ((groupByUser ? (a as GroupedUser).userEmail : (a as Redemption).userEmail) || '').localeCompare((groupByUser ? (b as GroupedUser).userEmail : (b as Redemption).userEmail) || '')
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredRedemptions(sortedData)
  }, [redemptions, search, statusFilter, dateFilter, sortBy, sortOrder, groupByUser])

  // Pagination logic - reactive to itemsPerPage changes
  const [paginatedItems, setPaginatedItems] = useState<(Redemption | GroupedUser)[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const items = filteredRedemptions.length
    const pages = Math.ceil(items / itemsPerPage)
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    const paginated = filteredRedemptions.slice(start, end)

    setTotalItems(items)
    setTotalPages(pages)
    setPaginatedItems(paginated)
  }, [filteredRedemptions, itemsPerPage, currentPage])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, dateFilter, sortBy, sortOrder, groupByUser, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

  const handleBanUser = async (userId: string) => {
    if (confirm('Are you sure you want to ban this user? This will prevent them from accessing the system.')) {
      const formData = new FormData()
      formData.append('uid', userId)
      await banUser(formData)
      // Refresh data
      loadData()
    }
  }

  const handleExportRedemptions = () => {
    if (filteredRedemptions.length === 0) return

    let data: any[] = []

    if (groupByUser) {
      // Export grouped data
      data = filteredRedemptions.map(user => {
        const groupedUser = user as GroupedUser
        return {
          'User Email': groupedUser.userEmail,
          'User ID': groupedUser.userId,
          'Total Redemptions': groupedUser.totalRedemptions,
          'Total Coins Spent': groupedUser.totalCoinsSpent,
          'Completed': groupedUser.completedCount,
          'Pending': groupedUser.pendingCount,
          'Processing': groupedUser.processingCount,
          'Rejected': groupedUser.rejectedCount,
          'Last Redemption': new Date(groupedUser.lastRedemption).toLocaleString()
        }
      })
    } else {
      // Export individual redemptions
      data = filteredRedemptions.map(r => {
        const redemption = r as Redemption
        return {
          'User Email': redemption.userEmail,
          'User ID': redemption.userId,
          'Amount': redemption.amount,
          'Coin Cost': redemption.coinCost,
          'Status': redemption.status,
          'Created': new Date(redemption.createdAt).toLocaleString(),
          'Processed': redemption.processedAt ? new Date(redemption.processedAt).toLocaleString() : 'N/A',
          'Code Used': redemption.redeemedCode || 'N/A'
        }
      })
    }

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `redemptions-${groupByUser ? 'grouped' : 'detailed'}-${new Date().toISOString().split('T')[0]}.csv`
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
              <h1 className="text-2xl md:text-4xl font-black gradient-text">Redemptions</h1>
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
                  <p className="text-gray-400 text-sm">{groupByUser ? 'Grouped by user account' : 'Individual transactions'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setGroupByUser(!groupByUser)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    groupByUser
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {groupByUser ? '📊 Grouped View' : '📋 List View'}
                </button>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{totalItems}</p>
                  <p className="text-sm text-gray-400">of {groupByUser ? groupedRedemptionsArray.length : redemptions.length} {groupByUser ? 'users' : 'redemptions'}</p>
                </div>
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
                      Showing {totalItems} of {redemptions.length} redemptions
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
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('user')}
                        className="flex items-center gap-1 hover:text-white transition-colors group"
                      >
                        {groupByUser ? 'User Account' : 'User'}
                      </button>
                    </th>
                    {groupByUser ? (
                      <>
                        <th className="px-6 py-4 text-center">Total Redemptions</th>
                        <th className="px-6 py-4 text-center">Coins Spent</th>
                        <th className="px-6 py-4 text-center">Status Breakdown</th>
                        <th className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSort('date')}
                            className="flex items-center gap-1 hover:text-white transition-colors group"
                          >
                            Last Activity
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={groupByUser ? 6 : 5} className="px-6 py-8 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <div className="spinner w-5 h-5"></div>
                          <span className="text-gray-400">Loading redemptions...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRedemptions.length === 0 ? (
                    <tr>
                      <td colSpan={groupByUser ? 6 : 5} className="px-6 py-8 text-center">
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
                  ) : groupByUser ? (
                    // Grouped view
                    paginatedItems.map((userGroup: any, index) => (
                      <>
                        <tr
                          key={userGroup.userId}
                          className="group hover:bg-white/5 transition-all duration-200 hover:shadow-md border-l-2 border-transparent hover:border-blue-500/30 cursor-pointer"
                          onClick={() => toggleUserExpansion(userGroup.userId)}
                          style={{ animationDelay: `${index * 0.02}s` }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {expandedUsers.has(userGroup.userId) ? (
                                <ChevronDown size={16} className="text-blue-400" />
                              ) : (
                                <ChevronRight size={16} className="text-gray-400" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-blue-400 truncate">
                                  {userGroup.userEmail}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {userGroup.userId.substring(0, 12)}...
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 rounded-md text-sm font-bold border border-blue-500/30">
                              {userGroup.totalRedemptions}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 rounded-md text-sm font-bold border border-yellow-500/30">
                              {userGroup.totalCoinsSpent}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex gap-1 justify-center">
                              {userGroup.completedCount > 0 && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium border border-green-500/30">
                                  ✓ {userGroup.completedCount}
                                </span>
                              )}
                              {userGroup.pendingCount > 0 && (
                                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium border border-yellow-500/30">
                                  ⏳ {userGroup.pendingCount}
                                </span>
                              )}
                              {userGroup.processingCount > 0 && (
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium border border-blue-500/30">
                                  🔄 {userGroup.processingCount}
                                </span>
                              )}
                              {userGroup.rejectedCount > 0 && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">
                                  ❌ {userGroup.rejectedCount}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-xs">
                              <div className="font-medium text-white">
                                {new Date(userGroup.lastRedemption).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500">
                                {new Date(userGroup.lastRedemption).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBanUser(userGroup.userId)
                              }}
                              disabled={userGroup.userEmail === 'Unknown User'}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={userGroup.userEmail === 'Unknown User' ? 'Cannot ban unknown user' : 'Ban User'}
                            >
                              <UserX size={14} />
                            </button>
                          </td>
                        </tr>
                        {/* Expanded user transactions */}
                        {expandedUsers.has(userGroup.userId) && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-white/5">
                              <div className="border border-white/10 rounded-lg overflow-hidden">
                                <div className="bg-white/10 px-4 py-2 border-b border-white/10">
                                  <h4 className="text-sm font-semibold text-white">Transaction History</h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                  {userGroup.redemptions.map((redemption: Redemption, idx: number) => (
                                    <div key={redemption.id || idx} className="px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                          <span className="text-sm font-medium text-green-400">{redemption.amount}</span>
                                          <span className="text-xs text-gray-400">
                                            {new Date(redemption.createdAt).toLocaleDateString()} {new Date(redemption.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {redemption.status === 'completed' ? (
                                            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium border border-green-500/30">✓ Completed</span>
                                          ) : redemption.status === 'processing' ? (
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium border border-blue-500/30">🔄 Processing</span>
                                          ) : redemption.status === 'pending' ? (
                                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium border border-yellow-500/30">⏳ Pending</span>
                                          ) : (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium border border-red-500/30">❌ Rejected</span>
                                          )}
                                          <button
                                            onClick={() => {
                                              const text = `${redemption.userEmail} - ${redemption.amount} - ${redemption.status}`
                                              navigator.clipboard.writeText(text)
                                            }}
                                            className="p-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded transition-all duration-200"
                                            title="Copy details"
                                          >
                                            <Copy size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))
                  ) : (
                    // Individual view (existing code)
                    paginatedItems.map((item, index) => {
                      const redemption = item as Redemption
                      return (
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
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleBanUser(redemption.userId)}
                              disabled={redemption.userEmail === 'Unknown User'}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={redemption.userEmail === 'Unknown User' ? 'Cannot ban unknown user' : 'Ban User'}
                            >
                              <UserX size={14} />
                            </button>
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
                          </div>
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {groupByUser ? 'users' : 'redemptions'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                              currentPage === pageNum
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with Export */}
            {filteredRedemptions.length > 0 && (
              <div className="p-6 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="custom-input text-sm px-2 py-1 w-16"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="text-sm text-gray-400">
                    Page <span className="font-medium text-white">{currentPage}</span> of{' '}
                    <span className="font-medium text-white">{totalPages}</span> •{' '}
                    Showing <span className="font-medium text-white">{paginatedItems.length}</span> of{' '}
                    <span className="font-medium text-white">{totalItems}</span> {groupByUser ? 'users' : 'redemptions'}
                  </div>
                </div>
                <button
                  onClick={handleExportRedemptions}
                  disabled={filteredRedemptions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50"
                >
                  <Download size={16} />
                  Export {groupByUser ? 'Grouped' : 'Detailed'} CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
