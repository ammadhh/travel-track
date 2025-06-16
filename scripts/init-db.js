const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database');
const dbFile = path.join(dbPath, 'travel_tracker.db');

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database.');
});

const createTables = `
-- Users table for OAuth authentication
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  access_token TEXT,
  refresh_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trips table for travel data
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('flight', 'hotel', 'car_rental', 'vacation_rental', 'other')),
  
  -- Flight-specific fields
  airline TEXT,
  flight_number TEXT,
  aircraft_type TEXT,
  departure_airport TEXT,
  departure_airport_code TEXT,
  arrival_airport TEXT,
  arrival_airport_code TEXT,
  departure_date TEXT,
  departure_time TEXT,
  arrival_date TEXT,
  arrival_time TEXT,
  duration TEXT,
  seat_number TEXT,
  seat_class TEXT,
  
  -- Hotel-specific fields
  hotel_name TEXT,
  hotel_address TEXT,
  check_in_date TEXT,
  check_out_date TEXT,
  room_type TEXT,
  guests INTEGER,
  
  -- Common fields
  origin_city TEXT,
  destination_city TEXT,
  origin_country TEXT,
  destination_country TEXT,
  booking_reference TEXT,
  confirmation_number TEXT,
  passenger_name TEXT,
  cost REAL,
  currency TEXT DEFAULT 'USD',
  booking_date TEXT,
  
  -- Metadata
  confidence_score REAL,
  raw_email_content TEXT,
  parsed_data TEXT, -- JSON string of all extracted data
  processing_logs TEXT, -- JSON string of processing information
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Email processing log
CREATE TABLE IF NOT EXISTS email_processing_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email_id TEXT NOT NULL,
  email_subject TEXT,
  email_from TEXT,
  email_date TEXT,
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  trips_found INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_type ON trips(type);
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_email_log_user_id ON email_processing_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_processing_log(processing_status);
`;

db.exec(createTables, (err) => {
  if (err) {
    console.error('Error creating tables:', err.message);
  } else {
    console.log('Database tables created successfully.');
  }
  
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});