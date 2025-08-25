import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Eye, 
  Gauge,
  Sunrise,
  Sunset,
  Calendar,
  AlertCircle 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useCityWeather } from '../hooks/useWeather';
import LoadingSpinner from './LoadingSpinner';

const WeatherDisplay = ({ city }) => {
  const { data: weatherData, isLoading, error } = useCityWeather(city.id);

  if (isLoading) {
    return (
      <div className="weather-card p-8 h-96 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading weather data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-card p-8 h-96 flex items-center justify-center">
        <div className="text-center text-red-500">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">Weather data unavailable</h3>
          <p className="text-sm text-gray-600">Unable to load weather for {city.name}</p>
        </div>
      </div>
    );
  }

  if (!weatherData?.weather) {
    return (
      <div className="weather-card p-8 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <AlertCircle className="mx-auto h-12 w-12 mb-4" />
          <p>No weather data available</p>
        </div>
      </div>
    );
  }

  const { current, forecast } = weatherData.weather;

  const getWeatherIcon = (iconCode) => {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return iconMap[iconCode] || '🌤️';
  };

  const getWeatherBackground = (weatherMain, icon) => {
    if (icon?.includes('n')) return 'weather-gradient-night';
    
    switch (weatherMain) {
      case 'Clear': return 'weather-gradient-sunny';
      case 'Clouds': return 'weather-gradient-cloudy';
      case 'Rain':
      case 'Drizzle':
      case 'Thunderstorm': return 'weather-gradient-rainy';
      default: return 'weather-gradient';
    }
  };

  const formatTime = (isoString) => {
    try {
      return format(parseISO(isoString), 'h:mm a');
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'EEE, MMM d');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Weather Card */}
      <div className={`${getWeatherBackground(current.weather.main, current.weather.icon)} rounded-lg p-8 text-white`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">{current.location.name}</h2>
            <p className="text-lg opacity-90">{current.location.country}</p>
            <p className="text-sm opacity-75">
              {format(parseISO(current.timestamp), 'EEEE, MMMM d, yyyy • h:mm a')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl mb-2">
              {getWeatherIcon(current.weather.icon)}
            </div>
            <p className="text-lg font-medium capitalize">
              {current.weather.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Temperature */}
          <div>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="temperature-large">{current.temperature.current}°</span>
              <span className="text-2xl opacity-75">C</span>
            </div>
            <div className="space-y-1 text-sm opacity-90">
              <p>Feels like {current.temperature.feelsLike}°C</p>
              <p>High {current.temperature.max}°C • Low {current.temperature.min}°C</p>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Droplets className="h-4 w-4" />
              <span>{current.details.humidity}% humidity</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="h-4 w-4" />
              <span>{current.details.windSpeed} km/h</span>
            </div>
            <div className="flex items-center space-x-2">
              <Gauge className="h-4 w-4" />
              <span>{current.details.pressure} mb</span>
            </div>
            {current.details.visibility && (
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>{current.details.visibility} km</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Sunrise className="h-4 w-4" />
              <span>{formatTime(current.sun.sunrise)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sunset className="h-4 w-4" />
              <span>{formatTime(current.sun.sunset)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      {forecast && forecast.forecast && (
        <div className="weather-card p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-900">5-Day Forecast</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {forecast.forecast.map((day, index) => (
              <div 
                key={day.date}
                className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors duration-200"
              >
                <p className="font-medium text-gray-900 mb-2">
                  {index === 0 ? 'Today' : formatDate(day.date)}
                </p>
                
                <div className="text-3xl mb-2">
                  {getWeatherIcon(day.weather.icon)}
                </div>
                
                <p className="text-sm text-gray-600 mb-3 capitalize">
                  {day.weather.description}
                </p>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      {day.temperature.max}°
                    </span>
                    <span className="text-sm text-gray-500">
                      {day.temperature.min}°
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Droplets className="h-3 w-3" />
                      <span>{day.details.humidity}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Wind className="h-3 w-3" />
                      <span>{day.details.windSpeed}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay; 