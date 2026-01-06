'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { MessageSquare, Search, Eye, EyeOff, CheckCircle, Clock, XCircle, User, Smartphone, Mail, Reply, Send, MoreVertical, MessageCircle } from 'lucide-react'
import { getSupportMessages, saveSupportReply, toggleMessageReadStatus } from '@/app/actions'

interface SupportMessage {
  id: string
  uid: string
  email: string
  message: string
  androidVersion: string
  device: string
  read: boolean
  status: 'sent' | 'processing' | 'resolved' | 'closed' | 'replied'
  timestamp: number
  replyText?: string
  replyTimestamp?: number
  isRead?: boolean
}

export default function SupportMessagesPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'processing' | 'resolved' | 'closed' | 'replied'>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all')
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    filterMessages()
  }, [messages, search, statusFilter, readFilter])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await getSupportMessages()
      if (response.supportMessages && typeof response.supportMessages === 'object') {
        const messagesList: SupportMessage[] = Object.entries(response.supportMessages).map(([id, message]: [string, any]) => ({
          id,
          uid: message.uid,
          email: message.email,
          message: message.message,
          androidVersion: message.androidVersion,
          device: message.device,
          read: message.read || false,
          status: message.status || 'sent',
          timestamp: message.timestamp,
          replyText: message.replyText,
          replyTimestamp: message.replyTimestamp,
          isRead: message.isRead
        }))
        setMessages(messagesList.sort((a, b) => b.timestamp - a.timestamp))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMessages = () => {
    let filtered = messages

    if (search) {
      filtered = filtered.filter(msg =>
        msg.email.toLowerCase().includes(search.toLowerCase()) ||
        msg.message.toLowerCase().includes(search.toLowerCase()) ||
        msg.device.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter)
    }

    if (readFilter !== 'all') {
      filtered = filtered.filter(msg => msg.read === (readFilter === 'read'))
    }

    setFilteredMessages(filtered)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMessage || !replyText.trim()) return

    setReplying(true)
    try {
      const formData = new FormData()
      formData.append('messageId', selectedMessage.id)
      formData.append('replyText', replyText.trim())

      const result = await saveSupportReply(formData)
      
      if (result.success) {
        setReplyText('')
        setSelectedMessage(null)
        await loadMessages() // Reload messages to show updated status
      } else {
        alert('Failed to send reply: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send reply')
    } finally {
      setReplying(false)
    }
  }

  const toggleReadStatus = async (messageId: string, currentReadStatus: boolean) => {
    try {
      const formData = new FormData()
      formData.append('messageId', messageId)
      formData.append('currentReadStatus', currentReadStatus.toString())

      const result = await toggleMessageReadStatus(formData)
      if (result.success) {
        await loadMessages() // Reload to reflect changes
      } else {
        alert('Failed to update read status: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating read status:', error)
      alert('Failed to update read status')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'replied':
        return <Reply className="w-4 h-4 text-purple-500" />
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
      case 'resolved':
        return 'bg-green-500/20 text-green-300 border border-green-500/30'
      case 'replied':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
      case 'closed':
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen animated-gradient">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading support messages...</p>
          </div>
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
                <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-text">Support<span className="text-[#D62323]">Messages</span></h1>
                <p className="text-gray-400 text-sm md:text-lg mt-2">Manage and respond to user support requests</p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#D62323] to-[#ff4757] rounded-full mt-4"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Data
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-white">{messages.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
                <EyeOff className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-white">{messages.filter(m => !m.read).length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">{messages.filter(m => m.status === 'sent').length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                <Reply className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Replied</p>
                <p className="text-2xl font-bold text-white">{messages.filter(m => m.status === 'replied').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-300">Quick Actions:</span>
              <button
                onClick={() => {
                  const unreadMessages = messages.filter(m => !m.read)
                  unreadMessages.forEach(m => toggleReadStatus(m.id, true))
                }}
                className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover-lift font-medium"
                disabled={messages.filter(m => !m.read).length === 0}
              >
                Mark All as Read ({messages.filter(m => !m.read).length})
              </button>
            </div>
            <div className="text-sm text-gray-400">
              Showing {filteredMessages.length} of {messages.length} messages
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="custom-input w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="custom-input w-full px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="processing">Processing</option>
                <option value="replied">Replied</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Read Status</label>
              <select
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value as any)}
                className="custom-input w-full px-3 py-2"
              >
                <option value="all">All</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                  setReadFilter('all')
                }}
                className="w-full px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="card">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">
              Messages ({filteredMessages.length})
            </h2>
          </div>

          <div className="divide-y divide-white/10">
            {filteredMessages.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">
                No messages found
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`px-6 py-4 hover:bg-white/5 cursor-pointer transition-colors border-l-4 ${
                    !message.read ? 'bg-blue-500/10 border-l-blue-500' : 'border-l-transparent'
                  } ${message.status === 'replied' ? 'border-l-purple-500' : ''}`}
                  onClick={() => {
                    setSelectedMessage(message)
                    setReplyText('')
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(message.status)}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(message.status)}`}>
                              {message.status}
                            </span>
                          </div>
                          {!message.read && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Unread
                            </span>
                          )}
                          {message.status === 'replied' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              <Reply className="w-3 h-3 mr-1" />
                              Replied
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleReadStatus(message.id, message.read)
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title={message.read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {message.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMessage(message)
                              setReplyText('')
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Reply to message"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="font-medium text-white">{message.email}</span>
                        </div>
                        <div className="flex items-center">
                          <Smartphone className="w-4 h-4 mr-1 text-gray-500" />
                          {message.device}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          <span className="font-mono text-xs text-gray-400">{message.uid.slice(0, 8)}...</span>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-2 leading-relaxed">{message.message}</p>

                      {message.replyText && (
                        <div className="mt-2 p-2 bg-purple-500/10 border-l-2 border-purple-500/50 rounded text-sm">
                          <p className="text-purple-300 font-medium mb-1">Your reply:</p>
                          <p className="text-purple-200">{message.replyText}</p>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                        <span>{formatDate(message.timestamp)} • Android {message.androidVersion}</span>
                        {message.replyTimestamp && (
                          <span className="text-purple-400">Replied {formatDate(message.replyTimestamp)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Support Message Details</h3>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-300 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)]">
                {/* Message Info Sidebar */}
                <div className="lg:w-1/3 border-r border-white/10 p-6 bg-white/5">
                  <h4 className="text-lg font-medium text-white mb-4">Message Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(selectedMessage.status)}
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedMessage.status)}`}>
                          {selectedMessage.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">From</label>
                      <p className="text-sm text-white font-medium">{selectedMessage.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">User ID</label>
                      <p className="text-sm text-white font-mono bg-white/10 px-2 py-1 rounded border border-white/20">{selectedMessage.uid}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Device</label>
                      <p className="text-sm text-white">{selectedMessage.device}</p>
                      <p className="text-xs text-gray-400">Android {selectedMessage.androidVersion}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Read Status</label>
                      <div className="flex items-center space-x-2">
                        {selectedMessage.read ? (
                          <>
                            <Eye className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-white">Read</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-white">Unread</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Timestamp</label>
                      <p className="text-sm text-white">{formatDate(selectedMessage.timestamp)}</p>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div className="lg:w-2/3 p-6 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    {/* User's Message */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="font-medium text-white">User Message</span>
                      </div>
                      <div className="bg-blue-500/10 border-l-4 border-blue-500/50 p-4 rounded-r-lg">
                        <p className="text-white whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                      </div>
                    </div>

                    {/* Admin Reply */}
                    {selectedMessage.replyText && (
                      <div className="mb-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <Reply className="w-4 h-4 text-purple-400" />
                          </div>
                          <span className="font-medium text-white">Your Reply</span>
                        </div>
                        <div className="bg-purple-500/10 border-l-4 border-purple-500/50 p-4 rounded-r-lg">
                          <p className="text-purple-200 whitespace-pre-wrap leading-relaxed">{selectedMessage.replyText}</p>
                          {selectedMessage.replyTimestamp && (
                            <p className="text-xs text-purple-400 mt-2 font-medium">
                              Sent on {formatDate(selectedMessage.replyTimestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reply Form */}
                  {selectedMessage.status !== 'replied' && (
                    <div className="border-t border-white/10 pt-6 mt-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <Reply className="w-5 h-5 text-blue-400" />
                        <h4 className="text-lg font-medium text-white">Send Reply</h4>
                      </div>
                      <form onSubmit={handleReply}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply to the user..."
                          rows={4}
                          className="custom-input w-full px-4 py-3 resize-none"
                          required
                        />
                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setSelectedMessage(null)}
                            className="px-4 py-2 text-gray-300 bg-white/10 rounded-lg hover:bg-white/20 transition-colors font-medium"
                            disabled={replying}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={replying || !replyText.trim()}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
                          >
                            {replying ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Send Reply</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {selectedMessage.status === 'replied' && (
                    <div className="border-t border-white/10 pt-6 mt-6 flex justify-end">
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  )
}