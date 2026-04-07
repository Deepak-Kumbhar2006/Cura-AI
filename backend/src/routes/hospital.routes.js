const express = require("express");
const router = express.Router();
const { getNearbyHospitals } = require("../controllers/hospital.controller");

router.get("/nearby", getNearbyHospitals);

module.exports = router;