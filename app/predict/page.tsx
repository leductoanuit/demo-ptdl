"use client";

import { useState } from "react";
import { PredictionForm } from "./components/prediction-form";
import { PredictionResultCard } from "./components/prediction-result";
import type { PredictionResult } from "@/lib/api";

export default function PredictPage() {
  const [result, setResult] = useState<PredictionResult | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dự đoán giá căn hộ
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Nhập thông tin căn hộ để dự đoán giá bằng mô hình XGBoost được huấn
          luyện trên dữ liệu thị trường bất động sản TP.HCM
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
        <div>
          <PredictionForm onResult={setResult} />
        </div>
        <div>
          {result ? (
            <PredictionResultCard result={result} />
          ) : (
            <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-400 text-center px-4">
                Nhập thông tin và nhấn &quot;Dự đoán giá&quot; để xem kết quả
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
