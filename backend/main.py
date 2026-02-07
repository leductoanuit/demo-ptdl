"""FastAPI backend for HCM Apartment Price Prediction.

Trains XGBoost model on startup, serves 4 API endpoints + health check.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Literal, Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import train_model, train_all_models, build_prediction_features, FEATURE_COLS

# --- Global state populated on startup ---
model = None
cached_stats: dict = {}
district_data: list[dict] = []
district_rank_map: dict[str, float] = {}
df_clean_global: pd.DataFrame = pd.DataFrame()
comparison_data: dict = {}


# --- Pydantic schemas ---
class PredictionInput(BaseModel):
    dien_tich: float = Field(gt=20, le=300, description="Area in m²")
    quan: str = Field(description="District name")
    so_phong: int = Field(ge=1, le=5, description="Number of bedrooms")
    so_wc: int = Field(ge=1, le=4, description="Number of bathrooms")
    noi_that: Literal["Cao_cap", "Day_du", "Co_ban", "Tho", "Khong_noi_that"]
    phap_ly: Literal["Dang_cho_so", "Hop_dong_dat_coc", "Hop_dong_mua_ban", "So_hong_rieng", "Khac"]
    khoang_cach_q1_km: float = Field(ge=0, le=25, description="Distance to District 1 in km")


class PredictionOutput(BaseModel):
    predicted_price: float
    price_per_m2: float
    district_avg_price: float
    comparison: str
    input_summary: dict


# --- Startup / shutdown ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, cached_stats, district_data, district_rank_map, df_clean_global, comparison_data

    csv_path = os.path.join(os.path.dirname(__file__), "data", "apartments.csv")
    print(f"Training model from {csv_path}...")

    model, r2, df_clean, rank_map = train_model(csv_path)
    df_clean_global = df_clean
    district_rank_map = rank_map
    print(f"Model trained. R² = {r2:.4f}, rows = {len(df_clean)}")

    # Cache stats
    cached_stats = {
        "total_listings": len(df_clean),
        "avg_price": float(df_clean["gia"].mean()),
        "avg_price_per_m2": float(df_clean["gia_m2"].mean()),
        "num_districts": df_clean["quan"].nunique(),
        "model_r2_score": round(r2, 4),
    }

    # Build district data
    district_agg = df_clean.groupby("quan").agg(
        avg_price=("gia", "mean"),
        avg_price_m2=("gia_m2", "mean"),
        count=("gia", "count"),
    ).reset_index()
    district_data = [
        {"name": row["quan"], "avg_price": round(row["avg_price"]), "avg_price_m2": round(row["avg_price_m2"], 2), "count": int(row["count"])}
        for _, row in district_agg.sort_values("avg_price", ascending=False).iterrows()
    ]

    # Train all models for comparison page
    print("Training comparison models...")
    comparison_data = train_all_models(csv_path)
    print(f"Comparison models trained: {len(comparison_data['metrics'])} models")

    yield  # app runs
    print("Shutting down...")


app = FastAPI(title="HCM Apartment Price Prediction API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---
@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}


@app.get("/api/stats")
def get_stats():
    return cached_stats


@app.get("/api/districts")
def get_districts():
    return district_data


@app.get("/api/model-comparison")
def get_model_comparison():
    """Return pre-computed model comparison data."""
    return comparison_data


@app.get("/api/chart-data")
def get_chart_data(district: Optional[str] = Query(default=None)):
    """Return pre-aggregated chart data. Optionally filter by district."""
    df = df_clean_global
    if district:
        df_filtered = df[df["quan"] == district]
    else:
        df_filtered = df

    # 1. Price by district (always show all districts)
    price_by_district = sorted(
        [{"district": d["name"], "avg_price_m2": d["avg_price_m2"]} for d in district_data],
        key=lambda x: x["avg_price_m2"], reverse=True,
    )

    # 2. Scatter: area vs price (max 500 points)
    sample = df_filtered.sample(n=min(500, len(df_filtered)), random_state=42) if len(df_filtered) > 0 else df_filtered
    area_price_data = [
        {"area": round(float(r["dien_tich"]), 1), "price": float(r["gia"])}
        for _, r in sample.iterrows()
    ]

    # 3. Price histogram (10 bins)
    if len(df_filtered) > 0:
        prices = df_filtered["gia"] / 1e9  # convert to billions
        counts, edges = np.histogram(prices, bins=10)
        price_bins = [
            {"range": f"{edges[i]:.1f}-{edges[i+1]:.1f}", "count": int(counts[i])}
            for i in range(len(counts))
        ]
    else:
        price_bins = []

    # 4. Feature importance from XGBoost
    importances = model.feature_importances_
    feature_importance = sorted(
        [{"feature": name, "importance": round(float(imp), 4)} for name, imp in zip(FEATURE_COLS, importances)],
        key=lambda x: x["importance"], reverse=True,
    )

    # 5. Legal status distribution (from full dataset, not filtered)
    legal_counts = df_clean_global["phap_ly"].value_counts()
    legal_status_distribution = [
        {"status": str(status), "count": int(count)}
        for status, count in legal_counts.items()
    ]

    return {
        "price_by_district": price_by_district,
        "area_price_data": area_price_data,
        "price_bins": price_bins,
        "feature_importance": feature_importance,
        "legal_status_distribution": legal_status_distribution,
    }


@app.post("/api/predict", response_model=PredictionOutput)
def predict(input_data: PredictionInput):
    # Get rank_quan for the selected district
    rank_quan = district_rank_map.get(input_data.quan)
    if rank_quan is None:
        # Fallback: use median rank if district not found
        rank_quan = float(np.median(list(district_rank_map.values())))

    features = build_prediction_features(
        dien_tich=input_data.dien_tich,
        so_phong=input_data.so_phong,
        so_wc=input_data.so_wc,
        khoang_cach_q1_km=input_data.khoang_cach_q1_km,
        rank_quan=rank_quan,
        phap_ly=input_data.phap_ly,
        noi_that=input_data.noi_that,
    )

    predicted_price = float(model.predict(features)[0])
    price_per_m2 = predicted_price / input_data.dien_tich

    # Find district avg price for comparison
    district_avg = next((d["avg_price"] for d in district_data if d["name"] == input_data.quan), predicted_price)
    if predicted_price > district_avg * 1.05:
        comparison = "Cao hơn trung bình quận"
    elif predicted_price < district_avg * 0.95:
        comparison = "Thấp hơn trung bình quận"
    else:
        comparison = "Ngang trung bình quận"

    return PredictionOutput(
        predicted_price=round(predicted_price),
        price_per_m2=round(price_per_m2),
        district_avg_price=round(district_avg),
        comparison=comparison,
        input_summary={
            "area": input_data.dien_tich,
            "district": input_data.quan,
            "bedrooms": input_data.so_phong,
            "bathrooms": input_data.so_wc,
        },
    )
