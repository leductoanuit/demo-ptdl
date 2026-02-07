# Phase 1: Backend — Multi-Model Training & API

## Context Links
- Parent: [plan.md](./plan.md)
- Backend model: `backend/model.py` (current XGBoost-only training)
- Backend API: `backend/main.py` (FastAPI endpoints)
- Data: `backend/data/apartments.csv`

## Overview
- **Priority:** High
- **Status:** Pending
- **Description:** Extend model.py to train 4 models, add comparison endpoint

## Key Insights
- Current `train_model()` returns single XGBoost model + r2 + df_clean + rank_map
- Feature engineering pipeline (load_and_clean → engineer_features) is reusable for all models
- `FEATURE_COLS` already defined, same features work for all 4 models
- Direction accuracy = % samples where (predicted > district_avg) == (actual > district_avg)

## Requirements

### Functional
- Train Linear Regression, Ridge, Random Forest, XGBoost with same data split
- Compute R², RMSE, MAE for each model
- Compute direction accuracy per model (above/below district avg)
- Return ~50 test sample predictions from each model
- Return feature importance for RF + XGBoost only

### Non-Functional
- Startup time increase < 5s for 4 models
- API response < 500ms (cached computation)

## Architecture

```
model.py:
  train_model() → unchanged (backward compat)
  train_all_models() → new function
    Returns: {
      models: dict of 4 trained models,
      metrics: [{name, r2, rmse, mae}, ...],
      predictions: [{actual, lr, ridge, rf, xgb}, ...] (50 samples),
      direction_accuracy: [{name, accuracy}, ...],
      feature_importance: [{feature, rf, xgb}, ...],
    }

main.py:
  GET /api/model-comparison → returns cached comparison data
```

## Related Code Files

### Modify
- `backend/model.py` — add `train_all_models()`
- `backend/main.py` — add global state for comparison data, new endpoint

### No New Files
- All changes in existing files

## Implementation Steps

1. **model.py — Add `train_all_models()` function**
   ```python
   from sklearn.linear_model import LinearRegression, Ridge
   from sklearn.ensemble import RandomForestRegressor
   from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
   ```
   - Reuse `load_and_clean()` and `engineer_features()`
   - Same `train_test_split(X, y, test_size=0.2, random_state=42)`
   - Train 4 models: LR, Ridge, RF(n_estimators=100, random_state=42), XGB(existing params)
   - Compute metrics per model: r2, rmse (sqrt of mse), mae
   - Select 50 random test samples, predict with each model
   - Direction accuracy: for each test sample, compare (pred > district_avg_for_that_sample) vs (actual > district_avg)
     - Need district avg per sample: use `rank_quan` as proxy or compute from df_clean
   - Feature importance: `model.feature_importances_` for RF and XGB
   - Return structured dict

2. **main.py — Store comparison data on startup**
   - Add `comparison_data: dict = {}` global
   - In lifespan, after existing model training, call `train_all_models(csv_path)`
   - Cache full response dict

3. **main.py — Add GET /api/model-comparison endpoint**
   - Return cached comparison_data dict
   - No query params needed

4. **Direction accuracy calculation logic:**
   ```python
   # For each test sample i:
   # Get the district avg price for that sample's district
   # direction_correct = (y_pred[i] > district_avg) == (y_test[i] > district_avg)
   # accuracy = sum(direction_correct) / len(y_test)
   ```
   - Need to map test indices back to districts
   - Use df_clean to get district info for each test sample

## Todo List

- [ ] Add sklearn imports (LinearRegression, Ridge, RandomForestRegressor)
- [ ] Add sklearn metrics imports (mean_squared_error, mean_absolute_error)
- [ ] Implement `train_all_models()` in model.py
- [ ] Compute direction accuracy using district averages
- [ ] Add comparison_data global in main.py
- [ ] Call train_all_models() in lifespan
- [ ] Add GET /api/model-comparison endpoint
- [ ] Test endpoint returns correct JSON structure

## Success Criteria
- All 4 models train without errors
- Metrics (R², RMSE, MAE) computed correctly
- Direction accuracy between 50-100% (sanity check)
- 50 prediction samples returned
- Feature importance arrays match FEATURE_COLS length
- Endpoint returns JSON within 200ms

## Risk Assessment
- **Startup time**: 4 models ~2-5s extra (acceptable for demo)
- **Memory**: 4 models in memory ~20-50MB (fine for demo)
- **sklearn version**: LinearRegression/Ridge/RF available in scikit-learn >= 0.20

## Security Considerations
- Read-only endpoint, no user input
- No PII exposed in response

## Next Steps
→ Phase 2: Frontend charts consuming this endpoint
