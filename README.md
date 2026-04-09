# Cura – AI-Based Smart Health Surveillance and Disease Outbreak Prediction System

Cura is a full-stack, end-to-end web platform where patients submit symptoms, weather context is fetched automatically, AI predicts outbreak risk, and doctors monitor alerts/trends via dashboard + maps.

## Project Structure

```bash
/cura
  /client
  /server
  /ai-model
```

## Core Data Flow

Frontend → Node/Express → FastAPI ML → MongoDB → Frontend

---

## Features Implemented

### Auth & Roles
- JWT authentication
- Role-based access (`patient`, `doctor`)
- Protected APIs and route-based UI behavior

### Patient
- Register/Login
- Submit symptoms form (`/patient/submit`)
- Personal risk view (`/patient/dashboard`)
- Nearby risk map (`/patient/nearby`)
- AI chatbot (floating widget + full chat page)

### Doctor
- Global dashboard with KPI cards and charts
- Alerts page
- Reports page with table + filter
- Outbreak map visualization
- AI chatbot for trends/high-risk insights

### Environmental + Trend Intelligence
- Open-Meteo live weather integration (temperature, humidity, precipitation)
- GDELT live disease-news trend scanning
- CDC public dataset signal pull for trend weighting
- Optional NewsAPI signal boost when key is configured
- Geolocation-driven trend risk rendering on Leaflet map
- API response caching layer to reduce repeated external API calls

### AI + Alerts
- FastAPI model endpoint: `POST /predict`
- Logistic Regression model trained on sample CSV
- Alert generation when risk = `High`
- Explainable response attached to each record

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Data
- `POST /api/data/add` (patient)
- `GET /api/data/all` (doctor/patient filtered)
- `GET /api/data/me` (patient history)
- `PATCH /api/data/:id/diagnosis` (doctor)
- `POST /api/data/bulk` (doctor)

### Prediction
- `POST /api/predict`

### Alerts
- `GET /api/alerts` (doctor)

### Insights (chatbot)
- `GET /api/insights?q=...`
- `POST /api/chat`
- `POST /api/healthbot/chat`
- `GET /api/dashboard/environment?city=Pune`
- `GET /api/trends/local?lat=18.52&lng=73.85&location=Pune`

---

## Database Models

### User
- `name`, `email`, `password`, `role`

### HealthRecord
- `userId`, `personalDetails`, `symptoms[] (with severity)`, `location`, `vitals`, `humidity`, `durationDays`, `medicalReportUrl`, `risk`, `probability`, `diagnosis`, `case status`

### Alert
- `location`, `message`, `risk`, `timestamp`

---

## Setup Instructions

## 1) AI service
```bash
cd ai-model
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app/train.py
uvicorn app.main:app --reload --port 8000
```

## 2) Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

## 3) Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

---

## Environment Variables

### `server/.env`
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cura
JWT_SECRET=replace_with_secure_secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
FRONTEND_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000/predict
GDELT_API_URL=https://api.gdeltproject.org/api/v2/doc/doc
OPEN_METEO_URL=https://api.open-meteo.com/v1/forecast
LEGACY_HEALTHBOT_URL=http://localhost:5001/api/chat
GEMINI_API_KEY=
HF_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
AQICN_API_KEY=
NEWSAPI_KEY=
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

---

## Security Notes
- Do **not** commit production credentials (Mongo URI passwords, JWT secret, API keys) to git.
- Store secrets only in `.env` locally and hosting provider secret managers.
- Rotate any key immediately if it was shared publicly.


## Deployment Notes
- Client container ships with Nginx SPA config and `/api` reverse proxy to `server:5000` for production-safe frontend/backend connectivity.
- API base URL defaults to relative `/` so hosted deployments work without code changes.
- Docker Compose includes health checks for mongo, ai-model, and server before client starts.

## Docker Deployment

```bash
docker compose up --build
```

Services:
- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- AI service: `http://localhost:8000`
- MongoDB: `localhost:27017`

---

## Merge Conflict Troubleshooting

If GitHub reports that conflicts are too complex to resolve in the web editor, resolve them locally from your terminal:

```bash
git fetch origin
git checkout <your-pr-branch>
git merge origin/<target-branch>
# resolve conflicts in your editor
git add .
git commit -m "Resolve merge conflicts"
git push
```

Quick check for unresolved conflict markers before pushing:

```bash
rg -n "^(<<<<<<<|=======|>>>>>>>)" client server ai-model README.md docker-compose.yml
```

---

## Sample Dataset

`ai-model/data/disease_data.csv`

Columns:
- `fever`, `cough`, `temperature`, `humidity`, `outbreak`
