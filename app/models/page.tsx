"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { fetchModelComparison, type ModelComparisonResponse } from "@/lib/api";
import { ModelMetricsChart } from "./components/model-metrics-chart";
import { ActualVsPredictedChart } from "./components/actual-vs-predicted-chart";
import { ModelFeatureImportanceChart } from "./components/model-feature-importance-chart";

// Register Chart.js components (LineElement needed for scatter diagonal line)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ModelsPage() {
  const [data, setData] = useState<ModelComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModelComparison()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Lỗi tải dữ liệu</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">So sánh mô hình</h1>
        <p className="mt-1 text-gray-500">
          So sánh hiệu suất giữa 4 mô hình: Hồi quy tuyến tính, Ridge, Random Forest, XGBoost
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hiệu suất mô hình (R² Score)</CardTitle>
          </CardHeader>
          <CardContent>
            {data && <ModelMetricsChart metrics={data.metrics} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Giá thực tế vs Dự đoán & Độ chính xác xu hướng</CardTitle>
          </CardHeader>
          <CardContent>
            {data && (
              <ActualVsPredictedChart
                predictions={data.predictions}
                directionAccuracy={data.direction_accuracy}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mức độ quan trọng của yếu tố (RF vs XGBoost)</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {data && <ModelFeatureImportanceChart data={data.feature_importance} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
