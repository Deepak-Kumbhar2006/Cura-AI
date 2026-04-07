from pathlib import Path
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / 'data' / 'disease_data.csv'
MODEL_PATH = BASE_DIR / 'models' / 'model.joblib'


def train_model():
    df = pd.read_csv(DATA_PATH)
    X = df[['fever', 'cough', 'temperature', 'humidity']]
    y = df['outbreak']

    model = LogisticRegression(max_iter=500)
    model.fit(X, y)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)


if __name__ == '__main__':
    train_model()
    print('model trained')
