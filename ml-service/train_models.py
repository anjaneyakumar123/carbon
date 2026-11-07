import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

# Configure paths
DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../data/Preprocessed_Carbon_Footprint_Dataset.csv'))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'models'))
os.makedirs(MODELS_DIR, exist_ok=True)

FEATURE_COLS = [
    'Energy_Usage_kWh',
    'Transportation_Distance_km',
    'Smart_Appliance_Usage_hours',
    'Renewable_Energy_Usage_percent',
    'Temperature_C',
    'Humidity_percent',
    'Fuel_Usage_Liters',
    'Waste_Generated_kg',
    'Vehicle_Type_Car',
    'Vehicle_Type_Electric Vehicle',
    'Vehicle_Type_Walking',
    'Building_Type_Residential'
]

TARGET_COL = 'Carbon_Emission_kgCO2'

def train_and_evaluate():
    print(f"Loading dataset from: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    print(f"Dataset shape: {df.shape}")

    # Ensure Date is parsed
    df['Date_Parsed'] = pd.to_datetime(df['Date'])
    
    # Sort by date for chronological comparison
    df_sorted = df.sort_values('Date_Parsed').reset_index(drop=True)

    X = df[FEATURE_COLS]
    y = df[TARGET_COL]

    # 1. Random split evaluation (reproducible seed, no data leakage)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"Random Split - Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

    # 2. Chronological split evaluation (first 80% train, last 20% test)
    split_idx = int(len(df_sorted) * 0.8)
    X_chrono_train = df_sorted.iloc[:split_idx][FEATURE_COLS]
    y_chrono_train = df_sorted.iloc[:split_idx][TARGET_COL]
    X_chrono_test = df_sorted.iloc[split_idx:][FEATURE_COLS]
    y_chrono_test = df_sorted.iloc[split_idx:][TARGET_COL]
    print(f"Chrono Split - Train size: {len(X_chrono_train)}, Test size: {len(X_chrono_test)}")

    models = {
        'Linear Regression': LinearRegression(),
        'Decision Tree': DecisionTreeRegressor(max_depth=8, random_state=42),
        'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        'Gradient Boosting': GradientBoostingRegressor(n_estimators=150, learning_rate=0.08, max_depth=5, random_state=42)
    }

    results = []
    best_model_name = None
    best_r2 = -1e9
    best_model_obj = None

    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train, y_train)
        preds = model.predict(X_test)

        r2 = r2_score(y_test, preds)
        mae = mean_absolute_error(y_test, preds)
        mse = mean_squared_error(y_test, preds)
        rmse = np.sqrt(mse)

        # Chronological test
        model_chrono = type(model)(**model.get_params())
        model_chrono.fit(X_chrono_train, y_chrono_train)
        chrono_preds = model_chrono.predict(X_chrono_test)
        chrono_r2 = r2_score(y_chrono_test, chrono_preds)
        chrono_rmse = np.sqrt(mean_squared_error(y_chrono_test, chrono_preds))

        # Extract feature importances or coefficients
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            feature_importance = {col: float(imp) for col, imp in zip(FEATURE_COLS, importances)}
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_)
            total = np.sum(importances) if np.sum(importances) > 0 else 1.0
            feature_importance = {col: float(imp / total) for col, imp in zip(FEATURE_COLS, importances)}

        # Save model artifact
        slug = name.lower().replace(' ', '_')
        model_filename = f"{slug}.joblib"
        joblib.dump(model, os.path.join(MODELS_DIR, model_filename))

        model_res = {
            'modelName': name,
            'algorithm': model.__class__.__name__,
            'filename': model_filename,
            'r2Score': float(r2),
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'chronoR2Score': float(chrono_r2),
            'chronoRmse': float(chrono_rmse),
            'trainSamples': int(X_train.shape[0]),
            'testSamples': int(X_test.shape[0]),
            'featureImportances': feature_importance,
            'trainedAt': datetime.now().isoformat()
        }
        results.append(model_res)

        print(f"Results for {name}:")
        print(f"  Test R²: {r2:.4f} | MAE: {mae:.4f} | RMSE: {rmse:.4f}")
        print(f"  Chrono Test R²: {chrono_r2:.4f} | Chrono RMSE: {chrono_rmse:.4f}")

        if r2 > best_r2:
            best_r2 = r2
            best_model_name = name
            best_model_obj = model

    # Mark active model
    for r in results:
        r['isActive'] = (r['modelName'] == best_model_name)

    # Save best model as active_model.joblib
    joblib.dump(best_model_obj, os.path.join(MODELS_DIR, 'active_model.joblib'))
    with open(os.path.join(MODELS_DIR, 'models_metadata.json'), 'w') as f:
        json.dump({
            'bestModel': best_model_name,
            'featureCols': FEATURE_COLS,
            'targetCol': TARGET_COL,
            'models': results
        }, f, indent=2)

    print(f"\n==========================================")
    print(f"BEST MODEL SELECTED: {best_model_name} (R² = {best_r2:.4f})")
    print(f"Saved models and metadata to: {MODELS_DIR}")
    print(f"==========================================")

    return results

if __name__ == '__main__':
    train_and_evaluate()

