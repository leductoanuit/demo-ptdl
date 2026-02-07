"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDistricts, fetchPrediction, type PredictionInput, type PredictionResult, type District } from "@/lib/api";

interface PredictionFormProps {
  onResult: (result: PredictionResult) => void;
}

const noiThatLabels: Record<string, string> = {
  Cao_cap: "Cao cấp",
  Day_du: "Đầy đủ",
  Co_ban: "Cơ bản",
  Tho: "Thô",
  Khong_noi_that: "Không nội thất",
};

const phapLyLabels: Record<string, string> = {
  So_hong_rieng: "Sổ hồng riêng",
  Hop_dong_mua_ban: "Hợp đồng mua bán",
  Hop_dong_dat_coc: "Hợp đồng đặt cọc",
  Dang_cho_so: "Đang chờ sổ",
  Khac: "Khác",
};

export function PredictionForm({ onResult }: PredictionFormProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionInput>({
    dien_tich: 0,
    quan: "",
    so_phong: 1,
    so_wc: 1,
    noi_that: "",
    phap_ly: "",
    khoang_cach_q1_km: 0,
  });

  useEffect(() => {
    fetchDistricts()
      .then((data) => setDistricts(data))
      .catch((err) => console.error("Failed to load districts:", err));
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!formData.dien_tich || formData.dien_tich <= 20) {
      setError("Diện tích phải lớn hơn 20 m²");
      return;
    }
    if (!formData.quan || !formData.noi_that || !formData.phap_ly) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const result = await fetchPrediction(formData);
      onResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      setError(`Không thể dự đoán giá: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin căn hộ</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dien_tich">Diện tích (m²)</Label>
              <Input
                id="dien_tich"
                type="number"
                required
                min="10"
                step="0.1"
                value={formData.dien_tich || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dien_tich: parseFloat(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quan">Quận/Huyện</Label>
              <Select
                value={formData.quan}
                onValueChange={(value) => setFormData({ ...formData, quan: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quận/huyện" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.name} value={district.name}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="so_phong">Số phòng ngủ</Label>
              <Select
                value={String(formData.so_phong)}
                onValueChange={(value) =>
                  setFormData({ ...formData, so_phong: parseInt(value) })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số phòng" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num} phòng
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="so_wc">Số WC</Label>
              <Select
                value={String(formData.so_wc)}
                onValueChange={(value) =>
                  setFormData({ ...formData, so_wc: parseInt(value) })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn số WC" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num} WC
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="noi_that">Nội thất</Label>
              <Select
                value={formData.noi_that}
                onValueChange={(value) => setFormData({ ...formData, noi_that: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tình trạng nội thất" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(noiThatLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phap_ly">Pháp lý</Label>
              <Select
                value={formData.phap_ly}
                onValueChange={(value) => setFormData({ ...formData, phap_ly: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tình trạng pháp lý" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(phapLyLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="khoang_cach_q1_km">Khoảng cách đến Q1 (km)</Label>
              <Input
                id="khoang_cach_q1_km"
                type="number"
                required
                min="0"
                step="0.1"
                value={formData.khoang_cach_q1_km || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    khoang_cach_q1_km: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Đang dự đoán..." : "Dự đoán giá"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
