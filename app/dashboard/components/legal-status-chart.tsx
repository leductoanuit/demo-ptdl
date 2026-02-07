"use client";

import { Doughnut } from "react-chartjs-2";
import { chartColorsPalette, defaultChartOptions } from "@/lib/chart-utils";

interface LegalStatusChartProps {
  data: { status: string; count: number }[];
}

export function LegalStatusChart({ data }: LegalStatusChartProps) {
  const chartData = {
    labels: data.map((d) => d.status),
    datasets: [
      {
        label: "Số lượng",
        data: data.map((d) => d.count),
        backgroundColor: chartColorsPalette,
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options: any = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: true,
        position: "right" as const,
      },
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (context: any) => {
            const total = data.reduce((sum, d) => sum + d.count, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
