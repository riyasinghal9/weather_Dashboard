import { useQuery, useMutation, useQueryClient } from 'react-query';
import { weatherAPI, citiesAPI, handleAPIError } from '../services/api';

// Query keys for React Query
const QUERY_KEYS = {
  CITIES: 'cities',
  CITIES_WITH_WEATHER: 'cities-with-weather',
  WEATHER: 'weather',
  FORECAST: 'forecast',
  COMPLETE_WEATHER: 'complete-weather',
  CITY_SEARCH: 'city-search',
};

// Hook to get all cities
export const useCities = () => {
  return useQuery(
    QUERY_KEYS.CITIES,
    () => citiesAPI.getCities().then(response => response.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      onError: (error) => {
        console.error('Error fetching cities:', handleAPIError(error));
      },
    }
  );
};

// Hook to get cities with weather data
export const useCitiesWithWeather = () => {
  return useQuery(
    QUERY_KEYS.CITIES_WITH_WEATHER,
    () => citiesAPI.getCitiesWithWeather().then(response => response.data),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
      onError: (error) => {
        console.error('Error fetching cities with weather:', handleAPIError(error));
      },
    }
  );
};

// Hook to get current weather for a specific location
export const useCurrentWeather = (lat, lon, enabled = true) => {
  return useQuery(
    [QUERY_KEYS.WEATHER, lat, lon],
    () => weatherAPI.getCurrentWeather(lat, lon).then(response => response.data),
    {
      enabled: Boolean(enabled && lat && lon),
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 15 * 60 * 1000, // 15 minutes
      retry: 2,
      onError: (error) => {
        console.error('Error fetching current weather:', handleAPIError(error));
      },
    }
  );
};

// Hook to get forecast for a specific location
export const useForecast = (lat, lon, enabled = true) => {
  return useQuery(
    [QUERY_KEYS.FORECAST, lat, lon],
    () => weatherAPI.getForecast(lat, lon).then(response => response.data),
    {
      enabled: Boolean(enabled && lat && lon),
      staleTime: 30 * 60 * 1000, // 30 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
      retry: 2,
      onError: (error) => {
        console.error('Error fetching forecast:', handleAPIError(error));
      },
    }
  );
};

// Hook to get complete weather data (current + forecast)
export const useCompleteWeather = (lat, lon, enabled = true) => {
  return useQuery(
    [QUERY_KEYS.COMPLETE_WEATHER, lat, lon],
    () => weatherAPI.getCompleteWeather(lat, lon).then(response => response.data),
    {
      enabled: Boolean(enabled && lat && lon),
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 20 * 60 * 1000, // 20 minutes
      retry: 2,
      onError: (error) => {
        console.error('Error fetching complete weather:', handleAPIError(error));
      },
    }
  );
};

// Hook to get weather for a specific city from user's list
export const useCityWeather = (cityId, enabled = true) => {
  return useQuery(
    [QUERY_KEYS.COMPLETE_WEATHER, 'city', cityId],
    () => citiesAPI.getCityWeather(cityId).then(response => response.data),
    {
      enabled: Boolean(enabled && cityId),
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 20 * 60 * 1000, // 20 minutes
      retry: 2,
      onError: (error) => {
        console.error('Error fetching city weather:', handleAPIError(error));
      },
    }
  );
};

// Hook to search for cities
export const useCitySearch = (query, enabled = true) => {
  return useQuery(
    [QUERY_KEYS.CITY_SEARCH, query],
    () => weatherAPI.searchCities(query).then(response => response.data),
    {
      enabled: Boolean(enabled && query && query.length >= 2),
      staleTime: 30 * 60 * 1000, // 30 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
      retry: 1,
      onError: (error) => {
        console.error('Error searching cities:', handleAPIError(error));
      },
    }
  );
};

// Mutation hook to add a city
export const useAddCity = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (cityData) => citiesAPI.addCity(cityData),
    {
      onSuccess: () => {
        // Invalidate and refetch cities data
        queryClient.invalidateQueries(QUERY_KEYS.CITIES);
        queryClient.invalidateQueries(QUERY_KEYS.CITIES_WITH_WEATHER);
      },
      onError: (error) => {
        console.error('Error adding city:', handleAPIError(error));
        throw new Error(handleAPIError(error));
      },
    }
  );
};

// Mutation hook to remove a city
export const useRemoveCity = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (cityId) => citiesAPI.removeCity(cityId),
    {
      onSuccess: () => {
        // Invalidate and refetch cities data
        queryClient.invalidateQueries(QUERY_KEYS.CITIES);
        queryClient.invalidateQueries(QUERY_KEYS.CITIES_WITH_WEATHER);
      },
      onError: (error) => {
        console.error('Error removing city:', handleAPIError(error));
        throw new Error(handleAPIError(error));
      },
    }
  );
};

// Custom hook for manual data refresh
export const useRefreshWeather = () => {
  const queryClient = useQueryClient();

  const refreshAll = () => {
    queryClient.invalidateQueries(QUERY_KEYS.CITIES_WITH_WEATHER);
    queryClient.invalidateQueries(QUERY_KEYS.WEATHER);
    queryClient.invalidateQueries(QUERY_KEYS.FORECAST);
    queryClient.invalidateQueries(QUERY_KEYS.COMPLETE_WEATHER);
  };

  const refreshCities = () => {
    queryClient.invalidateQueries(QUERY_KEYS.CITIES);
    queryClient.invalidateQueries(QUERY_KEYS.CITIES_WITH_WEATHER);
  };

  const refreshWeather = (lat, lon) => {
    queryClient.invalidateQueries([QUERY_KEYS.WEATHER, lat, lon]);
    queryClient.invalidateQueries([QUERY_KEYS.COMPLETE_WEATHER, lat, lon]);
  };

  return {
    refreshAll,
    refreshCities,
    refreshWeather,
  };
};

// Custom hook for optimistic updates
export const useOptimisticUpdates = () => {
  const queryClient = useQueryClient();

  const addCityOptimistic = (tempCity) => {
    queryClient.setQueryData(QUERY_KEYS.CITIES, (oldData) => {
      if (!oldData) return [tempCity];
      return [...oldData, tempCity];
    });
  };

  const removeCityOptimistic = (cityId) => {
    queryClient.setQueryData(QUERY_KEYS.CITIES, (oldData) => {
      if (!oldData) return [];
      return oldData.filter(city => city.id !== cityId);
    });
  };

  return {
    addCityOptimistic,
    removeCityOptimistic,
  };
};

// Hook to check if any weather data is currently loading
export const useWeatherLoading = () => {
  const queryClient = useQueryClient();
  const queries = queryClient.getQueryCache().findAll();
  
  const weatherQueries = queries.filter(query => 
    query.queryKey[0]?.includes?.('weather') || 
    query.queryKey[0]?.includes?.('cities') ||
    query.queryKey[0]?.includes?.('forecast')
  );
  
  return weatherQueries.some(query => query.state.isFetching);
}; 