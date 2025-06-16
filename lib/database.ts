import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'travel_tracker.db');

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  close(): void {
    this.db.close();
  }
}

// User operations
export async function createUser(userData: {
  google_id: string;
  email: string;
  name?: string;
  picture?: string;
  access_token?: string;
  refresh_token?: string;
}) {
  const db = new Database();
  try {
    const result = await db.run(`
      INSERT OR REPLACE INTO users (google_id, email, name, picture, access_token, refresh_token, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [userData.google_id, userData.email, userData.name, userData.picture, userData.access_token, userData.refresh_token]);
    return result.lastID;
  } finally {
    db.close();
  }
}

export async function getUserByGoogleId(googleId: string) {
  const db = new Database();
  try {
    return await db.get(`SELECT * FROM users WHERE google_id = ?`, [googleId]);
  } finally {
    db.close();
  }
}

export async function getUserByEmail(email: string) {
  const db = new Database();
  try {
    return await db.get(`SELECT * FROM users WHERE email = ?`, [email]);
  } finally {
    db.close();
  }
}

export async function updateUserTokens(userId: number, accessToken: string, refreshToken?: string) {
  const db = new Database();
  try {
    await db.run(`
      UPDATE users 
      SET access_token = ?, refresh_token = COALESCE(?, refresh_token), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [accessToken, refreshToken, userId]);
  } finally {
    db.close();
  }
}

// Trip operations
export async function createTrip(tripData: {
  user_id: number;
  email_id?: string;
  type: string;
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
  hotel_name?: string;
  hotel_address?: string;
  check_in_date?: string;
  check_out_date?: string;
  room_type?: string;
  guests?: number;
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
  confidence_score?: number;
  raw_email_content?: string;
  parsed_data?: string;
  processing_logs?: string;
}) {
  const db = new Database();
  try {
    const fields = Object.keys(tripData).join(', ');
    const placeholders = Object.keys(tripData).map(() => '?').join(', ');
    const values = Object.values(tripData);

    const result = await db.run(`
      INSERT INTO trips (${fields})
      VALUES (${placeholders})
    `, values);
    return result.lastID;
  } finally {
    db.close();
  }
}

export async function getTripsByUserId(userId: number) {
  const db = new Database();
  try {
    return await db.all(`
      SELECT * FROM trips 
      WHERE user_id = ? 
      ORDER BY departure_date DESC, check_in_date DESC, created_at DESC
    `, [userId]);
  } finally {
    db.close();
  }
}

export async function checkDuplicateTrip(userId: number, emailId: string, bookingReference?: string) {
  const db = new Database();
  try {
    let query = `SELECT id FROM trips WHERE user_id = ? AND email_id = ?`;
    let params = [userId, emailId];
    
    if (bookingReference) {
      query += ` OR (user_id = ? AND booking_reference = ?)`;
      params.push(userId, bookingReference);
    }
    
    return await db.get(query, params);
  } finally {
    db.close();
  }
}

export async function deleteTrip(tripId: number, userId: number) {
  const db = new Database();
  try {
    // First check if the trip exists and belongs to the user
    const trip = await db.get(`SELECT id FROM trips WHERE id = ? AND user_id = ?`, [tripId, userId]);
    if (!trip) {
      return false;
    }

    // Delete the trip
    await db.run(`DELETE FROM trips WHERE id = ? AND user_id = ?`, [tripId, userId]);
    return true;
  } finally {
    db.close();
  }
}

// Email processing log operations
export async function createEmailProcessingLog(logData: {
  user_id: number;
  email_id: string;
  email_subject?: string;
  email_from?: string;
  email_date?: string;
  processing_status: string;
  error_message?: string;
  trips_found?: number;
  processing_time_ms?: number;
}) {
  const db = new Database();
  try {
    const fields = Object.keys(logData).join(', ');
    const placeholders = Object.keys(logData).map(() => '?').join(', ');
    const values = Object.values(logData);

    const result = await db.run(`
      INSERT INTO email_processing_log (${fields})
      VALUES (${placeholders})
    `, values);
    return result.lastID;
  } finally {
    db.close();
  }
}

export async function updateEmailProcessingLog(logId: number, updates: {
  processing_status?: string;
  error_message?: string;
  trips_found?: number;
  processing_time_ms?: number;
}) {
  const db = new Database();
  try {
    const setFields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), logId];

    await db.run(`
      UPDATE email_processing_log 
      SET ${setFields}
      WHERE id = ?
    `, values);
  } finally {
    db.close();
  }
}

export async function getEmailProcessingLogsByUserId(userId: number) {
  const db = new Database();
  try {
    return await db.all(`
      SELECT * FROM email_processing_log 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);
  } finally {
    db.close();
  }
}