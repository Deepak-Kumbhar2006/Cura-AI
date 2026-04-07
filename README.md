# Cura AI — Smart Health Surveillance & Outbreak Prediction

Cura AI is a full-stack, production-style web platform for collecting health and environmental observations, predicting outbreak risk with AI/ML, and surfacing high-risk alerts with dashboards, reports, and map visualizations.

## Project Structure

```bash
/client    # React + Tailwind frontend
/server    # Node.js + Express + MongoDB backend
/ai-model  # FastAPI + scikit-learn prediction microservice
```

---

## 1) Frontend (`/client`)

### Features
- JWT-based auth flow (Login/Register)
- Sidebar dashboard layout (mobile responsive)
- KPI cards: Total Cases, Active Alerts, High-Risk Zones
- Charts (Recharts): trend line + region bar chart
- Data input module with symptoms + location + environmental data
- Outbreak map (Leaflet) with color markers by risk
- Reports table with date/region filters
- AI Assistant page (repurposed chatbot concept)

### Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

---

## 2) Backend (`/server`)

### Features
- Express REST API with MongoDB + Mongoose models
- JWT authentication and role-based access (`Admin`, `Health Officer`)
- Data ingestion endpoint (`/api/data/add`) with prediction handoff to AI service
- Alert generation when risk is `High`
- Optional email notification via Nodemailer
- Dashboard analytics endpoint for charts/cards

### Environment Variables
Copy `server/.env.example` to `server/.env` and update:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cura_ai
JWT_SECRET=replace_with_secure_secret
CLIENT_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000/predict
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
ALERT_EMAIL_TO=
```

### Setup
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

---

## 3) AI Service (`/ai-model`)

### Features
- RandomForest model trained on sample CSV dataset
- Auto-training if model file does not exist
- Prediction endpoint:
  - `POST /predict`
  - returns: `{ "risk": "High|Medium|Low", "probability": 0.87, "disease": "Respiratory Infection" }`

### Setup
```bash
cd ai-model
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app/train.py
uvicorn app.main:app --reload --port 8000
```

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Data
- `POST /api/data/add`
- `GET /api/data/all`

### Prediction
- `POST /api/predict`

### Alerts
- `GET /api/alerts`

### Dashboard
- `GET /api/dashboard/stats`

---

## Sample Prediction Payload

```json
{
  "symptoms": ["fever", "cough", "fatigue"],
  "location": {
    "city": "Austin",
    "region": "Texas",
    "lat": 30.2672,
    "lng": -97.7431
  },
  "environmental": {
    "temperature": 35,
    "humidity": 78
  }
}
```

---

## End-to-End Run Order
1. Start MongoDB
2. Start AI service (`uvicorn ... --port 8000`)
3. Start backend (`npm run dev` in `/server`)
4. Start frontend (`npm run dev` in `/client`)
5. Register as Admin or Health Officer and begin ingesting records

---

## Hackathon-Ready Notes
- Designed for clear data → prediction → alert → visualization flow
- Includes reusable assistant page from the prior chatbot direction
- Built with modular folder layout and environment-based configuration
