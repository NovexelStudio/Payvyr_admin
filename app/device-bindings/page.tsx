'use client'

import { getDeviceBindings } from '../actions'
import Navigation from '../components/Navigation'
import { Smartphone, MapPin, Clock, User, Search, Filter, X, Download, Copy, Calendar, Globe, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'

interface DeviceBinding {
  boundAt: number
  deviceName: string
  locationCity: string
  timezone: string
  uid: string
  userEmail: string
}

export default function DeviceBindingsPage() {
  const [deviceBindings, setDeviceBindings] = useState<Record<string, DeviceBinding>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [timezoneFilter, setTimezoneFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'boundAt' | 'deviceName' | 'locationCity'>('boundAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchDeviceBindings = async () => {
      try {
        const result = await getDeviceBindings()
        if (result.error) {
          setError(result.error)
        } else {
          setDeviceBindings(result.deviceBindings || {})
        }
      } catch (err) {
        setError('Failed to fetch device bindings')
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceBindings()
  }, [])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDateShort = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  // Get unique timezones for filter
  const uniqueTimezones = [...new Set(Object.values(deviceBindings).map(binding => binding.timezone))]

  // Filter and sort device bindings
  const filteredAndSortedBindings = Object.entries(deviceBindings)
    .filter(([deviceId, binding]) => {
      const matchesSearch = deviceId.toLowerCase().includes(search.toLowerCase()) ||
        binding.deviceName.toLowerCase().includes(search.toLowerCase()) ||
        binding.locationCity.toLowerCase().includes(search.toLowerCase()) ||
        binding.uid.toLowerCase().includes(search.toLowerCase()) ||
        binding.userEmail.toLowerCase().includes(search.toLowerCase())

      const matchesTimezone = timezoneFilter === 'all' || binding.timezone === timezoneFilter

      let matchesDate = true
      if (dateFilter !== 'all') {
        const bindingDate = new Date(binding.boundAt)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - bindingDate.getTime()) / (1000 * 60 * 60 * 24))

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

      return matchesSearch && matchesTimezone && matchesDate
    })
    .sort(([aId, a], [bId, b]) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'boundAt':
          aValue = a.boundAt
          bValue = b.boundAt
          break
        case 'deviceName':
          aValue = a.deviceName.toLowerCase()
          bValue = b.deviceName.toLowerCase()
          break
        case 'locationCity':
          aValue = a.locationCity.toLowerCase()
          bValue = b.locationCity.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const totalBindings = Object.keys(deviceBindings).length
  const recentBindings = Object.values(deviceBindings).filter(binding => {
    const daysDiff = Math.floor((Date.now() - binding.boundAt) / (1000 * 60 * 60 * 24))
    return daysDiff <= 7
  }).length

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const toggleCardExpansion = (deviceId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId)
      } else {
        newSet.add(deviceId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-100">Loading device bindings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen animated-gradient">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-400">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-gradient">
      <Navigation />
      <div className="container mx-auto px-4 py-8 font-sans text-gray-100">
        {/* Header */}
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
              <h1 className="text-5xl font-black tracking-tight gradient-text">Device<span className="text-[#D62323]">Bindings</span></h1>
              <p className="text-gray-400 text-lg mt-2">Manage and monitor device registrations</p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#D62323] to-[#ff4757] rounded-full mt-4"></div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold border border-green-500/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Live Data
          </div>
        </div>
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Total Devices</p>
                  <p className="text-3xl font-black text-white">{totalBindings}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Smartphone size={24} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Recent (7 days)</p>
                  <p className="text-3xl font-black text-green-400">{recentBindings}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar size={24} className="text-green-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="card hover-lift group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Timezones</p>
                  <p className="text-3xl font-black text-purple-400">{uniqueTimezones.length}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                  <Globe size={24} className="text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="card">
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#D62323] to-[#ff4757] rounded-xl text-white">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Device Management</h2>
                  <p className="text-gray-400 text-sm">Search, filter, and manage device bindings</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn-secondary flex items-center gap-2 px-4 py-2"
                >
                  <Filter size={16} />
                  Filters
                </button>
                <button className="btn-primary flex items-center gap-2 px-4 py-2">
                  <Download size={16} />
                  Export
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by device ID, name, location, user ID, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="custom-input w-full pl-10 pr-4 py-2"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="custom-input px-3 py-2"
                >
                  <option value="boundAt">Sort by Date</option>
                  <option value="deviceName">Sort by Device</option>
                  <option value="locationCity">Sort by Location</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="btn-secondary p-2"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {showFilters && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-white">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Date Range</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="custom-input w-full px-3 py-2"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 days</option>
                        <option value="month">Last 30 days</option>
                        <option value="older">Older than 30 days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Timezone</label>
                      <select
                        value={timezoneFilter}
                        onChange={(e) => setTimezoneFilter(e.target.value)}
                        className="custom-input w-full px-3 py-2"
                      >
                        <option value="all">All Timezones</option>
                        {uniqueTimezones.map(timezone => (
                          <option key={timezone} value={timezone}>{timezone}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="p-6">
            {filteredAndSortedBindings.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-gray-500/10 to-transparent rounded-2xl inline-block mb-6">
                  <Smartphone className="mx-auto h-16 w-16 text-gray-400" />
                </div>
                <h3 className="mt-2 text-xl font-medium text-gray-300">No device bindings found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                  {search || dateFilter !== 'all' || timezoneFilter !== 'all'
                    ? 'Try adjusting your search or filters to find what you\'re looking for.'
                    : 'Get started by registering your first device. New bindings will appear here.'}
                </p>
                {(search || dateFilter !== 'all' || timezoneFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearch('')
                      setDateFilter('all')
                      setTimezoneFilter('all')
                    }}
                    className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing <span className="font-medium text-white">{filteredAndSortedBindings.length}</span> of <span className="font-medium text-white">{totalBindings}</span> device bindings
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Live data
                  </div>
                </div>
                <div className="grid gap-4">
                  {filteredAndSortedBindings.map(([deviceId, binding]) => {
                    const isExpanded = expandedCards.has(deviceId)
                    return (
                      <div key={deviceId} className="card hover-lift group relative overflow-hidden transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                          {/* Compact Header */}
                          <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex-shrink-0">
                                <User className="text-indigo-400" size={20} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-white truncate">{binding.userEmail}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Smartphone className="text-green-400 flex-shrink-0" size={14} />
                                  <p className="text-sm text-gray-300 truncate">{binding.deviceName}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => copyToClipboard(binding.userEmail)}
                                className="p-2 text-gray-400 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors"
                                title="Copy email"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => toggleCardExpansion(deviceId)}
                                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                                title={isExpanded ? "Collapse details" : "Expand details"}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>

                          {/* Expandable Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 border-t border-white/10">
                              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/20 rounded-md">
                                      <Smartphone className="text-blue-400" size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Device ID</p>
                                      <p className="text-xs text-gray-300 font-mono break-all">{deviceId}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(deviceId)}
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-6"
                                  >
                                    <Copy size={10} />
                                    Copy
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-red-500/20 rounded-md">
                                      <MapPin className="text-red-400" size={14} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</p>
                                      <p className="text-sm text-gray-200">{binding.locationCity}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-500/20 rounded-md">
                                      <Clock className="text-purple-400" size={14} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Bound At</p>
                                      <p className="text-sm text-gray-200">{formatDateShort(binding.boundAt)}</p>
                                      <p className="text-xs text-gray-500">{formatDate(binding.boundAt)}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-orange-500/20 rounded-md">
                                      <Globe className="text-orange-400" size={14} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Timezone</p>
                                      <p className="text-sm text-gray-200">{binding.timezone}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}