import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ParsedTravelData {
  type: 'flight' | 'hotel' | 'car_rental' | 'vacation_rental' | 'other';
  
  // Flight data
  airline?: string;
  flight_number?: string;
  aircraft_type?: string;
  departure_airport?: string;
  departure_airport_code?: string;
  arrival_airport?: string;
  arrival_airport_code?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_date?: string;
  arrival_time?: string;
  duration?: string;
  seat_number?: string;
  seat_class?: string;
  
  // Hotel data
  hotel_name?: string;
  hotel_address?: string;
  check_in_date?: string;
  check_out_date?: string;
  room_type?: string;
  guests?: number;
  
  // Common data
  origin_city?: string;
  destination_city?: string;
  origin_country?: string;
  destination_country?: string;
  booking_reference?: string;
  confirmation_number?: string;
  passenger_name?: string;
  cost?: number;
  currency?: string;
  booking_date?: string;
  
  // Metadata
  confidence_score: number;
  extracted_data: any;
}

export class AIParser {
  async parseEmail(emailContent: string, subject: string, from: string): Promise<ParsedTravelData | null> {
    try {
      const prompt = this.buildPrompt(emailContent, subject, from);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a specialized travel email parser. Extract structured travel information from emails and return valid JSON. Be precise and only extract information that is explicitly stated in the email."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      // Parse the JSON response
      const parsedData = JSON.parse(content);
      
      // Validate the parsed data
      if (!this.isValidTravelData(parsedData)) {
        console.log('Invalid travel data detected, skipping email');
        return null;
      }

      return parsedData;
    } catch (error) {
      console.error('Error parsing email with AI:', error);
      return null;
    }
  }

  private buildPrompt(emailContent: string, subject: string, from: string): string {
    return `
Please analyze this email and extract travel information. Return a JSON object with the following structure:

{
  "type": "flight" | "hotel" | "car_rental" | "vacation_rental" | "other",
  "airline": "string (for flights)",
  "flight_number": "string (for flights)",
  "aircraft_type": "string (for flights)",
  "departure_airport": "string (full airport name)",
  "departure_airport_code": "string (3-letter code)",
  "arrival_airport": "string (full airport name)", 
  "arrival_airport_code": "string (3-letter code)",
  "departure_date": "YYYY-MM-DD",
  "departure_time": "HH:MM",
  "arrival_date": "YYYY-MM-DD",
  "arrival_time": "HH:MM",
  "duration": "string (e.g., '2h 30m')",
  "seat_number": "string",
  "seat_class": "string (Economy, Business, First)",
  "hotel_name": "string (for hotels)",
  "hotel_address": "string (for hotels)",
  "check_in_date": "YYYY-MM-DD (for hotels)",
  "check_out_date": "YYYY-MM-DD (for hotels)",
  "room_type": "string (for hotels)",
  "guests": number,
  "origin_city": "string",
  "destination_city": "string",
  "origin_country": "string",
  "destination_country": "string",
  "booking_reference": "string",
  "confirmation_number": "string",
  "passenger_name": "string",
  "cost": number,
  "currency": "string",
  "booking_date": "YYYY-MM-DD",
  "confidence_score": number (0-1),
  "extracted_data": {} // any additional relevant data
}

Email Details:
- Subject: ${subject}
- From: ${from}
- Content: ${emailContent.substring(0, 4000)}

Important guidelines:
1. Only extract information that is explicitly stated in the email
2. Use null for fields that are not present or unclear
3. Ensure dates are in YYYY-MM-DD format
4. Ensure times are in HH:MM format (24-hour)
5. Set confidence_score based on how clear and complete the information is
6. If this is not a travel-related email, set confidence_score to 0
7. For costs, extract only the numeric value without currency symbols
8. Return valid JSON only, no additional text or explanations

Return only the JSON object, nothing else.
`;
  }

  private isValidTravelData(data: any): boolean {
    // Check if it's a valid travel data object
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Must have a type
    if (!data.type || !['flight', 'hotel', 'car_rental', 'vacation_rental', 'other'].includes(data.type)) {
      return false;
    }

    // Must have a confidence score
    if (typeof data.confidence_score !== 'number' || data.confidence_score < 0.3) {
      return false;
    }

    // For flights, must have basic flight info
    if (data.type === 'flight') {
      if (!data.departure_date && !data.flight_number && !data.airline) {
        return false;
      }
    }

    // For hotels, must have basic hotel info
    if (data.type === 'hotel') {
      if (!data.check_in_date && !data.hotel_name) {
        return false;
      }
    }

    return true;
  }

  async parseMultipleEmails(emails: Array<{id: string, subject: string, from: string, body: string}>): Promise<Array<{emailId: string, data: ParsedTravelData | null, processingTime: number}>> {
    const results = [];
    
    // Process emails in parallel with controlled concurrency
    const concurrencyLimit = 5;
    const batches = [];
    
    for (let i = 0; i < emails.length; i += concurrencyLimit) {
      batches.push(emails.slice(i, i + concurrencyLimit));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (email) => {
        const startTime = Date.now();
        const data = await this.parseEmail(email.body, email.subject, email.from);
        const processingTime = Date.now() - startTime;
        
        return {
          emailId: email.id,
          data,
          processingTime
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}