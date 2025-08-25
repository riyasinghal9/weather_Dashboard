const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../weather.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // Create cities table for user preferences
    const createCitiesTable = `
      CREATE TABLE IF NOT EXISTS user_cities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, country)
      )
    `;

    // Create weather cache table
    const createCacheTable = `
      CREATE TABLE IF NOT EXISTS weather_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city_key TEXT NOT NULL UNIQUE,
        current_weather TEXT NOT NULL,
        forecast_data TEXT NOT NULL,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL
      )
    `;

    // Create API usage tracking table
    const createUsageTable = `
      CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        response_time INTEGER
      )
    `;

    db.serialize(() => {
      db.run(createCitiesTable)
        .run(createCacheTable)
        .run(createUsageTable, (err) => {
          if (err) {
            console.error('Error creating tables:', err);
            reject(err);
          } else {
            console.log('✅ Database tables initialized');
            
            // Insert default cities if table is empty
            insertDefaultCities()
              .then(() => resolve())
              .catch(reject);
          }
        });
    });
  });
};

// Insert default cities for demo purposes
const insertDefaultCities = () => {
  return new Promise((resolve, reject) => {
    const defaultCities = [
      { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
      { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
      { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
      { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 }
    ];

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO user_cities (name, country, lat, lon) 
      VALUES (?, ?, ?, ?)
    `);

    let completed = 0;
    defaultCities.forEach(city => {
      insertStmt.run([city.name, city.country, city.lat, city.lon], (err) => {
        if (err) {
          console.error('Error inserting default city:', err);
        }
        completed++;
        if (completed === defaultCities.length) {
          insertStmt.finalize();
          console.log('✅ Default cities inserted');
          resolve();
        }
      });
    });
  });
};

// Database query helpers
const dbHelpers = {
  // Get all user cities
  getUserCities: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM user_cities ORDER BY added_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Add a new city
  addUserCity: (name, country, lat, lon) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare('INSERT INTO user_cities (name, country, lat, lon) VALUES (?, ?, ?, ?)');
      stmt.run([name, country, lat, lon], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, country, lat, lon });
      });
      stmt.finalize();
    });
  },

  // Remove a city
  removeUserCity: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM user_cities WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },

  // Get cached weather data
  getCachedWeather: (cityKey) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM weather_cache WHERE city_key = ? AND expires_at > datetime("now")',
        [cityKey],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  // Cache weather data
  cacheWeather: (cityKey, currentWeather, forecastData, expiresAt) => {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO weather_cache (city_key, current_weather, forecast_data, expires_at) 
        VALUES (?, ?, ?, ?)
      `);
      stmt.run([cityKey, JSON.stringify(currentWeather), JSON.stringify(forecastData), expiresAt], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      stmt.finalize();
    });
  },

  // Log API usage
  logApiUsage: (endpoint, ipAddress, responseTime) => {
    db.run(
      'INSERT INTO api_usage (endpoint, ip_address, response_time) VALUES (?, ?, ?)',
      [endpoint, ipAddress, responseTime]
    );
  },

  // Clean expired cache entries
  cleanExpiredCache: () => {
    db.run('DELETE FROM weather_cache WHERE expires_at <= datetime("now")');
  }
};

module.exports = {
  db,
  initializeDatabase,
  ...dbHelpers
}; 