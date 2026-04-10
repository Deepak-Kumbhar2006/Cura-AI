function sanitizeString(val) {
  if (typeof val !== 'string') return val;
  return val.trim().slice(0, 500);
}

function validateHealthRecord(req, res, next) {
  const errors = [];
  const body = req.body || {};

  if (!body.location || !body.location.city) {
    errors.push('location.city is required');
  }

  if (body.symptoms && !Array.isArray(body.symptoms)) {
    errors.push('symptoms must be an array');
  }

  if (body.vitals) {
    if (body.vitals.bodyTemperature != null) {
      const t = Number(body.vitals.bodyTemperature);
      if (Number.isNaN(t) || t < 30 || t > 45) errors.push('vitals.bodyTemperature must be between 30 and 45');
    }
    if (body.vitals.spo2 != null) {
      const s = Number(body.vitals.spo2);
      if (Number.isNaN(s) || s < 0 || s > 100) errors.push('vitals.spo2 must be between 0 and 100');
    }
    if (body.vitals.heartRate != null) {
      const h = Number(body.vitals.heartRate);
      if (Number.isNaN(h) || h < 20 || h > 300) errors.push('vitals.heartRate must be between 20 and 300');
    }
  }

  if (body.personalDetails) {
    if (body.personalDetails.age != null) {
      const a = Number(body.personalDetails.age);
      if (Number.isNaN(a) || a < 0 || a > 150) errors.push('personalDetails.age must be between 0 and 150');
    }
    if (body.personalDetails.name) {
      body.personalDetails.name = sanitizeString(body.personalDetails.name);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
}

function validateQueryParams(allowedParams) {
  return (req, res, next) => {
    for (const key of Object.keys(req.query)) {
      if (!allowedParams.includes(key)) continue;
      req.query[key] = String(req.query[key]).trim().slice(0, 200);
    }
    next();
  };
}

function validatePagination(req, res, next) {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  req.pagination = {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50,
  };
  next();
}

module.exports = { validateHealthRecord, validateQueryParams, validatePagination, sanitizeString };
