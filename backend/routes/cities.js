const express = require('express');
const { getUserCities, addUserCity, removeUserCity } = require('../config/database');
const weatherService = require('../services/weatherService');

const router = express.Router();

// Get all user cities
router.get('/', async (req, res) => {
  try {
    const cities = await getUserCities();
    res.json({
      success: true,
      data: cities,
      count: cities.length
    });
  } catch (error) {
    console.error('Error fetching user cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities',
      message: error.message
    });
  }
});

// Add a new city
router.post('/', async (req, res) => {
  try {
    const { name, country, lat, lon } = req.body;
    
    // Validate required fields
    if (!name || !country || lat === undefined || lon === undefined) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, country, lat, and lon are required'
      });
    }
    
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
    
    // Validate name and country
    if (name.trim().length < 1 || name.trim().length > 100) {
      return res.status(400).json({
        error: 'Invalid name',
        message: 'City name must be between 1 and 100 characters'
      });
    }
    
    if (country.trim().length < 2 || country.trim().length > 3) {
      return res.status(400).json({
        error: 'Invalid country',
        message: 'Country code must be 2-3 characters'
      });
    }
    
    // Verify the city exists by testing weather API
    try {
      await weatherService.getCurrentWeather(latitude, longitude);
    } catch (weatherError) {
      return res.status(400).json({
        error: 'Invalid location',
        message: 'Unable to fetch weather data for this location. Please verify coordinates.'
      });
    }
    
    const city = await addUserCity(
      name.trim(), 
      country.trim().toUpperCase(), 
      latitude, 
      longitude
    );
    
    res.status(201).json({
      success: true,
      data: city,
      message: 'City added successfully'
    });
  } catch (error) {
    console.error('Error adding city:', error);
    
    // Handle duplicate city error
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        success: false,
        error: 'City already exists',
        message: 'This city is already in your list'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to add city',
      message: error.message
    });
  }
});

// Remove a city
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    const cityId = parseInt(id);
    if (isNaN(cityId) || cityId < 1) {
      return res.status(400).json({
        error: 'Invalid city ID',
        message: 'City ID must be a positive number'
      });
    }
    
    const changes = await removeUserCity(cityId);
    
    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'City not found',
        message: 'No city found with the specified ID'
      });
    }
    
    res.json({
      success: true,
      message: 'City removed successfully',
      deletedId: cityId
    });
  } catch (error) {
    console.error('Error removing city:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove city',
      message: error.message
    });
  }
});

// Search and add city in one step
router.post('/search-and-add', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    // Search for cities
    const cities = await weatherService.searchCities(query.trim(), 5);
    
    if (cities.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No cities found',
        message: 'No cities found matching your search query'
      });
    }
    
    res.json({
      success: true,
      data: cities,
      message: 'Cities found. Select one to add to your list.',
      count: cities.length
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search cities',
      message: error.message
    });
  }
});

// Get cities with current weather (dashboard endpoint)
router.get('/with-weather', async (req, res) => {
  try {
    const cities = await getUserCities();
    
    if (cities.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No cities added yet'
      });
    }
    
    // Fetch current weather for all cities
    const weatherPromises = cities.map(async (city) => {
      try {
        const weather = await weatherService.getCurrentWeather(city.lat, city.lon);
        return {
          ...city,
          weather: weather,
          hasWeather: true
        };
      } catch (error) {
        console.error(`Error fetching weather for ${city.name}:`, error.message);
        return {
          ...city,
          weather: null,
          hasWeather: false,
          weatherError: error.message
        };
      }
    });
    
    const citiesWithWeather = await Promise.all(weatherPromises);
    
    res.json({
      success: true,
      data: citiesWithWeather,
      count: citiesWithWeather.length,
      successfulWeather: citiesWithWeather.filter(c => c.hasWeather).length
    });
  } catch (error) {
    console.error('Error fetching cities with weather:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cities with weather data',
      message: error.message
    });
  }
});

// Get detailed weather for a specific city
router.get('/:id/weather', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    const cityId = parseInt(id);
    if (isNaN(cityId) || cityId < 1) {
      return res.status(400).json({
        error: 'Invalid city ID',
        message: 'City ID must be a positive number'
      });
    }
    
    // Get city from database
    const cities = await getUserCities();
    const city = cities.find(c => c.id === cityId);
    
    if (!city) {
      return res.status(404).json({
        success: false,
        error: 'City not found',
        message: 'No city found with the specified ID'
      });
    }
    
    // Get complete weather data
    const weatherData = await weatherService.getCompleteWeatherData(city.lat, city.lon);
    
    res.json({
      success: true,
      data: {
        city: city,
        weather: weatherData
      }
    });
  } catch (error) {
    console.error('Error fetching city weather:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather data for city',
      message: error.message
    });
  }
});

module.exports = router; 