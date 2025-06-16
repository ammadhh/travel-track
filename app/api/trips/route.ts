import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/google-auth';
import { getUserByGoogleId, getTripsByUserId } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookie
    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify JWT token
    const decoded = verifyJWT(authToken) as any;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user from database
    const user = await getUserByGoogleId(decoded.googleId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get trips for user
    const trips = await getTripsByUserId(user.id);

    // Transform data for frontend
    const transformedTrips = trips.map(trip => ({
      id: trip.id,
      type: trip.type,
      
      // Flight data
      airline: trip.airline,
      flightNumber: trip.flight_number,
      aircraft: trip.aircraft_type,
      departureAirport: trip.departure_airport,
      departureCode: trip.departure_airport_code,
      arrivalAirport: trip.arrival_airport,
      arrivalCode: trip.arrival_airport_code,
      departureDate: trip.departure_date,
      departureTime: trip.departure_time,
      arrivalDate: trip.arrival_date,
      arrivalTime: trip.arrival_time,
      duration: trip.duration,
      seatNumber: trip.seat_number,
      seatClass: trip.seat_class,
      
      // Hotel data
      hotelName: trip.hotel_name,
      hotelAddress: trip.hotel_address,
      checkInDate: trip.check_in_date,
      checkOutDate: trip.check_out_date,
      roomType: trip.room_type,
      guests: trip.guests,
      
      // Common data
      origin: trip.origin_city,
      destination: trip.destination_city,
      originCountry: trip.origin_country,
      destinationCountry: trip.destination_country,
      bookingReference: trip.booking_reference,
      confirmationNumber: trip.confirmation_number,
      passengerName: trip.passenger_name,
      cost: trip.cost,
      currency: trip.currency,
      bookingDate: trip.booking_date,
      
      // Metadata
      confidence: trip.confidence_score,
      emailId: trip.email_id,
      createdAt: trip.created_at,
      updatedAt: trip.updated_at
    }));

    return NextResponse.json({
      success: true,
      trips: transformedTrips,
      total: transformedTrips.length
    });

  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch trips',
      details: error.message 
    }, { status: 500 });
  }
}