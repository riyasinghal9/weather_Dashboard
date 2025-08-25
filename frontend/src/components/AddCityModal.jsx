import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Plus, AlertCircle } from 'lucide-react';
import { weatherAPI, citiesAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const AddCityModal = ({ onClose, onCityAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Auto-search with debouncing
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearch(searchQuery.trim());
      }, 500);
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setError('');
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query || query.length < 2) return;

    setIsSearching(true);
    setError('');

    try {
      const response = await weatherAPI.searchCities(query, 8);
      if (response.success) {
        setSearchResults(response.data);
        if (response.data.length === 0) {
          setError('No cities found. Try a different search term.');
        }
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Unable to search cities. Please check your connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCity = async (city) => {
    setIsAdding(true);
    setError('');

    try {
      const cityData = {
        name: city.name,
        country: city.country,
        lat: city.lat,
        lon: city.lon
      };

      const response = await citiesAPI.addCity(cityData);
      
      if (response.success) {
        onCityAdded();
      } else {
        setError(response.message || 'Failed to add city');
      }
    } catch (err) {
      console.error('Add city error:', err);
      if (err.response?.status === 409) {
        setError('This city is already in your list');
      } else {
        setError('Failed to add city. Please try again.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const getCountryFlag = (countryCode) => {
    // Simple country code to flag emoji mapping
    const flagMap = {
      'US': '🇺🇸', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸',
      'JP': '🇯🇵', 'IN': '🇮🇳', 'CN': '🇨🇳', 'BR': '🇧🇷',
      'RU': '🇷🇺', 'MX': '🇲🇽', 'KR': '🇰🇷', 'NL': '🇳🇱'
    };
    return flagMap[countryCode] || '🌍';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New City</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus-ring"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for a city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mt-3 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto max-h-96">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="Searching cities..." />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-4 space-y-2">
              {searchResults.map((city, index) => (
                <div
                  key={`${city.lat}-${city.lon}-${index}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-xl">{getCountryFlag(city.country)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">
                        {city.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {city.displayName}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddCity(city)}
                    disabled={isAdding}
                    className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors duration-200 focus-ring flex-shrink-0"
                  >
                    {isAdding ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span className="text-sm">Add</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery.length >= 2 && !isSearching ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>No cities found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <Search className="mx-auto h-12 w-12 mb-3 opacity-50" />
                <p>Start typing to search</p>
                <p className="text-sm">Enter at least 2 characters</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Search by city name, e.g., "New York" or "London"
            </p>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCityModal; 