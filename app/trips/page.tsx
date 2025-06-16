"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Plane,
  Hotel,
  Car,
  Search,
  Filter,
  Trash2,
  Edit,
  ChevronRight,
  Calendar,
  MapPin,
  DollarSign,
  User,
  X,
  Check,
  AlertTriangle
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

export default function AllTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    loadTrips()
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

  const deleteTrip = async (tripId: number) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setTrips(prev => prev.filter(trip => trip.id !== tripId))
        setShowDeleteConfirm(null)
      } else {
        setError('Failed to delete trip')
      }
    } catch (error) {
      console.error('Error deleting trip:', error)
      setError('Failed to delete trip')
    }
  }

  // Filter and sort trips
  const filteredTrips = trips
    .filter(trip => {
      const matchesSearch = searchTerm === "" || 
        trip.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.flightNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterType === "all" || trip.type === filterType
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case "date":
          aValue = new Date(a.departureDate || a.checkInDate || a.createdAt || 0).getTime()
          bValue = new Date(b.departureDate || b.checkInDate || b.createdAt || 0).getTime()
          break
        case "cost":
          aValue = a.cost || 0
          bValue = b.cost || 0
          break
        case "destination":
          aValue = a.destination || a.hotelName || ""
          bValue = b.destination || b.hotelName || ""
          break
        case "confidence":
          aValue = a.confidence || 0
          bValue = b.confidence || 0
          break
        default:
          return 0
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const getTripIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="w-5 h-5 text-blue-600" />
      case 'hotel':
        return <Hotel className="w-5 h-5 text-green-600" />
      default:
        return <Car className="w-5 h-5 text-purple-600" />
    }
  }

  const getTripTitle = (trip: Trip) => {
    if (trip.type === 'flight') {
      return `${trip.origin} → ${trip.destination}`
    } else if (trip.type === 'hotel') {
      return trip.hotelName || 'Hotel Booking'
    } else {
      return `${trip.type} booking`
    }
  }

  const getTripSubtitle = (trip: Trip) => {
    const date = trip.departureDate || trip.checkInDate || 'Unknown date'
    const details = []
    
    if (trip.airline) details.push(trip.airline)
    if (trip.flightNumber) details.push(trip.flightNumber)
    if (trip.roomType) details.push(trip.roomType)
    
    return `${date}${details.length > 0 ? ' • ' + details.join(' ') : ''}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading your trips...</p>
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
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">All Trips</h1>
              <Badge variant="secondary">{filteredTrips.length} trips</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search trips by destination, airline, hotel..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter by Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="flight">Flights</option>
                <option value="hotel">Hotels</option>
                <option value="car_rental">Car Rentals</option>
                <option value="other">Other</option>
              </select>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="cost">Sort by Cost</option>
                <option value="destination">Sort by Destination</option>
                <option value="confidence">Sort by Confidence</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Start by scanning your Gmail for travel bookings."
                }
              </p>
              {!searchTerm && filterType === "all" && (
                <Link href="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedTrip(trip)
                        setShowTripDetails(true)
                      }}
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getTripIcon(trip.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {getTripTitle(trip)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {getTripSubtitle(trip)}
                            </p>
                          </div>
                          
                          <div className="text-right ml-4">
                            {trip.cost && (
                              <div className="text-lg font-semibold text-gray-900">
                                ${trip.cost.toLocaleString()} {trip.currency || 'USD'}
                              </div>
                            )}
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {Math.round((trip.confidence || 0) * 100)}% confidence
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  trip.type === 'flight' ? 'border-blue-200 text-blue-700' :
                                  trip.type === 'hotel' ? 'border-green-200 text-green-700' :
                                  'border-purple-200 text-purple-700'
                                }`}
                              >
                                {trip.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional details row */}
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          {trip.bookingReference && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {trip.bookingReference}
                            </div>
                          )}
                          {trip.createdAt && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Added {new Date(trip.createdAt).toLocaleDateString()}
                            </div>
                          )}
                          {trip.emailId && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              From email
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTrip(trip)
                          setShowTripDetails(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(trip.id)
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold">Delete Trip</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this trip? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteTrip(showDeleteConfirm)}
                >
                  Delete Trip
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trip Details Modal (reuse from dashboard) */}
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
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
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
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}