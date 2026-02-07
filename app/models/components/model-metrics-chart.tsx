"use client";

import { Bar } from "react-chartjs-2";
import { chartColorsPalette, defaultChartOptions } from "@/lib/chart-utils";
import { formatPrice } from "@/lib/api";

interface ModelMetricsChartProps {
  metrics: { name: string; r2: number; rmse: number; mae: number }[];
}

export function ModelMetricsChart({ metrics }: ModelMetricsChartProps) {
  const chartData = {
    labels: metrics.map((m) => m.name),
    datasets: [
      {
        label: "R² Score",
        data: metrics.map((m) => m.r2),
        backgroundColor: chartColorsPalette.slice(0, metrics.length),
        borderColor: chartColorsPalette.slice(0, metrics.length),
        borderWidth: 1,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: { display: false },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context: any) => `R²: ${context.parsed.y.toFixed(4)}`,
        },
      },
    },
    scales: {
      y: { min: 0, max: 1, title: { display: true, text: "R² Score" } },
    },
  };

  return (
    <div>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      {/* RMSE / MAE stats below chart */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {metrics.map((m) => (
          <div key={m.name} className="rounded-md bg-gray-50 p-2">
            <p className="font-medium text-gray-700">{m.name}</p>
            <p className="text-gray-500">RMSE: {formatPrice(m.rmse)}</p>
            <p className="text-gray-500">MAE: {formatPrice(m.mae)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
