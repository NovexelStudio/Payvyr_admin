'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Ticket, BarChart3, Menu, X, Gift, Smartphone, MessageSquare } from 'lucide-react'
import { useState, memo } from 'react'

const Navigation = memo(function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/codes', label: 'Codes', icon: Ticket },
    { href: '/redemptions', label: 'Redemptions', icon: Gift },
    { href: '/device-bindings', label: 'Device Bindings', icon: Smartphone },
    { href: '/support-messages', label: 'Support Messages', icon: MessageSquare },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <nav className="glass border-b border-white/10 px-4 md:px-10 py-4 sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold gradient-text hover:scale-105 transition-transform">
              Payvyr<span className="text-red-500">Admin</span>
            </Link>
            <div className="hidden lg:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover-lift group ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:scale-102'
                    }`}
                  >
                    <Icon size={18} className={`${isActive ? 'animate-pulse' : 'group-hover:rotate-12'} transition-transform duration-300`} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-500/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              System Online
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-6 glass rounded-2xl p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-3">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg text-sm font-medium transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg scale-105'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 hover:scale-102'
                    }`}
                  >
                    <Icon size={20} className={`${isActive ? 'animate-bounce' : 'group-hover:rotate-12'} transition-transform duration-300`} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
})

Navigation.displayName = 'Navigation'

export default Navigation