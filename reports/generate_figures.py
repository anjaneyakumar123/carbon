import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FIG_DIR = os.path.join(os.path.dirname(__file__), 'figures')
DATA_PATH = os.path.join(BASE_DIR, 'data', 'Preprocessed_Carbon_Footprint_Dataset.csv')
META_PATH = os.path.join(BASE_DIR, 'ml-service', 'models', 'models_metadata.json')
MODEL_PATH = os.path.join(BASE_DIR, 'ml-service', 'models', 'linear_regression.joblib')

os.makedirs(FIG_DIR, exist_ok=True)

# Clean academic typography matching NIT Raipur report style
plt.rcParams['font.family'] = 'serif'
plt.rcParams['font.serif'] = ['Times New Roman', 'DejaVu Serif']
plt.rcParams['axes.edgecolor'] = '#334155'
plt.rcParams['axes.linewidth'] = 0.8

NAVY = '#002147'
BLUE = '#0b3b60'
TEAL = '#065f46'
EMERALD = '#10b981'
SLATE = '#475569'
LIGHT_BG = '#f8fafc'
AMBER = '#b45309'
ROSE = '#be123c'

def draw_box(ax, x, y, w, h, title, body='', fc='#f1f5f9', ec=NAVY, title_color=NAVY, lw=1.2, fs_title=9, fs_body=7.5):
    box = FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.02,rounding_size=0.02',
                         facecolor=fc, edgecolor=ec, linewidth=lw)
    ax.add_patch(box)
    if body:
        ax.text(x + w/2, y + h*0.68, title, ha='center', va='center', fontsize=fs_title, fontweight='bold', color=title_color)
        ax.text(x + w/2, y + h*0.32, body, ha='center', va='center', fontsize=fs_body, color='#1e293b', linespacing=1.35)
    else:
        ax.text(x + w/2, y + h/2, title, ha='center', va='center', fontsize=fs_title, fontweight='bold', color=title_color)

def draw_arrow(ax, x1, y1, x2, y2, label='', color='#334155', rad=0.0):
    arr = FancyArrowPatch((x1, y1), (x2, y2), arrowstyle='-|>,head_length=6,head_width=3.5',
                          color=color, linewidth=1.3, connectionstyle=f'arc3,rad={rad}')
    ax.add_patch(arr)
    if label:
        mx, my = (x1 + x2)/2, (y1 + y2)/2
        ax.text(mx, my, label, ha='center', va='center', fontsize=6.8, color=color,
                bbox=dict(boxstyle='round,pad=0.14', fc='white', ec='#e2e8f0', alpha=0.95))

def fig1_dual_mode(df):
    fig, ax = plt.subplots(figsize=(8.2, 4.0), dpi=300)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis('off')
    ax.set_title('IPRC CarbonTrack — Dual-Mode GHG Accounting & Predictive Analytics Framework',
                 fontsize=10.5, fontweight='bold', color=NAVY, pad=10)

    # Top Data Sources
    draw_box(ax, 0.04, 0.72, 0.40, 0.20, 'MODE A: Standardized Research Baseline',
             '10,000 CSV Observations (2024–2051)\n12 Z-Score Features + Physical Target (kg CO2)\nZero Missing Values | Batch Append Ready',
             fc='#eff6ff', ec=BLUE, title_color=BLUE)
    draw_box(ax, 0.56, 0.72, 0.40, 0.20, 'MODE B: Physical Facility Operations',
             'Live Propellant, Energy, Fuel & Fleet Logs\nPhysical Units (kWh, Litres, km, kg, kL)\nGHG Protocol Scope 1 / 2 / 3 Attribution',
             fc='#ecfdf5', ec=TEAL, title_color=TEAL)

    # Middle Processing Engines
    draw_box(ax, 0.04, 0.37, 0.40, 0.22, 'Predictive ML & Correlation Engine',
             'FastAPI Microservice (Port 8000)\nLinear Regression (R²=0.853), GBR, RF, DT\n13x13 Pearson Matrix & Feature Weights',
             fc='#f8fafc', ec=SLATE, title_color=NAVY)
    draw_box(ax, 0.56, 0.37, 0.40, 0.22, 'Deterministic Emission Calculator',
             'Express REST Engine + Prisma ORM (Port 5000)\nCEA India v19 (0.82 kg/kWh) & IPCC 2019\nEmissions = Quantity × Verified Factor',
             fc='#f8fafc', ec=SLATE, title_color=NAVY)

    # Bottom Unified Governance Layer
    draw_box(ax, 0.14, 0.05, 0.72, 0.20, 'Unified Governance, Audit & Reporting Portal (React 18 + PostgreSQL)',
             '15 Role-Gated Modules | Mitigation Protocol Tracking | Immutable Audit Logs | PDFKit & ExcelJS Statutory Exports',
             fc='#f1f5f9', ec=NAVY, title_color=NAVY, fs_title=9.2)

    draw_arrow(ax, 0.24, 0.72, 0.24, 0.59, '80/20 & Chrono Splits', color=BLUE)
    draw_arrow(ax, 0.76, 0.72, 0.76, 0.59, 'Factor Lookup & Validation', color=TEAL)
    draw_arrow(ax, 0.24, 0.37, 0.36, 0.25, 'Forecasts & R² Metrics', color=NAVY)
    draw_arrow(ax, 0.76, 0.37, 0.64, 0.25, 'Scoped CO2e Ledger', color=NAVY)

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig1_facility.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig2_architecture():
    fig, ax = plt.subplots(figsize=(8.4, 4.4), dpi=300)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis('off')
    ax.set_title('Decoupled Three-Tier Enterprise Microservice Architecture',
                 fontsize=10.5, fontweight='bold', color=NAVY, pad=10)

    # Tier 1 Frontend
    draw_box(ax, 0.05, 0.72, 0.90, 0.21, 'PRESENTATION TIER — React 18.3 + Vite 5.4 SPA (Port 3000)',
             '15 Interactive Views (Overview, Dataset Explorer, Activity Monitoring, 6 Domain Analytics, ML Insights, Reports, Data Import, Admin)\nChart.js 4.4 Visualizations  •  Tailwind CSS Enterprise Theme  •  Axios JWT Interceptors  •  Client CSV Preview (PapaParse)',
             fc='#eff6ff', ec=BLUE, title_color=BLUE, fs_title=9.2, fs_body=7.4)

    # Tier 2 Backend
    draw_box(ax, 0.05, 0.38, 0.90, 0.22, 'APPLICATION TIER — Node.js + Express.js 4.21 REST API (Port 5000)',
             '10 Mounted Route Modules (/auth, /dashboard, /dataset, /analytics, /activities, /emission-factors, /predictions, /recommendations, /reports, /users)\nJWT RBAC Middleware (ADMIN / OFFICER / ANALYST)  •  Multer 50 MB CSV Ingestion  •  PDFKit & 3-Sheet ExcelJS Report Engine',
             fc='#ecfdf5', ec=TEAL, title_color=TEAL, fs_title=9.2, fs_body=7.4)

    # Tier 3 Data + ML
    draw_box(ax, 0.05, 0.04, 0.43, 0.22, 'DATA TIER — PostgreSQL via Prisma ORM 5.22',
             '13 Normalized Relational Models\nDatasetRecord (10,200 rows)  •  ActivityRecord  •  EmissionFactor\nAuditLog  •  ImportLog  •  PredictionHistory',
             fc='#f8fafc', ec=NAVY, title_color=NAVY, fs_title=8.6, fs_body=7.3)

    draw_box(ax, 0.52, 0.04, 0.43, 0.22, 'INTELLIGENCE TIER — Python FastAPI ML Engine (Port 8000)',
             'Uvicorn ASGI + Async Lifespan Loader\n4 Trained Scikit-Learn Regressors (.joblib)\nGET /models  •  POST /predict  •  POST /train',
             fc='#fefce8', ec=AMBER, title_color=AMBER, fs_title=8.6, fs_body=7.3)

    draw_arrow(ax, 0.50, 0.72, 0.50, 0.60, 'HTTP/JSON + Bearer JWT Token (Axios)', color=NAVY)
    draw_arrow(ax, 0.27, 0.38, 0.27, 0.26, 'Prisma Client Parameterized SQL', color=TEAL)
    draw_arrow(ax, 0.73, 0.38, 0.73, 0.26, 'Axios REST Calls (:8000)', color=AMBER)

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig2_architecture.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig3_erd():
    fig, ax = plt.subplots(figsize=(8.6, 4.8), dpi=300)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis('off')
    ax.set_title('Normalized PostgreSQL Entity-Relationship Schema (Prisma Models)',
                 fontsize=10.5, fontweight='bold', color=NAVY, pad=10)

    draw_box(ax, 0.03, 0.66, 0.26, 0.26, 'Department', 'id (UUID PK)\nname, code (PTF/CEP/EMD/FIU/SQA)\ndescription', fc='#eff6ff', ec=BLUE, fs_body=7)
    draw_box(ax, 0.03, 0.33, 0.26, 0.25, 'User & AuditLog', 'id (UUID PK), email, passwordHash\nrole (ADMIN|OFFICER|ANALYST)\nAuditLog: userId FK, action, entity', fc='#f8fafc', ec=NAVY, fs_body=7)
    draw_box(ax, 0.37, 0.62, 0.28, 0.30, 'ActivityRecord (Mode B)', 'id (UUID PK), date, category, scope\nquantity, unit, departmentId FK\nemissionFactorId FK\ncalculatedEmissionKgCO2, status', fc='#ecfdf5', ec=TEAL, title_color=TEAL, fs_body=7)
    draw_box(ax, 0.37, 0.29, 0.28, 0.25, 'EmissionFactor & Result', 'EmissionFactor: fuelOrActivityType,\nfactor, unit, source, co2eMultiplier\nEmissionResult: emissionKgCO2e', fc='#ecfdf5', ec=TEAL, title_color=TEAL, fs_body=7)
    draw_box(ax, 0.71, 0.64, 0.26, 0.28, 'DatasetRecord (Mode A)', 'id, datasetId FK, date\n12 Z-score Input Columns\ncarbonEmissionKgCO2 (Float)\nIndexed: date, datasetId', fc='#fefce8', ec=AMBER, title_color=AMBER, fs_body=7)
    draw_box(ax, 0.71, 0.30, 0.26, 0.25, 'UploadedDataset & ImportLog', 'UploadedDataset: filename, status\nImportLog: filename, totalRows,\nsuccessfulRows, failedRows', fc='#fefce8', ec=AMBER, title_color=AMBER, fs_body=7)
    draw_box(ax, 0.14, 0.03, 0.72, 0.19, 'Analytical, Sustainability & Governance Support Models',
             'RenewableEnergyRecord  •  WaterRecord  •  WasteRecord  •  MaterialRecord\nRecommendation (Priority/Status)  •  PredictionHistory (inputFeatures JSON)  •  ModelMetadata (R², MAE, RMSE)',
             fc='#f1f5f9', ec=SLATE, fs_body=7)

    draw_arrow(ax, 0.16, 0.66, 0.16, 0.58, '1 : N')
    draw_arrow(ax, 0.29, 0.78, 0.37, 0.78, '1 : N')
    draw_arrow(ax, 0.51, 0.54, 0.51, 0.62, '1 : N')
    draw_arrow(ax, 0.84, 0.55, 0.84, 0.64, '1 : N')

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig3_erd.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig4_auth_flow():
    fig, ax = plt.subplots(figsize=(8.4, 4.2), dpi=300)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis('off')
    ax.set_title('JWT Authentication, RBAC Authorization & Protected Request Sequence',
                 fontsize=10.5, fontweight='bold', color=NAVY, pad=10)

    actors = [('Client SPA\n(:3000)', 0.12), ('Express RBAC\n(:5000)', 0.38), ('PostgreSQL\n(Prisma)', 0.64), ('FastAPI ML\n(:8000)', 0.88)]
    for name, x in actors:
        draw_box(ax, x-0.09, 0.82, 0.18, 0.12, name, fc='#eff6ff', ec=NAVY, fs_title=8.2)
        ax.plot([x, x], [0.06, 0.82], '--', color='#94a3b8', lw=1.0)

    steps = [
        (0.75, 0.12, 0.38, '1. POST /api/auth/login (email, password)', BLUE),
        (0.66, 0.38, 0.64, '2. Lookup User + bcryptjs.compare(hash) & AuditLog', TEAL),
        (0.57, 0.38, 0.12, '3. 200 OK + Signed HS256 JWT (7d expiry)', BLUE),
        (0.46, 0.12, 0.38, '4. Protected Request (Authorization: Bearer <JWT>)', NAVY),
        (0.37, 0.38, 0.64, '5. verifyToken() + requireRole(ADMIN|OFFICER)', ROSE),
        (0.26, 0.38, 0.88, '6. Authorized Forward (/predict or /train)', AMBER),
        (0.15, 0.88, 0.12, '7. Inference Result + Persisted PredictionHistory', TEAL),
    ]
    for y, x1, x2, lbl, col in steps:
        arr = FancyArrowPatch((x1, y), (x2, y), arrowstyle='-|>,head_length=5,head_width=3', color=col, lw=1.3)
        ax.add_patch(arr)
        ax.text((x1+x2)/2, y+0.018, lbl, ha='center', va='bottom', fontsize=7.3, fontweight='bold', color=col,
                bbox=dict(boxstyle='round,pad=0.1', fc='white', ec='none', alpha=0.9))

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig4_auth_flow.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig5_distribution(df):
    fig, axes = plt.subplots(1, 2, figsize=(8.4, 3.6), dpi=300)
    vals = df['Carbon_Emission_kgCO2'].values

    # Panel A: Histogram + mean/median
    ax = axes[0]
    ax.hist(vals, bins=32, color=TEAL, alpha=0.82, edgecolor='white', linewidth=0.5)
    ax.axvline(vals.mean(), color=ROSE, linestyle='--', lw=1.5, label=f'Mean = {vals.mean():.2f} kg')
    ax.axvline(np.median(vals), color=AMBER, linestyle=':', lw=1.6, label=f'Median = {np.median(vals):.2f} kg')
    ax.set_title('A. Target Distribution (n = 10,000)', fontsize=9.5, fontweight='bold', color=NAVY)
    ax.set_xlabel('Carbon_Emission_kgCO2 (kg CO2)', fontsize=8.5)
    ax.set_ylabel('Observation Frequency', fontsize=8.5)
    ax.legend(fontsize=7.5, frameon=True)
    ax.grid(alpha=0.25, linestyle='--')

    # Panel B: Boxplot by Building Type (Residential > 0 vs Commercial <= 0)
    ax2 = axes[1]
    res = df[df['Building_Type_Residential'] > 0]['Carbon_Emission_kgCO2'].values
    com = df[df['Building_Type_Residential'] <= 0]['Carbon_Emission_kgCO2'].values
    bp = ax2.boxplot([com, res], tick_labels=['Commercial / Industrial\n(Z <= 0)', 'Residential\n(Z > 0)'],
                     patch_artist=True, widths=0.45)
    bp['boxes'][0].set_facecolor('#bfdbfe')
    bp['boxes'][1].set_facecolor('#bbf7d0')
    for med in bp['medians']:
        med.set_color(NAVY); med.set_linewidth(1.6)
    ax2.set_title('B. Stratified Spread by Building Sector', fontsize=9.5, fontweight='bold', color=NAVY)
    ax2.set_ylabel('Carbon_Emission_kgCO2 (kg CO2)', fontsize=8.5)
    ax2.grid(axis='y', alpha=0.25, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig5_distribution.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig6_correlation(df):
    cols = [
        'Energy_Usage_kWh', 'Transportation_Distance_km', 'Smart_Appliance_Usage_hours',
        'Renewable_Energy_Usage_percent', 'Temperature_C', 'Humidity_percent',
        'Fuel_Usage_Liters', 'Waste_Generated_kg', 'Vehicle_Type_Car',
        'Vehicle_Type_Electric Vehicle', 'Vehicle_Type_Walking',
        'Building_Type_Residential', 'Carbon_Emission_kgCO2'
    ]
    short = [
        'Energy', 'Transport', 'SmartAppl', 'Renew%', 'Temp', 'Humid',
        'Fuel', 'Waste', 'Car', 'EV', 'Walk', 'Resid', 'CO2_Target'
    ]
    corr = df[cols].corr().values

    fig, axes = plt.subplots(1, 2, figsize=(8.8, 4.0), dpi=300, gridspec_kw={'width_ratios': [1.35, 1]})
    ax = axes[0]
    im = ax.imshow(corr, cmap='RdBu_r', vmin=-1.0, vmax=1.0)
    ax.set_xticks(range(len(short))); ax.set_xticklabels(short, rotation=45, ha='right', fontsize=6.8)
    ax.set_yticks(range(len(short))); ax.set_yticklabels(short, fontsize=6.8)
    ax.set_title('A. 13×13 Pearson Correlation Matrix', fontsize=9.2, fontweight='bold', color=NAVY)
    # Annotate strong entries
    for i in range(len(short)):
        for j in range(len(short)):
            if abs(corr[i, j]) >= 0.35 or i == j:
                txt_col = 'white' if abs(corr[i, j]) > 0.6 else '#0f172a'
                ax.text(j, i, f'{corr[i, j]:.2f}', ha='center', va='center', fontsize=5.2, color=txt_col)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    # Panel B: Bar ranking with target
    ax2 = axes[1]
    target_corr = pd.Series(corr[:-1, -1], index=short[:-1]).sort_values()
    bar_colors = [TEAL if v >= 0.1 else (SLATE if v >= 0 else ROSE) for v in target_corr.values]
    ax2.barh(target_corr.index, target_corr.values, color=bar_colors, height=0.65)
    ax2.axvline(0, color='#334155', lw=0.8)
    for idx, v in enumerate(target_corr.values):
        offset = 0.015 if v >= 0 else -0.015
        ha = 'left' if v >= 0 else 'right'
        ax2.text(v + offset, idx, f'{v:+.3f}', va='center', ha=ha, fontsize=6.8, color=NAVY)
    ax2.set_xlim(-0.18, 0.88)
    ax2.set_title('B. Feature Correlation with CO2 Target', fontsize=9.2, fontweight='bold', color=NAVY)
    ax2.set_xlabel('Pearson Coefficient (r)', fontsize=8)
    ax2.tick_params(axis='y', labelsize=7.2)
    ax2.grid(axis='x', alpha=0.25, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig6_correlation.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig7_scatter_drivers(df):
    sample = df.sample(n=1200, random_state=42)
    fig, axes = plt.subplots(1, 2, figsize=(8.4, 3.6), dpi=300)

    for ax, col, color, title in [
        (axes[0], 'Energy_Usage_kWh', BLUE, 'A. Energy Usage (Z-score) vs. CO2 Target'),
        (axes[1], 'Transportation_Distance_km', TEAL, 'B. Transport Distance (Z-score) vs. CO2 Target')
    ]:
        x = sample[col].values
        y = sample['Carbon_Emission_kgCO2'].values
        ax.scatter(x, y, s=8, alpha=0.38, color=color, edgecolors='none')
        m, b = np.polyfit(df[col].values, df['Carbon_Emission_kgCO2'].values, 1)
        xs = np.linspace(x.min(), x.max(), 100)
        r = df[col].corr(df['Carbon_Emission_kgCO2'])
        ax.plot(xs, m*xs + b, color=ROSE, lw=1.8, label=f'OLS Fit (r = +{r:.3f})')
        ax.set_title(title, fontsize=9.2, fontweight='bold', color=NAVY)
        ax.set_xlabel(f'{col} (Standardized)', fontsize=8.2)
        ax.set_ylabel('Carbon_Emission_kgCO2 (kg)', fontsize=8.2)
        ax.legend(fontsize=7.5, loc='upper left')
        ax.grid(alpha=0.25, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig7_scatter_drivers.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig8_modeb_workflow():
    fig, ax = plt.subplots(figsize=(8.4, 3.8), dpi=300)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis('off')
    ax.set_title('Mode B Activity-Based GHG Quantification Pipeline & Factor Registry',
                 fontsize=10.5, fontweight='bold', color=NAVY, pad=10)

    draw_box(ax, 0.03, 0.56, 0.21, 0.32, '1. Operational Input',
             'Activity Category (6)\nPhysical Quantity & Unit\nDepartment (PTF/CEP/...)\nGHG Scope (1 / 2 / 3)',
             fc='#eff6ff', ec=BLUE, fs_body=7.2)
    draw_box(ax, 0.29, 0.56, 0.22, 0.32, '2. Factor Resolution',
             'EmissionFactor Table\nCEA India v19: 0.82/kWh\nIPCC Diesel: 2.68/L\nIPCC Petrol: 2.31/L',
             fc='#ecfdf5', ec=TEAL, title_color=TEAL, fs_body=7.2)
    draw_box(ax, 0.56, 0.56, 0.20, 0.32, '3. Deterministic Engine',
             'CO2 = Qty × Factor\nCO2e = CO2 × Multiplier\nStatus = COMPLETED\nAuditLog Persisted',
             fc='#fefce8', ec=AMBER, title_color=AMBER, fs_body=7.2)
    draw_box(ax, 0.81, 0.56, 0.16, 0.32, '4. Scope Ledger',
             'Scope 1 (Direct)\nScope 2 (Grid)\nScope 3 (Value)\nPDF / XLSX Export',
             fc='#f1f5f9', ec=NAVY, fs_body=7.2)

    draw_arrow(ax, 0.24, 0.72, 0.29, 0.72)
    draw_arrow(ax, 0.51, 0.72, 0.56, 0.72)
    draw_arrow(ax, 0.76, 0.72, 0.81, 0.72)

    # Bottom bar of verified emission factors
    draw_box(ax, 0.03, 0.08, 0.94, 0.34, 'Seeded Authoritative Emission Factors (10 Verified Standards Across 6 Categories)',
             'Grid Electricity: 0.820 kg/kWh (CEA v19)   |   Diesel (HSD): 2.680 kg/L (IPCC 2019)   |   Petrol: 2.310 kg/L (IPCC 2019)   |   CNG: 2.750 kg/kg (MoPNG)\n'
             'Passenger Car: 0.171 kg/km (BEE India)   |   EV Fleet: 0.053 kg/km (CEA Grid)   |   Heavy Diesel Truck: 0.297 kg/t-km (GHG Protocol)\n'
             'Municipal Waste: 0.580 kg/kg (IPCC FOD)   |   Potable Water: 0.350 kg/kL (CPHEEO/BEE)   |   Cryogenic Liquid N2: 0.450 kg/kg (IGA LCA)',
             fc='#f8fafc', ec=SLATE, title_color=NAVY, fs_title=8.5, fs_body=7.3)

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig8_modeb_workflow.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig9_ml_benchmark(meta):
    models = meta['models']
    names = [m['modelName'] for m in models]
    r2_rand = [m['r2Score'] for m in models]
    r2_chrono = [m['chronoR2Score'] for m in models]
    mae = [m['mae'] for m in models]
    rmse = [m['rmse'] for m in models]

    x = np.arange(len(names))
    w = 0.34

    fig, axes = plt.subplots(1, 2, figsize=(8.6, 3.8), dpi=300)

    ax = axes[0]
    b1 = ax.bar(x - w/2, r2_rand, w, label='Random 80/20 R²', color=BLUE)
    b2 = ax.bar(x + w/2, r2_chrono, w, label='Chronological R²', color=EMERALD)
    ax.set_ylim(0.75, 0.90)
    ax.set_xticks(x); ax.set_xticklabels(names, rotation=15, ha='right', fontsize=7.8)
    ax.set_ylabel('Coefficient of Determination (R²)', fontsize=8.5)
    ax.set_title('A. Goodness-of-Fit (R²) Benchmark', fontsize=9.4, fontweight='bold', color=NAVY)
    ax.legend(fontsize=7.5)
    ax.grid(axis='y', alpha=0.25, linestyle='--')
    for bars in (b1, b2):
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2, h + 0.0025, f'{h:.3f}', ha='center', va='bottom', fontsize=6.5)

    ax2 = axes[1]
    b3 = ax2.bar(x - w/2, mae, w, label='Test MAE (kg)', color=AMBER)
    b4 = ax2.bar(x + w/2, rmse, w, label='Test RMSE (kg)', color=ROSE)
    ax2.set_ylim(0, 4.9)
    ax2.set_xticks(x); ax2.set_xticklabels(names, rotation=15, ha='right', fontsize=7.8)
    ax2.set_ylabel('Prediction Error (kg CO2)', fontsize=8.5)
    ax2.set_title('B. Error Magnitude Comparison (MAE / RMSE)', fontsize=9.4, fontweight='bold', color=NAVY)
    ax2.legend(fontsize=7.5)
    ax2.grid(axis='y', alpha=0.25, linestyle='--')
    for bars in (b3, b4):
        for bar in bars:
            h = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2, h + 0.07, f'{h:.2f}', ha='center', va='bottom', fontsize=6.5)

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig9_ml_benchmark.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig10_residuals(df, meta):
    feat_cols = meta['featureCols']
    target_col = meta['targetCol']
    X = df[feat_cols]
    y = df[target_col]
    _, X_test, _, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = joblib.load(MODEL_PATH)
    preds = model.predict(X_test)
    resids = y_test.values - preds

    fig, axes = plt.subplots(1, 2, figsize=(8.4, 3.6), dpi=300)

    ax = axes[0]
    ax.scatter(y_test.values, preds, s=9, alpha=0.35, color=BLUE, edgecolors='none')
    lims = [min(y_test.min(), preds.min()), max(y_test.max(), preds.max())]
    ax.plot(lims, lims, '--', color=ROSE, lw=1.6, label='Ideal y = ŷ Identity')
    ax.set_title('A. Actual vs. Predicted (Active Linear Regression)', fontsize=9.2, fontweight='bold', color=NAVY)
    ax.set_xlabel('Observed Physical Emission (kg CO2)', fontsize=8.2)
    ax.set_ylabel('Predicted Emission (kg CO2)', fontsize=8.2)
    ax.legend(fontsize=7.5)
    ax.grid(alpha=0.25, linestyle='--')

    ax2 = axes[1]
    ax2.hist(resids, bins=30, color=TEAL, alpha=0.82, edgecolor='white', linewidth=0.5)
    ax2.axvline(0, color=ROSE, linestyle='--', lw=1.5, label=f'Mean Residual = {resids.mean():.3f}')
    ax2.set_title(f'B. Test Residual Error Distribution (RMSE = {np.sqrt(np.mean(resids**2)):.3f})',
                  fontsize=9.2, fontweight='bold', color=NAVY)
    ax2.set_xlabel('Residual Error (y - ŷ) in kg CO2', fontsize=8.2)
    ax2.set_ylabel('Test Sample Count (n = 2,000)', fontsize=8.2)
    ax2.legend(fontsize=7.5)
    ax2.grid(alpha=0.25, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig10_residuals.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig11_feature_importance(meta):
    models = meta['models']
    feats = [
        'Energy_Usage_kWh', 'Transportation_Distance_km', 'Waste_Generated_kg',
        'Fuel_Usage_Liters', 'Renewable_Energy_Usage_percent', 'Smart_Appliance_Usage_hours'
    ]
    labels = ['Energy Usage', 'Transport Dist.', 'Waste Gen.', 'Fuel Usage', 'Renewable %', 'Smart Appl.']
    y_pos = np.arange(len(feats))
    h = 0.19
    palette = [BLUE, TEAL, AMBER, ROSE]

    fig, ax = plt.subplots(figsize=(8.4, 3.8), dpi=300)
    for idx, m in enumerate(models):
        vals = [m['featureImportances'].get(f, 0.0) * 100 for f in feats]
        ax.barh(y_pos + (idx - 1.5)*h, vals, h, label=m['modelName'], color=palette[idx])

    ax.set_yticks(y_pos); ax.set_yticklabels(labels, fontsize=8.2)
    ax.invert_yaxis()
    ax.set_xlabel('Relative Feature Attribution Weight (%)', fontsize=8.5)
    ax.set_title('Top-6 Standardized Feature Importance Comparison Across ML Models',
                 fontsize=9.8, fontweight='bold', color=NAVY)
    ax.legend(fontsize=7.8, loc='lower right')
    ax.grid(axis='x', alpha=0.25, linestyle='--')

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig11_feature_importance.png'), dpi=300, bbox_inches='tight')
    plt.close()

def fig12_ingestion_pipeline():
    fig, ax = plt.subplots(figsize=(8.4, 3.8), dpi=300)
    ax.set_xlim(0, 1); ax.set_ylim(0, 1); ax.axis('off')
    ax.set_title('Validated Batch CSV Ingestion & Statutory Report Synthesis Pipeline',
                 fontsize=10.2, fontweight='bold', color=NAVY, pad=10)

    draw_box(ax, 0.03, 0.54, 0.20, 0.34, 'Client CSV Preview',
             'PapaParse (DataImport.jsx)\nChecks 14 Expected Cols\nHTTP Upload up to 50 MB',
             fc='#eff6ff', ec=BLUE, fs_body=7.1)
    draw_box(ax, 0.28, 0.54, 0.21, 0.34, 'Express Ingestion',
             'Multer memoryStorage\nHeader Alias Normalizer\nNaN / Date Validation',
             fc='#ecfdf5', ec=TEAL, title_color=TEAL, fs_body=7.1)
    draw_box(ax, 0.54, 0.54, 0.21, 0.34, 'PostgreSQL Persistence',
             'UploadedDataset Record\nChunked createMany (1,000)\nImportLog & AuditLog',
             fc='#fefce8', ec=AMBER, title_color=AMBER, fs_body=7.1)
    draw_box(ax, 0.80, 0.54, 0.17, 0.34, 'Statutory Exports',
             'PDFKit (A4 Official)\nExcelJS (3 Worksheets)\nStreaming CSV Export',
             fc='#f1f5f9', ec=NAVY, fs_body=7.1)

    draw_arrow(ax, 0.23, 0.71, 0.28, 0.71)
    draw_arrow(ax, 0.49, 0.71, 0.54, 0.71)
    draw_arrow(ax, 0.75, 0.71, 0.80, 0.71)

    draw_box(ax, 0.06, 0.08, 0.88, 0.32, 'Observed Pipeline Throughput & End-to-End Verification Metrics',
             '• Baseline Seeding: 10,000 rows imported in 1 initial transaction (0 failed, 0 duplicates)\n'
             '• Synthetic Validation Batch: 100/100 rows ingested via POST /api/dataset/import (HTTP 200 OK; total DB rows = 10,200)\n'
             '• Statutory Exports Verified: PDFKit stream (5,373 bytes, valid %PDF header) | ExcelJS 3-sheet workbook (321,703 bytes, valid PK ZIP)',
             fc='#f8fafc', ec=SLATE, title_color=NAVY, fs_title=8.6, fs_body=7.4)

    plt.tight_layout()
    plt.savefig(os.path.join(FIG_DIR, 'fig12_ingestion_pipeline.png'), dpi=300, bbox_inches='tight')
    plt.close()

if __name__ == '__main__':
    df = pd.read_csv(DATA_PATH)
    with open(META_PATH, 'r') as f:
        meta = json.load(f)

    fig1_dual_mode(df)
    fig2_architecture()
    fig3_erd()
    fig4_auth_flow()
    fig5_distribution(df)
    fig6_correlation(df)
    fig7_scatter_drivers(df)
    fig8_modeb_workflow()
    fig9_ml_benchmark(meta)
    fig10_residuals(df, meta)
    fig11_feature_importance(meta)
    fig12_ingestion_pipeline()
    print('All 12 genuine CarbonTrack figures generated in:', FIG_DIR)
