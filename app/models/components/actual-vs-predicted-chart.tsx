"use client";

import { Scatter } from "react-chartjs-2";
import { chartColorsPalette, defaultChartOptions } from "@/lib/chart-utils";

interface ActualVsPredictedChartProps {
  predictions: { actual: number; lr: number; ridge: number; rf: number; xgb: number }[];
  directionAccuracy: { name: string; accuracy: number }[];
}

const MODEL_KEYS = ["lr", "ridge", "rf", "xgb"] as const;
const MODEL_LABELS: Record<string, string> = {
  lr: "Hồi quy tuyến tính",
  ridge: "Ridge",
  rf: "Random Forest",
  xgb: "XGBoost",
};

export function ActualVsPredictedChart({ predictions, directionAccuracy }: ActualVsPredictedChartProps) {
  if (!predictions.length) return <p className="text-gray-500">Không có dữ liệu</p>;

  // Find min/max for diagonal line
  const allValues = predictions.flatMap((p) => [p.actual, p.lr, p.ridge, p.rf, p.xgb]);
  const minVal = Math.min(...allValues) / 1e9;
  const maxVal = Math.max(...allValues) / 1e9;

  const datasets = MODEL_KEYS.map((key, i) => ({
    label: MODEL_LABELS[key],
    data: predictions.map((p) => ({ x: p.actual / 1e9, y: p[key] / 1e9 })),
    backgroundColor: chartColorsPalette[i],
    borderColor: chartColorsPalette[i],
    pointRadius: 5,
    pointHoverRadius: 7,
  }));

  // Diagonal reference line (y = x)
  datasets.push({
    label: "Hoàn hảo (y=x)",
    data: [{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }],
    backgroundColor: "rgba(156, 163, 175, 0.3)",
    borderColor: "rgb(156, 163, 175)",
    pointRadius: 0,
    pointHoverRadius: 0,
    // @ts-expect-error - Chart.js line properties on scatter dataset
    showLine: true,
    borderDash: [5, 5],
    borderWidth: 2,
  });

  const options: any = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins?.tooltip,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: Thực tế ${ctx.parsed.x.toFixed(2)} tỷ | Dự đoán ${ctx.parsed.y.toFixed(2)} tỷ`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: "Giá thực tế (tỷ VNĐ)" } },
      y: { title: { display: true, text: "Giá dự đoán (tỷ VNĐ)" } },
    },
  };

  return (
    <div>
      {/* Direction accuracy badges */}
      <div className="mb-3 flex flex-wrap gap-2">
        {directionAccuracy.map((d, i) => (
          <span
            key={d.name}
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${chartColorsPalette[i]}20`, color: chartColorsPalette[i] }}
          >
            {d.name}: {(d.accuracy * 100).toFixed(1)}%
          </span>
        ))}
      </div>
      <div className="h-80">
        <Scatter data={{ datasets }} options={options} />
      </div>
    </div>
  );
}
