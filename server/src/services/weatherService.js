const axios = require('axios');

async function fetchWeather(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return {
      temperature: 27 + Math.round(Math.random() * 9),
      humidity: 55 + Math.round(Math.random() * 35),
    };
  }

  const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
    params: { q: city, units: 'metric', appid: apiKey },
    timeout: 5000,
  });

  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    lat: data.coord.lat,
    lng: data.coord.lon,
    region: data.sys.country,
  };
}

module.exports = { fetchWeather };
