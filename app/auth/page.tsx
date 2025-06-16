"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Shield, Zap, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Check for auth error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    if (error) {
      let errorMessage = 'Authentication failed'
      switch (error) {
        case 'access_denied':
          errorMessage = 'Access was denied. Please try again.'
          break
        case 'no_code':
          errorMessage = 'No authorization code received.'
          break
        case 'callback_failed':
          errorMessage = 'Authentication callback failed.'
          break
      }
      alert(errorMessage)
    }
  }, [])

  const handleGmailConnect = async () => {
    setIsConnecting(true)
    try {
      // Get OAuth URL from backend
      const response = await fetch('/api/auth/google')
      const data = await response.json()
      
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error('Failed to get auth URL')
      }
    } catch (error) {
      console.error('Error connecting to Gmail:', error)
      setIsConnecting(false)
      alert('Failed to connect to Gmail. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Connect Your Gmail</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Information */}
          <div className="space-y-8">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-700">
                <Shield className="w-3 h-3 mr-1" />
                Privacy First
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Automatically Discover Your Travel History</h2>
              <p className="text-lg text-gray-600">
                Connect your Gmail account to let our AI automatically find and organize all your travel bookings,
                flights, hotels, and reservations.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">AI-Powered Email Parsing</h3>
                  <p className="text-gray-600">
                    GPT-4o Mini intelligently scans your emails to extract flight details, hotel bookings, and travel
                    confirmations with 99% accuracy.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Read-Only Access</h3>
                  <p className="text-gray-600">
                    We only request read-only permissions to scan for travel-related emails. We never send emails or
                    access personal information.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Local Data Storage</h3>
                  <p className="text-gray-600">
                    All your travel data is stored locally on your device. Your privacy is our top priority.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">What we scan for:</p>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Flight confirmations and boarding passes</li>
                    <li>• Hotel and accommodation bookings</li>
                    <li>• Car rental confirmations</li>
                    <li>• Travel insurance documents</li>
                    <li>• Vacation rental bookings</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Card */}
          <div>
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Connect Gmail Account</CardTitle>
                <CardDescription className="text-base">Secure OAuth authentication with Google</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {!isConnected ? (
                  <>
                    <Button
                      onClick={handleGmailConnect}
                      disabled={isConnecting}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5 mr-2" />
                          Connect with Google
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-4">
                        By connecting, you agree to our privacy policy and terms of service
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          Encrypted
                        </span>
                        <span className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Read-only
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Successfully Connected!</h3>
                      <p className="text-gray-600 mb-4">
                        Your Gmail account is now connected. We'll start scanning for travel bookings.
                      </p>
                    </div>
                    <Link href="/dashboard">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Go to Dashboard</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}