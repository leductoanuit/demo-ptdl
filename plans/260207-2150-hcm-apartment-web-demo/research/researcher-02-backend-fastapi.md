# FastAPI + XGBoost Model Serving Research Report

**Date:** 2026-02-07
**Context:** HCM apartment price prediction API (2400 rows, 14 features, local deployment)
**Target:** University thesis demo with FastAPI serving XGBoost model

---

## 1. Project Structure

### Recommended: Single-File for Thesis Demo
For 2400-row dataset, single `main.py` sufficient. Modular structure only if extending.

**Single File Pattern:**
```
project/
├── main.py              # FastAPI app + model loading + endpoints
├── requirements.txt
├── data/
│   └── apartments.csv
└── models/
    └── xgb_model.pkl    # Saved model (optional)
```

**Modular Pattern** (if needed):
```
project/
├── app/
│   ├── main.py          # FastAPI app
│   ├── model.py         # Model loading logic
│   ├── schemas.py       # Pydantic models
│   └── utils.py         # Feature engineering
├── data/
└── models/
```

---

## 2. Loading Pre-trained Model on Startup

**Pattern:** Use `@app.on_event("startup")` with joblib for scikit-learn pipelines.

```python
import joblib
from fastapi import FastAPI

app = FastAPI()
model = None

@app.on_event("startup")
def load_model():
    global model
    model = joblib.load("models/xgb_model.pkl")
    print("Model loaded successfully")

@app.post("/predict")
def predict(data: PredictionInput):
    prediction = model.predict(data.to_dataframe())
    return {"price": float(prediction[0])}
```

**Key Points:**
- `joblib.load()` for scikit-learn pipelines (handles feature engineering + XGBoost)
- Global variable pattern acceptable for single-model serving
- Version pinning critical: same XGBoost/sklearn versions for train/serve

---

## 3. Training Model on Startup from CSV

**Pattern:** Train during startup if no saved model exists (thesis demo flexibility).

```python
import pandas as pd
import xgboost as xgb
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from category_encoders import TargetEncoder

@app.on_event("startup")
def train_model():
    global model

    # Load data
    df = pd.read_csv("data/apartments.csv")
    X = df.drop("gia_thue", axis=1)
    y = df["gia_thue"]

    # Feature engineering pipeline
    numeric_features = ["dien_tich", "so_phong", "so_wc", "khoang_cach_q1_km",
                        "rank_quan", "tong_tien_ich"]
    categorical_onehot = ["phap_ly", "noi_that"]

    preprocessor = ColumnTransformer([
        ("num", StandardScaler(), numeric_features),
        ("cat_onehot", OneHotEncoder(drop="first", sparse_output=False), categorical_onehot)
    ])

    # Pipeline: preprocessing + XGBoost
    model = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        ))
    ])

    model.fit(X, y)
    joblib.dump(model, "models/xgb_model.pkl")
    print("Model trained and saved")
```

**Target Encoding Alternative:**
```python
from category_encoders import TargetEncoder

# Use for high-cardinality features (e.g., district names)
target_encoder = TargetEncoder(cols=["quan"])
```

**For Thesis:** Train on startup = easy to modify features/hyperparameters during demo.

---

## 4. CORS Middleware Setup

**Pattern:** Allow localhost:3000 for Next.js frontend.

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Development Shortcut:**
```python
allow_origins=["*"]  # Allow all origins (local dev only)
```

**Key Parameters:**
- `allow_credentials=True`: Required for cookies/auth headers
- `allow_methods=["*"]`: Permit all HTTP methods (GET, POST, OPTIONS)
- `allow_headers=["*"]`: Accept all headers from frontend

---

## 5. Prediction Endpoint Best Practices

**Pattern:** Pydantic validation + metadata response.

```python
from pydantic import BaseModel, Field, field_validator
from typing import Literal
import pandas as pd

# Input validation
class PredictionInput(BaseModel):
    dien_tich: float = Field(gt=0, description="Area in m²")
    so_phong: int = Field(ge=1, le=10)
    so_wc: int = Field(ge=1, le=5)
    khoang_cach_q1_km: float = Field(ge=0)
    rank_quan: int = Field(ge=1, le=24)
    tong_tien_ich: int = Field(ge=0)
    phap_ly: Literal["so_do", "so_hong", "giay_to_khac"]
    noi_that: Literal["cao_cap", "day_du", "co_ban", "trong"]

    @field_validator("dien_tich")
    def validate_area(cls, v):
        if v > 500:
            raise ValueError("Area too large (max 500m²)")
        return v

    def to_dataframe(self):
        return pd.DataFrame([self.model_dump()])

# Output with metadata
class PredictionOutput(BaseModel):
    predicted_price: float
    price_per_m2: float
    confidence: str
    input_summary: dict

@app.post("/predict", response_model=PredictionOutput)
def predict(data: PredictionInput):
    # Predict
    df = data.to_dataframe()
    prediction = model.predict(df)[0]

    # Metadata
    price_per_m2 = prediction / data.dien_tich
    confidence = "high" if data.rank_quan <= 5 else "medium"

    return PredictionOutput(
        predicted_price=round(prediction, 2),
        price_per_m2=round(price_per_m2, 2),
        confidence=confidence,
        input_summary={
            "area": data.dien_tich,
            "location_rank": data.rank_quan
        }
    )
```

**Validation Best Practices:**
- Use `Field()` constraints (gt, ge, le) for numeric bounds
- `Literal[]` for categorical validation (autocomplete in IDEs)
- `@field_validator` for custom business logic
- Return structured output with `response_model` for auto-documentation

---

## Complete Example (Single File)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pandas as pd
import xgboost as xgb
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
import os

app = FastAPI(title="HCM Apartment Price Prediction API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None

# Pydantic schemas
class ApartmentInput(BaseModel):
    dien_tich: float = Field(gt=0)
    so_phong: int = Field(ge=1)
    so_wc: int = Field(ge=1)
    khoang_cach_q1_km: float
    rank_quan: int
    tong_tien_ich: int
    phap_ly: str
    noi_that: str

    def to_dataframe(self):
        return pd.DataFrame([self.model_dump()])

@app.on_event("startup")
def load_or_train_model():
    global model
    model_path = "models/xgb_model.pkl"

    if os.path.exists(model_path):
        model = joblib.load(model_path)
    else:
        # Train model
        df = pd.read_csv("data/apartments.csv")
        X = df.drop("gia_thue", axis=1)
        y = df["gia_thue"]

        preprocessor = ColumnTransformer([
            ("num", StandardScaler(),
             ["dien_tich", "so_phong", "so_wc", "khoang_cach_q1_km", "rank_quan", "tong_tien_ich"]),
            ("cat", OneHotEncoder(drop="first"), ["phap_ly", "noi_that"])
        ])

        model = Pipeline([
            ("prep", preprocessor),
            ("xgb", xgb.XGBRegressor(n_estimators=100, max_depth=6))
        ])

        model.fit(X, y)
        os.makedirs("models", exist_ok=True)
        joblib.dump(model, model_path)

@app.post("/predict")
def predict(data: ApartmentInput):
    prediction = model.predict(data.to_dataframe())[0]
    return {
        "predicted_price": float(prediction),
        "price_per_m2": float(prediction / data.dien_tich)
    }

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

---

## Deployment Commands

```bash
# Install dependencies
pip install fastapi uvicorn xgboost scikit-learn pandas joblib

# Run server
uvicorn main:app --reload --port 8000

# API docs
# http://localhost:8000/docs
```

---

## Sources

- [Serve any XGBoost model with FastAPI in less than 40 lines](https://medium.com/predictly-on-tech/serve-any-xgboost-model-with-fastapi-in-less-than-40-lines-85adbb3c43b8)
- [Deploy XGBoost Model As Service with FastAPI](https://xgboosting.com/deploy-xgboost-model-as-service-with-fastapi/)
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
- [FastAPI Best Practices](https://github.com/zhanymkanov/fastapi-best-practices)
- [Feature Engineering for XGBoost Models](https://www.geeksforgeeks.org/machine-learning/feature-engineering-for-xgboost-models/)
- [XGBoost Categorical Features Pipeline](https://xgboost.readthedocs.io/en/latest/python/examples/cat_pipeline.html)
