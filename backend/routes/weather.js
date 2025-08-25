const express = require('express');
const weatherService = require('../services/weatherService');
const { logApiUsage } = require('../config/database');

const router = express.Router();

// Middleware to log API usage
const logUsage = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logApiUsage(req.originalUrl, req.ip, responseTime);
  });
  next();
};

router.use(logUsage);

// Get current weather for a city
router.get('/current/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates', 
        message: 'Latitude and longitude must be valid numbers' 
      });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        error: 'Invalid latitude', 
        message: 'Latitude must be between -90 and 90' 
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid longitude', 
        message: 'Longitude must be between -180 and 180' 
      });
    }

    const weather = await weatherService.getCurrentWeather(latitude, longitude);
    res.json({
      success: true,
      data: weather,
      cached: false // This could be enhanced to show cache status
    });
  } catch (error) {
    console.error('Error in /current route:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data',
      message: error.message
    });
  }
});

// Get 5-day forecast for a city
router.get('/forecast/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates', 
        message: 'Latitude and longitude must be valid numbers' 
      });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        error: 'Invalid latitude', 
        message: 'Latitude must be between -90 and 90' 
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid longitude', 
        message: 'Longitude must be between -180 and 180' 
      });
    }

    const forecast = await weatherService.getForecast(latitude, longitude);
    res.json({
      success: true,
      data: forecast,
      cached: false // This could be enhanced to show cache status
    });
  } catch (error) {
    console.error('Error in /forecast route:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch forecast data',
      message: error.message
    });
  }
});

// Get complete weather data (current + forecast) - optimized endpoint
router.get('/complete/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    
    // Validate coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates', 
        message: 'Latitude and longitude must be valid numbers' 
      });
    }
    
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ 
        error: 'Invalid latitude', 
        message: 'Latitude must be between -90 and 90' 
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ 
        error: 'Invalid longitude', 
        message: 'Longitude must be between -180 and 180' 
      });
    }

    const weatherData = await weatherService.getCompleteWeatherData(latitude, longitude);
    res.json({
      success: true,
      data: weatherData,
      cached: false // This could be enhanced to show cache status
    });
  } catch (error) {
    console.error('Error in /complete route:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch complete weather data',
      message: error.message
    });
  }
});

// Search for cities
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 5 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Invalid query', 
        message: 'Search query must be at least 2 characters long' 
      });
    }
    
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
      return res.status(400).json({ 
        error: 'Invalid limit', 
        message: 'Limit must be a number between 1 and 20' 
      });
    }

    const cities = await weatherService.searchCities(query.trim(), limitNum);
    res.json({
      success: true,
      data: cities,
      query: query.trim(),
      count: cities.length
    });
  } catch (error) {
    console.error('Error in /search route:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search cities',
      message: error.message
    });
  }
});

// Get weather for multiple cities at once
router.post('/batch', async (req, res) => {
  try {
    const { cities } = req.body;
    
    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Cities array is required and must not be empty'
      });
    }
    
    if (cities.length > 10) {
      return res.status(400).json({
        error: 'Too many cities',
        message: 'Maximum 10 cities allowed per batch request'
      });
    }
    
    // Validate each city has required coordinates
    for (const city of cities) {
      if (!city.lat || !city.lon || isNaN(city.lat) || isNaN(city.lon)) {
        return res.status(400).json({
          error: 'Invalid city data',
          message: 'Each city must have valid lat and lon coordinates'
        });
      }
    }
    
    // Fetch weather data for all cities in parallel
    const weatherPromises = cities.map(async (city) => {
      try {
        const weatherData = await weatherService.getCompleteWeatherData(city.lat, city.lon);
        return {
          success: true,
          cityId: city.id,
          data: weatherData
        };
      } catch (error) {
        return {
          success: false,
          cityId: city.id,
          error: error.message
        };
      }
    });
    
    const results = await Promise.all(weatherPromises);
    
    res.json({
      success: true,
      data: results,
      totalCities: cities.length,
      successfulCities: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('Error in /batch route:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batch weather data',
      message: error.message
    });
  }
});

module.exports = router; 