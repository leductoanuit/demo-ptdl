---
title: "Model Comparison Page"
description: "Add /models page with 3 charts: model metrics, actual vs predicted + direction accuracy, feature importance"
status: complete
priority: P2
effort: 5h
branch: main
tags: [feature, ml, visualization, comparison]
created: 2026-02-07
---

# Model Comparison Page

## Overview

Add "So sánh mô hình" page at `/models` with 3 charts comparing Linear Regression, Ridge, Random Forest, XGBoost on HCM apartment price data.

## Phases

### Phase 1: Backend — Multi-Model Training & API
**File:** `phase-01-backend-multi-model-training.md`
**Status:** Complete | **Effort:** 2.5h

- Refactor `model.py` to train 4 models (LR, Ridge, RF, XGB)
- Add `train_all_models()` returning metrics, predictions, feature importance
- New `GET /api/model-comparison` endpoint in `main.py`
- Compute direction accuracy per model

### Phase 2: Frontend — Model Comparison Charts
**File:** `phase-02-frontend-model-comparison-charts.md`
**Status:** Complete | **Effort:** 2.5h

- Add `/models` route with `app/models/page.tsx`
- 3 chart components: metrics bar, scatter + direction, feature importance
- Add "So sánh mô hình" nav link
- API type + fetch function in `lib/api.ts`

## Key Decisions

- Train all 4 models on startup, store in global dict
- Same train/test split (random_state=42) for fair comparison
- Direction = predicted above/below district avg vs actual above/below
- Feature importance: RF + XGBoost only (tree-based)
- Limit scatter to ~50 test samples

## Dependencies

- `backend/model.py`, `backend/main.py`
- `app/components/navbar.tsx`, `lib/api.ts`, `lib/chart-utils.ts`
- New: `sklearn.linear_model`, `sklearn.ensemble`

## Success Criteria

- [ ] 4 models trained on startup
- [ ] GET /api/model-comparison returns valid JSON
- [ ] Nav link "So sánh mô hình" routes to /models
- [ ] 3 charts render with Vietnamese labels
- [ ] Direction accuracy displayed per model
- [ ] Page responsive, loads within 2s
