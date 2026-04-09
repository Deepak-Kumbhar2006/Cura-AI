const axios = require('axios');

async function fetchWeatherAndAir(city = 'Pune') {
  const weatherApi = process.env.OPEN_METEO_URL || 'https://api.open-meteo.com/v1/forecast';
  const aqiKey = process.env.AQICN_API_KEY;
  let weather = null;
  let aqi = null;

  try {
    const geocode = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
      timeout: 7000,
    });
    const lat = geocode?.data?.results?.[0]?.latitude;
    const lng = geocode?.data?.results?.[0]?.longitude;
    if (lat != null && lng != null) {
      const { data } = await axios.get(weatherApi, {
        params: { latitude: lat, longitude: lng, hourly: 'temperature_2m,relative_humidity_2m', forecast_days: 1 },
        timeout: 5000,
      });
      weather = {
        temperature: Number(data?.hourly?.temperature_2m?.[0] ?? 0),
        humidity: Number(data?.hourly?.relative_humidity_2m?.[0] ?? 0),
        condition: 'Live',
      };
    }
  } catch (_e) {
    weather = null;
  }

  try {
    if (aqiKey) {
      const { data } = await axios.get(`https://api.waqi.info/feed/${encodeURIComponent(city)}/`, {
        params: { token: aqiKey },
        timeout: 5000,
      });
      const score = Number(data?.data?.aqi || 0);
      const level = score <= 50 ? 'Good' : score <= 100 ? 'Moderate' : score <= 150 ? 'Unhealthy for Sensitive' : 'Unhealthy';
      aqi = { aqi: score, level };
    }
  } catch (_e) {
    aqi = null;
  }

  return { weather, aqi, source: { weather: 'open-meteo', aqi: 'aqicn' } };
}

module.exports = { fetchWeatherAndAir };
