import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatNumber } from "@/lib/api";
import type { PredictionResult } from "@/lib/api";

interface PredictionResultProps {
  result: PredictionResult;
}

export function PredictionResultCard({ result }: PredictionResultProps) {
  const getComparisonBadge = (comparison: string) => {
    if (comparison.includes("cao hơn")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (comparison.includes("thấp hơn")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-center text-blue-900">
          Kết quả dự đoán
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Giá dự đoán</p>
          <p className="text-4xl font-bold text-blue-600">
            {formatPrice(result.predicted_price)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatNumber(Math.round(result.price_per_m2))} VNĐ/m²
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Giá TB quận:</span>
            <span className="font-semibold">
              {formatPrice(result.district_avg_price)}
            </span>
          </div>
          <div
            className={`px-3 py-2 rounded-lg border text-sm font-medium text-center ${getComparisonBadge(
              result.comparison
            )}`}
          >
            {result.comparison}
          </div>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Thông tin đầu vào:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(result.input_summary).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
