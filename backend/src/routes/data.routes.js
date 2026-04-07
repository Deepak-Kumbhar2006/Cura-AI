const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const optionalAuthMiddleware = require("../middleware/optionalAuth.middleware");

// Get all data records with optional filtering
router.get("/all", optionalAuthMiddleware, async (req, res) => {
  try {
    const { region, disease, date } = req.query;
    
    // Dummy data - replace with real DB queries in production
    const records = [
      {
        id: 1,
        disease: "Influenza",
        region: "Metro North",
        city: "Pune",
        cases: 45,
        date: new Date().toISOString(),
        latitude: 18.5204,
        longitude: 73.8567,
        temperature: 28,
        humidity: 65
      },
      {
        id: 2,
        disease: "Dengue",
        region: "South Zone",
        city: "Bangalore",
        cases: 23,
        date: new Date().toISOString(),
        latitude: 12.9716,
        longitude: 77.5946,
        temperature: 26,
        humidity: 72
      }
    ];
    
    res.json(records);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ message: "Failed to fetch data" });
  }
});

// Get user's own data
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // Dummy data - replace with real DB queries
    const userData = {
      id: userId,
      submissions: [
        {
          id: 1,
          disease: "Common Cold",
          symptoms: ["Cough", "Runny Nose"],
          severity: "Low",
          date: new Date().toISOString()
        }
      ]
    };
    
    res.json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});

// Add new data record
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { disease, city, region, symptoms, severity, temperature, humidity, latitude, longitude } = req.body;
    
    if (!disease || !city || !region) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Dummy data - replace with real DB insert
    const newRecord = {
      id: Math.random().toString(36).substr(2, 9),
      disease,
      city,
      region,
      symptoms,
      severity,
      temperature,
      humidity,
      latitude,
      longitude,
      date: new Date().toISOString(),
      userId: req.user?.id
    };
    
    res.status(201).json({ message: "Data added successfully", data: newRecord });
  } catch (err) {
    console.error("Error adding data:", err);
    res.status(500).json({ message: "Failed to add data" });
  }
});

// Add bulk data
router.post("/bulk", authMiddleware, async (req, res) => {
  try {
    const { disease, region, numberOfCases, symptoms } = req.body;
    
    if (!disease || !region || numberOfCases < 1) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Dummy response - replace with real DB operation
    res.status(201).json({
      message: "Bulk data added successfully",
      count: numberOfCases,
      data: { disease, region, numberOfCases, symptoms, date: new Date().toISOString() }
    });
  } catch (err) {
    console.error("Error adding bulk data:", err);
    res.status(500).json({ message: "Failed to add bulk data" });
  }
});

// Update diagnosis for a record
router.patch("/:id/diagnosis", authMiddleware, async (req, res) => {
  try {
    const { diagnosis, severity, recommendation } = req.body;
    const { id } = req.params;
    
    if (!diagnosis) {
      return res.status(400).json({ message: "Diagnosis is required" });
    }
    
    // Dummy response - replace with real DB update
    res.json({
      message: "Diagnosis updated successfully",
      data: { id, diagnosis, severity, recommendation, updatedAt: new Date().toISOString() }
    });
  } catch (err) {
    console.error("Error updating diagnosis:", err);
    res.status(500).json({ message: "Failed to update diagnosis" });
  }
});

module.exports = router;
