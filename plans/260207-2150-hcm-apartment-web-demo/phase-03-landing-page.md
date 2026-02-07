# Phase 3: Landing Page with Stats Cards

## Context Links
- Backend API: Phase 1 - GET /api/stats endpoint
- Components: Phase 2 - shadcn/ui Card component
- File: `/Users/cps/web-demo-ptdl/app/page.tsx`

## Overview
**Priority**: P1 (Critical)
**Status**: Pending
**Effort**: 1h
**Description**: Build landing page with hero section and 4 stats cards displaying real-time data from FastAPI backend.

## Key Insights
- Fetch stats from http://localhost:8000/api/stats on client side
- Use shadcn/ui Card component for consistent styling
- Vietnamese labels for all stats
- Loading and error states for better UX
- Format large numbers with Vietnamese locale (e.g., "3,45 tỷ")

## Requirements

### Functional
- Hero section with title, subtitle, description
- 4 stats cards in grid layout:
  1. Tổng số căn hộ (Total listings)
  2. Giá trung bình (Average price in billions)
  3. Số quận/huyện (Number of districts)
  4. Độ chính xác mô hình (Model R² score as percentage)
- Fetch data from /api/stats endpoint
- Loading skeleton during fetch
- Error message if API fails
- Responsive grid (1 column mobile, 2 on tablet, 4 on desktop)

### Non-Functional
- Page loads in <2 seconds
- Smooth transitions for loading states
- Numbers formatted with Vietnamese locale
- Accessible color contrast (WCAG AA)

## Architecture

### Component Structure
```
app/
├── page.tsx                    # Landing page (client component)
└── components/
    ├── navbar.tsx              # From Phase 2
    └── stats-card.tsx          # Reusable stats card (new)
```

### API Integration
- Endpoint: GET http://localhost:8000/api/stats
- Response:
  ```json
  {
    "total_listings": 2400,
    "avg_price": 3450000000,
    "avg_price_per_m2": 52000000,
    "num_districts": 16,
    "model_r2_score": 0.87
  }
  ```

## Related Code Files

### Files to Create
- `/Users/cps/web-demo-ptdl/app/components/stats-card.tsx` (~40 lines)
- `/Users/cps/web-demo-ptdl/lib/api.ts` (~30 lines)

### Files to Modify
- `/Users/cps/web-demo-ptdl/app/page.tsx` (complete rewrite, ~120 lines)

### Files to Delete
- None

## Implementation Steps

### 1. Create API utility module

File: `/Users/cps/web-demo-ptdl/lib/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StatsResponse {
  total_listings: number;
  avg_price: number;
  avg_price_per_m2: number;
  num_districts: number;
  model_r2_score: number;
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await fetch(`${API_URL}/api/stats`, {
    cache: "no-store", // Always fetch fresh data
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status}`);
  }

  return res.json();
}

// Number formatting utilities
export function formatPrice(price: number): string {
  const billions = price / 1_000_000_000;
  return `${billions.toFixed(2)} tỷ`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

export function formatPercentage(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}
```

### 2. Create StatsCard component

File: `/Users/cps/web-demo-ptdl/app/components/stats-card.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

export function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 3. Update landing page (page.tsx)

File: `/Users/cps/web-demo-ptdl/app/page.tsx`

Structure:
```typescript
"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./components/stats-card";
import {
  fetchStats,
  formatPrice,
  formatNumber,
  formatPercentage,
  type StatsResponse,
} from "@/lib/api";

export default function HomePage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Phân Tích Giá Căn Hộ
          <span className="block text-blue-600">Thành phố Hồ Chí Minh</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Nền tảng dự đoán giá căn hộ sử dụng Machine Learning với dữ liệu
          thực tế từ 2.400+ tin đăng bất động sản tại TP.HCM
        </p>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 pb-16">
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-32 rounded bg-gray-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-red-600">{error}</p>
            <p className="mt-2 text-sm text-red-500">
              Đảm bảo backend đang chạy tại http://localhost:8000
            </p>
          </div>
        )}

        {stats && !loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Tổng số căn hộ"
              value={formatNumber(stats.total_listings)}
              description="Dữ liệu thực tế từ thị trường"
            />
            <StatsCard
              title="Giá trung bình"
              value={formatPrice(stats.avg_price)}
              description={`${formatPrice(stats.avg_price_per_m2)} / m²`}
            />
            <StatsCard
              title="Số quận/huyện"
              value={stats.num_districts}
              description="Phân bố trên toàn TP.HCM"
            />
            <StatsCard
              title="Độ chính xác mô hình"
              value={formatPercentage(stats.model_r2_score)}
              description="R² Score của XGBoost"
            />
          </div>
        )}
      </section>
    </div>
  );
}
```

### 4. Create environment variable file

File: `/Users/cps/web-demo-ptdl/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Add to `.gitignore`:
```
.env.local
```

### 5. Test landing page
```bash
# Ensure backend is running
cd /Users/cps/web-demo-ptdl/backend
uvicorn main:app --reload --port 8000

# In another terminal, start frontend
cd /Users/cps/web-demo-ptdl
pnpm dev
```

Navigate to http://localhost:3000 and verify:
- Hero section displays correctly
- 4 stats cards load with real data
- Loading skeletons appear during fetch
- Error message shows if backend is down
- Numbers formatted in Vietnamese locale

### 6. Add Card import to components/ui if missing

Verify Card component was created in Phase 2:
```bash
ls -la /Users/cps/web-demo-ptdl/components/ui/card.tsx
```

If missing, install manually:
```bash
pnpm dlx shadcn@latest add card
```

## Todo List
- [ ] Create lib/api.ts with fetchStats function
- [ ] Add number formatting utilities (formatPrice, formatNumber, formatPercentage)
- [ ] Create app/components/stats-card.tsx component
- [ ] Update app/page.tsx with hero section
- [ ] Add stats grid with 4 cards
- [ ] Implement loading skeleton state
- [ ] Implement error handling UI
- [ ] Create .env.local with API_URL
- [ ] Test with backend running
- [ ] Test with backend stopped (error state)
- [ ] Verify Vietnamese number formatting
- [ ] Check responsive layout on mobile/tablet/desktop

## Success Criteria
- Landing page renders without errors
- Stats fetch from backend successfully
- Loading skeletons display during fetch
- Error message shows when backend unavailable
- Numbers formatted correctly:
  - 3,450,000,000 → "3.45 tỷ"
  - 0.87 → "87.0%"
  - 2400 → "2.400"
- Responsive grid works on all screen sizes
- No TypeScript compilation errors
- No hydration mismatches

## Risk Assessment
- **CORS errors**: Backend CORS must allow localhost:3000 → Verify in Phase 1
- **API timing**: Frontend may start before backend ready → Add retry logic if needed
- **Number formatting**: Vietnamese locale may not render → Use manual formatting
- **Fetch caching**: Next.js may cache API calls → Use cache: "no-store"

## Security Considerations
- API URL exposed in client code (acceptable for local demo)
- No sensitive data displayed (aggregated stats only)
- Error messages don't expose backend details

## Next Steps
- After completion, proceed to Phase 4 (Dashboard Charts)
- Landing page establishes pattern for API integration
- StatsCard component reusable in dashboard
