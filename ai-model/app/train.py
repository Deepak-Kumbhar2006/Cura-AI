from pathlib import Path
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BASE_DIR / 'data' / 'disease_data.csv'
MODEL_PATH = BASE_DIR / 'models' / 'model.joblib'


def train_model():
    df = pd.read_csv(DATA_PATH)
    X = df[['fever', 'cough', 'temperature', 'humidity']]
    y = df['outbreak']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    model = LogisticRegression(max_iter=500)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    acc = float(accuracy_score(y_test, preds))

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({'model': model, 'accuracy': acc}, MODEL_PATH)
    return acc


if __name__ == '__main__':
    score = train_model()
    print(f'model trained, accuracy={score:.2f}')
