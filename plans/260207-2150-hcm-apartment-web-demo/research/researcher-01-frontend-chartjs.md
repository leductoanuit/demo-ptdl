# Frontend Integration Research: Next.js 16 + React 19 + Chart.js

**Date:** 2026-02-07
**Environment:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, pnpm
**Purpose:** Research react-chartjs-2 setup, chart patterns, shadcn/ui forms, FastAPI integration

---

## 1. react-chartjs-2 v5 + Chart.js v4 Setup (Next.js App Router)

### Installation
```bash
pnpm add react-chartjs-2 chart.js
```

### Dependencies
- `chart.js`: ^4.4.8
- `react-chartjs-2`: ^5.3.0+

### Client Component Pattern (REQUIRED for App Router)

Chart.js requires browser APIs (window, document) → must use client components + dynamic imports.

**Pattern 1: Dynamic Import with SSR Disabled**
```typescript
"use client";
import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Dynamic import with SSR disabled
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), { ssr: false });
const Doughnut = dynamic(() => import("react-chartjs-2").then((mod) => mod.Doughnut), { ssr: false });
const Scatter = dynamic(() => import("react-chartjs-2").then((mod) => mod.Scatter), { ssr: false });
```

**Pattern 2: Separate Chart Component File**
```typescript
// components/charts/bar-chart.tsx
"use client";
import { Bar } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

export function BarChart({ data, options }: { data: ChartData<"bar">; options?: ChartOptions<"bar"> }) {
  return <Bar data={data} options={options} />;
}

// pages/dashboard/page.tsx - import dynamically
const BarChart = dynamic(() => import("@/components/charts/bar-chart").then(m => m.BarChart), { ssr: false });
```

### TypeScript Type Safety
```typescript
import type { ChartData, ChartOptions } from "chart.js";

const data: ChartData<"bar"> = { /* ... */ };
const options: ChartOptions<"bar"> = { /* ... */ };
```

---

## 2. Chart Patterns with react-chartjs-2

### Horizontal Bar Chart
```typescript
const horizontalBarData: ChartData<"bar"> = {
  labels: ["Category A", "Category B", "Category C"],
  datasets: [{
    label: "Sales",
    data: [65, 59, 80],
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    borderColor: "rgb(59, 130, 246)",
    borderWidth: 1,
  }],
};

const horizontalBarOptions: ChartOptions<"bar"> = {
  indexAxis: "y", // Horizontal bars
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: "top" },
    title: { display: true, text: "Horizontal Bar Chart" },
  },
};

<Bar data={horizontalBarData} options={horizontalBarOptions} />
```

### Scatter Plot
```typescript
const scatterData: ChartData<"scatter"> = {
  datasets: [{
    label: "Dataset 1",
    data: [
      { x: -10, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 5 },
      { x: 0.5, y: 5.5 },
    ],
    backgroundColor: "rgb(255, 99, 132)",
  }],
};

const scatterOptions: ChartOptions<"scatter"> = {
  scales: {
    x: { type: "linear", position: "bottom" },
    y: { beginAtZero: true },
  },
};

<Scatter data={scatterData} options={scatterOptions} />
```

### Histogram (using Bar chart)
```typescript
// Bin data first (example: price ranges)
const histogramData: ChartData<"bar"> = {
  labels: ["0-100k", "100k-200k", "200k-300k", "300k-400k"],
  datasets: [{
    label: "Frequency",
    data: [12, 45, 78, 34],
    backgroundColor: "rgba(34, 197, 94, 0.6)",
    borderColor: "rgb(34, 197, 94)",
    borderWidth: 1,
  }],
};

const histogramOptions: ChartOptions<"bar"> = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: "Price Distribution" },
  },
  scales: {
    x: { title: { display: true, text: "Price Range" } },
    y: { title: { display: true, text: "Count" }, beginAtZero: true },
  },
};
```

### Doughnut Chart
```typescript
const doughnutData: ChartData<"doughnut"> = {
  labels: ["Type A", "Type B", "Type C"],
  datasets: [{
    data: [300, 50, 100],
    backgroundColor: [
      "rgb(255, 99, 132)",
      "rgb(54, 162, 235)",
      "rgb(255, 205, 86)",
    ],
    hoverOffset: 4,
  }],
};

const doughnutOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  plugins: {
    legend: { position: "right" },
    title: { display: true, text: "Distribution" },
  },
};

<Doughnut data={doughnutData} options={doughnutOptions} />
```

---

## 3. shadcn/ui Card + Select + Input Components

### Installation (already done in project)
```bash
pnpm dlx shadcn@latest add card select input form button
```

### Card + Select + Input Pattern
```typescript
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FilterCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Apartments</CardTitle>
        <CardDescription>Search and filter apartments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="price">Max Price</Label>
          <Input id="price" type="number" placeholder="Enter max price" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Select>
            <SelectTrigger id="bedrooms">
              <SelectValue placeholder="Select bedrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bedroom</SelectItem>
              <SelectItem value="2">2 Bedrooms</SelectItem>
              <SelectItem value="3">3+ Bedrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full">Apply Filters</Button>
      </CardContent>
    </Card>
  );
}
```

### Form with React Hook Form + Zod
```typescript
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  price: z.number().min(0),
  bedrooms: z.string(),
});

export function FilterForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { price: 0, bedrooms: "" },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Price</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## 4. Fetch External API (FastAPI on port 8000)

### Client Component Fetch Pattern
```typescript
"use client";
import { useState, useEffect } from "react";

interface Apartment {
  id: number;
  name: string;
  price: number;
}

export function ApartmentList() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApartments() {
      try {
        const res = await fetch("http://localhost:8000/api/apartments");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setApartments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchApartments();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{/* render apartments */}</div>;
}
```

### FastAPI CORS Configuration (Backend)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Development CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/apartments")
async def get_apartments():
    return [{"id": 1, "name": "Apt 1", "price": 150000}]
```

### Environment Variable Pattern
```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApartments() {
  const res = await fetch(`${API_URL}/api/apartments`);
  return res.json();
}
```

### Error Handling Best Practice
```typescript
async function apiCall<T>(endpoint: string): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
```

---

## Summary

**Key Takeaways:**
1. **Chart.js in App Router:** Use `"use client"` + `dynamic(() => ..., { ssr: false })` pattern
2. **Component Registration:** Register Chart.js elements before use (CategoryScale, LinearScale, etc.)
3. **TypeScript:** Import types from `chart.js` for type safety (`ChartData`, `ChartOptions`)
4. **shadcn/ui Forms:** Use Card + Select + Input with React Hook Form + Zod for validation
5. **FastAPI Integration:** Client-side fetch with error handling; configure CORS on backend
6. **Environment Vars:** Use `NEXT_PUBLIC_` prefix for client-side API URLs

**Unresolved Questions:**
- None

**Sources:**
- [Chart.js in Next.js 15 Guide](https://dev.to/willochs316/mastering-chartjs-in-nextjs-15-create-dynamic-data-visualizations-564p)
- [react-chartjs-2 npm](https://www.npmjs.com/package/react-chartjs-2)
- [react-chartjs-2 TypeScript Guide](https://react-chartjs-2.js.org/faq/typescript/)
- [shadcn/ui Next.js Forms](https://ui.shadcn.com/docs/forms/next)
- [Mastering CORS: FastAPI and Next.js](https://medium.com/@vaibhavtiwari.945/mastering-cors-configuring-cross-origin-resource-sharing-in-fastapi-and-next-js-28c61272084b)
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)
