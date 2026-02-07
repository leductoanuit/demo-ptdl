"use client";

import { Bar } from "react-chartjs-2";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

interface PriceHistogramChartProps {
  data: { bin: string; count: number }[];
}

export function PriceHistogramChart({ data }: PriceHistogramChartProps) {
  const chartData = {
    labels: data.map((d) => d.bin),
    datasets: [
      {
        label: "Số lượng căn hộ",
        data: data.map((d) => d.count),
        backgroundColor: chartColors.success,
        borderColor: chartColors.success,
        borderWidth: 1,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Số lượng",
        },
        beginAtZero: true,
      },
      x: {
        title: {
          display: true,
          text: "Khoảng giá",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
