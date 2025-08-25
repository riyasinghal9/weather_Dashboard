import React from 'react';
import { MapPin, Trash2, Thermometer, AlertCircle } from 'lucide-react';
import { useRemoveCity } from '../hooks/useWeather';
import LoadingSpinner from './LoadingSpinner';

const CityList = ({ cities, selectedCityId, onCitySelect, onAddCity, onDeleteCity }) => {
  const removeCity = useRemoveCity();
  const [deletingCityId, setDeletingCityId] = React.useState(null);

  const handleDeleteCity = async (cityId, cityName) => {
    if (!window.confirm(`Remove ${cityName} from your cities?`)) {
      return;
    }

    setDeletingCityId(cityId);
    try {
      await removeCity.mutateAsync(cityId);
      onDeleteCity(cityId);
    } catch (error) {
      console.error('Failed to remove city:', error);
      alert('Failed to remove city. Please try again.');
    } finally {
      setDeletingCityId(null);
    }
  };

  const getWeatherIcon = (weatherMain) => {
    const iconMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return iconMap[weatherMain] || '🌤️';
  };

  const getTemperatureColor = (temp) => {
    if (temp <= 0) return 'text-blue-600';
    if (temp <= 10) return 'text-blue-500';
    if (temp <= 20) return 'text-green-500';
    if (temp <= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (!cities || cities.length === 0) {
    return (
      <div className="weather-card p-6">
        <div className="text-center text-gray-500">
          <MapPin className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="font-medium mb-2">No cities added yet</p>
          <p className="text-sm mb-4">Add your first city to get started</p>
          <button
            onClick={onAddCity}
            className="btn-primary text-sm"
          >
            Add City
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">My Cities</h2>
        <span className="text-sm text-gray-500">
          {cities.length} {cities.length === 1 ? 'city' : 'cities'}
        </span>
      </div>

      <div className="space-y-2">
        {cities.map((city) => (
          <div
            key={city.id}
            className={`weather-card p-4 cursor-pointer transition-all duration-200 ${
              selectedCityId === city.id
                ? 'ring-2 ring-primary-500 bg-primary-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onCitySelect(city.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* City Info */}
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {city.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {city.country}
                    </p>
                  </div>
                </div>

                {/* Weather Info */}
                {city.hasWeather && city.weather ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">
                        {getWeatherIcon(city.weather.weather.main)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {city.weather.weather.description}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Thermometer className="h-4 w-4 text-gray-400" />
                      <span className={`font-semibold ${getTemperatureColor(city.weather.temperature.current)}`}>
                        {city.weather.temperature.current}°C
                      </span>
                    </div>
                  </div>
                ) : city.hasWeather === false ? (
                  <div className="flex items-center space-x-1 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Weather unavailable</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="small" />
                    <span className="text-sm text-gray-500">Loading weather...</span>
                  </div>
                )}
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCity(city.id, city.name);
                }}
                disabled={deletingCityId === city.id}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 focus-ring flex-shrink-0"
                title={`Remove ${city.name}`}
              >
                {deletingCityId === city.id ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add City Button */}
      <button
        onClick={onAddCity}
        className="w-full py-3 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 rounded-lg transition-colors duration-200 text-gray-600 hover:text-primary-600 focus-ring"
      >
        <div className="flex items-center justify-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span className="font-medium">Add Another City</span>
        </div>
      </button>
    </div>
  );
};

export default CityList; 