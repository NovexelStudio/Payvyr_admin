'use client'

import { banUser, unbanUser, getUserInfo, getAllUsers, getUserRealtimeData, getAllUsersRealtimeData, addCoinsToUser, setUserCoins, resetUserStats } from '../actions'
import Navigation from '../../components/Navigation'
import { ShieldAlert, UserCheck, UserX, Users, Search, Crown, Coins, Eye, TrendingUp, Calendar, Activity, Plus, Settings, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'

interface User {
  uid: string
  email?: string
  disabled: boolean
  metadata?: {
    creationTime: string
    lastSignInTime?: string
  }
}

interface UserInfo {
  user?: {
    uid: string
    email?: string
    disabled: boolean
    metadata?: {
      creationTime: string
      lastSignInTime?: string
    }
  }
  error?: string
}

interface UserRealtimeData {
  adsWatchedToday: number
  anonymous: boolean
  coins: number
  createdAt: number
  lastAdWatch: number
  lastAdWatchAsLog: number
  lastRestDate: number
  totalAdsWatched: number
  totalEarned: number
}

export default function UsersPage() {
  const [userSearch, setUserSearch] = useState('')
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allUsersLoading, setAllUsersLoading] = useState(false)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [userRealtimeData, setUserRealtimeData] = useState<UserRealtimeData | null>(null)
  const [allUsersRealtimeData, setAllUsersRealtimeData] = useState<Record<string, UserRealtimeData>>({})
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedUserRealtimeData, setSelectedUserRealtimeData] = useState<UserRealtimeData | null>(null)
  const [modalAction, setModalAction] = useState<'addCoins' | 'setCoins' | 'resetStats' | null>(null)
  const [coinAmount, setCoinAmount] = useState('')
  const [modalLoading, setModalLoading] = useState(false)

  const handleUserSearch = async () => {
    if (!userSearch.trim()) return
    setUserLoading(true)
    const result = await getUserInfo(userSearch.trim())
    setUserInfo(result)

    // Also fetch realtime data
    const realtimeResult = await getUserRealtimeData(userSearch.trim())
    setUserRealtimeData(realtimeResult.userData)

    setUserLoading(false)
  }

  const handleLoadAllUsers = async () => {
    setAllUsersLoading(true)
    const result = await getAllUsers()
    if (result.users) {
      setAllUsers(result.users)
      setShowAllUsers(true)

      // Also fetch realtime data for all users
      const realtimeResult = await getAllUsersRealtimeData()
      setAllUsersRealtimeData(realtimeResult.usersData || {})
    }
    setAllUsersLoading(false)
  }

  const openUserModal = async (user: User, action: 'addCoins' | 'setCoins' | 'resetStats') => {
    setSelectedUser(user)
    setModalAction(action)
    setCoinAmount('')
    setShowUserModal(true)

    // Fetch realtime data for this user
    const realtimeResult = await getUserRealtimeData(user.uid)
    setSelectedUserRealtimeData(realtimeResult.userData)
  }

  const closeUserModal = () => {
    setShowUserModal(false)
    setSelectedUser(null)
    setSelectedUserRealtimeData(null)
    setModalAction(null)
    setCoinAmount('')
  }

  const handleAddCoins = async () => {
    if (!selectedUser || !coinAmount) return

    setModalLoading(true)
    const formData = new FormData()
    formData.append('uid', selectedUser.uid)
    formData.append('coins', coinAmount)

    const result = await addCoinsToUser(formData)

    if (result.success) {
      // Refresh the data
      const realtimeResult = await getAllUsersRealtimeData()
      setAllUsersRealtimeData(realtimeResult.usersData || {})
      closeUserModal()
    }
    setModalLoading(false)
  }

  const handleSetCoins = async () => {
    if (!selectedUser || !coinAmount) return

    setModalLoading(true)
    const formData = new FormData()
    formData.append('uid', selectedUser.uid)
    formData.append('coins', coinAmount)

    const result = await setUserCoins(formData)

    if (result.success) {
      // Refresh the data
      const realtimeResult = await getAllUsersRealtimeData()
      setAllUsersRealtimeData(realtimeResult.usersData || {})
      closeUserModal()
    }
    setModalLoading(false)
  }

  const handleResetStats = async () => {
    if (!selectedUser) return

    setModalLoading(true)
    const formData = new FormData()
    formData.append('uid', selectedUser.uid)

    const result = await resetUserStats(formData)

    if (result.success) {
      // Refresh the data
      const realtimeResult = await getAllUsersRealtimeData()
      setAllUsersRealtimeData(realtimeResult.usersData || {})
      closeUserModal()
    }
    setModalLoading(false)
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
                <h1 className="text-3xl md:text-5xl font-black tracking-tight gradient-text">User<span className="text-[#D62323]">Management</span></h1>
                <p className="text-gray-400 text-sm md:text-lg mt-2">Manage and monitor all users in your system</p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#D62323] to-[#ff4757] rounded-full mt-4"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Live Data
            </div>
          </div>

          {/* USER MANAGEMENT */}
          <div className="card mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#D62323] to-[#ff4757] rounded-xl text-white">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">User Management</h2>
                  <p className="text-gray-400 text-sm">Search individual users or load all users</p>
                </div>
              </div>
              <button
                onClick={handleLoadAllUsers}
                disabled={allUsersLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users size={18} />
                {allUsersLoading ? 'Loading...' : 'Load All Users'}
              </button>
            </div>

            {/* Individual User Search */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-300 mb-3 block">Search User by UID</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Enter Firebase UID..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                        className="custom-input w-full pl-12"
                      />
                    </div>
                    <button
                      onClick={handleUserSearch}
                      disabled={userLoading}
                      className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {userLoading ? <div className="spinner w-5 h-5"></div> : <Search size={18} />}
                    </button>
                  </div>
                </div>

                {/* User Info Display */}
                {userInfo?.user && (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{userInfo.user.email || 'Anonymous User'}</h3>
                        <p className="text-sm text-gray-400">UID: {userInfo.user.uid.substring(0, 12)}...</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          {userInfo.user.disabled ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-red-400 font-semibold">Banned</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-400 font-semibold">Active</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Created</p>
                        <p className="text-sm text-white font-medium mt-1">
                          {userInfo.user.metadata?.creationTime
                            ? new Date(userInfo.user.metadata.creationTime).toLocaleDateString()
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {userInfo.user.disabled ? (
                        <form action={unbanUser} className="flex-1">
                          <input type="hidden" name="uid" value={userInfo.user.uid} />
                          <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-300 hover-lift flex items-center justify-center gap-2">
                            <UserCheck size={18} />
                            Unban User
                          </button>
                        </form>
                      ) : (
                        <form action={banUser} className="flex-1">
                          <input type="hidden" name="uid" value={userInfo.user.uid} />
                          <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl text-sm font-bold hover:shadow-lg transition-all duration-300 hover-lift flex items-center justify-center gap-2">
                            <UserX size={18} />
                            Ban User
                          </button>
                        </form>
                      )}
                    </div>

                    {/* User Modification Actions */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Modify User Data</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => userInfo.user && openUserModal(userInfo.user, 'addCoins')}
                          className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-300 flex flex-col items-center gap-1"
                        >
                          <Plus size={16} />
                          <span className="text-xs">Add Coins</span>
                        </button>
                        <button
                          onClick={() => userInfo.user && openUserModal(userInfo.user, 'setCoins')}
                          className="p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-lg transition-all duration-300 flex flex-col items-center gap-1"
                        >
                          <Settings size={16} />
                          <span className="text-xs">Set Coins</span>
                        </button>
                        <button
                          onClick={() => userInfo.user && openUserModal(userInfo.user, 'resetStats')}
                          className="p-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 rounded-lg transition-all duration-300 flex flex-col items-center gap-1"
                        >
                          <RotateCcw size={16} />
                          <span className="text-xs">Reset</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {userInfo?.error && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-4">
                    <p className="text-red-400 font-medium">{userInfo.error}</p>
                  </div>
                )}
              </div>

              {/* User Realtime Data */}
              {userRealtimeData && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">User Statistics</h3>
                      <p className="text-gray-400 text-sm">Real-time user data and activity</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins size={16} className="text-yellow-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Coins</p>
                      </div>
                      <p className="text-2xl font-bold text-yellow-400">{userRealtimeData.coins}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Earned</p>
                      </div>
                      <p className="text-2xl font-bold text-green-400">₹ {userRealtimeData.totalEarned}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye size={16} className="text-blue-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Ads Today</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-400">{userRealtimeData.adsWatchedToday}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={16} className="text-purple-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Total Ads</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-400">{userRealtimeData.totalAdsWatched}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert size={16} className="text-gray-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Anonymous</p>
                      </div>
                      <p className="text-lg font-bold text-gray-300">{userRealtimeData.anonymous ? 'Yes' : 'No'}</p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar size={16} className="text-cyan-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Last Ad Watch</p>
                      </div>
                      <p className="text-sm font-bold text-cyan-400">
                        {userRealtimeData.lastAdWatch ? new Date(userRealtimeData.lastAdWatch).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ALL USERS TABLE */}
          {showAllUsers && (
            <div className="card">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl text-white">
                  <Crown size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">All Users</h2>
                  <p className="text-gray-400 text-sm">Complete user management overview</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-300 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-6">User</th>
                      <th className="p-6">Status</th>
                      <th className="p-6">Created</th>
                      <th className="p-6">Last Sign In</th>
                      <th className="p-6">Coins</th>
                      <th className="p-6">Total Earned</th>
                      <th className="p-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allUsers.map((user, index) => (
                      <tr key={user.uid} className="group hover:bg-white/5 transition-all duration-300" style={{ animationDelay: `${index * 0.05}s` }}>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/10 rounded-lg">
                              <Users size={16} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-white">{user.email || 'Anonymous User'}</p>
                              <p className="text-xs text-gray-500 font-mono">{user.uid.substring(0, 12)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          {user.disabled ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <span className="text-red-400 font-semibold text-sm">Banned</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              <span className="text-green-400 font-semibold text-sm">Active</span>
                            </div>
                          )}
                        </td>
                        <td className="p-6">
                          <div className="text-sm text-gray-400">
                            <div>{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleTimeString() : ''}</div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="text-sm text-gray-400">
                            {user.metadata?.lastSignInTime ? (
                              <>
                                <div>{new Date(user.metadata.lastSignInTime).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">{new Date(user.metadata.lastSignInTime).toLocaleTimeString()}</div>
                              </>
                            ) : (
                              <span className="text-gray-500">Never</span>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold border border-yellow-500/30">
                            {allUsersRealtimeData[user.uid]?.coins || 0}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold border border-green-500/30">
                            ₹{allUsersRealtimeData[user.uid]?.totalEarned || 0}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex gap-2">
                            {user.disabled ? (
                              <form action={unbanUser}>
                                <input type="hidden" name="uid" value={user.uid} />
                                <button className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-lg transition-all duration-300" title="Unban User">
                                  <UserCheck size={16} />
                                </button>
                              </form>
                            ) : (
                              <form action={banUser}>
                                <input type="hidden" name="uid" value={user.uid} />
                                <button className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300" title="Ban User">
                                  <UserX size={16} />
                                </button>
                              </form>
                            )}
                            <button
                              onClick={() => openUserModal(user, 'addCoins')}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg transition-all duration-300"
                              title="Add Coins"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => openUserModal(user, 'setCoins')}
                              className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-lg transition-all duration-300"
                              title="Set Coins"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => openUserModal(user, 'resetStats')}
                              className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 rounded-lg transition-all duration-300"
                              title="Reset Stats"
                            >
                              <RotateCcw size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* User Modification Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {modalAction === 'addCoins' && 'Add Coins'}
                      {modalAction === 'setCoins' && 'Set Coins'}
                      {modalAction === 'resetStats' && 'Reset Statistics'}
                    </h3>
                    <p className="text-gray-400 text-sm">{selectedUser.email || 'Anonymous User'}</p>
                  </div>
                </div>
                <button
                  onClick={closeUserModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {selectedUserRealtimeData && (
                <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Current Stats</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Coins:</span>
                      <span className="text-yellow-400 font-bold ml-2">{selectedUserRealtimeData.coins || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total Earned:</span>
                      <span className="text-green-400 font-bold ml-2">₹{selectedUserRealtimeData.totalEarned || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {modalAction !== 'resetStats' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">
                    {modalAction === 'addCoins' ? 'Coins to Add' : 'New Coin Amount'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    placeholder={modalAction === 'addCoins' ? 'Enter coins to add...' : 'Enter new coin amount...'}
                    className="custom-input w-full"
                  />
                </div>
              )}

              {modalAction === 'resetStats' && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert size={16} className="text-red-400" />
                    <span className="text-red-400 font-semibold">Warning</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    This will reset all user statistics to zero. This action cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeUserModal}
                  className="flex-1 btn-secondary"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={
                    modalAction === 'addCoins' ? handleAddCoins :
                    modalAction === 'setCoins' ? handleSetCoins :
                    handleResetStats
                  }
                  disabled={modalLoading || (modalAction !== 'resetStats' && !coinAmount)}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {modalLoading ? (
                    <>
                      <div className="spinner w-4 h-4"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {modalAction === 'addCoins' && <><Plus size={16} /> Add Coins</>}
                      {modalAction === 'setCoins' && <><Settings size={16} /> Set Coins</>}
                      {modalAction === 'resetStats' && <><RotateCcw size={16} /> Reset Stats</>}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}