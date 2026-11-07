# IPRC CarbonTrack — System Architecture & Technical Specifications

**Research Proposal Reference:** RES-IPRC-2025-003  
**Organization:** ISRO Propulsion Complex (IPRC), Mahendragiri  
**Research Area:** Environment Protection  
**System Objective:** Develop comprehensive software for carbon footprint monitoring, measurement, and operational activity recording.

---

## 1. Architectural Overview

IPRC CarbonTrack follows a decoupled, three-tier enterprise microservice architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                   React.js Frontend (Vite)                  │
│  - Tailwind CSS Enterprise Theme (Forest Green / White)     │
│  - Chart.js Visualizations (Trends, Scatter, Heatmap)       │
│  - Lucide React Iconography                                 │
│  - Port 3000                                                │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST APIs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Node.js / Express.js Backend                │
│  - REST API Routing & Controllers                           │
│  - JWT Authentication & RBAC Middleware                     │
│  - PDFKit & ExcelJS Report Engine                           │
│  - Port 5000                                                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼ Prisma ORM                   ▼ HTTP REST
┌──────────────────────────────┐ ┌─────────────────────────────┐
│     PostgreSQL Database      │ │ Python FastAPI ML Service   │
│  - 10,000 Dataset Records    │ │  - Scikit-learn Pipeline    │
│  - Mode B Activity Ledger    │ │  - 4 Regression Models      │
│  - Verified Emission Factors │ │  - Zero Target Leakage      │
│  - Audit Logs & Users        │ │  - Port 8000                │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Dataset Characteristics & Standardization Compliance

The supplied dataset (`Preprocessed_Carbon_Footprint_Dataset.csv`) contains:
- **10,000 records** and **14 columns**.
- **Date Range:** 2024-01-01 to 2051-05-18.
- **Missing Values:** 0.
- **Duplicate Rows:** 0.
- **Physical Target:** `Carbon_Emission_kgCO2` (Min: 1.187, Avg: 22.956, Max: 55.962 kg CO2).
- **Standardized Features:** Numerical input features (`Energy_Usage_kWh`, `Transportation_Distance_km`, `Fuel_Usage_Liters`, etc.) are Z-score standardized ($Mean \approx 0.0, Standard Deviation \approx 1.0$).
- **Compliance Rule:** Negative numerical features represent below-average scores relative to the mean, **NOT** negative physical energy or fuel. Only `Carbon_Emission_kgCO2` represents physical mass.

---

## 3. Two-Mode Operational Architecture

### Mode A: Standardized Dataset Analysis
- Inspects and benchmarks historical and projected observations.
- Multivariate Pearson correlation matrix.
- Machine learning regression models trained strictly on standardized scores.

### Mode B: Real-World Operational Activity Measurement
- Dedicated operational entry table separate from preprocessed records.
- Physical units ($kWh, Litres, km, kg, kL$).
- Calculation formula:
  $$\text{Emissions } (kg\,CO_2) = \text{Activity Quantity} \times \text{Verified Emission Factor}$$
- Scope 1, Scope 2, and Scope 3 classification compliant with the GHG Protocol.
- Verified factor benchmarks from the Central Electricity Authority (CEA) India Baseline v19 and IPCC 2019 Guidelines.

---

## 4. Machine Learning Model Benchmark

Evaluated across four regression architectures using an 80/20 train/test split (seed=42) and verified against a chronological holdout validation:

| Model Architecture | Test $R^2$ Score | Test MAE ($kg$) | Test RMSE ($kg$) | Chronological $R^2$ |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** (Active) | **0.8534** | **2.961** | **3.765** | **0.8451** |
| **Gradient Boosting** | 0.8474 | 3.011 | 3.842 | 0.8365 |
| **Random Forest** | 0.8428 | 3.057 | 3.900 | 0.8328 |
| **Decision Tree** | 0.8243 | 3.181 | 4.123 | 0.8102 |

---

## 5. Security & Authentication

- **Password Hashing:** `bcryptjs` with 10 salt rounds.
- **Token Format:** Signed JSON Web Tokens (JWT) with 7-day expiration.
- **Roles:**
  - `ADMIN`: Full administrative privileges, user management, retraining, factor adjustments.
  - `OFFICER`: Operational activity logging, report downloading, recommendation review.
  - `ANALYST`: Read-only analytics, prediction interface, data dictionary inspection.

