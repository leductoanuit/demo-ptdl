"use client";

import { Bar } from "react-chartjs-2";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

interface FeatureImportanceChartProps {
  data: { feature: string; importance: number }[];
}

export function FeatureImportanceChart({ data }: FeatureImportanceChartProps) {
  const chartData = {
    labels: data.map((d) => d.feature),
    datasets: [
      {
        label: "Mức độ quan trọng",
        data: data.map((d) => d.importance),
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
      legend: {
        display: false,
      },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context: any) => {
            return `${(context.parsed.x * 100).toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value: any) => `${(value * 100).toFixed(0)}%`,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
