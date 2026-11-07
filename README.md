# IPRC CarbonTrack — Carbon Footprint Monitoring and Measurement System

**Research Proposal Reference:** RES-IPRC-2025-003  
**Organization:** ISRO Propulsion Complex (IPRC), Mahendragiri  
**Research Area:** Environment Protection  
**Objective:** Develop software for carbon footprint monitoring, measurement, and recording of operational activities.

---

## Live Running Services

The entire application is currently running locally:

| Service | Port | Endpoint URL | Status |
| :--- | :---: | :--- | :---: |
| **Frontend UI (React/Vite)** | `3000` | [http://127.0.0.1:3000](http://127.0.0.1:3000) | **ONLINE** |
| **Backend REST API (Express)** | `5000` | [http://127.0.0.1:5000/api](http://127.0.0.1:5000/api) | **ONLINE** |
| **Machine Learning Service (FastAPI)** | `8000` | [http://127.0.0.1:8000](http://127.0.0.1:8000) | **ONLINE** |
| **PostgreSQL Database** | `5432` | `localhost:5432/carbontrack` | **ONLINE** |

---

## Demo Login Credentials

You can sign in with any of the following accounts (or use the one-click quick-fill buttons on the login page):

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@iprc.isro.gov.in` | `Admin@123` | Full access, user management, retraining, factor config |
| **Environmental Officer** | `officer@iprc.isro.gov.in` | `Officer@123` | Activity logging, report downloads, recommendations |
| **Research Analyst** | `analyst@iprc.isro.gov.in` | `Analyst@123` | Data explorer, prediction interface, analytics |

---

## Key Features

1. **Exact 10,000-Record Dataset Integration:**
   - 14 columns imported into PostgreSQL.
   - Date range: 2024-01-01 to 2051-05-18.
   - Zero missing values, zero duplicates.
   - Target variable: `Carbon_Emission_kgCO2` (physical range: 1.187 to 55.962 kg CO2).
   - Standardized features are strictly labeled as Z-scores ($Mean \approx 0.0, Standard Deviation \approx 1.0$).

2. **Enterprise Industrial UI/UX:**
   - Designed with ISRO corporate aesthetic: forest green (`#064e3b`, `#059669`), crisp white, and light neutral backgrounds.
   - Responsive sidebar with 15 functional navigation modules.
   - Interactive KPI cards with tooltips and standardization badges.

3. **Two-Mode Architecture:**
   - **Mode A (Dataset Analysis):** Comprehensive analytics on the 10,000-record standardized dataset.
   - **Mode B (Operational Activity Logging):** Live operational entries using raw physical quantities ($kWh, Litres, km, kg$) and verified emission factors ($\text{Emissions} = \text{Activity} \times \text{Factor}$).
   - Strict separation between standardized dataset records and operational activity records.

4. **Machine Learning & Prediction Module:**
   - Evaluated 4 regression architectures: Linear Regression, Decision Tree, Random Forest, and Gradient Boosting.
   - 80/20 train/test split with zero target leakage (seed=42).
   - Chronological holdout validation to evaluate temporal generalization.
   - Active Model: **Linear Regression** ($R^2 = 0.8534$, $\text{MAE} = 2.961\text{ kg}$, $\text{RMSE} = 3.765\text{ kg}$).
   - Interactive prediction form with real-time feature contribution breakdown.

5. **Reports Generator:**
   - Direct download of official PDF reports (generated dynamically via `PDFKit`).
   - Direct download of comprehensive Excel workbooks (generated via `ExcelJS`).
   - Dataset export to CSV and XLSX.

6. **Comprehensive Automated Verification:**
   - 32 integration tests passing covering health checks, RBAC, database counts, dashboard filters, Mode B calculation, ML prediction, and report exports.

---

## Starting the Application Manually

If restarting the environment:

```powershell
# 1. Start Python ML Service
python ml-service/app.py

# 2. Start Express Backend
cd backend
npm run dev

# 3. Start Vite Frontend
cd frontend
npm run dev
```

