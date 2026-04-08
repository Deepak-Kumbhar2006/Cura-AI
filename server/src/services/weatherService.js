const axios = require('axios');

async function fetchWeather(city) {
  const geocode = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: city, count: 1, language: 'en', format: 'json' },
    timeout: 7000,
  });
  const lat = geocode?.data?.results?.[0]?.latitude;
  const lng = geocode?.data?.results?.[0]?.longitude;
  const region = geocode?.data?.results?.[0]?.country_code || city;
  if (lat == null || lng == null) throw new Error(`Unable to resolve city "${city}"`);

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
    temperature: weather?.data?.hourly?.temperature_2m?.[0],
    humidity: weather?.data?.hourly?.relative_humidity_2m?.[0],
    lat,
    lng,
    region,
  };
}

module.exports = { fetchWeather };
