const axios = require('axios');

function fallbackWeather(city) {
  return {
    temperature: 29,
    humidity: 60,
    lat: null,
    lng: null,
    region: city || 'Unknown',
    source: 'fallback',
  };
}

async function fetchWeather(city) {
  try {
    if (!city || !String(city).trim()) return fallbackWeather('Unknown');

    const geocode = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
      timeout: 7000,
    });

    const lat = geocode?.data?.results?.[0]?.latitude;
    const lng = geocode?.data?.results?.[0]?.longitude;
    const region = geocode?.data?.results?.[0]?.country_code || city;

    if (lat == null || lng == null) {
      return fallbackWeather(city);
    }

    const weather = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lng,
        hourly: 'temperature_2m,relative_humidity_2m',
        forecast_days: 1,
      },
      timeout: 7000,
    });

    return {
      temperature: Number(weather?.data?.hourly?.temperature_2m?.[0] ?? 29),
      humidity: Number(weather?.data?.hourly?.relative_humidity_2m?.[0] ?? 60),
      lat,
      lng,
      region,
      source: 'open-meteo',
    };
  } catch (_error) {
    return fallbackWeather(city);
  }
}

module.exports = { fetchWeather };
