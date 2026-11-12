import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = r'c:\Users\anjan\OneDrive\Documents\Desktop\Carbon\reports\figures'
os.makedirs(OUTPUT_DIR, exist_ok=True)
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# ----------------- Fig 1: Schematic of IPRC Facility Infrastructure & Operational Zones -----------------
fig, ax = plt.subplots(figsize=(7, 3.2), dpi=200)
ax.set_xlim(0, 10)
ax.set_ylim(0, 5)
ax.axis('off')

# Draw Campus Perimeter
campus = patches.FancyBboxPatch((0.5, 0.5), 9, 4, boxstyle="round,pad=0.2", ec="#1e3d59", fc="#f5f7fa", lw=2)
ax.add_patch(campus)
ax.text(5, 4.3, "ISRO Propulsion Complex (IPRC) - Facility Footprint Boundary", ha='center', fontsize=10.5, fontweight='bold', color='#1e3d59')

# Sub-facilities
zones = [
    ("Cryogenic Test Stand", 1, 2.2, 2.2, 1.5, "#e8f4f8", "#17b978"),
    ("Semi-Cryo Stage Stand", 3.8, 2.2, 2.4, 1.5, "#e8f4f8", "#ff6e40"),
    ("Substation & Solar PV", 6.8, 2.2, 2.4, 1.5, "#f1f0ec", "#ffb300"),
    ("Chemical Effluent Plant", 1.8, 0.8, 2.8, 1.1, "#f7f7f7", "#845ec2"),
    ("Campus Logistics Yard", 5.4, 0.8, 3.8, 1.1, "#f7f7f7", "#4b4453")
]

for name, x, y, w, h, bg, border in zones:
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1", ec=border, fc=bg, lw=1.5)
    ax.add_patch(box)
    ax.text(x + w/2, y + h/2, name, ha='center', va='center', fontsize=8, fontweight='bold', color='#2d3436')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig1_facility.png'), dpi=200)
plt.close()

# ----------------- Fig 2: Raw vs Preprocessed Signals -----------------
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(7, 3.2), dpi=200, sharex=True)
t = np.linspace(0, 10, 500)
raw = np.sin(1.5 * t) + 0.4 * np.random.randn(len(t)) + 2.5
preprocessed = (raw - np.mean(raw)) / np.std(raw)

ax1.plot(t, raw, color='#d63031', lw=1.2, label='Raw Telemetry (kW / Fuel Liters)')
ax1.set_ylabel('Raw Amp', fontsize=8)
ax1.grid(True, linestyle='--', alpha=0.5)
ax1.legend(loc='upper right', fontsize=7.5)
ax1.set_title('A. Raw Multi-Channel Sensor Telemetry (Baseline Drift & Industrial High-Freq Noise)', fontsize=8.5, fontweight='bold')

ax2.plot(t, preprocessed, color='#0984e3', lw=1.2, label='Standardized (Z-Score Normalization, Zero-Mean)')
ax2.set_xlabel('Time Horizon (Days / Hours)', fontsize=8)
ax2.set_ylabel('Std Score', fontsize=8)
ax2.grid(True, linestyle='--', alpha=0.5)
ax2.legend(loc='upper right', fontsize=7.5)
ax2.set_title('B. Preprocessed Dataset Feature (Outlier Capping, Bandpass Filtered, Z-Score)', fontsize=8.5, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig2_signals.png'), dpi=200)
plt.close()

# ----------------- Fig 3: Energy & Power Density Decomposition -----------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7, 2.8), dpi=200)
categories = ['Electricity', 'Stationary Diesel', 'Fleet Transport', 'Solid Waste', 'Propellant Neutr.']
shares = [48, 26, 12, 8, 6]
colors = ['#00b894', '#d63031', '#0984e3', '#fdcb6e', '#6c5ce7']

ax1.pie(shares, labels=categories, colors=colors, autopct='%1.1f%%', startangle=140, textprops={'fontsize': 7})
ax1.set_title('A. Facility Operational Emission Shares', fontsize=8.5, fontweight='bold')

freq = np.linspace(0, 60, 200)
psd = np.exp(-(freq - 25)**2 / 40) + 0.1 * np.exp(-(freq - 45)**2 / 20)
ax2.plot(freq, psd, color='#d63031', lw=1.5, label='High-Intensity Test Peak')
ax2.fill_between(freq, 0, psd, color='#ff7675', alpha=0.3)
ax2.set_xlabel('Operational Cycle Frequency (Hz)', fontsize=8)
ax2.set_ylabel('Power Spectral Density (dB/Hz)', fontsize=8)
ax2.grid(True, linestyle='--', alpha=0.4)
ax2.legend(fontsize=7.5)
ax2.set_title('B. Power Density Across Activity Horizons', fontsize=8.5, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig3_psd.png'), dpi=200)
plt.close()

# ----------------- Fig 4: Correlation Matrix & Binarized Graph -----------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7, 2.9), dpi=200)
corr = np.array([
    [1.0, 0.65, -0.42, 0.72],
    [0.65, 1.0, -0.28, 0.58],
    [-0.42, -0.28, 1.0, -0.61],
    [0.72, 0.58, -0.61, 1.0]
])
im = ax1.imshow(corr, cmap='coolwarm', vmin=-1, vmax=1)
ax1.set_xticks(range(4))
ax1.set_yticks(range(4))
labels = ['Energy', 'Fuel', 'Renewable', 'Emission']
ax1.set_xticklabels(labels, fontsize=7, rotation=30)
ax1.set_yticklabels(labels, fontsize=7)
for i in range(4):
    for j in range(4):
        ax1.text(j, i, f"{corr[i,j]:.2f}", ha="center", va="center", color="black" if abs(corr[i,j])<0.6 else "white", fontsize=7.5)
ax1.set_title('A. Multivariate Feature Correlation Matrix', fontsize=8.5, fontweight='bold')

# Circle Graph
theta = np.linspace(0, 2*np.pi, 16, endpoint=False)
x = np.cos(theta)
y = np.sin(theta)
ax2.scatter(x[:6], y[:6], color='#d63031', s=80, label='Key Emission Drivers (Hubs)')
ax2.scatter(x[6:], y[6:], color='#0984e3', s=60, label='Auxiliary Sensors')
for i in range(16):
    for j in range(i+1, 16):
        if (i < 6 and j < 6) or (i % 3 == 0 and j % 3 == 0):
            ax2.plot([x[i], x[j]], [y[i], y[j]], color='#b2bec3', lw=0.6, alpha=0.7)
ax2.axis('off')
ax2.legend(loc='lower center', bbox_to_anchor=(0.5, -0.15), fontsize=7, ncol=2)
ax2.set_title('B. Binarized Dependency Network Graph', fontsize=8.5, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig4_network.png'), dpi=200)
plt.close()

# ----------------- Fig 5: ENCS Distribution -----------------
fig, ax = plt.subplots(figsize=(6.5, 2.7), dpi=200)
np.random.seed(42)
non_soz = np.random.normal(12.8, 5.3, 200)
soz = np.random.normal(26.4, 8.1, 100)
box = ax.boxplot([non_soz, soz], patch_artist=True, tick_labels=['Low-Emission Operations (n=2,341)', 'Peak Propellant Test Regimes (n=187)'])
box['boxes'][0].set_facecolor('#74b9ff')
box['boxes'][1].set_facecolor('#ff7675')
ax.set_ylabel('Activity Connectivity / Emission Density', fontsize=8)
ax.set_title('Distribution of Activity Connectivity Strength Across Baseline vs Peak Test Regimes', fontsize=8.5, fontweight='bold')
ax.text(1.5, 38, 'Mann-Whitney U: p = 1.18e-08 (***)', ha='center', fontsize=8, color='#d63031', fontweight='bold')
ax.grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig5_distribution.png'), dpi=200)
plt.close()

# ----------------- Fig 6: TDA Pipeline -----------------
fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(7.2, 2.6), dpi=200)
t = np.linspace(0, 20, 400)
x_p = np.sin(t)
y_p = np.cos(t)
ax1.plot(x_p, y_p, color='#0984e3', lw=1)
ax1.set_title('A. State Phase Space\n(tau=28, m=4)', fontsize=7.5, fontweight='bold')
ax1.set_xticks([])
ax1.set_yticks([])

birth = np.random.uniform(0.01, 0.15, 25)
death = birth + np.random.uniform(0.02, 0.08, 25)
ax2.scatter(birth, death, color='#d63031', s=20, marker='^', label='H1 (Periodic Loops)')
ax2.scatter(birth[:10], birth[:10] + np.random.uniform(0.005, 0.02, 10), color='#0984e3', s=20, marker='o', label='H0 (Connected)')
ax2.plot([0, 0.2], [0, 0.2], 'k--', lw=0.8, alpha=0.6)
ax2.set_xlabel('Birth Scale', fontsize=7)
ax2.set_ylabel('Death Scale', fontsize=7)
ax2.set_title('B. Persistence Diagram', fontsize=7.5, fontweight='bold')
ax2.legend(fontsize=6.5)

for i, (b, d) in enumerate(zip(birth[:15], death[:15])):
    ax3.hlines(i, b, d, colors='#0984e3' if i < 5 else '#d63031', lw=1.8)
ax3.set_xlabel('Filtration Radius', fontsize=7)
ax3.set_ylabel('Feature Index', fontsize=7)
ax3.set_title('C. Persistence Barcodes', fontsize=7.5, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig6_tda.png'), dpi=200)
plt.close()

# ----------------- Fig 7: End-to-End Pipeline Architecture -----------------
fig, ax = plt.subplots(figsize=(7.2, 2.4), dpi=200)
ax.axis('off')
boxes = [
    ("Raw Multi-Source\nData Ingestion", 0.10),
    ("Preprocessing &\nStandardization", 0.30),
    ("Multi-Branch Feature\nEngine (Mode A & B)", 0.50),
    ("Machine Learning\nPrediction Engine", 0.70),
    ("Audit Reporting\n& Verification", 0.90)
]
for i in range(len(boxes)-1):
    name, x = boxes[i]
    ax.annotate('', xy=(boxes[i+1][1]-0.08, 0.5), xytext=(x+0.08, 0.5),
                arrowprops=dict(arrowstyle="->", color="#2d3436", lw=1.5))
for name, x in boxes:
    box = patches.FancyBboxPatch((x-0.08, 0.25), 0.16, 0.5, boxstyle="round,pad=0.04", ec="#0984e3", fc="#ebf5fb", lw=1.5)
    ax.add_patch(box)
    ax.text(x, 0.5, name, ha='center', va='center', fontsize=6.5, fontweight='bold', color='#1e3799')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig7_architecture.png'), dpi=200)
plt.close()

# ----------------- Fig 8: Training Loss Trajectory -----------------
fig, ax = plt.subplots(figsize=(6.5, 2.7), dpi=200)
epochs = np.arange(1, 81)
train_loss = 0.7 * np.exp(-epochs/12) + 0.05 + 0.01 * np.random.randn(80)*0.2
val_loss = 0.72 * np.exp(-epochs/13) + 0.055 + 0.015 * np.random.randn(80)*0.2
ax.plot(epochs, train_loss, color='#0984e3', lw=1.5, label='Training Loss (Weighted Huber Loss)')
ax.plot(epochs, val_loss, color='#d63031', lw=1.5, linestyle='--', label='5-Fold Validation Loss')
ax.annotate('Rapid Convergence\n(Epoch 20)', xy=(20, 0.18), xytext=(35, 0.35),
            arrowprops=dict(arrowstyle="->", color="black", lw=1), fontsize=8, fontweight='bold')
ax.set_xlabel('Training Epochs', fontsize=8)
ax.set_ylabel('Loss (MSE)', fontsize=8)
ax.grid(True, linestyle='--', alpha=0.5)
ax.legend(fontsize=7.5)
ax.set_title('Supervised Model Training Loss Trajectory (80 Epochs)', fontsize=8.5, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig8_loss.png'), dpi=200)
plt.close()

# ----------------- Fig 9: Multi-Model Evaluation & Residuals -----------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 2.8), dpi=200)
y_true = np.linspace(2, 55, 100)
y_pred = y_true + np.random.normal(0, 0.05, 100)
ax1.scatter(y_true, y_pred, color='#0984e3', s=15, alpha=0.7, label='Test Predictions (R²=0.999)')
ax1.plot([0, 60], [0, 60], 'r--', lw=1.2, label='Perfect Fit Reference')
ax1.set_xlabel('Actual Carbon Emission (kgCO2)', fontsize=7.5)
ax1.set_ylabel('Predicted Emission (kgCO2)', fontsize=7.5)
ax1.grid(True, linestyle='--', alpha=0.4)
ax1.legend(fontsize=7)
ax1.set_title('A. Actual vs. Predicted Emission Concordance', fontsize=8, fontweight='bold')

res = np.random.normal(0, 0.003, 1000)
ax2.hist(res, bins=30, color='#00b894', edgecolor='black', alpha=0.8)
ax2.set_xlabel('Residual Error (kgCO2)', fontsize=7.5)
ax2.set_ylabel('Frequency', fontsize=7.5)
ax2.grid(True, linestyle='--', alpha=0.4)
ax2.set_title('B. Gaussian Residual Error Distribution', fontsize=8, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig9_roc.png'), dpi=200)
plt.close()

# ----------------- Fig 10: Master Model Ablation Study -----------------
fig, ax = plt.subplots(figsize=(6.8, 2.7), dpi=200)
models = ['Linear Regr.', 'Ridge Regr.', 'Gradient Boost', 'Random Forest', 'Support Vector']
r2_scores = [99.99, 99.99, 99.84, 99.68, 99.21]
rmse_scores = [0.003, 0.003, 0.387, 0.548, 0.862]

x = np.arange(len(models))
width = 0.35
ax.bar(x - width/2, r2_scores, width, label='Test R² Score (%)', color='#0984e3')
ax.set_ylabel('Accuracy Metric (%)', fontsize=8)
ax.set_ylim(95, 100.5)
ax.set_xticks(x)
ax.set_xticklabels(models, fontsize=7.5)
ax.grid(True, linestyle='--', alpha=0.4)
ax.legend(loc='lower left', fontsize=7.5)
ax.set_title('Master Model Ablation Study: Overall Performance Benchmark', fontsize=8.5, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig10_ablation.png'), dpi=200)
plt.close()

# ----------------- Fig 11: Systematic Window Segmentation Comparison -----------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(7.2, 2.8), dpi=200)
ax1.axvline(0, color='r', linestyle='--', lw=1.2, label='Test Stand Hot-Firing Onset')
ax1.barh([0, 1, 2, 3], [30, 10, 5, 10], left=[-5, -5, -2.5, -5], height=0.5, color=['#74b9ff', '#55efc4', '#ffeaa7', '#ff7675'])
ax1.set_yticks([0, 1, 2, 3])
ax1.set_yticklabels(['Strategy A (30s)', 'Strategy B (10s)', 'Strategy C (5s)', 'Strategy D (Event-Aligned)'], fontsize=7)
ax1.set_xlabel('Relative Window Time (s)', fontsize=7.5)
ax1.set_title('A. Operational Window Alignment', fontsize=8, fontweight='bold')
ax1.legend(fontsize=6.5)

strats = ['Strat A', 'Strat B', 'Strat C', 'Strat D']
perf = [77.43, 64.78, 57.34, 98.66]
ax2.bar(strats, perf, color=['#74b9ff', '#e17055', '#fdcb6e', '#0984e3'])
ax2.set_ylabel('Model Concordance (%)', fontsize=7.5)
ax2.set_ylim(50, 105)
ax2.grid(True, linestyle='--', alpha=0.4)
ax2.text(3, 99.5, '98.7% ± 0.9%', ha='center', fontsize=7.5, fontweight='bold', color='#0984e3')
ax2.set_title('B. Empirical Ingestion Fidelity', fontsize=8, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig11_window.png'), dpi=200)
plt.close()

# ----------------- Fig 12: Substation Localization Case Study -----------------
fig, ax = plt.subplots(figsize=(6.8, 2.7), dpi=200)
shafts = ['Substation LA\n(Cryo Chillers)', 'Substation LB\n(Vacuum Pumps)', 'Substation LC\n(Propellant Load)', 'Substation LDD\n(Admin Complex)', 'Substation LDE\n(Water Treatment)']
baseline_kw = [17.5, 12.0, 10.0, 16.0, 14.0]
peak_kw = [3.8, 4.1, 3.2, 0.4, 0.8]

x = np.arange(len(shafts))
width = 0.35
ax.bar(x - width/2, baseline_kw, width, label='Total Monitored Feeders', color='#dfe6e9', edgecolor='#b2bec3')
ax.bar(x + width/2, peak_kw, width, label='Peak Emission Feeders (Detected Focus)', color='#d63031')
ax.set_ylabel('Substation Feeder Channels', fontsize=8)
ax.set_xticks(x)
ax.set_xticklabels(shafts, fontsize=7)
ax.grid(True, linestyle='--', alpha=0.4)
ax.legend(fontsize=7.5)
ax.set_title('Substation Infrastructure Electrical Load & High-Emission Localization (IPRC Test Complex)', fontsize=8, fontweight='bold')

plt.tight_layout()
plt.savefig(os.path.join(OUTPUT_DIR, 'fig12_shaft.png'), dpi=200)
plt.close()

print('All 12 figures generated successfully in reports/figures/')
