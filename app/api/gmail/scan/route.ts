import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/google-auth';
import { GmailService } from '@/lib/gmail-service';
import { AIParser } from '@/lib/ai-parser';
import { 
  getUserByGoogleId, 
  createTrip, 
  checkDuplicateTrip, 
  createEmailProcessingLog, 
  updateEmailProcessingLog 
} from '@/lib/database';

export async function POST(request: NextRequest) {
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

    console.log(`Starting Gmail scan for user: ${user.email}`);

    // Initialize Gmail service
    const gmailService = new GmailService(user.access_token, user.refresh_token);
    
    // Initialize AI parser
    const aiParser = new AIParser();

    // Scan for travel emails
    const emails = await gmailService.scanForTravelEmails(50);
    console.log(`Found ${emails.length} emails to process`);

    const processedTrips = [];
    const processingLogs = [];
    let totalProcessingTime = 0;
    const startTime = Date.now();

    // Process emails in batches for better performance and rate limiting
    const emailsForProcessing = emails.map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.from,
      body: email.body
    }));

    // Parse emails with AI in parallel
    const parseResults = await aiParser.parseMultipleEmails(emailsForProcessing);
    
    // Process results and save to database
    for (let i = 0; i < parseResults.length; i++) {
      const result = parseResults[i];
      const email = emails[i];
      
      // Create processing log entry
      const logId = await createEmailProcessingLog({
        user_id: user.id,
        email_id: result.emailId,
        email_subject: email.subject,
        email_from: email.from,
        email_date: email.date,
        processing_status: 'processing'
      });

      totalProcessingTime += result.processingTime;

      if (result.data) {
        try {
          // Check for duplicates
          const duplicate = await checkDuplicateTrip(
            user.id,
            result.emailId,
            result.data.booking_reference
          );

          if (!duplicate) {
            // Create trip record
            const tripId = await createTrip({
              user_id: user.id,
              email_id: result.emailId,
              type: result.data.type,
              airline: result.data.airline,
              flight_number: result.data.flight_number,
              aircraft_type: result.data.aircraft_type,
              departure_airport: result.data.departure_airport,
              departure_airport_code: result.data.departure_airport_code,
              arrival_airport: result.data.arrival_airport,
              arrival_airport_code: result.data.arrival_airport_code,
              departure_date: result.data.departure_date,
              departure_time: result.data.departure_time,
              arrival_date: result.data.arrival_date,
              arrival_time: result.data.arrival_time,
              duration: result.data.duration,
              seat_number: result.data.seat_number,
              seat_class: result.data.seat_class,
              hotel_name: result.data.hotel_name,
              hotel_address: result.data.hotel_address,
              check_in_date: result.data.check_in_date,
              check_out_date: result.data.check_out_date,
              room_type: result.data.room_type,
              guests: result.data.guests,
              origin_city: result.data.origin_city,
              destination_city: result.data.destination_city,
              origin_country: result.data.origin_country,
              destination_country: result.data.destination_country,
              booking_reference: result.data.booking_reference,
              confirmation_number: result.data.confirmation_number,
              passenger_name: result.data.passenger_name,
              cost: result.data.cost,
              currency: result.data.currency || 'USD',
              booking_date: result.data.booking_date,
              confidence_score: result.data.confidence_score,
              raw_email_content: email.body,
              parsed_data: JSON.stringify(result.data),
              processing_logs: JSON.stringify({
                email_subject: email.subject,
                email_from: email.from,
                processing_time_ms: result.processingTime,
                ai_model: 'gpt-4o-mini'
              })
            });

            processedTrips.push({
              id: tripId,
              emailId: result.emailId,
              type: result.data.type,
              confidence: result.data.confidence_score,
              processingTime: result.processingTime
            });

            // Update log as completed
            await updateEmailProcessingLog(logId, {
              processing_status: 'completed',
              trips_found: 1,
              processing_time_ms: result.processingTime
            });
          } else {
            console.log(`Duplicate trip found for email ${result.emailId}, skipping`);
            await updateEmailProcessingLog(logId, {
              processing_status: 'completed',
              trips_found: 0,
              processing_time_ms: result.processingTime
            });
          }
        } catch (error: any) {
          console.error(`Error saving trip for email ${result.emailId}:`, error);
          await updateEmailProcessingLog(logId, {
            processing_status: 'failed',
            error_message: error.message,
            processing_time_ms: result.processingTime
          });
        }
      } else {
        // No travel data found
        await updateEmailProcessingLog(logId, {
          processing_status: 'completed',
          trips_found: 0,
          processing_time_ms: result.processingTime
        });
      }

      processingLogs.push({
        emailId: result.emailId,
        subject: email.subject,
        from: email.from,
        status: result.data ? 'processed' : 'no_travel_data',
        processingTime: result.processingTime
      });
    }

    const totalTime = Date.now() - startTime;

    console.log(`Gmail scan completed for user: ${user.email}`);
    console.log(`Processed ${emails.length} emails, found ${processedTrips.length} trips`);
    console.log(`Total processing time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      emailsProcessed: emails.length,
      tripsFound: processedTrips.length,
      totalProcessingTime: totalTime,
      averageProcessingTime: Math.round(totalProcessingTime / emails.length),
      trips: processedTrips,
      processingLogs: processingLogs.slice(0, 20) // Limit logs in response
    });

  } catch (error: any) {
    console.error('Gmail scan error:', error);
    return NextResponse.json({ 
      error: 'Failed to scan Gmail', 
      details: error.message 
    }, { status: 500 });
  }
}