import { NextRequest } from 'next/server';
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
  // Get auth token from cookie
  const authToken = request.cookies.get('auth_token')?.value;
  if (!authToken) {
    return new Response('Not authenticated', { status: 401 });
  }

  // Verify JWT token
  const decoded = verifyJWT(authToken) as any;
  if (!decoded) {
    return new Response('Invalid token', { status: 401 });
  }

  // Get user from database
  const user = await getUserByGoogleId(decoded.googleId);
  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const { startIndex = 0, maxResults = 50 } = await request.json();

  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendUpdate = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendUpdate({ 
          type: 'status', 
          message: 'Initializing Gmail connection...', 
          progress: 0 
        });

        // Initialize Gmail service
        const gmailService = new GmailService(user.access_token, user.refresh_token);
        
        sendUpdate({ 
          type: 'status', 
          message: 'Searching for travel emails...', 
          progress: 5 
        });

        // Get emails with pagination
        const emails = await gmailService.scanForTravelEmailsPaginated(maxResults, startIndex);
        
        sendUpdate({ 
          type: 'emails_found', 
          count: emails.length, 
          startIndex,
          message: `Found ${emails.length} emails to process`, 
          progress: 15 
        });

        if (emails.length === 0) {
          sendUpdate({ 
            type: 'complete', 
            message: 'No more emails found', 
            progress: 100,
            tripsFound: 0,
            emailsProcessed: 0
          });
          controller.close();
          return;
        }

        // Initialize AI parser
        const aiParser = new AIParser();
        const processedTrips = [];
        const totalEmails = emails.length;

        // Process emails in parallel batches
        const batchSize = 5; // Process 5 emails at a time for better UI updates
        const batches = [];
        
        for (let i = 0; i < emails.length; i += batchSize) {
          batches.push(emails.slice(i, i + batchSize));
        }

        let processedCount = 0;

        for (const [batchIndex, batch] of batches.entries()) {
          sendUpdate({
            type: 'batch_start',
            batchNumber: batchIndex + 1,
            totalBatches: batches.length,
            batchSize: batch.length,
            message: `Processing batch ${batchIndex + 1}/${batches.length}...`
          });

          // Process batch in parallel
          const batchPromises = batch.map(async (email, emailIndex) => {
            const globalIndex = batchIndex * batchSize + emailIndex;
            
            sendUpdate({
              type: 'processing_email',
              email: {
                subject: email.subject,
                from: email.from,
                date: email.date
              },
              progress: 15 + ((globalIndex / totalEmails) * 70), // 15% to 85%
              emailIndex: globalIndex + 1,
              totalEmails
            });

            const startTime = Date.now();
            
            // Create processing log entry
            const logId = await createEmailProcessingLog({
              user_id: user.id,
              email_id: email.id,
              email_subject: email.subject,
              email_from: email.from,
              email_date: email.date,
              processing_status: 'processing'
            });

            try {
              // Parse email with AI
              const parsedData = await aiParser.parseEmail(email.body, email.subject, email.from);
              const processingTime = Date.now() - startTime;

              if (parsedData) {
                // Check for duplicates
                const duplicate = await checkDuplicateTrip(
                  user.id,
                  email.id,
                  parsedData.booking_reference
                );

                if (!duplicate) {
                  // Create trip record
                  const tripId = await createTrip({
                    user_id: user.id,
                    email_id: email.id,
                    type: parsedData.type,
                    airline: parsedData.airline,
                    flight_number: parsedData.flight_number,
                    departure_airport: parsedData.departure_airport,
                    departure_airport_code: parsedData.departure_airport_code,
                    arrival_airport: parsedData.arrival_airport,
                    arrival_airport_code: parsedData.arrival_airport_code,
                    departure_date: parsedData.departure_date,
                    departure_time: parsedData.departure_time,
                    arrival_date: parsedData.arrival_date,
                    arrival_time: parsedData.arrival_time,
                    duration: parsedData.duration,
                    seat_number: parsedData.seat_number,
                    seat_class: parsedData.seat_class,
                    hotel_name: parsedData.hotel_name,
                    hotel_address: parsedData.hotel_address,
                    check_in_date: parsedData.check_in_date,
                    check_out_date: parsedData.check_out_date,
                    room_type: parsedData.room_type,
                    guests: parsedData.guests,
                    origin_city: parsedData.origin_city,
                    destination_city: parsedData.destination_city,
                    origin_country: parsedData.origin_country,
                    destination_country: parsedData.destination_country,
                    booking_reference: parsedData.booking_reference,
                    confirmation_number: parsedData.confirmation_number,
                    passenger_name: parsedData.passenger_name,
                    cost: parsedData.cost,
                    currency: parsedData.currency || 'USD',
                    booking_date: parsedData.booking_date,
                    confidence_score: parsedData.confidence_score,
                    raw_email_content: email.body,
                    parsed_data: JSON.stringify(parsedData)
                  });

                  const newTrip = {
                    id: tripId,
                    type: parsedData.type,
                    airline: parsedData.airline,
                    flightNumber: parsedData.flight_number,
                    origin: parsedData.origin_city,
                    destination: parsedData.destination_city,
                    departureDate: parsedData.departure_date,
                    hotelName: parsedData.hotel_name,
                    cost: parsedData.cost,
                    currency: parsedData.currency,
                    confidence: parsedData.confidence_score
                  };

                  processedTrips.push(newTrip);

                  sendUpdate({
                    type: 'trip_found',
                    trip: newTrip,
                    email: {
                      subject: email.subject,
                      from: email.from
                    },
                    processingTime
                  });

                  await updateEmailProcessingLog(logId, {
                    processing_status: 'completed',
                    trips_found: 1,
                    processing_time_ms: processingTime
                  });
                } else {
                  sendUpdate({
                    type: 'duplicate_found',
                    email: {
                      subject: email.subject,
                      from: email.from
                    },
                    processingTime
                  });

                  await updateEmailProcessingLog(logId, {
                    processing_status: 'completed',
                    trips_found: 0,
                    processing_time_ms: processingTime
                  });
                }
              } else {
                sendUpdate({
                  type: 'no_travel_data',
                  email: {
                    subject: email.subject,
                    from: email.from
                  },
                  processingTime
                });

                await updateEmailProcessingLog(logId, {
                  processing_status: 'completed',
                  trips_found: 0,
                  processing_time_ms: processingTime
                });
              }
            } catch (error: any) {
              console.error(`Error processing email ${email.id}:`, error);
              
              sendUpdate({
                type: 'error',
                email: {
                  subject: email.subject,
                  from: email.from
                },
                error: error.message
              });

              await updateEmailProcessingLog(logId, {
                processing_status: 'failed',
                error_message: error.message,
                processing_time_ms: Date.now() - startTime
              });
            }

            processedCount++;
            return true;
          });

          // Wait for batch to complete
          await Promise.all(batchPromises);
          
          sendUpdate({
            type: 'batch_complete',
            batchNumber: batchIndex + 1,
            progress: 15 + ((processedCount / totalEmails) * 70)
          });

          // Small delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Final completion
        sendUpdate({
          type: 'complete',
          message: `Scan complete! Processed ${totalEmails} emails, found ${processedTrips.length} trips`,
          progress: 100,
          tripsFound: processedTrips.length,
          emailsProcessed: totalEmails,
          hasMore: emails.length === maxResults // Indicate if there might be more emails
        });

      } catch (error: any) {
        console.error('Gmail scan error:', error);
        sendUpdate({
          type: 'error',
          message: 'Failed to scan Gmail',
          error: error.message
        });
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}