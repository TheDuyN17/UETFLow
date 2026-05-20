# PROGRESS-EAI.md — Đợt 2: Gemini AI Integration + Preview UI

**Ngày:** 2026-05-20  
**Thời gian thực hiện:** ~3 giờ  
**Kết quả:** ✅ PASS — Tất cả acceptance tests

---

## Task Summary

| Phase | Task | Status | Notes |
|-------|------|--------|-------|
| Phase 0 | Probe + backup image | ✅ DONE | 7 containers up, Gemini key verified, backup `docform:backup-eai` |
| Phase 1 | GeminiService.java — Gemini REST API | ✅ DONE | RestTemplate + POST to Gemini REST API |
| Phase 1 | application.yml — gemini.api.model config | ✅ DONE | Model configurable via env var |
| Phase 1 | FilledFormResultDTO — thêm rawText + extractionId | ✅ DONE | Sync endpoint trả đủ data cho FE |
| Phase 1 | Rebuild eai Docker image | ✅ DONE | Build JAR rồi `docker build` từ Dockerfile |
| Phase 1 | Model switch to `gemini-flash-lite-latest` | ✅ DONE | gemini-2.0-flash hết daily quota, dùng lite |
| Phase 2 | EAiUpload.jsx — dùng sync endpoint | ✅ DONE | Tránh MultipartFile bị cleanup trong async thread |
| Phase 2 | EAiUpload.jsx — editable FieldTable | ✅ DONE | User sửa được data trước khi tạo yêu cầu |
| Phase 2 | EAiUpload.jsx — navigate với prefill | ✅ DONE | Thay `createFromPdf` API call = navigate với base64 |
| Phase 3 | NewTicket.jsx — decode prefill | ✅ DONE | Auto-fill title + note từ Gemini data |
| Phase 3 | NewTicket.jsx — AI banner | ✅ DONE | Collapsible banner hiện danh sách field AI extract |
| Phase 4 | Sample PDFs | ✅ DONE | 2 file: Tran Thi Bich + Le Van Minh |
| Phase 5 | Playwright E2E | ✅ 3/3 PASS | A+B, C, E đều pass |
| Regression | Business-flow.spec.cjs | ✅ 7/7 PASS | Không có regression |

---

## Files đã sửa

### Backend (`backend/eAi/`)
- `src/main/java/com/vnu/uet/service/GeminiService.java` — Real Gemini REST API call via Spring RestTemplate
- `src/main/java/com/vnu/uet/service/dto/FilledFormResultDTO.java` — Thêm `rawText`, `extractionId`
- `src/main/java/com/vnu/uet/service/DocumentMapService.java` — populate rawText/extractionId trong processMapSync
- `src/main/java/com/vnu/uet/web/rest/DocumentMapResource.java` — populate rawText/extractionId trong getTaskResult
- `src/main/resources/config/application.yml` — Thêm `gemini.api.key` + `gemini.api.model` config

### Backend infrastructure
- `docker-compose.yml` — Thêm `GEMINI_API_MODEL: gemini-flash-lite-latest`

### Frontend (`frontend/src/`)
- `pages/EAiUpload.jsx` — Refactor hoàn toàn: sync endpoint, editable fields, navigate với prefill
- `pages/NewTicket.jsx` — Decode prefill param, auto-fill title+note, AI banner

### Tests (`frontend/e2e/`)
- `e2e/eai-flow.spec.cjs` — New E2E: Test A+B, C, E

### Scripts
- `scripts/create-sample-pdf.py` — Tạo 2 PDF mẫu
- `scripts/don-nghi-phep-tran-thi-bich.pdf` — PDF mẫu 1
- `scripts/don-nghi-phep-le-van-minh.pdf` — PDF mẫu 2

---

## Backend Image

```
docker image: docform:latest (rebuilt 2026-05-20)
docker image backup: docform:backup-eai (pre-eai version)
container: uetflow-eai (port 8085)
model: gemini-flash-lite-latest
```

---

## Key Decisions

### 1. Gemini Model: gemini-flash-lite-latest
- `gemini-2.0-flash` → 429 daily quota exhausted từ previous sessions
- `gemini-2.5-flash` → 503 high demand
- `gemini-flash-lite-latest` → ✅ works, separate quota pool

### 2. Sync vs Async endpoint
- Backend có 2 endpoints: `POST /document-maps` (async) và `POST /document-maps/sync`
- Async endpoint FAIL vì `MultipartFile` bị Spring cleanup sau HTTP response trước khi async thread chạy
- Fix: FE dùng sync endpoint (`eAi.submitSync()`), tránh hoàn toàn vấn đề này
- UX vẫn tốt: spinner hiện trong khi chờ 5-15s Gemini response

### 3. Navigate with prefill (thay vì POST /api/request/ai/create-from-pdf)
- Endpoint `/api/request/ai/create-from-pdf` không tồn tại ở eRequest BE
- Thay bằng: encode filledData thành base64, navigate `/erequest/new?flowId=X&prefill=<base64>`
- NewTicket.jsx decode và auto-fill từ prefill param

### 4. btoa/atob UTF-8 encoding pattern
- `btoa(unescape(encodeURIComponent(JSON.stringify(data))))` — browser encode
- `JSON.parse(decodeURIComponent(escape(atob(base64))))` — browser decode
- Playwright test: mimic với `Buffer.from(unescaped, "binary").toString("base64")`

---

## Playwright Results

```
✅ A+B: Upload PDF → Preview (Tran Thi Bich, not NGUYEN VAN A) → Navigate with prefill (13.0s)
✅ C: NewTicket prefill decode → Title = "Don xin nghi phep - Tran Thi Bich" (0.9s)
✅ E: PDF1="Tran Thi Bich", PDF2="Le Van Minh" — Different Gemini results (12.7s)
✅ Business-flow: 7/7 existing tests pass (no regression)
```

---

## Verify Commands

```bash
# Kiểm tra Gemini đang gọi thật (không phải mock)
docker logs uetflow-eai | grep "Calling Gemini"

# Test extraction
curl -s -X POST http://localhost:8080/api/document-maps/sync \
  -F "file=@E:/Du_an/scripts/don-nghi-phep-tran-thi-bich.pdf" \
  -F "formName=Don xin nghi phep" | python -m json.tool

# Run E2E
cd E:/Du_an/frontend && npx playwright test e2e/eai-flow.spec.cjs
```

---

## Known Limitations

1. **Gemini per-minute rate limit**: không nên call quá nhanh (15 RPM)
2. **Async endpoint broken**: `POST /api/document-maps` (async) vẫn FAIL với MultipartFile cleanup — cần fix trong backend nếu cần polling
3. **S3 không thật**: file upload được simulate (không thực sự lưu vào S3)
4. **Tesseract chỉ OCR text-based PDF**: PDF scan (image) cần thêm Tesseract OCR
