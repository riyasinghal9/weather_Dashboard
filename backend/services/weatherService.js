const axios = require('axios');
const { getCachedWeather, cacheWeather, cleanExpiredCache } = require('../config/database');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5';
    this.weatherCacheDuration = parseInt(process.env.WEATHER_CACHE_DURATION) || 30; // minutes
    this.forecastCacheDuration = parseInt(process.env.FORECAST_CACHE_DURATION) || 180; // minutes
    
    if (!this.apiKey) {
      console.warn('⚠️  OpenWeatherMap API key not found. Please set OPENWEATHER_API_KEY environment variable.');
    }

    // Clean expired cache every hour
    setInterval(() => {
      cleanExpiredCache();
    }, 60 * 60 * 1000);
  }

  // Generate cache key for a city
  generateCacheKey(lat, lon) {
    return `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  }

  // Get current weather for a city
  async getCurrentWeather(lat, lon) {
    try {
      const cacheKey = this.generateCacheKey(lat, lon);
      
      // Check cache first
      const cached = await getCachedWeather(cacheKey);
      if (cached) {
        console.log('📋 Returning cached current weather data');
        return JSON.parse(cached.current_weather);
      }

      console.log('🌐 Fetching current weather from API');
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        },
        timeout: 10000
      });

      const weatherData = this.formatCurrentWeather(response.data);
      
      // Cache the data (we'll cache both current and forecast together when forecast is fetched)
      return weatherData;
    } catch (error) {
      console.error('Error fetching current weather:', error.message);
      throw this.handleWeatherError(error);
    }
  }

  // Get 5-day forecast for a city
  async getForecast(lat, lon) {
    try {
      const cacheKey = this.generateCacheKey(lat, lon);
      
      // Check cache first
      const cached = await getCachedWeather(cacheKey);
      if (cached) {
        console.log('📋 Returning cached forecast data');
        return JSON.parse(cached.forecast_data);
      }

      console.log('🌐 Fetching forecast from API');
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          lat,
          lon,
          appid: this.apiKey,
          units: 'metric'
        },
        timeout: 10000
      });

      const forecastData = this.formatForecast(response.data);
      return forecastData;
    } catch (error) {
      console.error('Error fetching forecast:', error.message);
      throw this.handleWeatherError(error);
    }
  }

  // Get both current weather and forecast (optimized with caching)
  async getCompleteWeatherData(lat, lon) {
    try {
      const cacheKey = this.generateCacheKey(lat, lon);
      
      // Check cache first
      const cached = await getCachedWeather(cacheKey);
      if (cached) {
        console.log('📋 Returning complete cached weather data');
        return {
          current: JSON.parse(cached.current_weather),
          forecast: JSON.parse(cached.forecast_data)
        };
      }

      console.log('🌐 Fetching complete weather data from API');
      
      // Fetch both current weather and forecast in parallel
      const [currentResponse, forecastResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/weather`, {
          params: { lat, lon, appid: this.apiKey, units: 'metric' },
          timeout: 10000
        }),
        axios.get(`${this.baseUrl}/forecast`, {
          params: { lat, lon, appid: this.apiKey, units: 'metric' },
          timeout: 10000
        })
      ]);

      const currentWeather = this.formatCurrentWeather(currentResponse.data);
      const forecastData = this.formatForecast(forecastResponse.data);

      // Cache the data for future requests
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.weatherCacheDuration);
      
      await cacheWeather(
        cacheKey, 
        currentWeather, 
        forecastData, 
        expiresAt.toISOString()
      );

      return {
        current: currentWeather,
        forecast: forecastData
      };
    } catch (error) {
      console.error('Error fetching complete weather data:', error.message);
      throw this.handleWeatherError(error);
    }
  }

  // Search for cities by name
  async searchCities(query, limit = 5) {
    try {
      console.log(`🔍 Searching for cities: ${query}`);
      const response = await axios.get(`http://api.openweathermap.org/geo/1.0/direct`, {
        params: {
          q: query,
          limit,
          appid: this.apiKey
        },
        timeout: 10000
      });

      return response.data.map(city => ({
        name: city.name,
        country: city.country,
        state: city.state,
        lat: city.lat,
        lon: city.lon,
        displayName: `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`
      }));
    } catch (error) {
      console.error('Error searching cities:', error.message);
      throw this.handleWeatherError(error);
    }
  }

  // Format current weather data
  formatCurrentWeather(data) {
    return {
      location: {
        name: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      weather: {
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      },
      temperature: {
        current: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        min: Math.round(data.main.temp_min),
        max: Math.round(data.main.temp_max)
      },
      details: {
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        windSpeed: data.wind ? Math.round(data.wind.speed * 3.6) : 0, // Convert m/s to km/h
        windDirection: data.wind ? data.wind.deg : 0,
        cloudiness: data.clouds.all
      },
      sun: {
        sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
        sunset: new Date(data.sys.sunset * 1000).toISOString()
      },
      timestamp: new Date(data.dt * 1000).toISOString()
    };
  }

  // Format forecast data (5-day forecast with 3-hour intervals)
  formatForecast(data) {
    const dailyForecasts = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!dailyForecasts[dateKey]) {
        dailyForecasts[dateKey] = {
          date: dateKey,
          temperatures: [],
          weather: [],
          details: {
            humidity: [],
            pressure: [],
            windSpeed: []
          }
        };
      }
      
      dailyForecasts[dateKey].temperatures.push(item.main.temp);
      dailyForecasts[dateKey].weather.push({
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        time: date.toISOString()
      });
      dailyForecasts[dateKey].details.humidity.push(item.main.humidity);
      dailyForecasts[dateKey].details.pressure.push(item.main.pressure);
      dailyForecasts[dateKey].details.windSpeed.push(item.wind ? item.wind.speed * 3.6 : 0);
    });

    // Process daily summaries
    const forecast = Object.values(dailyForecasts).slice(0, 5).map(day => {
      const temps = day.temperatures;
      const mostCommonWeather = this.getMostCommonWeather(day.weather);
      
      return {
        date: day.date,
        weather: mostCommonWeather,
        temperature: {
          min: Math.round(Math.min(...temps)),
          max: Math.round(Math.max(...temps)),
          avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
        },
        details: {
          humidity: Math.round(day.details.humidity.reduce((a, b) => a + b, 0) / day.details.humidity.length),
          pressure: Math.round(day.details.pressure.reduce((a, b) => a + b, 0) / day.details.pressure.length),
          windSpeed: Math.round(day.details.windSpeed.reduce((a, b) => a + b, 0) / day.details.windSpeed.length)
        },
        hourlyData: day.weather
      };
    });

    return {
      city: {
        name: data.city.name,
        country: data.city.country,
        lat: data.city.coord.lat,
        lon: data.city.coord.lon
      },
      forecast
    };
  }

  // Get most common weather condition for a day
  getMostCommonWeather(weatherArray) {
    const weatherCount = {};
    weatherArray.forEach(w => {
      const key = w.main;
      weatherCount[key] = (weatherCount[key] || 0) + 1;
    });
    
    const mostCommon = Object.keys(weatherCount).reduce((a, b) => 
      weatherCount[a] > weatherCount[b] ? a : b
    );
    
    return weatherArray.find(w => w.main === mostCommon);
  }

  // Handle API errors
  handleWeatherError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        case 404:
          return new Error('Location not found. Please check the coordinates.');
        case 429:
          return new Error('API rate limit exceeded. Please try again later.');
        case 500:
        case 502:
        case 503:
          return new Error('Weather service temporarily unavailable. Please try again later.');
        default:
          return new Error(`Weather API error: ${error.response.data?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new Error('Unable to connect to weather service. Please check your internet connection.');
    }
    
    return new Error('Failed to fetch weather data. Please try again later.');
  }
}

module.exports = new WeatherService(); 