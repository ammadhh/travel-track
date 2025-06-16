import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/google-auth'
import { deleteTrip } from '@/lib/database'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    const token = request.cookies.get('auth_token')?.value

    if (!token && !authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const authToken = token || authHeader?.replace('Bearer ', '')
    
    if (!authToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const decoded = verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const tripId = parseInt(params.id)
    if (isNaN(tripId)) {
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 })
    }

    // Delete the trip
    const result = await deleteTrip(tripId, decoded.id)
    
    if (!result) {
      return NextResponse.json({ error: 'Trip not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Trip deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting trip:', error)
    return NextResponse.json({ 
      error: 'Failed to delete trip' 
    }, { status: 500 })
  }
}