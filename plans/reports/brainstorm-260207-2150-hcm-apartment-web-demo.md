# Brainstorm: Web Demo - Phân tích giá căn hộ TP.HCM

## Problem Statement
Build web demo cho đồ án "Phân tích các yếu tố ảnh hưởng đến giá căn hộ chung cư tại TP.HCM". Data: 2400 listings từ chotot.com, models: XGBoost (R2=0.79).

## Chosen Approach: Full Platform (Dashboard + Prediction)

### Architecture
- **Frontend**: Next.js 16 + shadcn/ui + Tailwind v4 + Chart.js
- **Backend**: FastAPI (Python) + XGBoost + pandas
- **Data**: data_bds_1.csv (static, local)
- **Deploy**: Local only

### Pages
1. `/` - Landing page: overview stats
2. `/dashboard` - Interactive charts (5 charts)
3. `/predict` - Price prediction form → FastAPI → result

### API Endpoints
- `POST /api/predict` - XGBoost prediction
- `GET /api/stats` - Aggregated dashboard data
- `GET /api/districts` - District list + avg prices

### Charts (Chart.js)
1. Bar: Giá TB/m2 theo quận
2. Scatter: Diện tích vs Giá
3. Histogram: Phân phối giá
4. Bar: Feature importance
5. Doughnut: Phân bố pháp lý/nội thất

### Risks
- CORS → FastAPI middleware
- Edge case accuracy → disclaimer
- Large data → pre-aggregate on backend
