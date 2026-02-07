"use client";

import { Bar } from "react-chartjs-2";
import { chartColors, defaultChartOptions, formatVietnameseCurrency } from "@/lib/chart-utils";

interface PriceByDistrictChartProps {
  data: { district: string; avg_price_m2: number }[];
}

export function PriceByDistrictChart({ data }: PriceByDistrictChartProps) {
  const chartData = {
    labels: data.map((d) => d.district),
    datasets: [
      {
        label: "Giá trung bình (VNĐ/m²)",
        data: data.map((d) => d.avg_price_m2),
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    indexAxis: "y" as const,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context: any) => {
            return `${formatVietnameseCurrency(context.parsed.x)} VNĐ/m²`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: any) => formatVietnameseCurrency(value),
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
