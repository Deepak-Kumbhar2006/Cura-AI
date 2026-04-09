const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const fail = (res, message) => res.status(400).json({ message });

exports.validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body || {};
  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    return fail(res, 'Name, email and password are required');
  }
  if (String(password).length < 6) return fail(res, 'Password must be at least 6 characters');
  if (role && !['patient', 'doctor'].includes(role)) return fail(res, 'Invalid role');
  return next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) return fail(res, 'Email and password are required');
  return next();
};

exports.validateAddRecord = (req, res, next) => {
  const { location, symptoms } = req.body || {};
  if (!location?.city || !isNonEmptyString(location.city)) return fail(res, 'City is required');
  if (!Array.isArray(symptoms) || symptoms.length === 0) return fail(res, 'At least one symptom is required');
  return next();
};

exports.validateDiagnosis = (req, res, next) => {
  const { diseaseName, severity, status } = req.body || {};
  if (!isNonEmptyString(diseaseName)) return fail(res, 'Disease name is required');
  if (severity && !['Mild', 'Moderate', 'Severe'].includes(severity)) return fail(res, 'Invalid severity');
  if (status && !['Suspected', 'Confirmed', 'Recovered'].includes(status)) return fail(res, 'Invalid status');
  return next();
};

exports.validateBulkEntry = (req, res, next) => {
  const { numberOfCases, diseaseType, region } = req.body || {};
  if (!Number.isFinite(Number(numberOfCases)) || Number(numberOfCases) <= 0) {
    return fail(res, 'numberOfCases must be a positive number');
  }
  if (!isNonEmptyString(diseaseType) || !isNonEmptyString(region)) {
    return fail(res, 'diseaseType and region are required');
  }
  return next();
};

exports.validateChatMessage = (req, res, next) => {
  const { message } = req.body || {};
  if (!isNonEmptyString(message)) return fail(res, 'Please enter a message.');
  return next();
};
