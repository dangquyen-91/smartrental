"""Train and compare RandomForest / XGBoost / LightGBM on the processed
rent-price dataset, then persist the best pipeline (preprocessing + model)
for serving via app.py.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBRegressor

PROCESSED_PATH = Path(__file__).resolve().parent.parent / "data" / "processed" / "dataset.csv"
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"

TARGET = "price_vnd"
CATEGORICAL_COLS = ["city", "district", "furniture", "condition", "season"]
RANDOM_STATE = 42


def load_dataset() -> tuple[pd.DataFrame, pd.Series, list[str]]:
    df = pd.read_csv(PROCESSED_PATH)
    numeric_cols = [c for c in df.columns if c not in CATEGORICAL_COLS + [TARGET]]
    X = df[CATEGORICAL_COLS + numeric_cols].copy()
    for col in numeric_cols:
        X[col] = X[col].astype(float)
    y = df[TARGET].astype(float)
    return X, y, numeric_cols


def build_preprocessor(numeric_cols: list[str]) -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_COLS),
            ("num", "passthrough", numeric_cols),
        ]
    )


def evaluate(model, X_train, y_train, X_test, y_test) -> dict:
    cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_mae = -cross_val_score(model, X_train, y_train, cv=cv, scoring="neg_mean_absolute_error", n_jobs=-1)

    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    return {
        "cv_mae_mean": float(cv_mae.mean()),
        "cv_mae_std": float(cv_mae.std()),
        "test_mae": float(mean_absolute_error(y_test, pred)),
        "test_rmse": float(np.sqrt(mean_squared_error(y_test, pred))),
        "test_r2": float(r2_score(y_test, pred)),
    }


def main() -> None:
    X, y, numeric_cols = load_dataset()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE)
    preprocessor = build_preprocessor(numeric_cols)

    candidates = {
        "random_forest": RandomForestRegressor(
            n_estimators=300, max_depth=None, min_samples_leaf=2,
            random_state=RANDOM_STATE, n_jobs=-1,
        ),
        "xgboost": XGBRegressor(
            n_estimators=400, learning_rate=0.05, max_depth=6,
            subsample=0.8, colsample_bytree=0.8,
            random_state=RANDOM_STATE, n_jobs=-1,
        ),
        "lightgbm": LGBMRegressor(
            n_estimators=400, learning_rate=0.05, max_depth=-1,
            subsample=0.8, colsample_bytree=0.8,
            random_state=RANDOM_STATE, n_jobs=-1, verbose=-1,
        ),
    }

    results = {}
    pipelines = {}
    for name, estimator in candidates.items():
        pipe = Pipeline([("prep", preprocessor), ("model", estimator)])
        metrics = evaluate(pipe, X_train, y_train, X_test, y_test)
        results[name] = metrics
        pipelines[name] = pipe
        print(f"[{name}] test_mae={metrics['test_mae']:.0f} test_r2={metrics['test_r2']:.3f}")

    best_name = min(results, key=lambda n: results[n]["test_mae"])
    best_pipeline = pipelines[best_name]

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_pipeline, MODELS_DIR / "price_model.joblib")

    meta = {
        "best_model": best_name,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(X),
        "numeric_cols": numeric_cols,
        "categorical_cols": CATEGORICAL_COLS,
        "metrics": results,
    }
    (MODELS_DIR / "model_meta.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    lines = ["# So sánh model dự đoán giá thuê", "", f"Dữ liệu: {len(X)} dòng (sau tiền xử lý)", "",
             "| Model | CV MAE (VND) | Test MAE (VND) | Test RMSE (VND) | Test R² |",
             "|---|---|---|---|---|"]
    for name, m in results.items():
        marker = " **(chọn)**" if name == best_name else ""
        lines.append(
            f"| {name}{marker} | {m['cv_mae_mean']:,.0f} | {m['test_mae']:,.0f} | "
            f"{m['test_rmse']:,.0f} | {m['test_r2']:.3f} |"
        )
    (REPORTS_DIR / "model_comparison.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"\nBest model: {best_name}")
    print(f"Saved pipeline to {MODELS_DIR / 'price_model.joblib'}")


if __name__ == "__main__":
    main()
