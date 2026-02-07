---
title: "Model Comparison Page Implementation"
description: "Add 'So sánh mô hình' page with metrics and charts comparing Linear, Ridge, RF, XGBoost"
status: pending
priority: P2
effort: 6h
branch: main
tags: [feature, ml, visualization, comparison]
created: 2026-02-07
---

# Model Comparison Page Implementation

## Overview

Add a dedicated "So sánh mô hình" (Model Comparison) page to visualize performance metrics and predictions across 4 ML models: Linear Regression, Ridge Regression, Random Forest, and XGBoost.

**Plan directory:** `/Users/cps/web-demo-ptdl/plans/260207-2327-model-comparison-page/`

## Phases

### Phase 1: Backend Model Comparison Endpoint
**File:** `phase-01-backend-model-comparison.md`
**Status:** Pending
**Effort:** 3h

- Train all 4 models on startup (LR, Ridge, RF, XGB)
- Create GET /api/model-comparison endpoint
- Return model metrics, prediction comparison, feature importance

### Phase 2: Frontend Model Comparison Page
**File:** `phase-02-frontend-model-comparison.md`
**Status:** Pending
**Effort:** 3h

- Add /models navigation link to navbar
- Create app/models/page.tsx with 3 charts
- Implement chart components for metrics, predictions, feature importance
- Add API integration and Vietnamese labels

## Key Decisions

- Store all 4 trained models in global state (startup overhead ~2-5s)
- Use same train/test split (random_state=42) for fair comparison
- Limit prediction comparison to ~50 test samples for chart clarity
- Feature importance: show only RF + XGB (tree-based models)

## Success Criteria

- [ ] All 4 models trained on startup without errors
- [ ] GET /api/model-comparison returns valid JSON with all data
- [ ] Nav link "So sánh mô hình" appears and routes to /models
- [ ] 3 charts render with Vietnamese labels
- [ ] XGBoost shows best R² score, consistent with existing /api/stats
- [ ] Page responsive, charts load within 2s

## Dependencies

- Existing: backend/main.py, backend/model.py, app/components/navbar.tsx
- Existing: lib/api.ts, lib/chart-utils.ts, Chart.js setup
- New: sklearn.linear_model, sklearn.ensemble

## Risks

- Model training time may increase startup (mitigate: parallel training if needed)
- Memory usage for 4 models (acceptable for demo with 2K rows)
- Feature importance different between RF/XGB (expected, document in UI)

## Related Files

- Backend: `backend/main.py`, `backend/model.py`
- Frontend: `app/components/navbar.tsx`, `app/models/page.tsx` (new)
- Lib: `lib/api.ts`, `lib/chart-utils.ts`
- Charts: `app/models/components/*.tsx` (new)

## Notes

- Follows existing patterns: dynamic chart imports, kebab-case files
- Reuses chart-utils.ts colors and formatters
- Maintains <200 lines per file guideline
