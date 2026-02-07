# Phase 4: Dashboard with Chart.js Visualizations

## Context Links
- Research: [researcher-01-frontend-chartjs.md](./research/researcher-01-frontend-chartjs.md)
- Backend API: Phase 1 - GET /api/stats, GET /api/districts
- Components: Phase 2 - shadcn/ui Card, Select components

## Overview
**Priority**: P1 (Critical)
**Status**: Pending
**Effort**: 1.5h
**Description**: Build interactive dashboard with 5 Chart.js charts and district filter dropdown. Display price analysis, area distribution, feature importance, and legal status breakdown.

## Key Insights
- Use "use client" + dynamic import with ssr: false for Chart.js
- Register Chart.js components globally once
- Use ChartData and ChartOptions types from chart.js
- District filter updates all charts dynamically
- Pre-aggregate data on backend for performance

## Requirements

### Functional
- 5 Chart.js charts:
  1. Horizontal Bar: Avg price/m² by district (top 10)
  2. Scatter: Area vs Price relationship
  3. Bar Histogram: Price distribution (10 bins)
  4. Horizontal Bar: Feature importance (top 10 features)
  5. Doughnut: Legal status distribution
- District filter dropdown (All + 16 districts)
- Fetch data from /api/stats and /api/districts
- Charts update when filter changes
- Loading state for each chart
- Responsive chart sizing

### Non-Functional
- Charts render in <1 second
- Smooth filter transitions
- Charts maintain aspect ratio on resize
- Vietnamese labels and tooltips
- Color scheme: blue for primary data, varied for categorical

## Architecture

### Component Structure
```
app/dashboard/
├── page.tsx                          # Main dashboard page (~150 lines)
└── components/
    ├── price-by-district-chart.tsx   # Horizontal bar chart
    ├── area-price-scatter-chart.tsx  # Scatter plot
    ├── price-histogram-chart.tsx     # Bar histogram
    ├── feature-importance-chart.tsx  # Horizontal bar chart
    └── legal-status-chart.tsx        # Doughnut chart
```

### API Integration
- GET /api/districts → District list with avg prices
- GET /api/stats → Feature importance + aggregated chart data
- Chart data structure:
  ```json
  {
    "price_by_district": [...],
    "area_price_data": [...],
    "price_bins": [...],
    "feature_importance": [...],
    "legal_status_distribution": [...]
  }
  ```

### Chart.js Setup
- Install: `pnpm add react-chartjs-2 chart.js`
- Dynamic imports for SSR compatibility
- Global registration: CategoryScale, LinearScale, BarElement, PointElement, ArcElement, Title, Tooltip, Legend

## Related Code Files

### Files to Create
- `/Users/cps/web-demo-ptdl/app/dashboard/page.tsx` (~150 lines)
- `/Users/cps/web-demo-ptdl/app/dashboard/components/price-by-district-chart.tsx` (~60 lines)
- `/Users/cps/web-demo-ptdl/app/dashboard/components/area-price-scatter-chart.tsx` (~60 lines)
- `/Users/cps/web-demo-ptdl/app/dashboard/components/price-histogram-chart.tsx` (~60 lines)
- `/Users/cps/web-demo-ptdl/app/dashboard/components/feature-importance-chart.tsx` (~60 lines)
- `/Users/cps/web-demo-ptdl/app/dashboard/components/legal-status-chart.tsx` (~60 lines)
- `/Users/cps/web-demo-ptdl/lib/chart-utils.ts` (~40 lines)

### Files to Modify
- `/Users/cps/web-demo-ptdl/lib/api.ts` (add fetchDistricts, fetchChartData functions)

### Files to Delete
- Remove placeholder `/Users/cps/web-demo-ptdl/app/dashboard/page.tsx` from Phase 2

## Implementation Steps

### 1. Install Chart.js dependencies
```bash
cd /Users/cps/web-demo-ptdl
pnpm add react-chartjs-2 chart.js
```

Expected versions:
- chart.js: ^4.4.8
- react-chartjs-2: ^5.3.0+

### 2. Update lib/api.ts with chart data endpoints

Add to `/Users/cps/web-demo-ptdl/lib/api.ts`:

```typescript
export interface District {
  name: string;
  avg_price: number;
  count: number;
}

export interface ChartData {
  price_by_district: { district: string; avg_price_m2: number }[];
  area_price_data: { area: number; price: number }[];
  price_bins: { range: string; count: number }[];
  feature_importance: { feature: string; importance: number }[];
  legal_status_distribution: { status: string; count: number }[];
}

export async function fetchDistricts(): Promise<District[]> {
  const res = await fetch(`${API_URL}/api/districts`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch districts: ${res.status}`);
  return res.json();
}

export async function fetchChartData(district?: string): Promise<ChartData> {
  const url = district
    ? `${API_URL}/api/chart-data?district=${encodeURIComponent(district)}`
    : `${API_URL}/api/chart-data`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch chart data: ${res.status}`);
  return res.json();
}
```

### 3. Create chart utilities module

File: `/Users/cps/web-demo-ptdl/lib/chart-utils.ts`

```typescript
import { ChartOptions } from "chart.js";

export const defaultChartOptions: ChartOptions<any> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top",
    },
  },
};

export const vietnameseTooltip = {
  callbacks: {
    label: function (context: any) {
      let label = context.dataset.label || "";
      if (label) label += ": ";
      if (context.parsed.y !== null) {
        label += new Intl.NumberFormat("vi-VN").format(context.parsed.y);
      }
      return label;
    },
  },
};

export const chartColors = {
  primary: "rgba(59, 130, 246, 0.8)", // blue-500
  secondary: "rgba(16, 185, 129, 0.8)", // green-500
  accent: "rgba(245, 158, 11, 0.8)", // amber-500
  danger: "rgba(239, 68, 68, 0.8)", // red-500
  categorical: [
    "rgba(59, 130, 246, 0.8)",
    "rgba(16, 185, 129, 0.8)",
    "rgba(245, 158, 11, 0.8)",
    "rgba(239, 68, 68, 0.8)",
    "rgba(139, 92, 246, 0.8)",
  ],
};
```

### 4. Create PriceByDistrictChart component

File: `/Users/cps/web-demo-ptdl/app/dashboard/components/price-by-district-chart.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, ChartOptions } from "chart.js";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

interface Props {
  data: { district: string; avg_price_m2: number }[];
}

export function PriceByDistrictChart({ data }: Props) {
  const chartData: ChartData<"bar"> = {
    labels: data.map((d) => d.district),
    datasets: [
      {
        label: "Giá trung bình (triệu/m²)",
        data: data.map((d) => d.avg_price_m2 / 1_000_000),
        backgroundColor: chartColors.primary,
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    ...defaultChartOptions,
    indexAxis: "y",
    plugins: {
      ...defaultChartOptions.plugins,
      title: {
        display: true,
        text: "Giá trung bình theo quận/huyện",
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Giá theo Quận/Huyện</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Bar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}
```

### 5. Create AreaPriceScatterChart component

File: `/Users/cps/web-demo-ptdl/app/dashboard/components/area-price-scatter-chart.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, ChartOptions } from "chart.js";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

const Scatter = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Scatter),
  { ssr: false }
);

interface Props {
  data: { area: number; price: number }[];
}

export function AreaPriceScatterChart({ data }: Props) {
  const chartData: ChartData<"scatter"> = {
    datasets: [
      {
        label: "Diện tích vs Giá",
        data: data.map((d) => ({ x: d.area, y: d.price / 1_000_000_000 })),
        backgroundColor: chartColors.secondary,
      },
    ],
  };

  const options: ChartOptions<"scatter"> = {
    ...defaultChartOptions,
    scales: {
      x: {
        title: { display: true, text: "Diện tích (m²)" },
        type: "linear",
        position: "bottom",
      },
      y: {
        title: { display: true, text: "Giá (tỷ VNĐ)" },
        beginAtZero: true,
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      title: { display: true, text: "Mối quan hệ Diện tích - Giá" },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diện tích vs Giá</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Scatter data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}
```

### 6. Create PriceHistogramChart component

File: `/Users/cps/web-demo-ptdl/app/dashboard/components/price-histogram-chart.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, ChartOptions } from "chart.js";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

interface Props {
  data: { range: string; count: number }[];
}

export function PriceHistogramChart({ data }: Props) {
  const chartData: ChartData<"bar"> = {
    labels: data.map((d) => d.range),
    datasets: [
      {
        label: "Số lượng",
        data: data.map((d) => d.count),
        backgroundColor: chartColors.accent,
        borderColor: "rgb(245, 158, 11)",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
      title: { display: true, text: "Phân bố giá căn hộ" },
    },
    scales: {
      x: { title: { display: true, text: "Khoảng giá (tỷ VNĐ)" } },
      y: { title: { display: true, text: "Số lượng" }, beginAtZero: true },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bố Giá</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Bar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}
```

### 7. Create FeatureImportanceChart component

File: `/Users/cps/web-demo-ptdl/app/dashboard/components/feature-importance-chart.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, ChartOptions } from "chart.js";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

interface Props {
  data: { feature: string; importance: number }[];
}

export function FeatureImportanceChart({ data }: Props) {
  const chartData: ChartData<"bar"> = {
    labels: data.map((d) => d.feature),
    datasets: [
      {
        label: "Mức độ quan trọng",
        data: data.map((d) => d.importance),
        backgroundColor: chartColors.danger,
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    ...defaultChartOptions,
    indexAxis: "y",
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
      title: { display: true, text: "Mức độ quan trọng của đặc trưng" },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tầm quan trọng các Yếu tố</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Bar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}
```

### 8. Create LegalStatusChart component

File: `/Users/cps/web-demo-ptdl/app/dashboard/components/legal-status-chart.tsx`

```typescript
"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartData, ChartOptions } from "chart.js";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

const Doughnut = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Doughnut),
  { ssr: false }
);

interface Props {
  data: { status: string; count: number }[];
}

export function LegalStatusChart({ data }: Props) {
  const chartData: ChartData<"doughnut"> = {
    labels: data.map((d) => d.status),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: chartColors.categorical,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { position: "right" },
      title: { display: true, text: "Phân bố tình trạng pháp lý" },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tình trạng Pháp lý</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <Doughnut data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}
```

### 9. Create main dashboard page

File: `/Users/cps/web-demo-ptdl/app/dashboard/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fetchDistricts, fetchChartData, type ChartData } from "@/lib/api";
import { PriceByDistrictChart } from "./components/price-by-district-chart";
import { AreaPriceScatterChart } from "./components/area-price-scatter-chart";
import { PriceHistogramChart } from "./components/price-histogram-chart";
import { FeatureImportanceChart } from "./components/feature-importance-chart";
import { LegalStatusChart } from "./components/legal-status-chart";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDistricts() {
      try {
        const data = await fetchDistricts();
        setDistricts(data.map((d) => d.name));
      } catch (err) {
        console.error("Failed to load districts:", err);
      }
    }
    loadDistricts();
  }, []);

  useEffect(() => {
    async function loadChartData() {
      setLoading(true);
      try {
        const data = await fetchChartData(
          selectedDistrict === "all" ? undefined : selectedDistrict
        );
        setChartData(data);
      } catch (err) {
        console.error("Failed to load chart data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChartData();
  }, [selectedDistrict]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
        <p className="mt-2 text-gray-600">
          Phân tích và trực quan hóa dữ liệu thị trường căn hộ TP.HCM
        </p>
      </div>

      {/* District Filter */}
      <div className="mb-8 flex items-center gap-4">
        <Label htmlFor="district-filter">Lọc theo quận/huyện:</Label>
        <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
          <SelectTrigger id="district-filter" className="w-[250px]">
            <SelectValue placeholder="Chọn quận/huyện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {districts.map((district) => (
              <SelectItem key={district} value={district}>
                {district}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts Grid */}
      {loading && (
        <div className="text-center text-gray-500">Đang tải dữ liệu...</div>
      )}

      {chartData && !loading && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PriceByDistrictChart data={chartData.price_by_district} />
            <AreaPriceScatterChart data={chartData.area_price_data} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PriceHistogramChart data={chartData.price_bins} />
            <FeatureImportanceChart data={chartData.feature_importance} />
          </div>
          <div className="grid gap-6 lg:grid-cols-1">
            <LegalStatusChart data={chartData.legal_status_distribution} />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 10. Update backend to include /api/chart-data endpoint

Note: This endpoint needs to be added in backend/main.py during Phase 1 implementation. The endpoint should aggregate and return chart-ready data.

### 11. Test dashboard
```bash
# Start backend
cd /Users/cps/web-demo-ptdl/backend
uvicorn main:app --reload --port 8000

# Start frontend
cd /Users/cps/web-demo-ptdl
pnpm dev
```

Navigate to http://localhost:3000/dashboard and verify:
- All 5 charts render correctly
- District filter dropdown works
- Charts update when filter changes
- Vietnamese labels display correctly
- Charts are responsive

## Todo List
- [ ] Install react-chartjs-2 and chart.js packages
- [ ] Create lib/chart-utils.ts with shared config
- [ ] Update lib/api.ts with fetchDistricts and fetchChartData
- [ ] Create PriceByDistrictChart component
- [ ] Create AreaPriceScatterChart component
- [ ] Create PriceHistogramChart component
- [ ] Create FeatureImportanceChart component
- [ ] Create LegalStatusChart component
- [ ] Create main dashboard page with Chart.js registration
- [ ] Add district filter dropdown with state management
- [ ] Update backend with /api/chart-data endpoint
- [ ] Test all charts render without errors
- [ ] Test district filter functionality
- [ ] Verify Vietnamese labels and tooltips
- [ ] Check responsive layout on different screen sizes

## Success Criteria
- All 5 charts render without errors
- Charts load data from backend API
- District filter updates all charts dynamically
- Chart.js SSR issues resolved with dynamic imports
- Vietnamese labels display correctly in all charts
- Charts maintain aspect ratio on window resize
- No TypeScript compilation errors
- Loading state shows during data fetch
- All charts interactive (hover tooltips work)

## Risk Assessment
- **SSR hydration errors**: Chart.js requires window object → Use dynamic import with ssr: false
- **Chart registration**: Must register components globally → Do once in page.tsx
- **Data format mismatch**: Backend data shape must match chart expectations → Strict TypeScript types
- **Performance**: 5 charts may lag on low-end devices → Use React.memo if needed

## Security Considerations
- No user input in charts (data from backend only)
- District filter validated against backend list
- No XSS risk (Chart.js escapes labels automatically)

## Next Steps
- After completion, proceed to Phase 5 (Prediction Page)
- Dashboard establishes pattern for Chart.js integration
- Chart components can be reused if needed
