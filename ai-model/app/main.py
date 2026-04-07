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

app = FastAPI(title='Cura AI Service')


class PredictionRequest(BaseModel):
    symptoms: list[str]
    temperature: float
    humidity: float


@app.get('/healthz')
def healthz():
    return {'ok': True, 'service': 'cura-ai'}


@app.post('/predict')
def predict(payload: PredictionRequest):
    s = set(sym.lower() for sym in payload.symptoms)
    features = [[
        1 if 'fever' in s else 0,
        1 if 'cough' in s else 0,
        payload.temperature,
        payload.humidity,
    ]]

    proba = float(model.predict_proba(features)[0][1])
    risk = 'High' if proba >= 0.75 else 'Medium' if proba >= 0.45 else 'Low'

    return {'risk': risk, 'probability': round(proba, 2)}
