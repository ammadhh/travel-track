# Travel Tracker - Gmail Email Scanning & AI-Powered Travel Data Extraction

A comprehensive travel tracking application that automatically scans Gmail emails using GPT-4o Mini to extract and organize travel information including flights, hotels, and other bookings.

## Features

- **Gmail Integration**: OAuth authentication and email scanning
- **AI-Powered Parsing**: GPT-4o Mini extracts detailed travel information
- **Parallel Processing**: Efficient email processing with rate limiting
- **Real-time Dashboard**: Live updates showing scanning progress
- **Travel Visualization**: Interactive maps and timeline views
- **Data Deduplication**: Prevents duplicate entries
- **Comprehensive Logging**: Detailed processing logs and error handling
- **Privacy-First**: Local SQLite storage, read-only Gmail access

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, SQLite3, Node.js
- **Authentication**: Google OAuth 2.0, JWT
- **AI**: OpenAI GPT-4o Mini
- **Email**: Gmail API
- **Database**: SQLite3 with custom ORM

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

Initialize the SQLite database:

```bash
node scripts/init-db.js
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API and Google OAuth 2.0
4. Create credentials (OAuth 2.0 Client ID)
5. Add authorized redirect URI: `http://localhost:5001/api/auth/callback`
6. Update `.env` file with your credentials

### 4. OpenAI API Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Add it to your `.env` file

### 5. Environment Configuration

Update the `.env` file with your actual credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/callback

# OpenAI Configuration for Email Parsing
OPENAI_API_KEY=your_actual_openai_api_key

# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# Database
DATABASE_PATH=./database/travel_tracker.db
```

### 6. Run the Application

```bash
npm run dev
```

Navigate to `http://localhost:5001`

## Usage

1. **Authentication**: Click "Connect with Google" to authenticate
2. **Email Scanning**: Use "Sync Gmail" to scan for travel emails
3. **View Data**: Browse your trips in the dashboard, map, or timeline views
4. **Monitoring**: Check processing logs to see what emails were scanned

## API Endpoints

### Authentication
- `GET /api/auth/google` - Get OAuth URL
- `GET /api/auth/callback` - OAuth callback handler

### Gmail & AI Processing
- `POST /api/gmail/scan` - Scan Gmail for travel emails
- `POST /api/ai/parse-email` - Parse individual email with AI

### Data Access
- `GET /api/trips` - Get user's trips
- `GET /api/processing-logs` - Get email processing logs

## Features Implemented

✅ **Backend Infrastructure**
- SQLite database with comprehensive schema
- Google OAuth 2.0 authentication
- JWT session management
- Gmail API integration with parallel processing

✅ **AI Email Parsing**
- GPT-4o Mini integration
- Structured data extraction
- Confidence scoring
- Error handling and validation

✅ **Data Management**
- Trip storage and retrieval
- Duplicate detection
- Processing logs
- Data transformation for frontend

✅ **Frontend Integration**
- Real authentication flow
- Live dashboard with real data
- Loading states and error handling
- Processing progress indicators

✅ **Privacy & Security**
- Read-only Gmail access
- Local data storage
- Secure token handling
- Rate limiting and retry logic

## Email Types Supported

The AI parser can extract data from:
- ✈️ Flight confirmations (all major airlines)
- 🏨 Hotel bookings (major chains and booking sites)
- 🚗 Car rental confirmations
- 🏠 Vacation rental bookings (Airbnb, VRBO, etc.)
- 🎫 Travel insurance documents

## Performance

- **Parallel Processing**: Multiple emails processed simultaneously
- **Rate Limiting**: Respects Gmail API limits
- **Caching**: Efficient database queries
- **Batch Operations**: Optimized for large email volumes

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `node scripts/init-db.js` - Initialize database

### Database Schema

The application uses a comprehensive SQLite schema with tables for:
- `users` - OAuth user information
- `trips` - Extracted travel data
- `email_processing_log` - Processing history and logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the processing logs in the dashboard
2. Verify your .env configuration
3. Ensure API keys are valid
4. Check browser console for errors

## Next Steps

Future enhancements could include:
- Calendar integration
- Expense categorization
- Travel statistics and insights
- Email notification system
- Mobile app
- Team/family sharing features