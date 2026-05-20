# PROGRESS-SEARCH.md — Global Search trong Header

**Ngày:** 2026-05-20  
**Thời gian:** ~30 phút  
**Kết quả:** ✅ PASS — 6/6 search tests + 18/18 regression tests

---

## Files đã sửa

| File | Thay đổi |
|------|---------|
| `frontend/src/components/GlobalSearch.jsx` | **NEW** — Component global search |
| `frontend/src/components/AppHeader.jsx` | Import + wire GlobalSearch vào header |
| `frontend/e2e/global-search.spec.cjs` | **NEW** — 6 Playwright acceptance tests |

---

## Tính năng

- Gõ tên module/chức năng → dropdown gợi ý ngay lập tức
- Diacritic-insensitive: "phe duyet" matches "Phê duyệt" (normalize NFD + strip marks)
- Keyboard navigation: ArrowUp/Down + Enter + Escape
- Click outside → dropdown đóng
- Empty state khi không có kết quả
- 11 items trong SEARCH_INDEX (4 module chính + 7 trang con)

## SEARCH_INDEX routes (tất cả đã verify với App.jsx)

| Label | Path |
|-------|------|
| eForm — Quản lý biểu mẫu | `/eform` |
| eFlow — Quản lý quy trình | `/eflow` |
| eRequest — Yêu cầu / Ticket | `/erequest` |
| eAi — Trích xuất PDF bằng AI | `/eai` |
| eAccount — Quản lý tài khoản | `/eaccount` |
| Tạo biểu mẫu mới | `/eform` |
| Tạo quy trình mới | `/eflow` |
| Giao dịch cần xử lý (Phê duyệt) | `/erequest` |
| Tải lên PDF / Trích xuất AI | `/eai` |
| Hồ sơ cá nhân | `/eaccount/profile` |
| Quản lý nhân viên | `/eaccount/staff` |

---

## Playwright Test Results

```
Global Search:
  ✅ Case A: Search có dấu "eflow" → navigate /eflow
  ✅ Case B: Search không dấu "phe duyet" → match "Phê duyệt"
  ✅ Case C: Keyboard ArrowDown×2 + Enter → navigate
  ✅ Case D: "xxxxxxxxxxxxxxxx" → empty state
  ✅ Case E: Escape → close dropdown
  ✅ Case F: Click outside → close dropdown

Regression:
  ✅ business-flow.spec.cjs: 7/7
  ✅ eai-flow.spec.cjs: 3/3
  ✅ v2-acceptance.spec.cjs: 8/8
─────────────────────────────────
TOTAL: 24/24 PASS
```

---

## Không làm (theo yêu cầu)

- Role-based filtering (tất cả users thấy cùng 11 items — có thể filter sau)
- Backend changes
- Push git
