const globalHealth = require('../services/globalHealthDataService');

async function getAllData(_req, res) {
  try {
    const data = await globalHealth.fetchAllGlobalHealthData();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch global health data', error: error.message });
  }
}

async function getCovidGlobal(_req, res) {
  try {
    const data = await globalHealth.fetchGlobalCovidSummary();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch global COVID data', error: error.message });
  }
}

async function getCovidIndia(_req, res) {
  try {
    const data = await globalHealth.fetchIndiaCovidData();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch India COVID data', error: error.message });
  }
}

async function getCovidTimeline(req, res) {
  try {
    const days = Math.min(Number(req.query.days) || 90, 365);
    const data = await globalHealth.fetchCovidTimeline(days);
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch COVID timeline', error: error.message });
  }
}

async function getTopCountries(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 50);
    const data = await globalHealth.fetchTopCountries(limit);
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch top countries', error: error.message });
  }
}

async function getWhoIndicators(_req, res) {
  try {
    const data = await globalHealth.fetchWhoIndicators();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch WHO indicators', error: error.message });
  }
}

async function getWhoDiseases(_req, res) {
  try {
    const data = await globalHealth.fetchWhoDiseaseData();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch WHO disease data', error: error.message });
  }
}

async function getWorldBankHealth(_req, res) {
  try {
    const data = await globalHealth.fetchWorldBankHealthData();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch World Bank data', error: error.message });
  }
}

async function getCdcResources(_req, res) {
  try {
    const data = await globalHealth.fetchCdcResources();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch CDC resources', error: error.message });
  }
}

async function getCdcDiseaseData(_req, res) {
  try {
    const data = await globalHealth.fetchCdcDiseaseData();
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch CDC disease data', error: error.message });
  }
}

async function getEnvironmentalHealth(req, res) {
  try {
    const lat = Number(req.query.lat) || undefined;
    const lng = Number(req.query.lng) || undefined;
    const data = await globalHealth.fetchEnvironmentalHealth(lat, lng);
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch environmental data', error: error.message });
  }
}

async function getClinicalConditions(req, res) {
  try {
    const query = req.query.q || 'infectious disease';
    const data = await globalHealth.fetchClinicalConditions(query);
    return res.status(200).json(data || { message: 'Data temporarily unavailable' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch clinical conditions', error: error.message });
  }
}

module.exports = {
  getAllData,
  getCovidGlobal,
  getCovidIndia,
  getCovidTimeline,
  getTopCountries,
  getWhoIndicators,
  getWhoDiseases,
  getWorldBankHealth,
  getCdcResources,
  getCdcDiseaseData,
  getEnvironmentalHealth,
  getClinicalConditions,
};
