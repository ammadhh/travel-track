-- Create travel_trips table
CREATE TABLE IF NOT EXISTS travel_trips (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('flight', 'hotel', 'car', 'train')),
    origin TEXT,
    destination TEXT,
    departure_date DATE,
    arrival_date DATE,
    departure_time TIME,
    arrival_time TIME,
    airline TEXT,
    flight_number TEXT,
    booking_reference TEXT,
    passenger_name TEXT,
    cost DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    duration TEXT,
    seat_number TEXT,
    email_id TEXT,
    confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create travel_locations table
CREATE TABLE IF NOT EXISTS travel_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    airport_code TEXT,
    airport_name TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create email_processing_log table
CREATE TABLE IF NOT EXISTS email_processing_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id TEXT UNIQUE NOT NULL,
    subject TEXT,
    sender TEXT,
    processed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_status TEXT CHECK (processing_status IN ('pending', 'processed', 'failed')),
    ai_confidence DECIMAL(3,2),
    extracted_data TEXT, -- JSON string
    error_message TEXT
);

-- Insert sample locations
INSERT OR IGNORE INTO travel_locations (city, country, airport_code, airport_name, latitude, longitude, timezone) VALUES
('New York', 'United States', 'JFK', 'John F. Kennedy International Airport', 40.6413, -73.7781, 'America/New_York'),
('London', 'United Kingdom', 'LHR', 'Heathrow Airport', 51.4700, -0.4543, 'Europe/London'),
('Paris', 'France', 'CDG', 'Charles de Gaulle Airport', 49.0097, 2.5479, 'Europe/Paris'),
('Tokyo', 'Japan', 'NRT', 'Narita International Airport', 35.7720, 140.3929, 'Asia/Tokyo'),
('Los Angeles', 'United States', 'LAX', 'Los Angeles International Airport', 33.9425, -118.4081, 'America/Los_Angeles'),
('Seoul', 'South Korea', 'ICN', 'Incheon International Airport', 37.4602, 126.4407, 'Asia/Seoul');

-- Insert sample trips
INSERT OR IGNORE INTO travel_trips (
    id, type, origin, destination, departure_date, airline, flight_number, 
    cost, booking_reference, passenger_name, confidence
) VALUES
('trip_001', 'flight', 'New York', 'London', '2024-03-15', 'Delta Air Lines', 'DL142', 1250.00, 'ABC123', 'John Doe', 0.96),
('trip_002', 'flight', 'London', 'Paris', '2024-03-20', 'Air France', 'AF1234', 180.00, 'DEF456', 'John Doe', 0.94),
('trip_003', 'flight', 'Paris', 'Tokyo', '2024-04-02', 'Japan Airlines', 'JL416', 1800.00, 'GHI789', 'John Doe', 0.98);
