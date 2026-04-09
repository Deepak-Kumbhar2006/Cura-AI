const express = require("express");
const router = express.Router();

// Weather data for cities
const weatherData = {
  "pune": { temperature: 28, humidity: 65, condition: "Partly Cloudy", windSpeed: 12 },
  "bangalore": { temperature: 26, humidity: 72, condition: "Cloudy", windSpeed: 8 },
  "mumbai": { temperature: 30, humidity: 78, condition: "Humid", windSpeed: 15 },
  "delhi": { temperature: 32, humidity: 55, condition: "Sunny", windSpeed: 10 },
  "hyderabad": { temperature: 29, humidity: 68, condition: "Partly Cloudy", windSpeed: 9 },
};

// Get weather for a specific city
router.get("/:city", (req, res) => {
  try {
    const city = req.params.city.toLowerCase();
    const weather = weatherData[city];
    
    if (!weather) {
      return res.status(404).json({ message: "City not found", data: null });
    }
    
    res.json({
      city: req.params.city,
      ...weather,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error fetching weather:", err);
    res.status(500).json({ message: "Failed to fetch weather" });
  }
});

// Get weather for multiple cities
router.get("/", (req, res) => {
  try {
    const cities = Object.keys(weatherData).map(city => ({
      city: city.charAt(0).toUpperCase() + city.slice(1),
      ...weatherData[city],
      timestamp: new Date().toISOString()
    }));
    
    res.json(cities);
  } catch (err) {
    console.error("Error fetching weather data:", err);
    res.status(500).json({ message: "Failed to fetch weather data" });
  }
});

module.exports = router;
