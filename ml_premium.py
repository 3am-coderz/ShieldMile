import xgboost as xgb
import shap
import pandas as pd
import numpy as np
from mock_data.worker_history_mock import get_worker

_model = None
_explainer = None
_drift_stats = {"predictions": [], "actuals": [], "drift_detected": False}

FEATURE_NAMES = [
    "rainfall_7d_avg", "wind_7d_avg", "visibility_7d_avg",
    "zone_flood_history", "season_monsoon",
    "worker_reliability_score", "rain_velocity_change",
]


def _initialize_model():
    global _model, _explainer
    if _model is not None:
        return

    N = 2000
    np.random.seed(42)
    X = pd.DataFrame({
        "rainfall_7d_avg":          np.random.uniform(0, 50, N),
        "wind_7d_avg":              np.random.uniform(5, 60, N),
        "visibility_7d_avg":        np.random.uniform(2, 10, N),
        "zone_flood_history":       np.random.randint(0, 2, N),
        "season_monsoon":           np.random.randint(0, 2, N),
        "worker_reliability_score": np.random.uniform(60, 100, N),
        "rain_velocity_change":     np.random.uniform(-10, 20, N),
    })

    # Synthetic risk score target (0-100)
    y = (
        X["rainfall_7d_avg"] * 0.8
        + X["wind_7d_avg"] * 0.4
        + (10 - X["visibility_7d_avg"]) * 2
        + X["zone_flood_history"] * 15
        + X["season_monsoon"] * 10
        - (X["worker_reliability_score"] - 60) * 0.5
        + X["rain_velocity_change"] * 0.3
    )
    y = np.clip(y, 0, 100)

    _model = xgb.XGBRegressor(
        n_estimators=50, max_depth=4, learning_rate=0.1, random_state=42
    )
    _model.fit(X, y)
    _explainer = shap.TreeExplainer(_model)


def get_premium_and_explanation(worker_id: str) -> dict:
    """
    Returns dict with premium, risk_score, explanation text,
    SHAP breakdown dict, and feature values.
    Premium tiers: 0-25 → ₹20, 26-50 → ₹40, 51-75 → ₹60, 76-100 → ₹80-100
    """
    _initialize_model()

    worker = get_worker(worker_id)
    if not worker:
        return {
            "premium": 20, "risk_score": 0.0,
            "explanation": "Unknown worker", "shap_breakdown": {},
            "features": {},
        }

    np.random.seed(hash(worker_id) % 2**31)
    features = {
        "rainfall_7d_avg":          round(np.random.uniform(10, 40), 1),
        "wind_7d_avg":              round(np.random.uniform(10, 30), 1),
        "visibility_7d_avg":        round(np.random.uniform(4, 10), 1),
        "zone_flood_history":       worker.get("flood_zone", 0),
        "season_monsoon":           1,
        "worker_reliability_score": float(worker["reliability_score"]),
        "rain_velocity_change":     round(np.random.uniform(-5, 15), 1),
    }

    df = pd.DataFrame([features])
    risk_score = float(np.clip(_model.predict(df)[0], 0, 100))

    # Premium tier mapping
    if risk_score <= 25:
        premium = 20
    elif risk_score <= 50:
        premium = 40
    elif risk_score <= 75:
        premium = 60
    else:
        premium = int(80 + (risk_score - 75) * 0.8)  # 80-100

    # SHAP explainability
    shap_values = _explainer.shap_values(df)
    shap_dict = {}
    explanation_parts = []

    feature_labels = {
        "rainfall_7d_avg": "Avg rainfall (7d)",
        "wind_7d_avg": "Avg wind speed (7d)",
        "visibility_7d_avg": "Avg visibility (7d)",
        "zone_flood_history": "Flood history",
        "season_monsoon": "Monsoon season",
        "worker_reliability_score": "Your reliability",
        "rain_velocity_change": "Rain acceleration",
    }

    for i, col in enumerate(df.columns):
        val = float(shap_values[0][i])
        shap_dict[col] = round(val, 2)
        monetary = round(abs(val) * 0.5, 0)
        if monetary >= 1:
            sign = "+" if val >= 0 else "-"
            label = feature_labels.get(col, col)
            explanation_parts.append(f"{label} {sign}₹{int(monetary)}")

    explanation = (
        f"Your premium is ₹{premium} because: "
        + ", ".join(explanation_parts)
        + f". Total: ₹{premium}/week"
    )

    # Track for drift detection
    _drift_stats["predictions"].append(risk_score)

    return {
        "premium": premium,
        "risk_score": round(risk_score, 1),
        "explanation": explanation,
        "shap_breakdown": shap_dict,
        "features": features,
    }


def check_drift() -> dict:
    """Model monitoring: check for data/concept drift."""
    preds = _drift_stats["predictions"]
    if len(preds) < 10:
        return {"status": "insufficient_data", "drift": False}
    recent = preds[-10:]
    overall_mean = np.mean(preds)
    recent_mean = np.mean(recent)
    drift_pct = abs(recent_mean - overall_mean) / (overall_mean + 1e-9) * 100
    drifted = drift_pct > 5
    _drift_stats["drift_detected"] = drifted
    return {
        "status": "retrain_needed" if drifted else "stable",
        "drift": drifted,
        "drift_pct": round(drift_pct, 2),
        "overall_mean": round(overall_mean, 2),
        "recent_mean": round(recent_mean, 2),
    }
