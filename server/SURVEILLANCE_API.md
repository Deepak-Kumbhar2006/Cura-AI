# Cura-AI Surveillance API

Base URL: `http://localhost:5000/api`

## Core Endpoints

- `GET /dashboard`
- `GET /regions`
- `GET /alerts`
- `GET /trends`
- `GET /environment`
- `GET /predictions`
- `GET /dataset`

All endpoints require `Authorization: Bearer <jwt>`.

## Example: `GET /dashboard`

```json
{
  "lastUpdated": "2026-04-09T13:20:14.502Z",
  "dataSources": ["WHO GHO", "data.gov.in", "disease.sh", "Open-Meteo", "AQICN", "IDSP"],
  "totalCases": 45035776,
  "activeCases": 2134,
  "highRiskRegions": 6,
  "alertsToday": 3,
  "recoveryRate": 98.81,
  "aiConfidence": 84,
  "growthPct": 4.52,
  "insights": [
    {
      "type": "prediction",
      "confidence": 86,
      "message": "Forecast indicates potential Dengue spike in Maharashtra within 7 days."
    }
  ]
}
```

## Example: `GET /predictions?humidityDelta=10`

```json
{
  "lastUpdated": "2026-04-09T13:20:14.502Z",
  "predictions": [
    {
      "region": "Maharashtra",
      "disease": "Dengue",
      "predictedActiveCases7d": 2160,
      "riskScore": 76.4,
      "level": "high",
      "confidence": 88,
      "rationale": "High humidity (74.2%) and elevated risk score indicate vector-borne spread potential."
    }
  ],
  "hospitalLoadEstimator": [
    {
      "region": "Maharashtra",
      "predictedAdmissions": 238,
      "icuDemand": 39
    }
  ],
  "simulation": {
    "humidityDelta": 10,
    "summary": "Scenario applied with humidity adjustment of 10% for all monitored regions."
  }
}
```
