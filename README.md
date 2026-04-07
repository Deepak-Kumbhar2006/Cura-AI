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

### Environmental Integration
- OpenWeatherMap integration (temperature, humidity)
- Fallback simulation if API key is not configured

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

### Prediction
- `POST /api/predict`

### Alerts
- `GET /api/alerts` (doctor)

### Insights (chatbot)
- `GET /api/insights?q=...`
- `POST /api/chat`

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
CLIENT_ORIGIN=http://localhost:5173
AI_SERVICE_URL=http://127.0.0.1:8000/predict
OPENWEATHER_API_KEY=your_key_here
```

### `client/.env`
```env
VITE_API_URL=http://localhost:5000
```

---

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

## Sample Dataset

`ai-model/data/disease_data.csv`

Columns:
- `fever`, `cough`, `temperature`, `humidity`, `outbreak`
