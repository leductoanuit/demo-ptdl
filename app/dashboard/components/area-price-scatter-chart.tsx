"use client";

import { Scatter } from "react-chartjs-2";
import { chartColors, defaultChartOptions } from "@/lib/chart-utils";

interface AreaPriceScatterChartProps {
  data: { area: number; price: number }[];
}

export function AreaPriceScatterChart({ data }: AreaPriceScatterChartProps) {
  const chartData = {
    datasets: [
      {
        label: "Giá theo diện tích",
        data: data.map((d) => ({
          x: d.area,
          y: d.price / 1_000_000_000, // Convert to tỷ
        })),
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context: any) => {
            return `Diện tích: ${context.parsed.x}m² | Giá: ${context.parsed.y.toFixed(2)} tỷ`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Diện tích (m²)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Giá (tỷ VNĐ)",
        },
      },
    },
  };

  return <Scatter data={chartData} options={options} />;
}
