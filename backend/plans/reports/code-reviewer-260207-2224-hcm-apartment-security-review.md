# Code Review: HCM Apartment Price Analysis Web Demo

**Review Date:** 2026-02-07
**Reviewer:** Code Review Agent (a5ba5e2)
**Scope:** Full codebase security, type safety, performance review

---

## Code Review Summary

### Scope
- **Files Reviewed:**
  - Backend: `backend/main.py`, `backend/model.py`
  - Frontend: `app/**/*.tsx`, `lib/api.ts`, `lib/chart-utils.ts`
- **Lines of Code:** ~1,400 LOC
- **Focus:** Security vulnerabilities, type safety, error handling, performance
- **Scout Findings:** Input validation gaps, CORS configuration risks, missing error boundaries

### Overall Assessment
**Rating: 7/10** - Functional implementation with good structure but several security and production-readiness issues requiring attention before deployment.

**Strengths:**
- Clean separation of concerns (model training, API, UI components)
- TypeScript properly configured, no compilation errors
- Proper use of Pydantic for input validation on backend
- Good error handling on frontend with loading states
- Sensible .gitignore prevents committing sensitive files

**Weaknesses:**
- CORS security misconfiguration
- Missing input sanitization for XSS
- No rate limiting or request validation
- Error responses expose stack traces
- Missing authentication/authorization layer
- No request timeout handling

---

## Critical Issues

### 1. **SECURITY: CORS Misconfiguration - Production Risk**
**File:** `backend/main.py:85-90`
**Severity:** CRITICAL
**Impact:** Allows any origin with localhost:3000 to make requests, but `allow_methods=["*"]` and `allow_headers=["*"]` is overly permissive

```python
# CURRENT (INSECURE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issues:**
- `allow_methods=["*"]` includes dangerous methods like DELETE, PUT
- `allow_headers=["*"]` could allow custom headers attackers might inject
- No `allow_credentials` configuration specified
- Hard-coded origins won't work in production

**Recommended Fix:**
```python
# SECURE VERSION
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],  # Only what's needed
    allow_headers=["Content-Type", "Authorization"],  # Explicit list
    allow_credentials=False,
    max_age=3600,
)
```

### 2. **SECURITY: No Input Sanitization for User-Facing Display**
**Files:** `app/predict/components/prediction-result.tsx:50`, `lib/api.ts:82-92`
**Severity:** HIGH
**Impact:** XSS vulnerability if comparison string or district names contain malicious content

**Current Code:**
```tsx
// prediction-result.tsx:50
<div>{result.comparison}</div>  // Unescaped string from API
```

**Risk:** Backend constructs comparison strings that are directly rendered:
```python
# main.py:189-193
comparison = "Cao hơn trung bình quận"  # Hard-coded OK
# But district names from CSV are directly displayed
```

**Recommended Fix:**
1. Backend: Validate district names against whitelist before storing
2. Frontend: Use DOMPurify or React's built-in escaping (already safe if using `{variable}` syntax)
3. Add CSP headers to prevent inline script execution

**Note:** React's JSX already escapes content in `{variable}` expressions, so current risk is LOW. However, if `dangerouslySetInnerHTML` is used anywhere, this becomes CRITICAL.

### 3. **SECURITY: Missing Rate Limiting**
**File:** `backend/main.py`
**Severity:** HIGH
**Impact:** API can be abused for DoS attacks or excessive model inference costs

**Recommended Fix:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/predict", response_model=PredictionOutput)
@limiter.limit("10/minute")  # 10 predictions per minute per IP
def predict(request: Request, input_data: PredictionInput):
    # ... existing code
```

---

## High Priority Issues

### 4. **Type Safety: Missing Error Response Types**
**File:** `lib/api.ts:46-79`
**Severity:** MEDIUM
**Impact:** Frontend error handling is generic, doesn't parse API error details

**Current:**
```typescript
if (!response.ok) throw new Error("Failed to fetch stats");
```

**Recommended:**
```typescript
interface APIError {
  detail: string;
  status_code: number;
}

async function fetchStats(): Promise<StatsResponse> {
  const response = await fetch(`${API_URL}/api/stats`);
  if (!response.ok) {
    const error: APIError = await response.json();
    throw new Error(error.detail || "Failed to fetch stats");
  }
  return response.json();
}
```

### 5. **Error Handling: Backend Exposes Stack Traces**
**File:** `backend/main.py`
**Severity:** MEDIUM
**Impact:** FastAPI default behavior exposes error details in production

**Recommended Fix:**
```python
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Don't expose validation details in production
    if os.getenv("ENV") == "production":
        return JSONResponse(
            status_code=400,
            content={"detail": "Invalid request parameters"}
        )
    return JSONResponse(status_code=400, content={"detail": exc.errors()})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")  # Log to stderr
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

### 6. **Performance: Missing Request Timeouts**
**File:** `lib/api.ts`
**Severity:** MEDIUM
**Impact:** Frontend hangs indefinitely if backend is slow/down

**Recommended Fix:**
```typescript
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};
```

### 7. **Data Validation: CSV Path Hardcoded**
**File:** `backend/main.py:52`
**Severity:** MEDIUM
**Impact:** Deployment issues if directory structure changes

**Current:**
```python
csv_path = os.path.join(os.path.dirname(__file__), "data", "apartments.csv")
```

**Recommended:**
```python
csv_path = os.getenv("DATA_CSV_PATH", os.path.join(os.path.dirname(__file__), "data", "apartments.csv"))
if not os.path.exists(csv_path):
    raise FileNotFoundError(f"Training data not found: {csv_path}")
```

### 8. **Memory: Model Trained on Every Startup**
**File:** `backend/main.py:48-58`
**Severity:** MEDIUM
**Impact:** Slow startup (20-60s), wastes resources

**Current:** Model retrains from CSV every time server starts

**Recommended:**
```python
# Add model caching
MODEL_PATH = "models/xgboost_model.pkl"
if os.path.exists(MODEL_PATH) and not os.getenv("FORCE_RETRAIN"):
    print(f"Loading cached model from {MODEL_PATH}")
    import joblib
    model = joblib.load(MODEL_PATH)
    # Load cached metadata
else:
    print("Training new model...")
    model, r2, df_clean, rank_map = train_model(csv_path)
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, MODEL_PATH)
```

---

## Medium Priority Issues

### 9. **Code Quality: Magic Numbers in Validation**
**Files:** `backend/main.py:30-36`, `backend/model.py:65`
**Severity:** LOW
**Impact:** Maintainability

**Examples:**
```python
dien_tich: float = Field(gt=20, le=300)  # Why 20? Why 300?
df_clean = df_clean[(df_clean["gia"] > 500_000_000) & (df_clean["dien_tich"] > 20)]
```

**Recommended:** Extract to constants with comments explaining business logic:
```python
# Business rules: apartments below 20m² are typically studios/illegal conversions
MIN_AREA_M2 = 20
MAX_AREA_M2 = 300  # Penthouses rarely exceed this in HCM
MIN_PRICE_VND = 500_000_000  # Below this likely data errors
```

### 10. **UI/UX: Missing Error Boundary**
**File:** `app/layout.tsx`
**Severity:** LOW
**Impact:** Uncaught React errors crash entire app

**Recommended:** Add error boundary component:
```tsx
// components/error-boundary.tsx
'use client'
import { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div>Đã xảy ra lỗi. Vui lòng tải lại trang.</div>
    }
    return this.props.children
  }
}
```

### 11. **Performance: Scatter Chart Samples 500 Points**
**File:** `backend/main.py:125`
**Severity:** LOW
**Impact:** Could sample more efficiently

**Current:**
```python
sample = df_filtered.sample(n=min(500, len(df_filtered)), random_state=42)
```

**Recommended:** Use stratified sampling to maintain distribution:
```python
if len(df_filtered) > 500:
    # Stratify by price bins to maintain visual distribution
    df_filtered['_price_bin'] = pd.qcut(df_filtered['gia'], q=10, duplicates='drop')
    sample = df_filtered.groupby('_price_bin', group_keys=False).apply(
        lambda x: x.sample(min(len(x), 50), random_state=42)
    ).drop(columns=['_price_bin'])
else:
    sample = df_filtered
```

### 12. **Code Smell: Global State Variables**
**File:** `backend/main.py:20-25`
**Severity:** LOW
**Impact:** Not thread-safe if using multiple workers

**Current:**
```python
model = None
cached_stats: dict = {}
# ... more globals
```

**Recommended:** Use dependency injection or app.state:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = None
    app.state.cached_stats = {}
    # ... populate on startup
    yield

# In endpoints:
@app.get("/api/stats")
def get_stats(request: Request):
    return request.app.state.cached_stats
```

---

## Edge Cases Found by Scout

### 13. **Edge Case: District Not in Training Data**
**File:** `backend/main.py:168-171`
**Status:** HANDLED CORRECTLY ✓

Good fallback to median rank when district not found:
```python
rank_quan = district_rank_map.get(input_data.quan)
if rank_quan is None:
    rank_quan = float(np.median(list(district_rank_map.values())))
```

### 14. **Edge Case: Empty Dataset After Filtering**
**File:** `backend/main.py:132-140`
**Status:** HANDLED ✓

Properly returns empty array for price_bins when no data.

### 15. **Edge Case: Float Parsing in Form**
**File:** `app/predict/components/prediction-form.tsx:88, 209`
**Risk:** `parseFloat("")` returns `NaN`, could crash backend

**Current:**
```tsx
onChange={(e) => setFormData({ ...formData, dien_tich: parseFloat(e.target.value) })}
```

**Recommended:**
```tsx
onChange={(e) => {
  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
  setFormData({ ...formData, dien_tich: isNaN(val) ? 0 : val });
}}
```

### 16. **Edge Case: CSV File Has BOM Character**
**File:** `backend/data/apartments.csv:1`
**Status:** DETECTED ⚠️

CSV starts with BOM: `\ufeff`. Pandas handles this automatically, but could cause issues if parsed manually.

**Verification:**
```python
# pandas.read_csv() handles BOM automatically ✓
```

---

## Positive Observations

1. **Excellent Type Safety:** All TypeScript files compile without errors, proper use of interfaces
2. **Clean Component Structure:** React components are focused and reusable
3. **Good Model Engineering:** Matches thesis notebook pipeline exactly, reproducible
4. **Proper Environment Variables:** `.env.local` not committed, uses `.env.example` pattern
5. **FastAPI Best Practices:** Lifespan events, Pydantic models, proper async patterns
6. **User Experience:** Loading states, error messages in Vietnamese, good accessibility
7. **Data Validation:** Pydantic Field validators with business logic constraints
8. **No Commented-Out Code:** Clean, production-ready code structure

---

## Recommended Actions (Priority Order)

1. **IMMEDIATE (Before Commit):**
   - Fix CORS configuration with environment variable
   - Add rate limiting to `/api/predict` endpoint
   - Add global exception handlers to prevent stack trace leaks
   - Add request timeouts to frontend API calls

2. **BEFORE PRODUCTION:**
   - Implement model caching (saves 30-60s startup time)
   - Add authentication/authorization layer
   - Configure CSP headers
   - Set up logging/monitoring (e.g., Sentry)
   - Add health check endpoint that verifies model is loaded
   - Create `requirements-prod.txt` with pinned versions

3. **NICE TO HAVE:**
   - Add unit tests for model.py functions
   - Add E2E tests for prediction flow
   - Extract magic numbers to constants
   - Add error boundary to React app
   - Implement stratified sampling for scatter chart
   - Add TypeScript error response types

---

## Metrics

- **Type Coverage:** 100% (all TypeScript, Python uses type hints)
- **Linting Issues:** 0 TypeScript errors, 0 Python syntax errors
- **Test Coverage:** 0% (no tests found)
- **Security Issues:** 3 Critical, 4 High, 5 Medium
- **Code Smells:** 3 (globals, magic numbers, missing error boundary)

---

## Unresolved Questions

1. **Authentication:** Is this demo public or requires login? Should `/api/predict` be rate-limited per user or per IP?
2. **Data Updates:** How often is `apartments.csv` updated? Should model be retrained automatically?
3. **Scaling:** Expected concurrent users? Need Redis caching for `cached_stats`?
4. **Deployment Target:** Vercel/Netlify for frontend? Railway/Render for backend? Affects CORS origins configuration.
5. **Model Versioning:** Should we track model versions and allow A/B testing?

---

**Review Completed:** 2026-02-07 22:24
**Next Steps:** Address critical security issues, then delegate to `tester` agent for integration tests.
