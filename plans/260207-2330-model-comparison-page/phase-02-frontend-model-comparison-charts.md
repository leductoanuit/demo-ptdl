# Phase 2: Frontend — Model Comparison Charts

## Context Links
- Parent: [plan.md](./plan.md)
- Phase 1: [phase-01-backend-multi-model-training.md](./phase-01-backend-multi-model-training.md)
- Chart utils: `lib/chart-utils.ts`
- Existing chart pattern: `app/dashboard/components/*.tsx`
- Navbar: `app/components/navbar.tsx`
- API client: `lib/api.ts`

## Overview
- **Priority:** High
- **Status:** Pending (blocked by Phase 1)
- **Description:** Create /models page with 3 comparison charts

## Key Insights
- Existing chart components use `react-chartjs-2` with `chartColors` and `defaultChartOptions` from `lib/chart-utils.ts`
- Dashboard page pattern: page.tsx registers Chart.js components, renders Cards with chart components
- ScatterElement needed for scatter chart (not yet registered in dashboard)
- Line plugin needed for diagonal reference line in scatter

## Requirements

### API Response Shape (from Phase 1)
```typescript
interface ModelComparisonResponse {
  metrics: { name: string; r2: number; rmse: number; mae: number }[];
  predictions: { actual: number; lr: number; ridge: number; rf: number; xgb: number }[];
  direction_accuracy: { name: string; accuracy: number }[];
  feature_importance: { feature: string; rf: number; xgb: number }[];
}
```

### Chart 1 — Model Performance Metrics (Grouped Bar)
- X-axis: metric names (R², RMSE, MAE)
- Y-axis: values
- 4 bars per metric group (one per model)
- Vietnamese labels
- Note: R² is 0-1 scale, RMSE/MAE are billion VND scale — use dual axis or normalize

**Better approach**: 3 separate mini-bars or a table+bar hybrid:
- Actually simplest: grouped bar with R² on left y-axis (0-1), RMSE/MAE on right y-axis (tỷ VND)
- Or: just show a grouped bar where each model is a group, 3 bars (R², RMSE_normalized, MAE_normalized)
- **Decision**: Show R² as main grouped bar (most intuitive), display RMSE/MAE as text stats below chart

### Chart 2 — Actual vs Predicted Scatter + Direction Accuracy
- Scatter plot: x = actual price, y = predicted price
- 4 datasets (one per model), different colors
- Diagonal reference line (y=x) for perfect prediction
- Direction accuracy shown as stat cards or annotation above chart
- Convert prices to tỷ VND for readability

### Chart 3 — Feature Importance (Horizontal Grouped Bar)
- Y-axis: feature names
- X-axis: importance values
- 2 bars per feature: RF (blue), XGBoost (amber)
- Vietnamese feature name mapping

## Architecture

```
app/models/
├── page.tsx                              — main page, data fetching, layout
└── components/
    ├── model-metrics-chart.tsx           — grouped bar for R², stats for RMSE/MAE
    ├── actual-vs-predicted-chart.tsx     — scatter with diagonal + direction accuracy
    └── model-feature-importance-chart.tsx — horizontal grouped bar RF vs XGB

lib/api.ts — add ModelComparisonResponse type + fetchModelComparison()
app/components/navbar.tsx — add "So sánh mô hình" link
```

## Related Code Files

### Modify
- `lib/api.ts` — add type + fetch function
- `app/components/navbar.tsx` — add nav link

### Create
- `app/models/page.tsx`
- `app/models/components/model-metrics-chart.tsx`
- `app/models/components/actual-vs-predicted-chart.tsx`
- `app/models/components/model-feature-importance-chart.tsx`

## Implementation Steps

1. **lib/api.ts — Add types and fetch function**
   ```typescript
   export interface ModelComparisonResponse {
     metrics: { name: string; r2: number; rmse: number; mae: number }[];
     predictions: { actual: number; lr: number; ridge: number; rf: number; xgb: number }[];
     direction_accuracy: { name: string; accuracy: number }[];
     feature_importance: { feature: string; rf: number; xgb: number }[];
   }

   export async function fetchModelComparison(): Promise<ModelComparisonResponse> {
     const response = await fetch(`${API_URL}/api/model-comparison`);
     if (!response.ok) throw new Error("Failed to fetch model comparison");
     return response.json();
   }
   ```

2. **app/components/navbar.tsx — Add nav link**
   - Add `{ href: "/models", label: "So sánh mô hình" }` to links array

3. **app/models/components/model-metrics-chart.tsx (~60 lines)**
   - Grouped bar chart: 4 models as datasets, R² as primary metric
   - Show RMSE and MAE as formatted text stats below
   - Use `chartColorsPalette` for 4 model colors
   - Vietnamese labels: "Hồi quy tuyến tính", "Ridge", "Random Forest", "XGBoost"

4. **app/models/components/actual-vs-predicted-chart.tsx (~80 lines)**
   - Scatter chart with 4 datasets
   - Add diagonal line using chartjs-plugin-annotation or manual dataset
   - Direction accuracy displayed as stat badges above chart
   - Prices in tỷ VND
   - Tooltip: "Thực tế: X tỷ | Dự đoán: Y tỷ"

5. **app/models/components/model-feature-importance-chart.tsx (~60 lines)**
   - Horizontal bar, `indexAxis: "y"`
   - 2 datasets: RF and XGBoost
   - Feature name mapping to Vietnamese

6. **app/models/page.tsx (~120 lines)**
   - Register Chart.js components (including ScatterElement, LineElement if needed)
   - Fetch data from /api/model-comparison
   - Loading skeleton (3 cards)
   - Error state
   - Layout: 3 Card components in grid

## Vietnamese Label Mapping

```typescript
const modelNames: Record<string, string> = {
  lr: "Hồi quy tuyến tính",
  ridge: "Ridge",
  rf: "Random Forest",
  xgb: "XGBoost",
};

const featureNames: Record<string, string> = {
  dien_tich: "Diện tích",
  so_phong: "Số phòng",
  so_wc: "Số WC",
  khoang_cach_q1_km: "K/c đến Q1",
  rank_quan: "Xếp hạng quận",
  tong_tien_ich: "Tổng tiện ích",
  phap_ly_Hop_dong_dat_coc: "HĐ đặt cọc",
  phap_ly_Hop_dong_mua_ban: "HĐ mua bán",
  phap_ly_Khac: "Pháp lý khác",
  phap_ly_So_hong_rieng: "Sổ hồng riêng",
  noi_that_Co_ban: "NT cơ bản",
  noi_that_Day_du: "NT đầy đủ",
  noi_that_Khong_noi_that: "Không NT",
  noi_that_Tho: "NT thô",
};
```

## Todo List

- [ ] Add ModelComparisonResponse type to lib/api.ts
- [ ] Add fetchModelComparison() to lib/api.ts
- [ ] Add nav link to navbar.tsx
- [ ] Create model-metrics-chart.tsx
- [ ] Create actual-vs-predicted-chart.tsx with diagonal line
- [ ] Create model-feature-importance-chart.tsx
- [ ] Create app/models/page.tsx with loading/error states
- [ ] Verify all charts render with Vietnamese labels
- [ ] Test responsive layout

## Success Criteria
- Nav link "So sánh mô hình" visible and active on /models
- 3 charts render correctly with data from API
- Diagonal reference line visible in scatter
- Direction accuracy % displayed per model
- Feature importance shows RF vs XGBoost side by side
- Page responsive on mobile (single column)
- All files < 200 lines

## Risk Assessment
- **Chart.js plugins**: Diagonal line may need `chartjs-plugin-annotation` — fallback: use a line dataset
- **ScatterElement**: Must register in Chart.js or scatter won't render
- **Dual-scale metrics**: R² (0-1) vs RMSE (billions) — solved by showing R² as bar, RMSE/MAE as text

## Security Considerations
- Read-only data display, no user input
- API URL from env variable (existing pattern)

## Next Steps
→ Test full flow: backend startup → API → frontend render
→ Update docs if needed
