"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Mail,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Globe,
  Clock,
  ArrowLeft,
  RefreshCw,
  Plus,
  CheckCircle,
  AlertCircle,
  Hotel,
  Car,
  X,
  User,
  CreditCard,
  MapPinIcon,
  Wifi,
  Coffee,
  Utensils,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

interface Trip {
  id: number
  type: string
  // Flight details
  airline?: string
  flightNumber?: string
  aircraft?: string
  origin?: string
  destination?: string
  departureDate?: string
  departureTime?: string
  arrivalDate?: string
  arrivalTime?: string
  duration?: string
  seatNumber?: string
  seatClass?: string
  departureAirport?: string
  departureCode?: string
  arrivalAirport?: string
  arrivalCode?: string
  // Hotel details
  hotelName?: string
  hotelAddress?: string
  checkInDate?: string
  checkOutDate?: string
  roomType?: string
  guests?: number
  // Common details
  originCountry?: string
  destinationCountry?: string
  bookingReference?: string
  confirmationNumber?: string
  passengerName?: string
  cost?: number
  currency?: string
  bookingDate?: string
  confidence?: number
  emailId?: string
  createdAt?: string
  updatedAt?: string
}

interface ProcessingLog {
  id: number
  email_subject: string
  email_from: string
  processing_status: string
  trips_found: number
  processing_time_ms: number
  created_at: string
}

export default function DashboardPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Enhanced scanning state
  const [scanningDetails, setScanningDetails] = useState({
    currentEmail: null as any,
    emailsFound: 0,
    emailsProcessed: 0,
    tripsFound: 0,
    currentBatch: 0,
    totalBatches: 0,
    recentTrips: [] as any[],
    statusMessage: '',
    canLoadMore: false,
    startIndex: 0,
    totalEmailsToProcess: 0
  })
  
  // Detailed trip view state
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showTripDetails, setShowTripDetails] = useState(false)
  
  const eventSourceRef = useRef<EventSource | null>(null)

  // Load initial data
  useEffect(() => {
    loadTrips()
    loadProcessingLogs()
  }, [])

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const loadTrips = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.status === 401) {
        window.location.href = '/auth'
        return
      }
      const data = await response.json()
      if (data.success) {
        setTrips(data.trips)
      }
    } catch (error) {
      console.error('Error loading trips:', error)
      setError('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  const loadProcessingLogs = async () => {
    try {
      const response = await fetch('/api/processing-logs')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProcessingLogs(data.logs.slice(0, 10)) // Show last 10 logs
        }
      }
    } catch (error) {
      console.error('Error loading processing logs:', error)
    }
  }

  const handleGmailSync = async (loadMore = false) => {
    if (isScanning) return;
    
    setIsScanning(true)
    setScanProgress(0)
    setError(null)
    
    const startIndex = loadMore ? scanningDetails.startIndex + 50 : 0;
    
    if (!loadMore) {
      setScanningDetails(prev => ({
        ...prev,
        currentEmail: null,
        emailsFound: 0,
        emailsProcessed: 0,
        tripsFound: 0,
        currentBatch: 0,
        totalBatches: 0,
        recentTrips: [],
        statusMessage: 'Starting scan...',
        startIndex: 0
      }))
    } else {
      setScanningDetails(prev => ({
        ...prev,
        startIndex,
        statusMessage: `Loading ${startIndex + 1}-${startIndex + 50} emails...`
      }))
    }

    try {
      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Start streaming scan
      const response = await fetch('/api/gmail/scan-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startIndex,
          maxResults: 50
        })
      })

      if (response.status === 401) {
        window.location.href = '/auth'
        return
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              handleStreamUpdate(data)
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

    } catch (error) {
      console.error('Error scanning Gmail:', error)
      setError('Failed to scan Gmail. Please try again.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleStreamUpdate = (data: any) => {
    switch (data.type) {
      case 'status':
        setScanningDetails(prev => ({
          ...prev,
          statusMessage: data.message
        }))
        setScanProgress(data.progress || 0)
        break

      case 'emails_found':
        setScanningDetails(prev => ({
          ...prev,
          emailsFound: data.count,
          totalEmailsToProcess: data.count,
          statusMessage: data.message,
          startIndex: data.startIndex
        }))
        setScanProgress(data.progress || 0)
        break

      case 'batch_start':
        setScanningDetails(prev => ({
          ...prev,
          currentBatch: data.batchNumber,
          totalBatches: data.totalBatches,
          statusMessage: data.message
        }))
        break

      case 'processing_email':
        const emailProgress = (data.emailIndex / data.totalEmails) * 100
        setScanningDetails(prev => ({
          ...prev,
          currentEmail: data.email,
          emailsProcessed: data.emailIndex,
          statusMessage: `Processing ${data.emailIndex}/${data.totalEmails}: ${data.email.from}`
        }))
        setScanProgress(Math.min(15 + emailProgress * 0.7, 100)) // 15% startup + 70% processing
        break

      case 'trip_found':
        setScanningDetails(prev => ({
          ...prev,
          tripsFound: prev.tripsFound + 1,
          recentTrips: [data.trip, ...prev.recentTrips].slice(0, 10), // Keep last 10
          statusMessage: `Found trip: ${data.trip.type === 'flight' ? `${data.trip.origin} → ${data.trip.destination}` : data.trip.hotelName}`
        }))
        // Add trip to main trips list in real-time
        setTrips(prev => [data.trip, ...prev])
        break

      case 'duplicate_found':
        setScanningDetails(prev => ({
          ...prev,
          statusMessage: `Duplicate found: ${data.email.subject}`
        }))
        break

      case 'no_travel_data':
        setScanningDetails(prev => ({
          ...prev,
          statusMessage: `No travel data: ${data.email.from}`
        }))
        break

      case 'batch_complete':
        setScanningDetails(prev => ({
          ...prev,
          statusMessage: `Completed batch ${data.batchNumber}...`
        }))
        setScanProgress(data.progress || 0)
        break

      case 'complete':
        setScanningDetails(prev => ({
          ...prev,
          statusMessage: data.message,
          canLoadMore: data.hasMore
        }))
        setScanProgress(100)
        setLastScan(new Date().toISOString())
        // Reload full trip list to ensure consistency
        setTimeout(() => loadTrips(), 1000)
        break

      case 'error':
        setError(data.message || data.error)
        setScanningDetails(prev => ({
          ...prev,
          statusMessage: `Error: ${data.message || data.error}`
        }))
        break
    }
  }

  // Calculate stats
  const stats = {
    totalTrips: trips.length,
    flights: trips.filter(t => t.type === 'flight').length,
    hotels: trips.filter(t => t.type === 'hotel').length,
    totalSpent: trips.reduce((sum, trip) => sum + (trip.cost || 0), 0),
    countries: new Set(trips.map(t => t.destination || t.origin).filter(Boolean)).size,
    recentTrips: trips.slice(0, 5)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading your travel data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Travel Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleGmailSync(false)}
                disabled={isScanning}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'Scanning...' : 'Sync Gmail'}
              </Button>
              {scanningDetails.canLoadMore && !isScanning && (
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleGmailSync(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Load More Emails
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Scanning Progress */}
        {isScanning && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gmail Scanning in Progress</span>
                <Badge variant="secondary">
                  {scanningDetails.currentBatch > 0 && scanningDetails.totalBatches > 0
                    ? `Batch ${scanningDetails.currentBatch}/${scanningDetails.totalBatches}`
                    : 'Initializing...'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{scanningDetails.statusMessage}</span>
                  <div className="text-sm text-gray-500">
                    {scanningDetails.totalEmailsToProcess > 0 && (
                      <span className="mr-2">
                        {scanningDetails.emailsProcessed}/{scanningDetails.totalEmailsToProcess} emails
                      </span>
                    )}
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                </div>
                <Progress value={scanProgress} className="w-full" />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{scanningDetails.emailsFound}</div>
                  <div className="text-xs text-blue-700">Emails Found</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{scanningDetails.emailsProcessed}</div>
                  <div className="text-xs text-green-700">Processed</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{scanningDetails.tripsFound}</div>
                  <div className="text-xs text-purple-700">Trips Found</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {scanningDetails.startIndex > 0 ? `${scanningDetails.startIndex + 1}-${scanningDetails.startIndex + 50}` : '1-50'}
                  </div>
                  <div className="text-xs text-orange-700">Email Range</div>
                </div>
              </div>

              {/* Current Email Being Processed */}
              {scanningDetails.currentEmail && (
                <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-sm font-medium text-gray-900">Currently Processing:</div>
                  <div className="text-sm text-gray-600 truncate">{scanningDetails.currentEmail.subject}</div>
                  <div className="text-xs text-gray-500">From: {scanningDetails.currentEmail.from}</div>
                  <div className="text-xs text-gray-500">Date: {scanningDetails.currentEmail.date}</div>
                </div>
              )}

              {/* Recent Trips Found */}
              {scanningDetails.recentTrips.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Latest Trips Found:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {scanningDetails.recentTrips.map((trip, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-green-50 rounded border-l-4 border-green-500 cursor-pointer hover:bg-green-100 transition-colors group"
                        onClick={() => {
                          setSelectedTrip(trip)
                          setShowTripDetails(true)
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            {trip.type === 'flight' ? (
                              <Plane className="w-4 h-4 text-green-600" />
                            ) : trip.type === 'hotel' ? (
                              <Hotel className="w-4 h-4 text-green-600" />
                            ) : (
                              <Car className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium group-hover:text-green-700">
                              {trip.type === 'flight' 
                                ? `${trip.origin} → ${trip.destination}`
                                : trip.hotelName || 'Hotel Booking'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {trip.departureDate || trip.checkInDate}
                              {trip.airline && ` • ${trip.airline}`}
                              {trip.flightNumber && ` ${trip.flightNumber}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {trip.cost && (
                            <div className="text-sm font-medium text-green-600">
                              ${trip.cost} {trip.currency || 'USD'}
                            </div>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Load More Button */}
              {!isScanning && scanningDetails.canLoadMore && (
                <Button 
                  onClick={() => handleGmailSync(true)}
                  variant="outline" 
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Load Next 50 Emails
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Plane className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips}</div>
              <p className="text-xs text-muted-foreground">
                {stats.flights} flights, {stats.hotels} hotels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destinations</CardTitle>
              <Globe className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.countries}</div>
              <p className="text-xs text-muted-foreground">Unique locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                ${stats.totalTrips > 0 ? Math.round(stats.totalSpent / stats.totalTrips) : 0} average per trip
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {lastScan ? 'Recent' : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">
                {lastScan ? new Date(lastScan).toLocaleDateString() : 'Sync Gmail to scan'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Trips */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Trips</CardTitle>
                  {stats.recentTrips.length > 0 && (
                    <Link href="/trips">
                      <Button variant="outline" size="sm">
                        View All
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentTrips.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedTrip(trip)
                          setShowTripDetails(true)
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {trip.type === 'flight' ? (
                              <Plane className="w-5 h-5 text-blue-600" />
                            ) : trip.type === 'hotel' ? (
                              <Hotel className="w-5 h-5 text-green-600" />
                            ) : (
                              <Car className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium group-hover:text-blue-600 transition-colors">
                              {trip.type === 'flight' 
                                ? `${trip.origin} → ${trip.destination}`
                                : trip.hotelName || 'Hotel Booking'
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              {trip.departureDate || trip.checkInDate || 'Date unknown'}
                              {trip.airline && ` • ${trip.airline}`}
                              {trip.flightNumber && ` ${trip.flightNumber}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            {trip.cost && (
                              <div className="font-medium">
                                ${trip.cost.toLocaleString()} {trip.currency || 'USD'}
                              </div>
                            )}
                            <Badge variant="secondary">
                              {Math.round((trip.confidence || 0) * 100)}% confidence
                            </Badge>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No trips found yet.</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Sync your Gmail to automatically discover travel bookings.
                    </p>
                    <Button onClick={() => handleGmailSync(false)} disabled={isScanning}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                      Scan Gmail
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processing Logs */}
            {processingLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Email Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {processingLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">
                            {log.email_subject}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.email_from} • {new Date(log.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {log.processing_status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : log.processing_status === 'failed' ? (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {log.trips_found} trips
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/map">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="w-4 h-4 mr-2" />
                    View Travel Map
                  </Button>
                </Link>
                <Link href="/timeline">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Timeline View
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Travel Analytics
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleGmailSync(false)}
                  disabled={isScanning}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
                  Rescan Gmail
                </Button>
                {scanningDetails.canLoadMore && !isScanning && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleGmailSync(true)}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Load More Emails
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Trip Type Breakdown */}
            {stats.totalTrips > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Trip Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Plane className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Flights</span>
                    </div>
                    <Badge variant="secondary">{stats.flights} trips</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Hotel className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Hotels</span>
                    </div>
                    <Badge variant="secondary">{stats.hotels} trips</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Other</span>
                    </div>
                    <Badge variant="secondary">
                      {stats.totalTrips - stats.flights - stats.hotels} trips
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Trip View Modal */}
      {showTripDetails && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTrip.type === 'flight' 
                  ? `Flight ${selectedTrip.flightNumber || ''} Details`
                  : `${selectedTrip.hotelName || 'Hotel'} Details`
                }
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTripDetails(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Trip Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {selectedTrip.type === 'flight' ? (
                      <Plane className="w-5 h-5 mr-2 text-blue-600" />
                    ) : selectedTrip.type === 'hotel' ? (
                      <Hotel className="w-5 h-5 mr-2 text-green-600" />
                    ) : (
                      <Car className="w-5 h-5 mr-2 text-purple-600" />
                    )}
                    Trip Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTrip.type === 'flight' ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Flight Route</h4>
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="text-lg font-bold">{selectedTrip.departureCode || selectedTrip.origin}</div>
                              <div className="text-sm text-gray-500">{selectedTrip.departureAirport || selectedTrip.origin}</div>
                            </div>
                            <div className="flex-1 flex items-center">
                              <div className="flex-1 border-t-2 border-blue-200"></div>
                              <Plane className="w-5 h-5 text-blue-600 mx-2" />
                              <div className="flex-1 border-t-2 border-blue-200"></div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{selectedTrip.arrivalCode || selectedTrip.destination}</div>
                              <div className="text-sm text-gray-500">{selectedTrip.arrivalAirport || selectedTrip.destination}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-700">Departure</h5>
                            <p className="text-sm text-gray-600">{selectedTrip.departureDate}</p>
                            {selectedTrip.departureTime && (
                              <p className="text-sm text-gray-600">{selectedTrip.departureTime}</p>
                            )}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700">Arrival</h5>
                            <p className="text-sm text-gray-600">{selectedTrip.arrivalDate}</p>
                            {selectedTrip.arrivalTime && (
                              <p className="text-sm text-gray-600">{selectedTrip.arrivalTime}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Flight Details</h4>
                          <div className="space-y-2">
                            {selectedTrip.airline && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Airline:</span>
                                <span className="font-medium">{selectedTrip.airline}</span>
                              </div>
                            )}
                            {selectedTrip.flightNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Flight Number:</span>
                                <span className="font-medium">{selectedTrip.flightNumber}</span>
                              </div>
                            )}
                            {selectedTrip.aircraft && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Aircraft:</span>
                                <span className="font-medium">{selectedTrip.aircraft}</span>
                              </div>
                            )}
                            {selectedTrip.duration && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duration:</span>
                                <span className="font-medium">{selectedTrip.duration}</span>
                              </div>
                            )}
                            {selectedTrip.seatNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Seat:</span>
                                <span className="font-medium">{selectedTrip.seatNumber} ({selectedTrip.seatClass})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Hotel Information</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {selectedTrip.hotelName && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hotel:</span>
                                <span className="font-medium">{selectedTrip.hotelName}</span>
                              </div>
                            )}
                            {selectedTrip.hotelAddress && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Address:</span>
                                <span className="font-medium">{selectedTrip.hotelAddress}</span>
                              </div>
                            )}
                            {selectedTrip.roomType && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Room Type:</span>
                                <span className="font-medium">{selectedTrip.roomType}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {selectedTrip.checkInDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Check-in:</span>
                                <span className="font-medium">{selectedTrip.checkInDate}</span>
                              </div>
                            )}
                            {selectedTrip.checkOutDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Check-out:</span>
                                <span className="font-medium">{selectedTrip.checkOutDate}</span>
                              </div>
                            )}
                            {selectedTrip.guests && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Guests:</span>
                                <span className="font-medium">{selectedTrip.guests}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking & Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Booking & Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-2">Booking Information</h4>
                      {selectedTrip.bookingReference && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booking Reference:</span>
                          <span className="font-medium">{selectedTrip.bookingReference}</span>
                        </div>
                      )}
                      {selectedTrip.confirmationNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confirmation:</span>
                          <span className="font-medium">{selectedTrip.confirmationNumber}</span>
                        </div>
                      )}
                      {selectedTrip.passengerName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Passenger:</span>
                          <span className="font-medium">{selectedTrip.passengerName}</span>
                        </div>
                      )}
                      {selectedTrip.bookingDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Booked On:</span>
                          <span className="font-medium">{selectedTrip.bookingDate}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-2">Cost Breakdown</h4>
                      {selectedTrip.cost && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total Cost:</span>
                            <span>${selectedTrip.cost.toLocaleString()} {selectedTrip.currency || 'USD'}</span>
                          </div>
                          {selectedTrip.type === 'flight' && selectedTrip.duration && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Cost per hour:</span>
                              <span>${Math.round(selectedTrip.cost / parseFloat(selectedTrip.duration.replace(/[^\d.]/g, '')) || 0)}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">AI Confidence:</span>
                        <Badge variant="secondary">
                          {Math.round((selectedTrip.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trip Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-purple-600" />
                    Trip Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {selectedTrip.emailId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Source Email ID:</span>
                        <span className="font-medium">{selectedTrip.emailId}</span>
                      </div>
                    )}
                    {selectedTrip.createdAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Added to System:</span>
                        <span className="font-medium">{new Date(selectedTrip.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trip Type:</span>
                      <span className="font-medium capitalize">{selectedTrip.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trip ID:</span>
                      <span className="font-medium">#{selectedTrip.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}