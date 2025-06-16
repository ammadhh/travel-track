"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Plane, Calendar, DollarSign, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Trip {
  id: string
  origin: string
  destination: string
  date: string
  airline: string
  flightNumber: string
  cost: number
  coordinates: {
    origin: [number, number]
    destination: [number, number]
  }
  type: "flight" | "hotel" | "car"
}

const sampleTrips: Trip[] = [
  {
    id: "1",
    origin: "New York",
    destination: "London",
    date: "2024-03-15",
    airline: "Delta",
    flightNumber: "DL142",
    cost: 1250,
    coordinates: {
      origin: [-74.006, 40.7128],
      destination: [-0.1276, 51.5074],
    },
    type: "flight",
  },
  {
    id: "2",
    origin: "London",
    destination: "Paris",
    date: "2024-03-20",
    airline: "Air France",
    flightNumber: "AF1234",
    cost: 180,
    coordinates: {
      origin: [-0.1276, 51.5074],
      destination: [2.3522, 48.8566],
    },
    type: "flight",
  },
  {
    id: "3",
    origin: "Paris",
    destination: "Tokyo",
    date: "2024-04-02",
    airline: "Japan Airlines",
    flightNumber: "JL416",
    cost: 1800,
    coordinates: {
      origin: [2.3522, 48.8566],
      destination: [139.6917, 35.6895],
    },
    type: "flight",
  },
]

export default function MapPage() {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [animatedPaths, setAnimatedPaths] = useState<string[]>([])

  useEffect(() => {
    // Animate flight paths on load
    const timer = setTimeout(() => {
      setAnimatedPaths(sampleTrips.map((trip) => trip.id))
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const getAirlineColor = (airline: string) => {
    const colors: Record<string, string> = {
      Delta: "#003366",
      "Air France": "#002157",
      "Japan Airlines": "#DC143C",
      United: "#0039A6",
      American: "#C8102E",
    }
    return colors[airline] || "#6366f1"
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
              <h1 className="text-2xl font-bold text-gray-900">Travel Map</h1>
            </div>
            <Badge className="bg-green-100 text-green-700">{sampleTrips.length} Trips Discovered</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Interactive World Map
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="relative w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200">
                  {/* Simplified World Map SVG */}
                  <svg
                    viewBox="0 0 1000 500"
                    className="w-full h-full"
                    style={{ background: "linear-gradient(to bottom, #e0f2fe, #b3e5fc)" }}
                  >
                    {/* Continents (simplified shapes) */}
                    <g fill="#4ade80" stroke="#22c55e" strokeWidth="1">
                      {/* North America */}
                      <path d="M100 150 L200 120 L250 180 L180 220 L120 200 Z" />
                      {/* Europe */}
                      <path d="M450 140 L520 130 L540 170 L480 180 Z" />
                      {/* Asia */}
                      <path d="M600 120 L800 100 L850 200 L650 180 Z" />
                      {/* Africa */}
                      <path d="M480 200 L520 190 L540 300 L460 320 Z" />
                      {/* Australia */}
                      <path d="M750 350 L820 340 L830 380 L760 390 Z" />
                    </g>

                    {/* Flight Paths */}
                    {sampleTrips.map((trip, index) => {
                      const [x1, y1] = [
                        ((trip.coordinates.origin[0] + 180) / 360) * 1000,
                        ((90 - trip.coordinates.origin[1]) / 180) * 500,
                      ]
                      const [x2, y2] = [
                        ((trip.coordinates.destination[0] + 180) / 360) * 1000,
                        ((90 - trip.coordinates.destination[1]) / 180) * 500,
                      ]

                      const midX = (x1 + x2) / 2
                      const midY = Math.min(y1, y2) - 50

                      return (
                        <g key={trip.id}>
                          {/* Curved flight path */}
                          <path
                            d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                            fill="none"
                            stroke={getAirlineColor(trip.airline)}
                            strokeWidth="3"
                            strokeDasharray="5,5"
                            className={`transition-all duration-1000 ${
                              animatedPaths.includes(trip.id) ? "opacity-100" : "opacity-0"
                            }`}
                            style={{
                              animation: animatedPaths.includes(trip.id)
                                ? `dash 2s ease-in-out ${index * 0.5}s`
                                : "none",
                            }}
                          />

                          {/* Origin marker */}
                          <circle
                            cx={x1}
                            cy={y1}
                            r="6"
                            fill={getAirlineColor(trip.airline)}
                            className="cursor-pointer hover:r-8 transition-all"
                            onClick={() => setSelectedTrip(trip)}
                          />

                          {/* Destination marker */}
                          <circle
                            cx={x2}
                            cy={y2}
                            r="6"
                            fill={getAirlineColor(trip.airline)}
                            className="cursor-pointer hover:r-8 transition-all"
                            onClick={() => setSelectedTrip(trip)}
                          />

                          {/* Plane icon animation */}
                          <g
                            className={`transition-all duration-1000 ${
                              animatedPaths.includes(trip.id) ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            <circle cx={x2} cy={y2} r="3" fill="white" className="animate-pulse" />
                          </g>
                        </g>
                      )
                    })}
                  </svg>

                  {/* CSS for path animation */}
                  <style jsx>{`
                    @keyframes dash {
                      from {
                        stroke-dashoffset: 1000;
                      }
                      to {
                        stroke-dashoffset: 0;
                      }
                    }
                  `}</style>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trip Details Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Trip Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTrip ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge style={{ backgroundColor: getAirlineColor(selectedTrip.airline) }}>
                        {selectedTrip.airline}
                      </Badge>
                      <span className="text-sm text-gray-500">{selectedTrip.flightNumber}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Plane className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedTrip.origin} → {selectedTrip.destination}
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(selectedTrip.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />${selectedTrip.cost.toLocaleString()}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Flight Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Flight: {selectedTrip.flightNumber}</p>
                        <p>Carrier: {selectedTrip.airline}</p>
                        <p>
                          Route: {selectedTrip.origin} - {selectedTrip.destination}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Click on a location marker to view trip details</p>
                )}
              </CardContent>
            </Card>

            {/* Trip List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sampleTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTrip?.id === trip.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedTrip(trip)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">
                        {trip.origin} → {trip.destination}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: `${getAirlineColor(trip.airline)}20` }}
                      >
                        {trip.airline}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(trip.date).toLocaleDateString()}</span>
                      <span>${trip.cost.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
