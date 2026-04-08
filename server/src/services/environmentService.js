const axios = require('axios');

async function fetchWeatherAndAir(city = 'Pune') {
  const weatherKey = process.env.OPENWEATHER_API_KEY;
  const aqiKey = process.env.AQICN_API_KEY;

  let weather = { temperature: 28, humidity: 64, condition: 'Clear' };
  let aqi = { aqi: 82, level: 'Moderate' };

  try {
    if (weatherKey) {
      const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { q: city, units: 'metric', appid: weatherKey },
        timeout: 5000,
      });
      weather = {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        condition: data.weather?.[0]?.main || 'Clear',
      };
    }
  } catch (_e) {}

  try {
    if (aqiKey) {
      const { data } = await axios.get(`https://api.waqi.info/feed/${encodeURIComponent(city)}/`, {
        params: { token: aqiKey },
        timeout: 5000,
      });
      const score = Number(data?.data?.aqi || 0);
      const level = score <= 50 ? 'Good' : score <= 100 ? 'Moderate' : score <= 150 ? 'Unhealthy for Sensitive' : 'Unhealthy';
      aqi = { aqi: score || aqi.aqi, level };
    }
  } catch (_e) {}

  return { weather, aqi };
}

module.exports = { fetchWeatherAndAir };
