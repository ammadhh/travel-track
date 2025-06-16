"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Plane,
  Hotel,
  Car,
  DollarSign,
  Globe,
  Calendar,
  TrendingUp,
  MapPin,
  Clock,
  BarChart3,
  PieChart
} from "lucide-react"
import Link from "next/link"
import { ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, Area, AreaChart, Pie } from 'recharts'

interface Trip {
  id: number
  type: string
  airline?: string
  origin?: string
  destination?: string
  departureDate?: string
  cost?: number
  currency?: string
  duration?: string
  originCountry?: string
  destinationCountry?: string
}

interface AnalyticsData {
  totalSpent: number
  totalTrips: number
  totalMiles: number
  countries: number
  avgTripCost: number
  spendingByCategory: Array<{ name: string; value: number; color: string }>
  airlineDistribution: Array<{ name: string; value: number; flights: number }>
  monthlySpending: Array<{ month: string; amount: number; trips: number }>
  destinationStats: Array<{ destination: string; trips: number; spent: number }>
  travelTrends: Array<{ month: string; miles: number; cost: number }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [distanceUnit, setDistanceUnit] = useState<'miles' | 'km'>('miles')

  useEffect(() => {
    loadTripsAndAnalytics()
  }, [])

  const loadTripsAndAnalytics = async () => {
    try {
      const response = await fetch('/api/trips')
      if (response.status === 401) {
        window.location.href = '/auth'
        return
      }
      const data = await response.json()
      if (data.success) {
        const tripsData = data.trips
        setTrips(tripsData)
        generateAnalytics(tripsData)
      }
    } catch (error) {
      console.error('Error loading trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAnalytics = (tripsData: Trip[]) => {
    const totalSpent = tripsData.reduce((sum, trip) => sum + (trip.cost || 0), 0)
    const totalTrips = tripsData.length
    const avgTripCost = totalTrips > 0 ? totalSpent / totalTrips : 0

    // Estimate miles (rough calculation)
    const estimatedMiles = tripsData.filter(t => t.type === 'flight').length * 1200 // Average 1200 miles per flight
    const countries = new Set(tripsData.map(t => t.destinationCountry || t.destination).filter(Boolean)).size

    // Spending by category
    const flightSpending = tripsData.filter(t => t.type === 'flight').reduce((sum, t) => sum + (t.cost || 0), 0)
    const hotelSpending = tripsData.filter(t => t.type === 'hotel').reduce((sum, t) => sum + (t.cost || 0), 0)
    const otherSpending = tripsData.filter(t => !['flight', 'hotel'].includes(t.type)).reduce((sum, t) => sum + (t.cost || 0), 0)

    const spendingByCategory = [
      { name: 'Flights', value: flightSpending, color: '#0088FE' },
      { name: 'Hotels', value: hotelSpending, color: '#00C49F' },
      { name: 'Other', value: otherSpending, color: '#FFBB28' }
    ].filter(item => item.value > 0)

    // Airline distribution
    const airlineMap = new Map()
    tripsData.filter(t => t.type === 'flight' && t.airline).forEach(trip => {
      const airline = trip.airline!
      if (airlineMap.has(airline)) {
        airlineMap.set(airline, {
          ...airlineMap.get(airline),
          value: airlineMap.get(airline).value + (trip.cost || 0),
          flights: airlineMap.get(airline).flights + 1
        })
      } else {
        airlineMap.set(airline, { name: airline, value: trip.cost || 0, flights: 1 })
      }
    })
    const airlineDistribution = Array.from(airlineMap.values()).sort((a, b) => b.value - a.value).slice(0, 6)

    // Monthly spending trends
    const monthlyMap = new Map()
    tripsData.forEach(trip => {
      if (trip.departureDate) {
        const month = new Date(trip.departureDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        if (monthlyMap.has(month)) {
          monthlyMap.set(month, {
            ...monthlyMap.get(month),
            amount: monthlyMap.get(month).amount + (trip.cost || 0),
            trips: monthlyMap.get(month).trips + 1
          })
        } else {
          monthlyMap.set(month, { month, amount: trip.cost || 0, trips: 1 })
        }
      }
    })
    const monthlySpending = Array.from(monthlyMap.values()).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Destination statistics
    const destMap = new Map()
    tripsData.forEach(trip => {
      const dest = trip.destination || 'Unknown'
      if (destMap.has(dest)) {
        destMap.set(dest, {
          ...destMap.get(dest),
          trips: destMap.get(dest).trips + 1,
          spent: destMap.get(dest).spent + (trip.cost || 0)
        })
      } else {
        destMap.set(dest, { destination: dest, trips: 1, spent: trip.cost || 0 })
      }
    })
    const destinationStats = Array.from(destMap.values()).sort((a, b) => b.trips - a.trips).slice(0, 8)

    // Travel trends (miles and cost over time)
    const travelTrends = monthlySpending.map(month => ({
      month: month.month,
      miles: month.trips * 1200, // Estimated miles
      cost: month.amount
    }))

    setAnalytics({
      totalSpent,
      totalTrips,
      totalMiles: estimatedMiles,
      countries,
      avgTripCost,
      spendingByCategory,
      airlineDistribution,
      monthlySpending,
      destinationStats,
      travelTrends
    })
  }

  const convertDistance = (miles: number) => {
    return distanceUnit === 'km' ? Math.round(miles * 1.60934) : miles
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Available</h2>
          <p className="text-gray-600 mb-4">You need some trips to view analytics.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
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
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Travel Analytics</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={distanceUnit === 'miles' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDistanceUnit('miles')}
              >
                Miles
              </Button>
              <Button
                variant={distanceUnit === 'km' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDistanceUnit('km')}
              >
                Kilometers
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.totalSpent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${analytics.avgTripCost.toFixed(0)} avg per trip
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Plane className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTrips}</div>
              <p className="text-xs text-muted-foreground">
                {trips.filter(t => t.type === 'flight').length} flights, {trips.filter(t => t.type === 'hotel').length} hotels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distance Traveled</CardTitle>
              <Globe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {convertDistance(analytics.totalMiles).toLocaleString()} {distanceUnit}
              </div>
              <p className="text-xs text-muted-foreground">
                ~{Math.round(convertDistance(analytics.totalMiles) / analytics.totalTrips)} {distanceUnit} per trip
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries Visited</CardTitle>
              <MapPin className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.countries}</div>
              <p className="text-xs text-muted-foreground">
                Unique destinations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per {distanceUnit === 'miles' ? 'Mile' : 'KM'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(analytics.totalSpent / convertDistance(analytics.totalMiles)).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cost efficiency
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="spending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
            <TabsTrigger value="destinations">Destinations</TabsTrigger>
            <TabsTrigger value="airlines">Airlines & Hotels</TabsTrigger>
            <TabsTrigger value="trends">Travel Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Spending by Category Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-blue-600" />
                    Spending by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analytics.spendingByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.spendingByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Spending Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Monthly Spending Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.monthlySpending}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Spent']} />
                        <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Spending Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Flight Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    ${analytics.spendingByCategory.find(c => c.name === 'Flights')?.value.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {((analytics.spendingByCategory.find(c => c.name === 'Flights')?.value || 0) / analytics.totalSpent * 100).toFixed(1)}% of total spending
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hotel Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ${analytics.spendingByCategory.find(c => c.name === 'Hotels')?.value.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {((analytics.spendingByCategory.find(c => c.name === 'Hotels')?.value || 0) / analytics.totalSpent * 100).toFixed(1)}% of total spending
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Other Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    ${analytics.spendingByCategory.find(c => c.name === 'Other')?.value.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Car rentals, activities, etc.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="destinations" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Destinations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-orange-600" />
                    Top Destinations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.destinationStats.map((dest, index) => (
                      <div key={dest.destination} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium">{dest.destination}</div>
                            <div className="text-sm text-gray-500">{dest.trips} trips</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${dest.spent.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">${Math.round(dest.spent / dest.trips)} per trip</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Destination Spending Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                    Spending by Destination
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.destinationStats} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="destination" type="category" width={80} />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Spent']} />
                        <Bar dataKey="spent" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="airlines" className="space-y-6">
            {/* Airlines Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="w-5 h-5 mr-2 text-blue-600" />
                  Airline Usage & Spending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Top Airlines by Spending</h4>
                    {analytics.airlineDistribution.map((airline, index) => (
                      <div key={airline.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Plane className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{airline.name}</div>
                            <div className="text-sm text-gray-500">{airline.flights} flights</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${airline.value.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">${Math.round(airline.value / airline.flights)} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analytics.airlineDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.airlineDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Spent']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Travel Trends Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                  Travel Trends Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.travelTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="cost" fill="#8884d8" name="Spending ($)" />
                      <Line yAxisId="right" type="monotone" dataKey="miles" stroke="#82ca9d" name={`Distance (${distanceUnit})`} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Travel Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Travel Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Most Expensive Month</h4>
                    <p className="text-blue-700">
                      {analytics.monthlySpending.reduce((max, month) => month.amount > max.amount ? month : max, { month: 'N/A', amount: 0 }).month}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Most Active Month</h4>
                    <p className="text-green-700">
                      {analytics.monthlySpending.reduce((max, month) => month.trips > max.trips ? month : max, { month: 'N/A', trips: 0 }).month}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">Average Monthly Spending</h4>
                    <p className="text-purple-700">
                      ${(analytics.totalSpent / Math.max(analytics.monthlySpending.length, 1)).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Travel Goals Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Countries Visited</span>
                      <span>{analytics.countries}/50</span>
                    </div>
                    <Progress value={(analytics.countries / 50) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Distance Traveled</span>
                      <span>{convertDistance(analytics.totalMiles).toLocaleString()}/{convertDistance(100000).toLocaleString()} {distanceUnit}</span>
                    </div>
                    <Progress value={(analytics.totalMiles / 100000) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Annual Budget</span>
                      <span>${analytics.totalSpent.toLocaleString()}/$25,000</span>
                    </div>
                    <Progress value={(analytics.totalSpent / 25000) * 100} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}