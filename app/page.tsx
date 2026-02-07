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

export default function Home() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        setStats(data);
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
        <div className="mb-8 text-center">
          <div className="h-12 w-3/4 mx-auto bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-1/2 mx-auto bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
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
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Phân Tích Giá Căn Hộ
        </h1>
        <p className="text-xl text-gray-600">Thành phố Hồ Chí Minh</p>
        <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
          Hệ thống phân tích và dự đoán giá căn hộ sử dụng mô hình XGBoost
          dựa trên dữ liệu thị trường bất động sản TP.HCM
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng số căn hộ"
          value={formatNumber(stats?.total_listings || 0)}
          description="Số lượng căn hộ trong cơ sở dữ liệu"
        />
        <StatsCard
          title="Giá trung bình"
          value={formatPrice(stats?.avg_price || 0)}
          description={`${formatNumber(Math.round(stats?.avg_price_per_m2 || 0))} VNĐ/m²`}
        />
        <StatsCard
          title="Số quận/huyện"
          value={stats?.num_districts || 0}
          description="Phủ sóng toàn TP.HCM"
        />
        <StatsCard
          title="Độ chính xác mô hình"
          value={formatPercentage(stats?.model_r2_score || 0)}
          description="R² Score của mô hình XGBoost"
        />
      </div>
    </div>
  );
}
