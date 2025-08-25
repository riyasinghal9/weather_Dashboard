import React, { useState } from 'react';
import { Cloud, Sun, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import CityList from './components/CityList';
import WeatherDisplay from './components/WeatherDisplay';
import AddCityModal from './components/AddCityModal';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { useCitiesWithWeather } from './hooks/useWeather';

function App() {
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [showAddCityModal, setShowAddCityModal] = useState(false);
  
  const { 
    data: cities, 
    isLoading, 
    error, 
    refetch 
  } = useCitiesWithWeather();

  // Select first city by default when cities load
  React.useEffect(() => {
    if (cities && cities.length > 0 && !selectedCityId) {
      setSelectedCityId(cities[0].id);
    }
  }, [cities, selectedCityId]);

  const selectedCity = cities?.find(city => city.id === selectedCityId);

  const handleCitySelect = (cityId) => {
    setSelectedCityId(cityId);
  };

  const handleAddCity = () => {
    setShowAddCityModal(true);
  };

  const handleCityAdded = () => {
    setShowAddCityModal(false);
    refetch(); // Refresh the cities list
  };

  const handleDeleteCity = () => {
    // If the selected city was deleted, select the first available city
    if (cities && cities.length > 0) {
      const remainingCities = cities.filter(city => city.id !== selectedCityId);
      if (remainingCities.length > 0) {
        setSelectedCityId(remainingCities[0].id);
      } else {
        setSelectedCityId(null);
      }
    }
    refetch(); // Refresh the cities list
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            Unable to load weather data. Please try again later.
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header onAddCity={handleAddCity} />
        
        <main className="container mx-auto px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <LoadingSpinner size="large" />
            </div>
          ) : cities && cities.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* City List Sidebar */}
              <div className="lg:col-span-1">
                <CityList
                  cities={cities}
                  selectedCityId={selectedCityId}
                  onCitySelect={handleCitySelect}
                  onAddCity={handleAddCity}
                  onDeleteCity={handleDeleteCity}
                />
              </div>

              {/* Main Weather Display */}
              <div className="lg:col-span-3">
                {selectedCity ? (
                  <WeatherDisplay city={selectedCity} />
                ) : (
                  <div className="flex items-center justify-center h-96 weather-card">
                    <div className="text-center text-gray-500">
                      <Cloud className="mx-auto h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg">Select a city to view weather details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty state when no cities are added
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="relative mb-6">
                  <Cloud className="mx-auto h-24 w-24 text-gray-300" />
                  <Sun className="absolute top-2 right-8 h-8 w-8 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Weather Dashboard
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Get started by adding your first city to see current weather 
                  and 5-day forecasts.
                </p>
                <button
                  onClick={handleAddCity}
                  className="btn-primary text-lg px-6 py-3"
                >
                  Add Your First City
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Add City Modal */}
        {showAddCityModal && (
          <AddCityModal
            onClose={() => setShowAddCityModal(false)}
            onCityAdded={handleCityAdded}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App; 