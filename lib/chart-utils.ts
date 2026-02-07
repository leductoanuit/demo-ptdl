import { ChartOptions } from "chart.js";

export const chartColors = {
  primary: "rgb(59, 130, 246)", // blue-500
  secondary: "rgb(139, 92, 246)", // violet-500
  success: "rgb(34, 197, 94)", // green-500
  warning: "rgb(251, 191, 36)", // amber-400
  danger: "rgb(239, 68, 68)", // red-500
  info: "rgb(14, 165, 233)", // sky-500
  gray: "rgb(156, 163, 175)", // gray-400
};

export const chartColorsPalette = [
  "rgb(59, 130, 246)",
  "rgb(139, 92, 246)",
  "rgb(34, 197, 94)",
  "rgb(251, 191, 36)",
  "rgb(239, 68, 68)",
  "rgb(14, 165, 233)",
  "rgb(236, 72, 153)",
  "rgb(20, 184, 166)",
  "rgb(245, 158, 11)",
  "rgb(168, 85, 247)",
];

export const defaultChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top" as const,
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: "bold",
      },
      bodyFont: {
        size: 13,
      },
    },
  },
};

export function formatVietnameseCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(0)} tr`;
  }
  return value.toLocaleString("vi-VN");
}
