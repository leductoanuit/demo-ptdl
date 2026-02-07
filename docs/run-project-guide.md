# Hướng dẫn chạy dự án

## Yêu cầu hệ thống

- **Node.js** >= 18 ([https://nodejs.org](https://nodejs.org))
- **Python** >= 3.9 ([https://python.org](https://python.org))
- **pnpm** - cài bằng `npm install -g pnpm`

### 1. Frontend

```bash
cd web-demo-ptdl
pnpm install
```

### 2. Backend

```bash
brew install libomp
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### Chạy dự án (macOS)

Mở **2 terminal** riêng biệt:

**Terminal 1 - Backend (port 8000):**
```bash
cd backend
.venv/bin/uvicorn main:app --port 8000
```

**Terminal 2 - Frontend (port 3000):**
```bash
cd web-demo-ptdl
pnpm dev
```

---

## Cài đặt trên Windows

### 1. Cài đặt công cụ cần thiết

- Tải **Node.js** từ [https://nodejs.org](https://nodejs.org) → cài bản LTS
- Tải **Python** từ [https://python.org](https://python.org) → **tick "Add Python to PATH"** khi cài
- Mở **PowerShell** hoặc **Command Prompt**, chạy:

```cmd
npm install -g pnpm
```

### 2. Frontend

```cmd
cd web-demo-ptdl
pnpm install
```

### 3. Backend

```cmd
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
```

> **Lưu ý:** Nếu gặp lỗi XGBoost, cài Visual C++ Build Tools:
> [https://visualstudio.microsoft.com/visual-cpp-build-tools/](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Chạy dự án (Windows)

Mở **2 cửa sổ CMD/PowerShell** riêng biệt:

**Cửa sổ 1 - Backend (port 8000):**
```cmd
cd backend
.venv\Scripts\uvicorn main:app --port 8000
```

**Cửa sổ 2 - Frontend (port 3000):**
```cmd
cd web-demo-ptdl
pnpm dev
```

Khi thấy `Model trained. R² = 0.79xx` (backend) và `Ready in xxxms` (frontend) là sẵn sàng.

---

## Truy cập

Mở trình duyệt: **http://localhost:3000**

| Trang | URL | Mô tả |
|-------|-----|-------|
| Trang chủ | `/` | Hero + 4 thẻ thống kê |
| Bảng điều khiển | `/dashboard` | 5 biểu đồ + bộ lọc quận |
| Dự đoán giá | `/predict` | Form 7 trường + kết quả dự đoán |

## API Endpoints (Backend)

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/health` | Kiểm tra trạng thái server |
| GET | `/api/stats` | Thống kê tổng quan |
| GET | `/api/districts` | Danh sách quận + giá TB |
| GET | `/api/chart-data?district=X` | Dữ liệu biểu đồ (lọc theo quận) |
| POST | `/api/predict` | Dự đoán giá căn hộ |
| GET | `/docs` | Swagger UI (FastAPI auto-docs) |

## Kiểm tra nhanh

```bash
# Kiểm tra backend
curl http://localhost:8000/health

# Kiểm tra API stats
curl http://localhost:8000/api/stats

# Test dự đoán
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"dien_tich":65,"quan":"Quận 7","so_phong":2,"so_wc":2,"noi_that":"Day_du","phap_ly":"So_hong_rieng","khoang_cach_q1_km":7.5}'
```

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `XGBoostError: libomp.dylib not found` | Thiếu OpenMP (macOS) | `brew install libomp` |
| `error: Microsoft Visual C++ 14.0 is required` | Thiếu C++ Build Tools (Windows) | Cài Visual C++ Build Tools |
| `'python' is not recognized` | Python chưa trong PATH (Windows) | Cài lại Python, tick "Add to PATH" |
| CORS error trong console | Backend chưa chạy | Chạy uvicorn trước |
| Chart trống | Backend chưa sẵn sàng | Đợi model train xong, reload trang |
| `Failed to fetch stats` | Backend không phản hồi | Kiểm tra terminal backend |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Chart.js
- **Backend**: FastAPI, XGBoost, pandas, scikit-learn
- **Dữ liệu**: 2,400 tin đăng căn hộ TP.HCM (sau cleaning: 2,093 dòng)
- **Model**: XGBoost (R² ≈ 0.79, 14 features)
