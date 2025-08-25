import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and error handling
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('Unauthorized access');
    } else if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      console.error('Server error');
    }
    
    return Promise.reject(error);
  }
);

// Weather API endpoints
export const weatherAPI = {
  // Get current weather for a location
  getCurrentWeather: async (lat, lon) => {
    const response = await api.get(`/weather/current/${lat}/${lon}`);
    return response.data;
  },

  // Get 5-day forecast for a location
  getForecast: async (lat, lon) => {
    const response = await api.get(`/weather/forecast/${lat}/${lon}`);
    return response.data;
  },

  // Get complete weather data (current + forecast)
  getCompleteWeather: async (lat, lon) => {
    const response = await api.get(`/weather/complete/${lat}/${lon}`);
    return response.data;
  },

  // Search for cities
  searchCities: async (query, limit = 5) => {
    const response = await api.get(`/weather/search/${encodeURIComponent(query)}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get weather for multiple cities at once
  getBatchWeather: async (cities) => {
    const response = await api.post('/weather/batch', { cities });
    return response.data;
  },
};

// Cities API endpoints
export const citiesAPI = {
  // Get all user cities
  getCities: async () => {
    const response = await api.get('/cities');
    return response.data;
  },

  // Get cities with current weather
  getCitiesWithWeather: async () => {
    const response = await api.get('/cities/with-weather');
    return response.data;
  },

  // Add a new city
  addCity: async (cityData) => {
    const response = await api.post('/cities', cityData);
    return response.data;
  },

  // Remove a city
  removeCity: async (cityId) => {
    const response = await api.delete(`/cities/${cityId}`);
    return response.data;
  },

  // Search for cities to add
  searchAndAdd: async (query) => {
    const response = await api.post('/cities/search-and-add', { query });
    return response.data;
  },

  // Get detailed weather for a specific city
  getCityWeather: async (cityId) => {
    const response = await api.get(`/cities/${cityId}/weather`);
    return response.data;
  },
};

// Utility functions for error handling
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.message || 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication required. Please refresh the page.';
      case 404:
        return data.message || 'Resource not found.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.message || `Error: ${status}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your internet connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

// Health check function
export const checkAPIHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API health check failed');
  }
};

export default api; 