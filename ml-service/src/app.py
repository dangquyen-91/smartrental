import json
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException

from preprocess import AMENITY_PATTERNS, SEASON_BY_MONTH
from schemas import (
    HealthResponse, ModelMetrics, PredictBatchRequest, PredictBatchResponse,
    PredictRequest, PredictResponse, PriceRange,
)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

app = FastAPI(title="SmartRental Price Prediction Service")

_pipeline = None
_meta = None


@app.on_event("startup")
def load_model() -> None:
    global _pipeline, _meta
    model_path = MODELS_DIR / "price_model.joblib"
    meta_path = MODELS_DIR / "model_meta.json"
    if model_path.exists() and meta_path.exists():
        _pipeline = joblib.load(model_path)
        _meta = json.loads(meta_path.read_text(encoding="utf-8"))
    else:
        _pipeline = None
        _meta = None


def _current_season() -> str:
    from datetime import datetime
    return SEASON_BY_MONTH[datetime.now().month]


def _build_row_dict(req: PredictRequest) -> dict[str, object]:
    row: dict[str, object] = {
        "city": req.city,
        "district": req.district,
        "furniture": req.furniture,
        "condition": req.condition,
        "season": _current_season(),
    }
    amenity_set = set(req.amenities)
    matched = 0
    for col in _meta["numeric_cols"]:
        if col == "area":
            row[col] = req.area
        elif col == "bedrooms":
            row[col] = req.bedrooms
        elif col == "amenity_count":
            continue  # filled after counting matches below
        elif col.startswith("amenity__"):
            name = col[len("amenity__"):]
            hit = 1 if name in amenity_set else 0
            row[col] = hit
            matched += hit
        else:
            row[col] = 0
    if "amenity_count" in _meta["numeric_cols"]:
        row["amenity_count"] = matched
    return row


def _to_response(predicted: float) -> PredictResponse:
    predicted = max(round(predicted / 1000) * 1000, 0)
    best_metrics = _meta["metrics"][_meta["best_model"]]
    mae = best_metrics["test_mae"]
    return PredictResponse(
        predictedPrice=int(predicted),
        priceRange=PriceRange(min=int(max(predicted - mae, 0)), max=int(predicted + mae)),
        model=_meta["best_model"],
        modelMetrics=ModelMetrics(mae=mae, r2=best_metrics["test_r2"]),
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    if _pipeline is None:
        return HealthResponse(status="model_not_loaded")
    return HealthResponse(status="ok", model=_meta["best_model"], trainedAt=_meta["trained_at"])


@app.get("/amenities")
def amenities() -> list[str]:
    return list(AMENITY_PATTERNS.keys())


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    if _pipeline is None or _meta is None:
        raise HTTPException(status_code=503, detail="Model chưa được train/tải")

    row = pd.DataFrame([_build_row_dict(req)])
    predicted = float(_pipeline.predict(row)[0])
    return _to_response(predicted)


@app.post("/predict/batch", response_model=PredictBatchResponse)
def predict_batch(req: PredictBatchRequest) -> PredictBatchResponse:
    if _pipeline is None or _meta is None:
        raise HTTPException(status_code=503, detail="Model chưa được train/tải")
    if not req.items:
        return PredictBatchResponse(results=[])

    rows = pd.DataFrame([_build_row_dict(item) for item in req.items])
    predicted = _pipeline.predict(rows)
    return PredictBatchResponse(results=[_to_response(float(p)) for p in predicted])
