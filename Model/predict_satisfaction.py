import pickle
import numpy as np
import pandas as pd

MODEL_PKL_PATH = "outputs/xgb_satisfaction_model.pkl"

def predict_one(session: dict) -> float:
    with open(MODEL_PKL_PATH, "rb") as f:
        bundle = pickle.load(f)

    model = bundle["model"]
    imputer = bundle["imputer"]
    feature_cols = bundle["feature_cols"]

    # Base dataframe
    df = pd.DataFrame([session])

    # Add engineered features (must match training)
    df["time_per_click"] = df["task_time"] / (df["click_count"] + 1.0)
    df["errors_per_click"] = df["form_errors"] / (df["click_count"] + 1.0)
    df["rage_per_click"] = df["rage_clicks"] / (df["click_count"] + 1.0)
    df["backtracks_per_click"] = df["backtracks"] / (df["click_count"] + 1.0)
    df["friction_index"] = (
        0.45 * (df["task_time"] - 10) / (180 - 10) +
        0.25 * (df["form_errors"] - 0) / (10 - 0) +
        0.15 * (df["rage_clicks"] - 0) / (8 - 0) +
        0.08 * (df["backtracks"] - 0) / (20 - 0) +
        0.05 * (df["click_count"] - 1) / (50 - 1) +
        0.02 * (df["hover_time"] - 0) / (10 - 0)
    ).clip(0, 2)

    X = df[feature_cols]
    X_i = imputer.transform(X)
    pred = model.predict(X_i)[0]
    return float(np.clip(pred, 0, 100))


if __name__ == "__main__":
    example = {
        "backtracks": 11,
        "click_count": 7,
        "form_errors": 0,
        "hover_time": 0.8,
        "rage_clicks": 0,
        "task_time": 55,
    }
    print("Predicted satisfaction:", predict_one(example))