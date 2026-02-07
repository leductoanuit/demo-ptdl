# Phase 5: Prediction Page with Form

## Context Links
- Research: [researcher-01-frontend-chartjs.md](./research/researcher-01-frontend-chartjs.md)
- Backend API: Phase 1 - POST /api/predict
- Components: Phase 2 - shadcn/ui Card, Select, Input, Button, Label

## Overview
**Priority**: P1
**Status**: Pending
**Effort**: 1h
**Description**: Build prediction form with 6 fields. User inputs apartment features, form POSTs to FastAPI, displays predicted price with district comparison.

## Key Insights
- Use controlled state (simpler than React Hook Form for 6 fields)
- District list fetched from /api/districts for dropdown
- khoang_cach_q1_km derived from district on backend (user doesn't input)
- Display result as formatted VND with comparison to district average
- Vietnamese UI labels

## Requirements

### Functional
- Form with 7 fields: dien_tich, quan, so_phong, so_wc, noi_that, phap_ly, khoang_cach_q1_km
- Submit calls POST /api/predict
- Result card shows: predicted_price, price_per_m2, district_avg_price, comparison
- Loading spinner during prediction
- Error handling if API fails
- Reset form button

### Non-Functional
- Prediction latency < 1 second including network
- Form validates before submit (client-side)
- Responsive: stack fields on mobile, grid on desktop

## Architecture

### Component Structure
```
app/predict/
├── page.tsx                         # Main page (~60 lines)
└── components/
    ├── prediction-form.tsx          # Form component (~120 lines)
    └── prediction-result.tsx        # Result display (~60 lines)
```

### API Integration
- POST /api/predict
- Request: { dien_tich, quan, so_phong, so_wc, noi_that, phap_ly, khoang_cach_q1_km }
- Response: { predicted_price, price_per_m2, district_avg_price, comparison, input_summary }

## Related Code Files

### Files to Create
- `/Users/cps/web-demo-ptdl/app/predict/page.tsx`
- `/Users/cps/web-demo-ptdl/app/predict/components/prediction-form.tsx`
- `/Users/cps/web-demo-ptdl/app/predict/components/prediction-result.tsx`

### Files to Modify
- `/Users/cps/web-demo-ptdl/lib/api.ts` (add fetchPrediction function)

## Implementation Steps

### 1. Add prediction API function to lib/api.ts

```typescript
export interface PredictionInput {
  dien_tich: number;
  quan: string;
  so_phong: number;
  so_wc: number;
  noi_that: string;
  phap_ly: string;
  khoang_cach_q1_km: number;
}

export interface PredictionResult {
  predicted_price: number;
  price_per_m2: number;
  district_avg_price: number;
  comparison: string;
  input_summary: {
    area: number;
    district: string;
    bedrooms: number;
    bathrooms: number;
  };
}

export async function fetchPrediction(input: PredictionInput): Promise<PredictionResult> {
  const res = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Prediction failed: ${res.status}`);
  }
  return res.json();
}
```

### 2. Create PredictionResult component

File: `/Users/cps/web-demo-ptdl/app/predict/components/prediction-result.tsx`

- Card with predicted price (large, bold, formatted as "X.XX tỷ VNĐ")
- Sub-info: price_per_m2 formatted
- Comparison badge: "Cao hơn" / "Thấp hơn" / "Ngang bằng" vs district avg
- District avg price for reference
- Input summary recap

### 3. Create PredictionForm component

File: `/Users/cps/web-demo-ptdl/app/predict/components/prediction-form.tsx`

- "use client" component
- State: formData, result, loading, error
- Fields:
  - dien_tich: Input type=number, min=20, max=300, step=1, label="Diện tích (m²)"
  - quan: Select with districts from /api/districts, label="Quận/Huyện"
  - so_phong: Select options 1-5, label="Số phòng ngủ"
  - so_wc: Select options 1-4, label="Số WC"
  - noi_that: Select ["Cao_cap", "Day_du", "Co_ban", "Tho", "Khong_noi_that"], label="Nội thất"
  - phap_ly: Select ["So_hong_rieng", "Hop_dong_mua_ban", "Hop_dong_dat_coc", "Dang_cho_so", "Khac"], label="Pháp lý"
  - khoang_cach_q1_km: Input type=number, min=0, max=25, step=0.1, label="Khoảng cách đến Q1 (km)"
- Submit handler: validate → setLoading → fetchPrediction → setResult
- Display Vietnamese labels for select options (mapping)

### 4. Create prediction page

File: `/Users/cps/web-demo-ptdl/app/predict/page.tsx`

```typescript
import { PredictionForm } from "./components/prediction-form";

export default function PredictPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900">Dự đoán giá căn hộ</h1>
      <p className="mt-2 text-gray-600">
        Nhập thông tin căn hộ để dự đoán giá bằng mô hình XGBoost
      </p>
      <div className="mt-8">
        <PredictionForm />
      </div>
    </div>
  );
}
```

### 5. Vietnamese label mappings for form

```typescript
const noiThatLabels: Record<string, string> = {
  Cao_cap: "Cao cấp",
  Day_du: "Đầy đủ",
  Co_ban: "Cơ bản",
  Tho: "Thô",
  Khong_noi_that: "Không nội thất",
};

const phapLyLabels: Record<string, string> = {
  So_hong_rieng: "Sổ hồng riêng",
  Hop_dong_mua_ban: "Hợp đồng mua bán",
  Hop_dong_dat_coc: "Hợp đồng đặt cọc",
  Dang_cho_so: "Đang chờ sổ",
  Khac: "Khác",
};
```

### 6. Test prediction flow
```bash
# Ensure backend running on port 8000
# Navigate to http://localhost:3000/predict
# Fill form: 65m², Quận 7, 2 phòng, 2 WC, Đầy đủ, Sổ hồng riêng
# Submit → verify result card displays
```

## Todo List
- [ ] Add PredictionInput/PredictionResult types to lib/api.ts
- [ ] Add fetchPrediction function to lib/api.ts
- [ ] Create prediction-result.tsx component
- [ ] Create prediction-form.tsx with 6 fields
- [ ] Create predict/page.tsx
- [ ] Add Vietnamese label mappings
- [ ] Test form validation (empty fields, out of range)
- [ ] Test successful prediction flow
- [ ] Test error handling (backend down)
- [ ] Verify formatted price display
- [ ] Check responsive layout

## Success Criteria
- Form renders with all 6 fields
- Districts load dynamically from API
- Submit sends correct payload to /api/predict
- Predicted price displays formatted (e.g., "3.68 tỷ VNĐ")
- Comparison shows relative to district average
- Loading spinner during prediction
- Error message if API fails
- No TypeScript errors

## Risk Assessment
- **District list empty**: Backend must be running → Show error message
- **Prediction outliers**: Model may predict negative or extreme values → Clamp result
- **Form reset**: User expects clean form after prediction → Add reset button

## Security Considerations
- Input validated both client-side (HTML5) and server-side (Pydantic)
- No injection risk (fetch with JSON content type)

## Next Steps
- After completion, all 5 phases done
- Run full integration test: backend + all 3 frontend pages
- Final polish: loading states, error handling, responsive
