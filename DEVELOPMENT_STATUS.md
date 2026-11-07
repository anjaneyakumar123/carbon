# IPRC CarbonTrack — Development Status & Acceptance Verification

**Project Reference:** RES-IPRC-2025-003  
**Organization:** ISRO Propulsion Complex (IPRC), Mahendragiri  
**Status Date:** 2026-11-07  
**Build Status:** ALL CRITERIA PASSED (32/32 Integration Tests Verified)

---

## 1. Phase Completion Summary

| Phase | Description | Status | Verification Detail |
| :--- | :--- | :---: | :--- |
| **Phase 1** | Workspace & Dataset Inspection | **COMPLETED** | Verified 10,000 rows, 14 columns, 0 missing, 0 duplicates, target range 1.19–55.96 kg CO2. |
| **Phase 2** | Tech Stack Setup | **COMPLETED** | React 18, Vite, Tailwind CSS, Express.js, Prisma ORM, Python FastAPI installed and configured. |
| **Phase 3** | Database Configuration | **COMPLETED** | PostgreSQL 15 running, `carbontrack` schema pushed with all tables, constraints, and indexes. |
| **Phase 4** | Authentication & RBAC | **COMPLETED** | JWT authentication implemented with bcrypt hashing and RBAC (`ADMIN`, `OFFICER`, `ANALYST`). |
| **Phase 5** | Dataset Import | **COMPLETED** | All 10,000 preprocessed dataset records imported into PostgreSQL via high-speed batches. |
| **Phase 6** | Dataset Explorer & Dictionary | **COMPLETED** | Full pagination, sorting, search, column filters, data dictionary, CSV & Excel exports. |
| **Phase 7** | Interactive Dashboard | **COMPLETED** | KPI cards, yearly/monthly trends, distribution histogram, vehicle & building breakdown charts. |
| **Phase 8** | Analytics & Visualization | **COMPLETED** | Pearson correlation matrix, feature scatter plots, renewable energy quartile analysis. |
| **Phase 9** | Emission Factors Registry | **COMPLETED** | Verified factors from CEA India Baseline v19, IPCC 2019, BEE India, and GHG Protocol. |
| **Phase 10** | Mode B Activity Management | **COMPLETED** | Real-world operational activity logging separated from standardized dataset with live calculation. |
| **Phase 11** | Machine Learning Module | **COMPLETED** | 4 regression models trained with zero leakage. Linear Regression achieves $R^2 = 0.8534$. |
| **Phase 12** | Recommendation Engine | **COMPLETED** | Rule-based mitigation engine with priority filtering and status tracking. |
| **Phase 13** | Report Generation | **COMPLETED** | Downloadable PDF (PDFKit) and Excel (ExcelJS) reports generated dynamically. |
| **Phase 14** | Complete Testing | **COMPLETED** | Automated test suite passed 32/32 tests with zero errors. |
| **Phase 15** | Documentation & Instructions | **COMPLETED** | Complete technical manuals, architectural diagrams, and user guides published. |

---

## 2. Active Services Endpoints

- **Frontend Client (React/Vite):** `http://127.0.0.1:3000`
- **Backend API Server (Express):** `http://127.0.0.1:5000/api`
- **Machine Learning Engine (FastAPI):** `http://127.0.0.1:8000`
- **PostgreSQL Database:** `localhost:5432/carbontrack`

---

## 3. Seed Credentials

- **Administrator:** `admin@iprc.isro.gov.in` / `Admin@123` (Role: `ADMIN`)
- **Environmental Officer:** `officer@iprc.isro.gov.in` / `Officer@123` (Role: `OFFICER`)
- **Research Analyst:** `analyst@iprc.isro.gov.in` / `Analyst@123` (Role: `ANALYST`)

