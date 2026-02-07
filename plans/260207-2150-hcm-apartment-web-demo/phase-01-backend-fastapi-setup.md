# Phase 1: Backend FastAPI + XGBoost Model Setup

## Context Links
- Research: [researcher-02-backend-fastapi.md](./research/researcher-02-backend-fastapi.md)
- Data: `/Users/cps/web-demo-ptdl/data_bds_1.csv`
- Notebook: `/Users/cps/web-demo-ptdl/1_Final_Do_an_Mon_PTDL.ipynb`

## Overview
**Priority**: P1 (Critical)
**Status**: Pending
**Effort**: 2h
**Description**: Create FastAPI backend with XGBoost model trained on startup from CSV. Implement 3 endpoints for stats, districts, and price prediction with full feature engineering pipeline from notebook.

## Key Insights
- Train on startup for thesis demo flexibility (easy hyperparameter tuning)
- Single main.py file sufficient for 2400 rows
- Feature pipeline matches notebook exactly: IQR outlier removal, target encoding for districts, one-hot for phap_ly/noi_that
- CORS middleware essential for localhost:3000 frontend access

## Requirements

### Functional
- Train XGBoost model on startup with 80/20 train/test split
- Load CSV from /Users/cps/web-demo-ptdl/data_bds_1.csv
- Feature engineering: drop 13 columns, map phap_ly/noi_that, IQR outlier removal, create rank_quan + tong_tien_ich, one-hot encoding
- 4 endpoints: GET /api/stats, GET /api/districts, GET /api/chart-data, POST /api/predict
- Save trained model to backend/models/xgb_model.pkl
- Calculate and cache pre-aggregated stats on startup

### Non-Functional
- Model R² score ≈ 0.79 (notebook baseline)
- Training completes in <10 seconds
- Prediction latency < 100ms
- CORS allows localhost:3000

## Architecture

### Directory Structure
```
backend/
├── main.py              # FastAPI app + model training + endpoints
├── requirements.txt     # Dependencies
├── data/
│   └── apartments.csv   # Symlink to /Users/cps/web-demo-ptdl/data_bds_1.csv
└── models/
    └── xgb_model.pkl    # Trained model (auto-generated)
```

### Data Pipeline (from notebook)
1. **Load CSV**: 2400 rows × 23 columns
2. **Drop columns**: huong_nha, huong_ban_cong, gia_hien_thi, nguoi_ban, ngay_dang, loai_tin, link, tieu_de, duong, phuong, thanh_pho, latitude, longitude
3. **Map categorical**:
   - phap_ly: {2: "Dang_cho_so", 4: "Hop_dong_dat_coc", 5: "Hop_dong_mua_ban", 6: "So_hong_rieng"}
   - noi_that: {1: "Cao_cap", 2: "Day_du", 3: "Co_ban", 4: "Tho"}
4. **Fill NaN**: so_wc with median
5. **Drop rows**: NaN in gia or dien_tich
6. **Outlier removal**: IQR on gia and dien_tich, then gia > 500M and dien_tich > 20
7. **Feature engineering**:
   - rank_quan = avg gia_m2 per district (target encoding)
   - tong_tien_ich = so_phong + so_wc
8. **One-hot encoding**: phap_ly and noi_that (drop_first=True)
9. **Final features (14)**: dien_tich, so_phong, so_wc, khoang_cach_q1_km, rank_quan, tong_tien_ich, phap_ly_Hop_dong_dat_coc, phap_ly_Hop_dong_mua_ban, phap_ly_So_hong_rieng, noi_that_Co_ban, noi_that_Day_du, noi_that_Tho, noi_that_Khong (if missing = NaN)
10. **Target**: gia (price in VND)
11. **Model**: XGBoost(n_estimators=100, learning_rate=0.1, max_depth=6, random_state=42)

### API Endpoints

#### GET /api/stats
Response:
```json
{
  "total_listings": 2400,
  "avg_price": 3450000000,
  "avg_price_per_m2": 52000000,
  "num_districts": 16,
  "model_r2_score": 0.87
}
```

#### GET /api/districts
Response:
```json
[
  { "name": "Quận 1", "avg_price": 85000000, "count": 180 },
  { "name": "Quận 2", "avg_price": 72000000, "count": 210 },
  ...
]
```

#### POST /api/predict
Request body:
```json
{
  "dien_tich": 65.0,
  "quan": "Quận 7",
  "so_phong": 2,
  "so_wc": 2,
  "noi_that": "Day_du",
  "phap_ly": "So_hong_rieng",
  "khoang_cach_q1_km": 7.5
}
```

Response:
```json
{
  "predicted_price": 3800000000,
  "price_per_m2": 58461538,
  "district_avg_price": 55000000,
  "comparison": "Above average",
  "input_summary": {
    "area": 65.0,
    "district": "Quận 7",
    "bedrooms": 2,
    "bathrooms": 2
  }
}
```

## Related Code Files

### Files to Create
- `/Users/cps/web-demo-ptdl/backend/main.py` (~180 lines)
- `/Users/cps/web-demo-ptdl/backend/requirements.txt`
- `/Users/cps/web-demo-ptdl/backend/models/.gitkeep`

### Files to Modify
- None (new backend directory)

### Files to Delete
- None

## Implementation Steps

### 1. Create backend directory structure
```bash
mkdir -p /Users/cps/web-demo-ptdl/backend/models /Users/cps/web-demo-ptdl/backend/data
cd /Users/cps/web-demo-ptdl/backend
```

### 2. Create symlink to CSV
```bash
ln -s /Users/cps/web-demo-ptdl/data_bds_1.csv /Users/cps/web-demo-ptdl/backend/data/apartments.csv
```

### 3. Create requirements.txt
Dependencies:
```
fastapi==0.115.0
uvicorn[standard]==0.32.0
pandas==2.2.3
scikit-learn==1.5.2
xgboost==2.1.3
joblib==1.4.2
pydantic==2.10.4
```

### 4. Create main.py with following sections

#### 4.1. Import dependencies
- FastAPI, CORSMiddleware, BaseModel
- pandas, numpy for data processing
- XGBoost, scikit-learn (train_test_split, r2_score)
- joblib for model persistence

#### 4.2. Initialize FastAPI app
- Title: "HCM Apartment Price Prediction API"
- CORS middleware: allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]

#### 4.3. Define Pydantic schemas
- **PredictionInput**: dien_tich (float, gt=20, le=300), quan (str), so_phong (int, ge=1, le=5), so_wc (int, ge=1, le=4), noi_that (Literal["Cao_cap", "Day_du", "Co_ban", "Tho", "Khong_noi_that"]), phap_ly (Literal["Dang_cho_so", "Hop_dong_dat_coc", "Hop_dong_mua_ban", "So_hong_rieng", "Khac"]), khoang_cach_q1_km (float, ge=0, le=25)
- **PredictionOutput**: predicted_price, price_per_m2, district_avg_price, comparison, input_summary
- **StatsOutput**: total_listings, avg_price, avg_price_per_m2, num_districts, model_r2_score
- **DistrictOutput**: name, avg_price, count

#### 4.4. Global variables
- model = None
- cached_stats = {}
- district_data = []
- district_rank_map = {}

#### 4.5. Feature engineering function
```python
def engineer_features(df):
    # Drop unnecessary columns
    # Map phap_ly and noi_that
    # Fill so_wc NaN with median
    # Drop rows with NaN in gia/dien_tich
    # IQR outlier removal for gia and dien_tich
    # Filter: gia > 500M and dien_tich > 20
    # Calculate rank_quan (target encoding)
    # Create tong_tien_ich
    # One-hot encode phap_ly and noi_that
    return processed_df, rank_map
```

#### 4.6. Startup event handler (@app.on_event("startup"))
- Load CSV from data/apartments.csv
- Apply feature engineering
- Split train/test (80/20, random_state=42)
- Train XGBoost model
- Calculate R² score
- Save model to models/xgb_model.pkl
- Cache stats: total_listings, avg_price, avg_price_per_m2, num_districts, r2_score
- Build district_data list with avg prices
- Store district_rank_map for prediction

#### 4.7. GET /api/stats endpoint
- Return cached_stats

#### 4.8. GET /api/districts endpoint
- Return district_data sorted by avg_price descending

#### 4.9. GET /api/chart-data endpoint (optional query param: district)
- Return pre-aggregated chart data:
  - price_by_district: list of {district, avg_price_m2} sorted desc
  - area_price_data: list of {area, price} (scatter plot, max 500 points)
  - price_bins: list of {range, count} (histogram, ~10 bins from min to max price)
  - feature_importance: list of {feature, importance} from XGBoost model
  - legal_status_distribution: list of {status, count} from df_clean phap_ly value_counts
- If district param provided, filter area_price_data and price_bins by that district

#### 4.10. POST /api/predict endpoint
- Validate input with PredictionInput schema (includes khoang_cach_q1_km from user)
- Get rank_quan from district_rank_map
- Calculate tong_tien_ich = so_phong + so_wc
- Create feature DataFrame with one-hot encoding
- Predict price
- Calculate price_per_m2
- Get district_avg_price from district_data
- Determine comparison (Above/Below/Average)
- Return PredictionOutput

#### 4.10. Health check endpoint
```python
@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

### 5. Test endpoints locally
```bash
# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --reload --port 8000

# Test in browser
# http://localhost:8000/docs (FastAPI auto-docs)
# http://localhost:8000/health
# http://localhost:8000/api/stats
# http://localhost:8000/api/districts
```

### 6. Test prediction with curl
```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "dien_tich": 65,
    "quan": "Quận 7",
    "so_phong": 2,
    "so_wc": 2,
    "noi_that": "Day_du",
    "phap_ly": "So_hong_rieng"
  }'
```

## Todo List
- [ ] Create backend directory structure (models/, data/)
- [ ] Create symlink to CSV dataset
- [ ] Write requirements.txt with exact versions
- [ ] Implement feature engineering function matching notebook
- [ ] Create Pydantic schemas for validation
- [ ] Implement startup model training with caching
- [ ] Create /api/stats endpoint
- [ ] Create /api/districts endpoint
- [ ] Create /api/predict endpoint with district mapping
- [ ] Add CORS middleware configuration
- [ ] Test all endpoints with FastAPI /docs
- [ ] Verify model R² score > 0.85
- [ ] Test prediction with sample inputs
- [ ] Document district distance mapping (khoang_cach_q1_km)

## Success Criteria
- FastAPI server starts without errors
- Model trains in <10 seconds on startup
- R² score ≈ 0.79 logged in console
- /api/stats returns valid JSON with 5 fields
- /api/districts returns 16 districts sorted by price
- /api/predict returns price within 10% of notebook predictions for test inputs
- CORS allows fetch from localhost:3000
- /docs page renders all endpoints with schemas

## Risk Assessment
- **CSV path issues**: Symlink may break → Use absolute path or copy CSV
- **NaN handling**: Missing so_wc values → Fill with median before split
- **Outlier removal order**: IQR then hardcoded filters must match notebook
- **One-hot encoding**: Column names must match exactly for prediction
- **District mapping**: rank_quan must be derived from district name → Use pre-computed dict

## Security Considerations
- CORS restricted to localhost:3000 only
- No authentication needed (local thesis demo)
- Input validation with Pydantic (bounds checking)
- No file upload endpoints (CSV loaded on startup only)

## Next Steps
- After completion, proceed to Phase 2 (Frontend Shared Layout)
- Test backend endpoints before starting frontend integration
- Document exact district list and rank_quan values for frontend dropdown
