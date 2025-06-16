import { google } from 'googleapis';
import { getGoogleAuthClient } from './google-auth';

export interface EmailData {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
}

export class GmailService {
  private auth;
  private gmail;

  constructor(accessToken: string, refreshToken?: string) {
    this.auth = getGoogleAuthClient(accessToken, refreshToken);
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  async scanForTravelEmailsPaginated(maxResults = 50, startIndex = 0): Promise<EmailData[]> {
    try {
      // Search query to find travel-related emails
      const searchQuery = [
        'from:(noreply@delta.com OR confirmation@united.com OR noreply@aa.com OR booking@southwest.com OR',
        'noreply@jetblue.com OR noreply@alaskaair.com OR reservations@marriott.com OR',
        'reservations@hilton.com OR bookings@booking.com OR noreply@expedia.com OR',
        'noreply@hotels.com OR confirmation@airbnb.com OR noreply@kayak.com OR',
        'noreply@priceline.com OR confirmation@orbitz.com OR noreply@tripadvisor.com OR',
        'reservations@hyatt.com OR noreply@ihg.com OR confirmation@hertz.com OR',
        'noreply@enterprise.com OR confirmation@avis.com OR noreply@budget.com)',
        'OR (subject:(flight OR hotel OR booking OR confirmation OR itinerary OR reservation OR travel))',
        'OR (flight confirmation OR hotel booking OR travel itinerary OR boarding pass)'
      ].join(' ');

      console.log('Searching Gmail with query:', searchQuery);
      console.log(`Pagination: startIndex=${startIndex}, maxResults=${maxResults}`);

      // Search for emails with pagination
      const searchResponse = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults
      });

      const allMessages = searchResponse.data.messages || [];
      console.log(`Total messages found: ${allMessages.length}`);
      
      // Apply manual pagination since Gmail API doesn't support startIndex
      const paginatedMessages = allMessages.slice(startIndex, startIndex + maxResults);
      console.log(`Processing messages ${startIndex} to ${startIndex + paginatedMessages.length}`);

      // Process emails in parallel batches to avoid rate limits
      const batchSize = 10;
      const emailBatches = [];
      
      for (let i = 0; i < paginatedMessages.length; i += batchSize) {
        emailBatches.push(paginatedMessages.slice(i, i + batchSize));
      }

      const allEmails: EmailData[] = [];
      
      for (const batch of emailBatches) {
        const batchPromises = batch.map(message => this.getEmailDetails(message.id!));
        const batchEmails = await Promise.all(batchPromises);
        allEmails.push(...batchEmails.filter(email => email !== null) as EmailData[]);
        
        // Add small delay between batches to respect rate limits
        if (emailBatches.indexOf(batch) < emailBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return allEmails;
    } catch (error) {
      console.error('Error scanning Gmail:', error);
      throw error;
    }
  }

  async scanForTravelEmails(maxResults = 50): Promise<EmailData[]> {
    try {
      // Search query to find travel-related emails
      const searchQuery = [
        'from:(noreply@delta.com OR confirmation@united.com OR noreply@aa.com OR booking@southwest.com OR',
        'noreply@jetblue.com OR noreply@alaskaair.com OR reservations@marriott.com OR',
        'reservations@hilton.com OR bookings@booking.com OR noreply@expedia.com OR',
        'noreply@hotels.com OR confirmation@airbnb.com OR noreply@kayak.com OR',
        'noreply@priceline.com OR confirmation@orbitz.com OR noreply@tripadvisor.com OR',
        'reservations@hyatt.com OR noreply@ihg.com OR confirmation@hertz.com OR',
        'noreply@enterprise.com OR confirmation@avis.com OR noreply@budget.com)',
        'OR (subject:(flight OR hotel OR booking OR confirmation OR itinerary OR reservation OR travel))',
        'OR (flight confirmation OR hotel booking OR travel itinerary OR boarding pass)'
      ].join(' ');

      console.log('Searching Gmail with query:', searchQuery);

      // Search for emails
      const searchResponse = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults
      });

      const messages = searchResponse.data.messages || [];
      console.log(`Found ${messages.length} potential travel emails`);

      // Process emails in parallel batches to avoid rate limits
      const batchSize = 10;
      const emailBatches = [];
      
      for (let i = 0; i < messages.length; i += batchSize) {
        emailBatches.push(messages.slice(i, i + batchSize));
      }

      const allEmails: EmailData[] = [];
      
      for (const batch of emailBatches) {
        const batchPromises = batch.map(message => this.getEmailDetails(message.id!));
        const batchEmails = await Promise.all(batchPromises);
        allEmails.push(...batchEmails.filter(email => email !== null) as EmailData[]);
        
        // Add small delay between batches to respect rate limits
        if (emailBatches.indexOf(batch) < emailBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return allEmails;
    } catch (error) {
      console.error('Error scanning Gmail:', error);
      throw error;
    }
  }

  private async getEmailDetails(messageId: string): Promise<EmailData | null> {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const headers = message.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      // Extract email body
      const body = this.extractEmailBody(message.data.payload);

      return {
        id: messageId,
        subject,
        from,
        date,
        snippet: message.data.snippet || '',
        body
      };
    } catch (error) {
      console.error(`Error getting email details for ${messageId}:`, error);
      return null;
    }
  }

  private extractEmailBody(payload: any): string {
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          // Fallback to HTML if no plain text
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          // Recursively check nested parts
          body += this.extractEmailBody(part);
        }
      }
    }

    return body;
  }

  async getRecentEmails(days = 30): Promise<EmailData[]> {
    try {
      const date = new Date();
      date.setDate(date.getDate() - days);
      const after = Math.floor(date.getTime() / 1000);

      const searchQuery = `after:${after} (flight OR hotel OR booking OR confirmation OR itinerary OR reservation OR travel)`;

      const searchResponse = await this.gmail.users.messages.list({
        userId: 'me',
        q: searchQuery,
        maxResults: 100
      });

      const messages = searchResponse.data.messages || [];
      
      // Process in smaller batches
      const emails: EmailData[] = [];
      const batchSize = 5;
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchPromises = batch.map(message => this.getEmailDetails(message.id!));
        const batchEmails = await Promise.all(batchPromises);
        emails.push(...batchEmails.filter(email => email !== null) as EmailData[]);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      return emails;
    } catch (error) {
      console.error('Error getting recent emails:', error);
      throw error;
    }
  }
}