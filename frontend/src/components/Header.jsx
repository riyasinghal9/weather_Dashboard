import React from 'react';
import { Cloud, Plus, RefreshCw } from 'lucide-react';
import { useRefreshWeather } from '../hooks/useWeather';

const Header = ({ onAddCity }) => {
  const { refreshAll } = useRefreshWeather();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshAll();
    // Show refresh animation for at least 1 second
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Cloud className="h-8 w-8 text-primary-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full animate-pulse-slow"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Weather Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Current weather and 5-day forecasts
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus-ring"
              title="Refresh weather data"
            >
              <RefreshCw 
                className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Add City Button */}
            <button
              onClick={onAddCity}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 focus-ring"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add City</span>
            </button>
          </div>
        </div>

        {/* Optional: Status indicator */}
        <div className="mt-3 text-xs text-gray-500 flex items-center">
          <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Weather data auto-refreshes every 5 minutes
        </div>
      </div>
    </header>
  );
};

export default Header; 