"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchChartData, fetchDistricts, type ChartDataResponse, type District } from "@/lib/api";
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
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load districts on mount
  useEffect(() => {
    fetchDistricts()
      .then((data) => setDistricts(data))
      .catch((err) => console.error("Failed to load districts:", err));
  }, []);

  // Load chart data when district changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchChartData(selectedDistrict || undefined)
      .then((data) => {
        setChartData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedDistrict]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4, 5].map((i) => (
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bảng điều khiển</h1>
        <div className="w-64">
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả quận/huyện" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả quận/huyện</SelectItem>
              {districts.map((district) => (
                <SelectItem key={district.name} value={district.name}>
                  {district.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Giá trung bình theo quận/huyện</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {chartData && (
              <PriceByDistrictChart data={chartData.price_by_district} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quan hệ diện tích - giá</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {chartData && (
              <AreaPriceScatterChart data={chartData.area_price_data} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ giá</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {chartData && <PriceHistogramChart data={chartData.price_bins} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mức độ quan trọng của yếu tố</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {chartData && (
              <FeatureImportanceChart data={chartData.feature_importance} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bổ pháp lý</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {chartData && (
              <LegalStatusChart data={chartData.legal_status_distribution} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
