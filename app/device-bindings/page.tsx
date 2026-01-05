'use client'

import { getDeviceBindings } from '../actions'
import Navigation from '../components/Navigation'
import { Smartphone, MapPin, Clock, User } from 'lucide-react'
import { useState, useEffect } from 'react'

interface DeviceBinding {
  boundAt: number
  deviceName: string
  locationCity: string
  timezone: string
  uid: string
}

export default function DeviceBindingsPage() {
  const [deviceBindings, setDeviceBindings] = useState<Record<string, DeviceBinding>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeviceBindings = async () => {
      try {
        const result = await getDeviceBindings()
        if (result.error) {
          setError(result.error)
        } else {
          setDeviceBindings(result.deviceBindings)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading device bindings...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-600">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <Smartphone className="mr-2" />
            Device Bindings
          </h1>

          {Object.keys(deviceBindings).length === 0 ? (
            <p className="text-gray-500">No device bindings found.</p>
          ) : (
            <div className="grid gap-4">
              {Object.entries(deviceBindings).map(([deviceId, binding]) => (
                <div key={deviceId} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Smartphone className="mr-2 text-blue-600" size={20} />
                      <div>
                        <p className="font-semibold">Device ID</p>
                        <p className="text-sm text-gray-600">{deviceId}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Smartphone className="mr-2 text-green-600" size={20} />
                      <div>
                        <p className="font-semibold">Device Name</p>
                        <p className="text-sm text-gray-600">{binding.deviceName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 text-red-600" size={20} />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-sm text-gray-600">{binding.locationCity}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 text-purple-600" size={20} />
                      <div>
                        <p className="font-semibold">Bound At</p>
                        <p className="text-sm text-gray-600">{formatDate(binding.boundAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 text-orange-600" size={20} />
                      <div>
                        <p className="font-semibold">Timezone</p>
                        <p className="text-sm text-gray-600">{binding.timezone}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <User className="mr-2 text-indigo-600" size={20} />
                      <div>
                        <p className="font-semibold">User ID</p>
                        <p className="text-sm text-gray-600">{binding.uid}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}