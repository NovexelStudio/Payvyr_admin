'use client'

import { addRedeemCode, getRedeemCodes, removeUsedCodesByValue, deleteRedeemCode, getUserInfo } from '../actions'
import Navigation from '../components/Navigation'
import { PlusCircle, Ticket, Search, Trash2, AlertTriangle, Filter, X, BarChart3, Calendar, ChevronUp, ChevronDown, CheckSquare, Square, Download, Copy } from 'lucide-react'
import { useState, useEffect } from 'react'

interface RedeemCode {
  id: string
  code: string
  amount: string
  used: boolean
  used_by?: string
  created_at: string
  used_at?: string
}

export default function CodesPage() {
  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [removeValue, setRemoveValue] = useState('')
  const [removeLoading, setRemoveLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'available'>('all')
  const [amountFilter, setAmountFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [userEmails, setUserEmails] = useState<Record<string, string>>({})

  // New state for enhanced features
  const [sortBy, setSortBy] = useState<'created_at' | 'amount' | 'used' | 'code'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    const fetchCodes = async () => {
      const data = await getRedeemCodes()
      setCodes(data)
      setLoading(false)
    }
    fetchCodes()
  }, [])

  useEffect(() => {
    const fetchUserEmails = async () => {
      if (codes.length === 0) return

      const uniqueUids = [...new Set([
        ...codes.filter(c => c.used_by).map(c => c.used_by!)
      ])]

      const emailPromises = uniqueUids.map(async (uid) => {
        try {
          const result = await getUserInfo(uid)
          return { uid, email: result.user?.email || 'Unknown User' }
        } catch (error) {
          console.error(`Failed to fetch user info for ${uid}:`, error)
          return { uid, email: 'Unknown User' }
        }
      })

      const emailResults = await Promise.all(emailPromises)
      const emailMap = emailResults.reduce((acc, { uid, email }) => {
        acc[uid] = email
        return acc
      }, {} as Record<string, string>)

      setUserEmails(emailMap)
    }

    fetchUserEmails()
  }, [codes])

  const filteredCodes = codes.filter(c => {
    // Search filter
    const userEmail = c.used_by ? userEmails[c.used_by] || '' : ''
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.amount.toLowerCase().includes(search.toLowerCase()) ||
      (c.used_by && c.used_by.toLowerCase().includes(search.toLowerCase())) ||
      userEmail.toLowerCase().includes(search.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'used' && c.used) ||
      (statusFilter === 'available' && !c.used)

    // Amount filter
    const matchesAmount = amountFilter === 'all' || c.amount === amountFilter

    // Date filter
    let matchesDate = true
    if (dateFilter !== 'all') {
      const codeDate = new Date(c.created_at)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - codeDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0
          break
        case 'week':
          matchesDate = daysDiff <= 7
          break
        case 'month':
          matchesDate = daysDiff <= 30
          break
        case 'older':
          matchesDate = daysDiff > 30
          break
      }
    }

    return matchesSearch && matchesStatus && matchesAmount && matchesDate
  })

  // Sort filtered codes
  const sortedCodes = [...filteredCodes].sort((a, b) => {
    let aValue: string | number | boolean, bValue: string | number | boolean

    switch (sortBy) {
      case 'code':
        aValue = a.code.toLowerCase()
        bValue = b.code.toLowerCase()
        break
      case 'amount':
        aValue = parseInt(a.amount.replace('R', ''))
        bValue = parseInt(b.amount.replace('R', ''))
        break
      case 'used':
        aValue = a.used ? 1 : 0
        bValue = b.used ? 1 : 0
        break
      case 'created_at':
      default:
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
    }
  })

  // Bulk operations functions
  const handleSelectAll = () => {
    if (selectedCodes.size === sortedCodes.length) {
      setSelectedCodes(new Set())
    } else {
      setSelectedCodes(new Set(sortedCodes.map(c => c.id)))
    }
  }

  const handleSelectCode = (codeId: string) => {
    const newSelected = new Set(selectedCodes)
    if (newSelected.has(codeId)) {
      newSelected.delete(codeId)
    } else {
      newSelected.add(codeId)
    }
    setSelectedCodes(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedCodes.size === 0) return

    const confirmMessage = `Are you sure you want to delete ${selectedCodes.size} selected code${selectedCodes.size > 1 ? 's' : ''}? This action cannot be undone.`
    if (!confirm(confirmMessage)) return

    setBulkLoading(true)
    let successCount = 0

    for (const codeId of selectedCodes) {
      const result = await deleteRedeemCode(codeId)
      if (result.success) successCount++
    }

    if (successCount > 0) {
      const data = await getRedeemCodes()
      setCodes(data)
      setSelectedCodes(new Set())
    }

    setBulkLoading(false)
  }

  const handleBulkExport = () => {
    const selectedData = sortedCodes.filter(c => selectedCodes.has(c.id))
    const csvContent = [
      ['Code', 'Amount', 'Status', 'User', 'Created At', 'Used At'].join(','),
      ...selectedData.map(c => [
        c.code,
        c.amount,
        c.used ? 'Used' : 'Available',
        c.used_by ? userEmails[c.used_by] || c.used_by : 'Not used',
        new Date(c.created_at).toLocaleString(),
        c.used_at ? new Date(c.used_at).toLocaleString() : 'Not used'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `redeem-codes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handleRemoveUsedCodes = async () => {
    if (!removeValue.trim()) return
    setRemoveLoading(true)
    const result = await removeUsedCodesByValue(removeValue.trim())
    if (result.success) {
      // Refresh codes
      const data = await getRedeemCodes()
      setCodes(data)
    }
    setRemoveLoading(false)
  }

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this redeem code? This action cannot be undone.')) {
      return
    }

    setDeleteLoading(codeId)
    const result = await deleteRedeemCode(codeId)
    if (result.success) {
      // Refresh codes
      const data = await getRedeemCodes()
      setCodes(data)
    } else {
      alert('Failed to delete code. Please try again.')
    }
    setDeleteLoading(null)
  }

  // Calculate stats
  const totalCodes = codes.length
  const usedCodes = codes.filter(c => c.used).length
  const availableCodes = totalCodes - usedCodes

  // Breakdown by amount
  const amountStats = codes.reduce((acc, c) => {
    acc[c.amount] = (acc[c.amount] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const usedByAmount = codes.filter(c => c.used).reduce((acc, c) => {
    acc[c.amount] = (acc[c.amount] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
                <h1 className="text-5xl font-black tracking-tight gradient-text">Code<span className="text-[#D62323]">Management</span></h1>
                <p className="text-gray-400 text-lg mt-2">Manage redeem codes and monitor usage statistics</p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#D62323] to-[#ff4757] rounded-full mt-4"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Data
            </div>
          </div>

          {/* ENHANCED STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Ticket size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Total Codes</p>
                  <p className="text-3xl font-bold text-white">{totalCodes}</p>
                  <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                    All time created
                  </p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Ticket size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Used Codes</p>
                  <p className="text-3xl font-bold text-white">{usedCodes}</p>
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
                    Successfully redeemed
                  </p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Ticket size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Available</p>
                  <p className="text-3xl font-bold text-white">{availableCodes}</p>
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    Ready for use
                  </p>
                </div>
              </div>
            </div>

            <div className="card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <AlertTriangle size={28} />
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Cleanup Ready</p>
                  <p className="text-3xl font-bold text-white">{usedCodes}</p>
                  <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                    <div className="w-1 h-1 bg-orange-400 rounded-full animate-pulse"></div>
                    Can be removed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ENHANCED AMOUNT BREAKDOWN */}
          <div className="card mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Amount Breakdown</h2>
                  <p className="text-gray-400 text-sm">Distribution of codes by value with usage statistics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(amountStats).map(([amount, count], index) => {
                  const used = usedByAmount[amount] || 0
                  const usageRate = count > 0 ? ((used / count) * 100).toFixed(1) : '0'

                  return (
                    <div
                      key={amount}
                      className="bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover-lift group relative overflow-hidden"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform">
                            <Ticket size={24} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 font-medium">{amount} Codes</p>
                            <p className="text-2xl font-bold text-white">{count}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Used</span>
                            <span className="text-red-400 font-bold">{used}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Available</span>
                            <span className="text-green-400 font-bold">{count - used}</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${usageRate}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-center text-gray-400">{usageRate}% redeemed</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

            {/* ENHANCED FORM */}
            <div className="card h-fit relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D62323]/5 to-[#ff4757]/5"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-gradient-to-br from-[#D62323] to-[#ff4757] rounded-xl text-white shadow-lg">
                    <PlusCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Add New Code</h2>
                    <p className="text-gray-400 text-sm">Create redeem codes for users</p>
                  </div>
                </div>

                <form action={addRedeemCode} className="space-y-6">
                  <div className="group">
                    <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                      <Ticket size={16} className="text-[#D62323]" />
                      Code Value
                    </label>
                    <input
                      name="code"
                      placeholder="e.g. GP10-A1B2-C3D4-E5F6"
                      className="custom-input w-full group-hover:border-[#D62323]/50 transition-colors"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-2">Enter a unique code for redemption</p>
                  </div>

                  <div className="group">
                    <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
                      Amount
                    </label>
                    <select name="amount" className="custom-input w-full group-hover:border-[#D62323]/50 transition-colors" required>
                      <option value="" className="bg-slate-700">Select Amount</option>
                      <option value="R10" className="bg-slate-700">💰 R10 - Small Reward</option>
                      <option value="R20" className="bg-slate-700">💎 R20 - Medium Reward</option>
                      <option value="R50" className="bg-slate-700">🏆 R50 - Large Reward</option>
                      <option value="R100" className="bg-slate-700">👑 R100 - Premium Reward</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">Choose the monetary value for this code</p>
                  </div>

                  <button className="btn-primary w-full flex items-center justify-center gap-2 group hover:scale-105 transition-transform">
                    <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    <span>Add Redeem Code</span>
                  </button>
                </form>

                {/* ENHANCED CLEANUP SECTION */}
                <div className="mt-10 pt-8 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white shadow-lg">
                      <Trash2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Cleanup Used Codes</h3>
                      <p className="text-gray-400 text-sm">Remove redeemed codes by value to keep database clean</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-400" />
                        Remove Used Codes by Value
                      </label>
                      <select
                        value={removeValue}
                        onChange={(e) => setRemoveValue(e.target.value)}
                        className="custom-input w-full group-hover:border-red-500/50 transition-colors"
                      >
                        <option value="" className="bg-slate-700">Select Amount to Remove</option>
                        <option value="R10" className="bg-slate-700">🗑️ R10 (Used: {usedByAmount['R10'] || 0})</option>
                        <option value="R20" className="bg-slate-700">🗑️ R20 (Used: {usedByAmount['R20'] || 0})</option>
                        <option value="R50" className="bg-slate-700">🗑️ R50 (Used: {usedByAmount['R50'] || 0})</option>
                        <option value="R100" className="bg-slate-700">🗑️ R100 (Used: {usedByAmount['R100'] || 0})</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-2">This will permanently delete all used codes of the selected value</p>
                    </div>

                    <button
                      onClick={handleRemoveUsedCodes}
                      disabled={removeLoading || !removeValue}
                      className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group hover:scale-105 transition-transform bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      <Trash2 size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                      {removeLoading ? (
                        <>
                          <div className="spinner w-4 h-4"></div>
                          <span>Removing...</span>
                        </>
                      ) : (
                        <span>Remove Used {removeValue} Codes</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ENHANCED TABLE */}
            <div className="lg:col-span-2 card overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"></div>
              <div className="relative">
                <div className="p-8 border-b border-white/10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                      <Ticket size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">All Codes</h2>
                      <p className="text-gray-400 text-sm">Live data from Supabase with real-time updates</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{filteredCodes.length}</p>
                      <p className="text-sm text-gray-400">of {codes.length} codes</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-400">Live</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 border-b border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-1 max-w-md group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="Search codes, amounts, emails, or user IDs..."
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

                  {/* ENHANCED FILTERS */}
                  {showFilters && (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 shadow-xl animate-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group">
                          <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"></div>
                            Status
                          </label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'used' | 'available')}
                            className="custom-input w-full group-hover:border-gray-500/50 transition-colors"
                          >
                            <option value="all" className="bg-slate-700">All Status</option>
                            <option value="available" className="bg-slate-700">✅ Available</option>
                            <option value="used" className="bg-slate-700">❌ Used</option>
                          </select>
                        </div>
                        <div className="group">
                          <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-red-500"></div>
                            Amount
                          </label>
                          <select
                            value={amountFilter}
                            onChange={(e) => setAmountFilter(e.target.value)}
                            className="custom-input w-full group-hover:border-red-500/50 transition-colors"
                          >
                            <option value="all" className="bg-slate-700">All Amounts</option>
                            <option value="R10" className="bg-slate-700">💰 R10</option>
                            <option value="R20" className="bg-slate-700">💎 R20</option>
                            <option value="R50" className="bg-slate-700">🏆 R50</option>
                            <option value="R100" className="bg-slate-700">👑 R100</option>
                          </select>
                        </div>
                        <div className="group">
                          <label className="text-sm font-semibold text-gray-300 mb-3 block flex items-center gap-2">
                            <Calendar size={16} className="text-cyan-400" />
                            Date Created
                          </label>
                          <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="custom-input w-full group-hover:border-cyan-500/50 transition-colors"
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
                          Showing {filteredCodes.length} of {codes.length} codes
                        </span>
                        <button
                          onClick={() => {
                            setStatusFilter('all')
                            setAmountFilter('all')
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

                {/* QUICK ACTIONS TOOLBAR */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 font-medium">Quick Actions:</span>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          viewMode === 'table'
                            ? 'bg-[#D62323] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        Table
                      </button>
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          viewMode === 'cards'
                            ? 'bg-[#D62323] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                        title="Toggle card view"
                      >
                        Cards
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allCodes = codes.map(c => c.code).join('\n')
                        navigator.clipboard.writeText(allCodes)
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all duration-200 text-sm"
                      title="Copy all codes to clipboard"
                    >
                      <Copy size={14} />
                      Copy All
                    </button>
                    <button
                      onClick={handleBulkExport}
                      disabled={codes.length === 0}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg transition-all duration-200 text-sm disabled:opacity-50"
                    >
                      <Download size={14} />
                      Export All
                    </button>
                  </div>
                </div>

                {/* BULK ACTIONS BAR */}
                {selectedCodes.size > 0 && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <CheckSquare size={16} className="text-blue-400" />
                        </div>
                        <span className="text-white font-medium">
                          {selectedCodes.size} code{selectedCodes.size > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkExport}
                          className="flex items-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          <Download size={14} />
                          Export CSV
                        </button>
                        <button
                          onClick={() => setSelectedCodes(new Set())}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 hover:text-gray-300 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          <X size={14} />
                          Clear
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          disabled={bulkLoading}
                          className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50"
                        >
                          {bulkLoading ? (
                            <div className="spinner w-3 h-3"></div>
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Delete Selected
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-300 text-xs uppercase tracking-wider font-bold sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 first:rounded-tl-2xl text-center w-12">
                          <button
                            onClick={handleSelectAll}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title={selectedCodes.size === sortedCodes.length ? "Deselect all" : "Select all"}
                          >
                            {selectedCodes.size === sortedCodes.length && sortedCodes.length > 0 ? (
                              <CheckSquare size={16} className="text-blue-400" />
                            ) : (
                              <Square size={16} className="text-gray-400" />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3 text-left">
                          <button
                            onClick={() => handleSort('code')}
                            className="flex items-center gap-1 hover:text-white transition-colors group"
                          >
                            Code
                            {sortBy === 'code' && (
                              sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleSort('amount')}
                            className="flex items-center gap-1 hover:text-white transition-colors group"
                          >
                            Amount
                            {sortBy === 'amount' && (
                              sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleSort('used')}
                            className="flex items-center gap-1 hover:text-white transition-colors group"
                          >
                            Status
                            {sortBy === 'used' && (
                              sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3 text-left">User</th>
                        <th className="px-3 py-3 text-center">Used</th>
                        <th className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleSort('created_at')}
                            className="flex items-center gap-1 hover:text-white transition-colors group"
                          >
                            Created
                            {sortBy === 'created_at' && (
                              sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3 last:rounded-tr-2xl text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <div className="spinner w-5 h-5"></div>
                              <span className="text-gray-400">Loading codes...</span>
                            </div>
                          </td>
                        </tr>
                      ) : sortedCodes.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 py-8 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-3 bg-white/5 rounded-full">
                                <Ticket size={32} className="text-gray-600" />
                              </div>
                              <div>
                                <span className="text-gray-400 text-sm block">No codes found</span>
                                <span className="text-gray-500 text-xs">Try adjusting your search or filters</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortedCodes.map((c, index) => (
                          <tr
                            key={c.id}
                            className={`group hover:bg-white/5 transition-all duration-200 hover:shadow-md border-l-2 ${
                              selectedCodes.has(c.id)
                                ? 'border-blue-500 bg-blue-500/5'
                                : 'border-transparent hover:border-blue-500/30'
                            }`}
                            style={{ animationDelay: `${index * 0.01}s` }}
                          >
                            {/* Checkbox Column */}
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={() => handleSelectCode(c.id)}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                              >
                                {selectedCodes.has(c.id) ? (
                                  <CheckSquare size={16} className="text-blue-400" />
                                ) : (
                                  <Square size={16} className="text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-blue-500/20 transition-colors">
                                  <Ticket size={14} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-white font-mono text-xs group-hover:text-blue-400 transition-colors truncate max-w-32">
                                    {c.code}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate max-w-24">
                                    {c.id.substring(0, 6)}...
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Amount Column - Compact Badge */}
                            <td className="px-3 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 rounded-md text-xs font-bold border border-red-500/30 group-hover:scale-105 transition-transform">
                                {c.amount}
                              </span>
                            </td>

                            {/* Status Column - Compact */}
                            <td className="px-3 py-3 text-center">
                              {c.used ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                  <span className="text-red-400 font-medium text-xs">Used</span>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                  <span className="text-green-400 font-medium text-xs">Available</span>
                                </div>
                              )}
                            </td>

                            {/* User Column - Compact */}
                            <td className="px-3 py-3">
                              {c.used_by ? (
                                <div className="min-w-0">
                                  <span className="text-xs text-blue-400 font-medium hover:text-blue-300 transition-colors cursor-pointer block truncate max-w-28">
                                    {userEmails[c.used_by] || 'Loading...'}
                                  </span>
                                  <span className="text-xs font-mono bg-white/5 px-1.5 py-0.5 rounded text-gray-400 truncate block max-w-20">
                                    {c.used_by.substring(0, 6)}...
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs italic flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                  Not used
                                </span>
                              )}
                            </td>

                            {/* Used At Column - Compact */}
                            <td className="px-3 py-3 text-center">
                              {c.used_at ? (
                                <div className="text-xs">
                                  <div className="font-medium text-white text-xs">{new Date(c.used_at).toLocaleDateString()}</div>
                                  <div className="text-gray-500 text-xs">{new Date(c.used_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">-</span>
                              )}
                            </td>

                            {/* Created Column - Compact */}
                            <td className="px-3 py-3 text-center">
                              <div className="text-xs">
                                <div className="font-medium text-white text-xs">{new Date(c.created_at).toLocaleDateString()}</div>
                                <div className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                              </div>
                            </td>

                            {/* Actions Column - Compact */}
                            <td className="px-3 py-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteCode(c.id)
                                }}
                                disabled={deleteLoading === c.id}
                                className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-md transition-all duration-200 disabled:opacity-50 hover:scale-110"
                                title="Delete this code"
                              >
                                {deleteLoading === c.id ? (
                                  <div className="spinner w-3 h-3"></div>
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* PAGINATION CONTROLS */}
                  {sortedCodes.length > 0 && (
                    <div className="flex items-center justify-between px-3 py-4 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-400">
                          Showing <span className="font-medium text-white">{sortedCodes.length}</span> of{' '}
                          <span className="font-medium text-white">{codes.length}</span> codes
                          {selectedCodes.size > 0 && (
                            <span className="ml-2 text-blue-400">
                              • <span className="font-medium">{selectedCodes.size}</span> selected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Rows per page:</label>
                          <select
                            value={10}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            disabled
                          >
                            <option value={10}>10</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled
                          title="Previous page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="flex items-center gap-1">
                          <button className="px-3 py-1 bg-[#D62323] text-white rounded text-sm font-medium">
                            1
                          </button>
                        </div>

                        <button
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled
                          title="Next page"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                ) : (
                  // CARD VIEW
                  <div className="p-8">
                    {loading ? (
                      <div className="flex items-center justify-center gap-3 py-12">
                        <div className="spinner w-5 h-5"></div>
                        <span className="text-gray-400">Loading codes...</span>
                      </div>
                    ) : sortedCodes.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-12">
                        <div className="p-3 bg-white/5 rounded-full">
                          <Ticket size={32} className="text-gray-600" />
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm block">No codes found</span>
                          <span className="text-gray-500 text-xs">Try adjusting your search or filters</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCodes.map((c) => (
                          <div
                            key={c.id}
                            className="card group hover:shadow-lg transition-all duration-200 border border-white/10 hover:border-blue-500/30 relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative p-6">
                              {/* Header with Code and Status */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <p className="text-xs text-gray-400 mb-1">Redeem Code</p>
                                  <p className="font-mono font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{c.code}</p>
                                  <p className="text-xs text-gray-500 mt-1">{c.id.substring(0, 12)}...</p>
                                </div>
                                <div>
                                  {c.used ? (
                                    <div className="flex items-center gap-1.5 bg-red-500/20 px-2 py-1 rounded-md">
                                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                      <span className="text-red-400 font-medium text-xs">Used</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-md">
                                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                      <span className="text-green-400 font-medium text-xs">Available</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Amount Badge */}
                              <div className="mb-4">
                                <span className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 rounded-md text-sm font-bold border border-red-500/30">
                                  💰 {c.amount}
                                </span>
                              </div>

                              {/* Divider */}
                              <div className="border-t border-white/10 my-4"></div>

                              {/* Details */}
                              <div className="space-y-3 mb-4">
                                <div>
                                  <p className="text-xs text-gray-400 mb-1">Created</p>
                                  <p className="text-sm text-white">
                                    {new Date(c.created_at).toLocaleDateString()}
                                    <span className="text-gray-500 ml-2">
                                      {new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                  </p>
                                </div>
                                {c.used && c.used_at && (
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Used</p>
                                    <p className="text-sm text-white">
                                      {new Date(c.used_at).toLocaleDateString()}
                                      <span className="text-gray-500 ml-2">
                                        {new Date(c.used_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </span>
                                    </p>
                                  </div>
                                )}
                                {c.used_by && (
                                  <div>
                                    <p className="text-xs text-gray-400 mb-1">Used by</p>
                                    <p className="text-sm text-blue-400">{userEmails[c.used_by] || c.used_by}</p>
                                  </div>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="border-t border-white/10 my-4"></div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const codeText = c.code
                                    navigator.clipboard.writeText(codeText)
                                  }}
                                  className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-md transition-all duration-200 text-xs font-medium flex items-center justify-center gap-2"
                                  title="Copy code"
                                >
                                  <Copy size={14} />
                                  Copy
                                </button>
                                <button
                                  onClick={() => handleDeleteCode(c.id)}
                                  disabled={deleteLoading === c.id}
                                  className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-md transition-all duration-200 text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                  title="Delete this code"
                                >
                                  {deleteLoading === c.id ? (
                                    <div className="spinner w-3 h-3"></div>
                                  ) : (
                                    <>
                                      <Trash2 size={14} />
                                      Delete
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
