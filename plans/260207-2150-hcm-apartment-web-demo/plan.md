---
title: "HCM Apartment Price Analysis Web Demo"
description: "Full platform with dashboard + ML prediction for apartment prices"
status: pending
priority: P1
effort: 6h
branch: main
tags: [nextjs, fastapi, xgboost, dashboard, chart.js]
created: 2026-02-07
---

# HCM Apartment Price Analysis - Full Platform Plan

## Overview
University thesis web demo with 3-page Next.js frontend + FastAPI backend serving XGBoost model trained on 2400 HCM apartment listings.

## Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Chart.js
- **Backend**: FastAPI, XGBoost, pandas, scikit-learn
- **Data**: 2400 rows CSV with 23 columns → 14 engineered features
- **Deployment**: Local only (localhost:3000 frontend, localhost:8000 backend)

## Phases

### [Phase 1] Backend FastAPI + XGBoost Model
**File**: [phase-01-backend-fastapi-setup.md](./phase-01-backend-fastapi-setup.md)
**Status**: Pending
**Effort**: 2h
- Train XGBoost model on startup from CSV with feature pipeline from notebook
- 3 endpoints: /api/stats, /api/districts, /api/predict
- CORS middleware for localhost:3000

### [Phase 2] Frontend Shared Layout
**File**: [phase-02-frontend-shared-layout.md](./phase-02-frontend-shared-layout.md)
**Status**: Pending
**Effort**: 1h
- Install shadcn/ui components (card, select, input, form, button, label)
- Navbar with 3 links (Vietnamese UI)
- Root layout update

### [Phase 3] Landing Page
**File**: [phase-03-landing-page.md](./phase-03-landing-page.md)
**Status**: Pending
**Effort**: 1h
- Hero section with project title
- 4 stats cards from /api/stats (total listings, avg price, num districts, R² score)

### [Phase 4] Dashboard Charts
**File**: [phase-04-dashboard-charts.md](./phase-04-dashboard-charts.md)
**Status**: Pending
**Effort**: 1.5h
- Install react-chartjs-2 + chart.js
- 5 Chart.js charts with district filter dropdown
- Dynamic imports with SSR disabled

### [Phase 5] Prediction Page
**File**: [phase-05-prediction-page.md](./phase-05-prediction-page.md)
**Status**: Pending
**Effort**: 1h
- Form with 7 fields (controlled state, includes khoang_cach_q1_km)
- POST to /api/predict via lib/api.ts
- Display predicted price + price/m² + district comparison

## Success Criteria
- All pages render without errors
- Charts load and filter correctly
- Prediction form validates and returns accurate results
- Model R² ≈ 0.79 (from notebook baseline)
- Vietnamese UI text throughout
- No compilation errors

## Dependencies
- Phase 2 depends on Phase 1 (API endpoints required)
- Phase 3, 4, 5 depend on Phase 2 (shared layout + components)
- Phase 4 depends on Phase 1 (/api/stats, /api/districts)
- Phase 5 depends on Phase 1 (/api/predict)

## Notes
- Keep all files under 200 lines
- Use kebab-case for filenames
- Backend runs on port 8000, frontend on port 3000
- No authentication required (thesis demo)
