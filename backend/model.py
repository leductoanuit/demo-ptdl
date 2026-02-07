"""XGBoost model training and prediction for HCM apartment prices.

Replicates the exact feature engineering pipeline from the thesis notebook:
1. Drop unnecessary columns
2. Map phap_ly/noi_that codes to strings
3. Fill NaN, remove outliers (IQR + business rules)
4. Target encoding for districts (rank_quan)
5. One-hot encoding for phap_ly/noi_that
6. Train XGBoost model
"""

from __future__ import annotations

import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score
from xgboost import XGBRegressor

# Columns to drop during cleaning (matching notebook exactly)
COLS_TO_DROP = [
    "huong_nha", "huong_ban_cong", "gia_hien_thi", "nguoi_ban",
    "ngay_dang", "loai_tin", "link", "tieu_de", "duong", "phuong",
    "thanh_pho", "latitude", "longitude",
]

PHAP_LY_MAP = {2: "Dang_cho_so", 4: "Hop_dong_dat_coc", 5: "Hop_dong_mua_ban", 6: "So_hong_rieng"}
NOI_THAT_MAP = {1: "Cao_cap", 2: "Day_du", 3: "Co_ban", 4: "Tho"}

# One-hot encoded feature columns expected by the model (after drop_first=True)
ONEHOT_PHAP_LY = ["phap_ly_Hop_dong_dat_coc", "phap_ly_Hop_dong_mua_ban", "phap_ly_Khac", "phap_ly_So_hong_rieng"]
ONEHOT_NOI_THAT = ["noi_that_Co_ban", "noi_that_Day_du", "noi_that_Khong_noi_that", "noi_that_Tho"]
FEATURE_COLS = [
    "dien_tich", "so_phong", "so_wc", "khoang_cach_q1_km",
    "rank_quan", "tong_tien_ich",
    *ONEHOT_PHAP_LY, *ONEHOT_NOI_THAT,
]


def _remove_outliers_iqr(df: pd.DataFrame, column: str) -> pd.DataFrame:
    """Remove outliers using IQR method (matching notebook)."""
    q1 = df[column].quantile(0.25)
    q3 = df[column].quantile(0.75)
    iqr = q3 - q1
    return df[(df[column] >= q1 - 1.5 * iqr) & (df[column] <= q3 + 1.5 * iqr)]


def load_and_clean(csv_path: str) -> pd.DataFrame:
    """Load CSV and apply full cleaning pipeline from notebook."""
    df = pd.read_csv(csv_path)
    df_clean = df.drop(columns=[c for c in COLS_TO_DROP if c in df.columns])

    # Map categorical codes to strings
    df_clean["phap_ly"] = df_clean["phap_ly"].map(PHAP_LY_MAP).fillna("Khac")
    df_clean["noi_that"] = df_clean["noi_that"].map(NOI_THAT_MAP).fillna("Khong_noi_that")

    # Handle missing values
    df_clean["so_wc"] = df_clean["so_wc"].fillna(df_clean["so_wc"].median())
    df_clean = df_clean.dropna(subset=["gia", "dien_tich"])

    # Outlier removal: IQR then business rules
    df_clean = _remove_outliers_iqr(df_clean, "gia")
    df_clean = _remove_outliers_iqr(df_clean, "dien_tich")
    df_clean = df_clean[(df_clean["gia"] > 500_000_000) & (df_clean["dien_tich"] > 20)]

    return df_clean


def engineer_features(df_clean: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, float]]:
    """Apply feature engineering: rank_quan, tong_tien_ich, one-hot encoding.

    Returns (feature_df_with_target, district_rank_map).
    """
    # Target encoding: avg gia_m2 per district
    rank_map = df_clean.groupby("quan")["gia_m2"].mean().to_dict()
    df_clean = df_clean.copy()
    df_clean["rank_quan"] = df_clean["quan"].map(rank_map)
    df_clean["tong_tien_ich"] = df_clean["so_phong"] + df_clean["so_wc"]

    # Prepare X with one-hot encoding
    features_drop = ["gia", "gia_m2", "ten_du_an", "quan"]
    X = df_clean.drop(columns=[c for c in features_drop if c in df_clean.columns])
    X = pd.get_dummies(X, columns=["phap_ly", "noi_that"], drop_first=True)

    # Ensure all expected columns exist (some categories may be absent after outlier removal)
    for col in FEATURE_COLS:
        if col not in X.columns:
            X[col] = False
    X = X[FEATURE_COLS]

    return X, df_clean["gia"], rank_map


def train_model(csv_path: str) -> tuple[XGBRegressor, float, pd.DataFrame, dict]:
    """Full pipeline: load → clean → engineer → train. Returns (model, r2, df_clean, rank_map)."""
    df_clean = load_and_clean(csv_path)
    X, y, rank_map = engineer_features(df_clean)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)

    return model, r2, df_clean, rank_map


def build_prediction_features(
    dien_tich: float, so_phong: int, so_wc: int,
    khoang_cach_q1_km: float, rank_quan: float,
    phap_ly: str, noi_that: str,
) -> pd.DataFrame:
    """Build a single-row DataFrame with one-hot encoding for prediction."""
    row = {col: 0 for col in FEATURE_COLS}
    row["dien_tich"] = dien_tich
    row["so_phong"] = so_phong
    row["so_wc"] = so_wc
    row["khoang_cach_q1_km"] = khoang_cach_q1_km
    row["rank_quan"] = rank_quan
    row["tong_tien_ich"] = so_phong + so_wc

    # One-hot: phap_ly (base = Dang_cho_so, dropped first)
    phap_ly_col = f"phap_ly_{phap_ly}"
    if phap_ly_col in row:
        row[phap_ly_col] = 1

    # One-hot: noi_that (base = Cao_cap, dropped first)
    noi_that_col = f"noi_that_{noi_that}"
    if noi_that_col in row:
        row[noi_that_col] = 1

    return pd.DataFrame([row])[FEATURE_COLS]
