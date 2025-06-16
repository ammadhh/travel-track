"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Calendar, Plane, MapPin, DollarSign, Clock, ArrowLeft, Play, Pause } from "lucide-react"
import Link from "next/link"

interface TimelineTrip {
  id: string
  date: string
  origin: string
  destination: string
  airline: string
  flightNumber: string
  cost: number
  duration: string
  type: "departure" | "arrival"
  description: string
}

const timelineTrips: TimelineTrip[] = [
  {
    id: "1",
    date: "2024-01-15",
    origin: "New York",
    destination: "Los Angeles",
    airline: "Delta",
    flightNumber: "DL1234",
    cost: 450,
    duration: "6h 30m",
    type: "departure",
    description: "Business trip to LA for client meetings",
  },
  {
    id: "2",
    date: "2024-02-03",
    origin: "Los Angeles",
    destination: "Tokyo",
    airline: "Japan Airlines",
    flightNumber: "JL061",
    cost: 1200,
    duration: "11h 45m",
    type: "departure",
    description: "Vacation in Japan - cherry blossom season",
  },
  {
    id: "3",
    date: "2024-02-15",
    origin: "Tokyo",
    destination: "Seoul",
    airline: "Korean Air",
    flightNumber: "KE706",
    cost: 280,
    duration: "2h 15m",
    type: "departure",
    description: "Weekend getaway to South Korea",
  },
  {
    id: "4",
    date: "2024-03-01",
    origin: "Seoul",
    destination: "London",
    airline: "British Airways",
    flightNumber: "BA717",
    cost: 950,
    duration: "12h 30m",
    type: "departure",
    description: "European adventure begins",
  },
  {
    id: "5",
    date: "2024-03-15",
    origin: "London",
    destination: "Paris",
    airline: "Air France",
    flightNumber: "AF1234",
    cost: 180,
    duration: "1h 25m",
    type: "departure",
    description: "Quick trip to Paris for the weekend",
  },
  {
    id: "6",
    date: "2024-04-02",
    origin: "Paris",
    destination: "New York",
    airline: "Delta",
    flightNumber: "DL142",
    cost: 1100,
    duration: "8h 15m",
    type: "arrival",
    description: "Return home after amazing European tour",
  },
]

export default function TimelinePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<TimelineTrip>(timelineTrips[0])

  const handleSliderChange = (value: number[]) => {
    const index = Math.floor((value[0] / 100) * (timelineTrips.length - 1))
    setCurrentIndex(index)
    setSelectedTrip(timelineTrips[index])
  }

  const getAirlineColor = (airline: string) => {
    const colors: Record<string, string> = {
      Delta: "#003366",
      "Japan Airlines": "#DC143C",
      "Korean Air": "#0085C3",
      "British Airways": "#075AAA",
      "Air France": "#002157",
    }
    return colors[airline] || "#6366f1"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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
              <h1 className="text-2xl font-bold text-gray-900">Travel Timeline</h1>
            </div>
            <Badge className="bg-purple-100 text-purple-700">Journey Explorer</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timeline Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                    Interactive Timeline
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>January 2024</span>
                    <span>April 2024</span>
                  </div>
                  <Slider
                    value={[(currentIndex / (timelineTrips.length - 1)) * 100]}
                    onValueChange={handleSliderChange}
                    className="w-full"
                    step={1}
                  />
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Trip {currentIndex + 1} of {timelineTrips.length}
                    </p>
                  </div>
                </div>

                {/* Current Trip Highlight */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <Badge style={{ backgroundColor: getAirlineColor(selectedTrip.airline) }} className="text-white">
                      {selectedTrip.airline}
                    </Badge>
                    <span className="text-sm text-gray-500">{selectedTrip.flightNumber}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-lg font-semibold">
                      <Plane className="w-5 h-5 mr-2 text-purple-600" />
                      {selectedTrip.origin} → {selectedTrip.destination}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(selectedTrip.date)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedTrip.duration}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />${selectedTrip.cost.toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {selectedTrip.type === "departure" ? "Departure" : "Arrival"}
                      </div>
                    </div>

                    <p className="text-gray-600 italic">{selectedTrip.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Timeline items */}
                  <div className="space-y-8">
                    {timelineTrips.map((trip, index) => (
                      <div
                        key={trip.id}
                        className={`relative flex items-start space-x-4 transition-all duration-500 ${
                          index <= currentIndex ? "opacity-100" : "opacity-30"
                        }`}
                      >
                        {/* Timeline dot */}
                        <div
                          className={`relative z-10 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                            index === currentIndex
                              ? "bg-purple-600 border-purple-600 scale-125"
                              : index < currentIndex
                                ? "bg-green-500 border-green-500"
                                : "bg-white border-gray-300"
                          }`}
                        >
                          {index === currentIndex && (
                            <div className="absolute inset-0 rounded-full bg-purple-600 animate-ping"></div>
                          )}
                        </div>

                        {/* Trip card */}
                        <div
                          className={`flex-1 bg-white rounded-lg border p-4 cursor-pointer transition-all duration-300 ${
                            index === currentIndex
                              ? "border-purple-300 shadow-lg scale-105"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            setCurrentIndex(index)
                            setSelectedTrip(trip)
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {trip.origin} → {trip.destination}
                            </span>
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: `${getAirlineColor(trip.airline)}20` }}
                            >
                              {trip.airline}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>{formatDate(trip.date)}</p>
                            <p className="text-xs">{trip.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Journey Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">6</div>
                    <div className="text-sm text-gray-600">Total Flights</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">8</div>
                    <div className="text-sm text-gray-600">Countries</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">$4.16K</div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">42h</div>
                    <div className="text-sm text-gray-600">Flight Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Airlines Used</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from(new Set(timelineTrips.map((trip) => trip.airline))).map((airline) => {
                  const count = timelineTrips.filter((trip) => trip.airline === airline).length
                  return (
                    <div key={airline} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getAirlineColor(airline) }}
                        ></div>
                        <span className="text-sm">{airline}</span>
                      </div>
                      <Badge variant="secondary">{count} flights</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Travel Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Busiest Month</span>
                  <span className="font-medium">March 2024</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Longest Flight</span>
                  <span className="font-medium">Tokyo → Seoul</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Most Expensive</span>
                  <span className="font-medium">$1,200</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Cost</span>
                  <span className="font-medium">$693</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
