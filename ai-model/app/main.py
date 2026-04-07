from pathlib import Path
import joblib
from fastapi import FastAPI
from pydantic import BaseModel

from train import train_model

BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / 'models' / 'model.joblib'

if not MODEL_PATH.exists():
    train_model()

model = joblib.load(MODEL_PATH)

app = FastAPI(title='Cura AI Prediction Service')


class Location(BaseModel):
    city: str
    region: str
    lat: float | None = None
    lng: float | None = None


class Environmental(BaseModel):
    temperature: float
    humidity: float


class PredictionRequest(BaseModel):
    symptoms: list[str]
    location: Location
    environmental: Environmental


@app.get('/healthz')
def healthz():
    return {'ok': True, 'service': 'cura-ai-model'}


@app.post('/predict')
def predict(payload: PredictionRequest):
    symptom_set = set(s.lower() for s in payload.symptoms)
    features = [[
        1 if 'fever' in symptom_set else 0,
        1 if 'cough' in symptom_set else 0,
        1 if 'headache' in symptom_set else 0,
        1 if 'fatigue' in symptom_set else 0,
        1 if 'breathlessness' in symptom_set else 0,
        payload.environmental.temperature,
        payload.environmental.humidity,
    ]]

    probability = float(model.predict_proba(features)[0][1])
    if probability >= 0.75:
        risk = 'High'
    elif probability >= 0.45:
        risk = 'Medium'
    else:
        risk = 'Low'

    return {'risk': risk, 'probability': round(probability, 2), 'disease': 'Respiratory Infection'}
