const STATE_ALIASES = {
  'maharashtra': 'Maharashtra', 'mh': 'Maharashtra',
  'karnataka': 'Karnataka', 'ka': 'Karnataka',
  'tamil nadu': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu', 'tn': 'Tamil Nadu',
  'delhi': 'Delhi', 'new delhi': 'Delhi', 'dl': 'Delhi',
  'uttar pradesh': 'Uttar Pradesh', 'up': 'Uttar Pradesh',
  'west bengal': 'West Bengal', 'wb': 'West Bengal',
  'telangana': 'Telangana', 'ts': 'Telangana',
  'andhra pradesh': 'Andhra Pradesh', 'ap': 'Andhra Pradesh',
  'rajasthan': 'Rajasthan', 'rj': 'Rajasthan',
  'gujarat': 'Gujarat', 'gj': 'Gujarat',
  'madhya pradesh': 'Madhya Pradesh', 'mp': 'Madhya Pradesh',
  'kerala': 'Kerala', 'kl': 'Kerala',
  'punjab': 'Punjab', 'pb': 'Punjab',
  'bihar': 'Bihar', 'br': 'Bihar',
  'odisha': 'Odisha', 'orissa': 'Odisha', 'or': 'Odisha',
  'jharkhand': 'Jharkhand', 'jh': 'Jharkhand',
  'assam': 'Assam', 'as': 'Assam',
  'chhattisgarh': 'Chhattisgarh', 'ct': 'Chhattisgarh',
  'haryana': 'Haryana', 'hr': 'Haryana',
  'goa': 'Goa', 'ga': 'Goa',
};

const CITY_ALIASES = {
  'bombay': 'Mumbai', 'mumbai': 'Mumbai',
  'calcutta': 'Kolkata', 'kolkata': 'Kolkata',
  'madras': 'Chennai', 'chennai': 'Chennai',
  'bangalore': 'Bengaluru', 'bengaluru': 'Bengaluru', 'blr': 'Bengaluru',
  'pune': 'Pune', 'poona': 'Pune',
  'hyderabad': 'Hyderabad', 'hyd': 'Hyderabad',
  'ahmedabad': 'Ahmedabad', 'amdavad': 'Ahmedabad',
  'jaipur': 'Jaipur',
  'lucknow': 'Lucknow',
  'new delhi': 'New Delhi', 'delhi': 'New Delhi',
  'thiruvananthapuram': 'Thiruvananthapuram', 'trivandrum': 'Thiruvananthapuram',
  'kochi': 'Kochi', 'cochin': 'Kochi',
  'nagpur': 'Nagpur',
  'indore': 'Indore',
  'bhopal': 'Bhopal',
  'visakhapatnam': 'Visakhapatnam', 'vizag': 'Visakhapatnam',
  'patna': 'Patna',
  'surat': 'Surat',
  'vadodara': 'Vadodara', 'baroda': 'Vadodara',
  'coimbatore': 'Coimbatore',
};

const CITY_COORDINATES = {
  'Mumbai': { lat: 19.076, lng: 72.8777 },
  'New Delhi': { lat: 28.6139, lng: 77.209 },
  'Bengaluru': { lat: 12.9716, lng: 77.5946 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Hyderabad': { lat: 17.385, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'Patna': { lat: 25.6093, lng: 85.1376 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Kochi': { lat: 9.9312, lng: 76.2673 },
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Vadodara': { lat: 22.3072, lng: 73.1812 },
};

function standardizeCity(raw) {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();
  return CITY_ALIASES[key] || raw.trim();
}

function standardizeState(raw) {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();
  return STATE_ALIASES[key] || raw.trim();
}

function getCoordinates(city) {
  const std = standardizeCity(city);
  return CITY_COORDINATES[std] || null;
}

function standardizeLocation(location) {
  if (!location) return location;
  const result = { ...location };
  if (result.city) result.city = standardizeCity(result.city);
  if (result.region) {
    const stateStd = STATE_ALIASES[result.region.trim().toLowerCase()];
    const cityStd = CITY_ALIASES[result.region.trim().toLowerCase()];
    result.region = stateStd || cityStd || result.region.trim();
  }
  if (result.city && (!result.lat || !result.lng)) {
    const coords = getCoordinates(result.city);
    if (coords) {
      result.lat = coords.lat;
      result.lng = coords.lng;
    }
  }
  return result;
}

module.exports = { standardizeCity, standardizeState, getCoordinates, standardizeLocation, CITY_ALIASES, STATE_ALIASES, CITY_COORDINATES };
