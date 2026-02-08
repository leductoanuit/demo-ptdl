const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export interface StatsResponse {
  total_listings: number;
  avg_price: number;
  avg_price_per_m2: number;
  num_districts: number;
  model_r2_score: number;
}

export interface District {
  name: string;
  avg_price: number;
  avg_price_m2: number;
  count: number;
}

export interface ChartDataResponse {
  price_by_district: { district: string; avg_price_m2: number }[];
  area_price_data: { area: number; price: number }[];
  price_bins: { range: string; count: number }[];
  feature_importance: { feature: string; importance: number }[];
  legal_status_distribution: { status: string; count: number }[];
}

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
  input_summary: Record<string, string | number>;
}

export interface ModelComparisonResponse {
  metrics: { name: string; r2: number; rmse: number; mae: number }[];
  predictions: { actual: number; lr: number; ridge: number; rf: number; xgb: number }[];
  direction_accuracy: { name: string; accuracy: number }[];
  feature_importance: { feature: string; rf: number; xgb: number }[];
}

// API Functions
export async function fetchStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_URL}/api/stats`);
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
}

export async function fetchDistricts(): Promise<District[]> {
  const response = await fetch(`${API_URL}/api/districts`);
  if (!response.ok) throw new Error("Failed to fetch districts");
  return response.json();
}

export async function fetchChartData(
  district?: string
): Promise<ChartDataResponse> {
  const url = district
    ? `${API_URL}/api/chart-data?district=${encodeURIComponent(district)}`
    : `${API_URL}/api/chart-data`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch chart data");
  return response.json();
}

export async function fetchPrediction(
  input: PredictionInput
): Promise<PredictionResult> {
  const response = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    // Pydantic returns detail as array of validation errors
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e: { loc?: string[]; msg?: string }) => `${e.loc?.slice(-1)[0]}: ${e.msg}`).join("; ")
      : err.detail || `Prediction failed: ${response.status}`;
    throw new Error(detail);
  }
  return response.json();
}

export async function fetchModelComparison(): Promise<ModelComparisonResponse> {
  const response = await fetch(`${API_URL}/api/model-comparison`);
  if (!response.ok) throw new Error("Failed to fetch model comparison");
  return response.json();
}

// Formatters
export function formatPrice(price: number): string {
  return `${(price / 1_000_000_000).toFixed(2)} tỷ`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("vi-VN");
}

export function formatPercentage(decimal: number): string {
  return `${(decimal * 100).toFixed(1)}%`;
}
