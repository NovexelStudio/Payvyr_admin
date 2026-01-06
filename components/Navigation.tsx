'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, Ticket, BarChart3, Menu, X, Gift, 
  Smartphone, MessageSquare 
} from 'lucide-react'
import { useState, memo, useEffect } from 'react'

const navItems = [
  { href: '/users', label: 'Users', icon: Users },
  { href: '/codes', label: 'Codes', icon: Ticket },
  { href: '/redemptions', label: 'Redemptions', icon: Gift },
  { href: '/device-bindings', label: 'Devices', icon: Smartphone },
  { href: '/support-messages', label: 'Messages', icon: MessageSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const Navigation = memo(function Navigation() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  // Ensure hydration matches server
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* --- DESKTOP: Left Side Vertical Strip --- */}
      <nav className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
        <div className="flex flex-col items-center gap-4 p-2 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
          
          {/* Brand Logo Anchor */}
          <Link href="/" className="group mb-2">
            <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:rotate-[360deg] transition-transform duration-1000">
              <span className="text-white font-black text-sm">P</span>
            </div>
          </Link>

          <div className="flex flex-col gap-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <div key={item.href} className="relative group/item">
                  <Link
                    href={item.href}
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                      isActive 
                        ? 'bg-white text-black shadow-xl scale-110' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon size={20} className="shrink-0 transition-transform duration-500" />
                  </Link>

                  {/* Tooltip */}
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-md opacity-0 translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-[60] shadow-xl">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </nav>

      {/* --- MOBILE: Bottom Floating Action Dock --- */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
        <div className="flex items-center justify-around p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Mobile Home/Logo */}
          <Link 
            href="/" 
            className={`p-3 rounded-full transition-all ${
              pathname === '/' ? 'bg-white text-black' : 'text-gray-400'
            }`}
          >
            <div className={`w-5 h-5 flex items-center justify-center font-black text-[10px] ${pathname === '/' ? 'text-black' : 'text-red-500'}`}>
              P
            </div>
          </Link>

          {/* Icons Grid */}
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-white text-black scale-110 -translate-y-1 shadow-lg shadow-white/10' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Top Brand Bar (Optional: Just for identity) */}
      <div className="lg:hidden fixed top-0 left-0 w-full p-6 pointer-events-none">
        <div className="flex justify-start">
          <div className="px-4 py-1.5 bg-black/20 backdrop-blur-md border border-white/5 rounded-full">
            <span className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Payvyr Admin</span>
          </div>
        </div>
      </div>
    </>
  )
})

Navigation.displayName = 'Navigation'

export default Navigation