"use client";

import { Bar } from "react-chartjs-2";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

interface ModelFeatureImportanceChartProps {
  data: { feature: string; rf: number; xgb: number }[];
}

// Vietnamese feature name mapping
const FEATURE_LABELS: Record<string, string> = {
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

export function ModelFeatureImportanceChart({ data }: ModelFeatureImportanceChartProps) {
  const labels = data.map((d) => FEATURE_LABELS[d.feature] || d.feature);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Random Forest",
        data: data.map((d) => d.rf),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
      },
      {
        label: "XGBoost",
        data: data.map((d) => d.xgb),
        backgroundColor: chartColors.warning,
        borderColor: chartColors.warning,
        borderWidth: 1,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    indexAxis: "y" as const,
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${(ctx.parsed.x * 100).toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        ticks: { callback: (v: any) => `${(v * 100).toFixed(0)}%` },
        title: { display: true, text: "Mức độ quan trọng" },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
