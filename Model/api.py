"""
Flask API for Confusion / Satisfaction Score Prediction
Loads the XGBoost model from the .pkl file and exposes a /predict endpoint.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os

# The project root is one level up from this file (Model/)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

app = Flask(__name__, static_folder=PROJECT_ROOT, static_url_path="")
CORS(app)  # Allow cross-origin requests from the frontend

# ── Load model once at startup ──────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgb_satisfaction_model.pkl")

with open(MODEL_PATH, "rb") as f:
    bundle = pickle.load(f)

model = bundle["model"]
imputer = bundle["imputer"]
feature_cols = bundle["feature_cols"]

print(f"Model loaded. Features: {feature_cols}")


def predict_one(session: dict) -> float:
    """Run prediction for a single session's UX metrics."""
    df = pd.DataFrame([session])

    # Engineered features (must match training pipeline)
    df["time_per_click"] = df["task_time"] / (df["click_count"] + 1.0)
    df["errors_per_click"] = df["form_errors"] / (df["click_count"] + 1.0)
    df["rage_per_click"] = df["rage_clicks"] / (df["click_count"] + 1.0)
    df["backtracks_per_click"] = df["backtracks"] / (df["click_count"] + 1.0)
    df["friction_index"] = (
        0.45 * (df["task_time"] - 10) / (180 - 10)
        + 0.25 * (df["form_errors"] - 0) / (10 - 0)
        + 0.15 * (df["rage_clicks"] - 0) / (8 - 0)
        + 0.08 * (df["backtracks"] - 0) / (20 - 0)
        + 0.05 * (df["click_count"] - 1) / (50 - 1)
        + 0.02 * (df["hover_time"] - 0) / (10 - 0)
    ).clip(0, 2)

    X = df[feature_cols]
    X_i = imputer.transform(X)
    pred = model.predict(X_i)[0]
    return float(np.clip(pred, 0, 100))


@app.route("/predict", methods=["POST"])
def predict():
    """
    Expects JSON body with keys:
        backtracks, click_count, form_errors, hover_time, rage_clicks, task_time
    Returns JSON: { "confusion_score": <float 0-100> }
    """
    data = request.get_json(force=True)

    required = ["backtracks", "click_count", "form_errors", "hover_time", "rage_clicks", "task_time"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    session = {k: float(data[k]) for k in required}

    try:
        score = predict_one(session)
        # The model predicts "satisfaction" (0-100).
        # Confusion score = 100 - satisfaction
        confusion = round(100.0 - score, 2)
        return jsonify({"confusion_score": confusion, "satisfaction_score": round(score, 2)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/")
def serve_index():
    return send_from_directory(PROJECT_ROOT, "index.html")


if __name__ == "__main__":
    print("=" * 50)
    print("  Prediction API running at http://localhost:5000")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=False)
