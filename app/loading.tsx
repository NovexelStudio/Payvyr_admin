export default function Loading() {
  return (
    <div className="min-h-screen animated-gradient">
      <nav className="glass border-b border-white/10 px-4 md:px-10 py-4 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold gradient-text">
              Payvyr<span className="text-red-500">Admin</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-6 md:p-8 font-sans text-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-white/10 rounded-lg animate-pulse mb-3"></div>
            <div className="h-4 bg-white/10 rounded animate-pulse mb-4"></div>
            <div className="w-20 h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-lg animate-pulse">
                    <div className="w-6 h-6"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-white/10 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-white/10 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <div className="h-6 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded animate-pulse mb-1"></div>
                      <div className="h-3 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="h-6 bg-white/10 rounded animate-pulse mb-4"></div>
              <div className="h-64 bg-white/10 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}