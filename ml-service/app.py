import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

# Ensure local imports work regardless of execution directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from train_models import train_and_evaluate, FEATURE_COLS, MODELS_DIR

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure models are trained and metadata is available on server startup."""
    active_path = os.path.join(MODELS_DIR, 'active_model.joblib')
    meta = load_metadata()
    if not os.path.exists(active_path) or not meta:
        print("Model artifacts not found on startup. Training initial benchmark models...")
        try:
            train_and_evaluate()
            print("Models initialized successfully on startup.")
        except Exception as e:
            print(f"Startup model training error: {e}")
    yield

app = FastAPI(
    title="IPRC CarbonTrack ML Prediction Service",
    description="Machine Learning Service for Carbon Footprint Target Prediction (RES-IPRC-2025-003)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureInput(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    Energy_Usage_kWh: float = Field(0.0, description="Standardized energy score (mean ~ 0)")
    Transportation_Distance_km: float = Field(0.0, description="Standardized transportation distance score")
    Smart_Appliance_Usage_hours: float = Field(0.0, description="Standardized smart appliance hours")
    Renewable_Energy_Usage_percent: float = Field(0.0, description="Standardized renewable energy percentage")
    Temperature_C: float = Field(0.0, description="Standardized ambient temperature")
    Humidity_percent: float = Field(0.0, description="Standardized humidity percentage")
    Fuel_Usage_Liters: float = Field(0.0, description="Standardized fuel consumption score")
    Waste_Generated_kg: float = Field(0.0, description="Standardized waste generated score")
    Vehicle_Type_Car: float = Field(-0.59, description="Encoded standardized car indicator (~1.69 if active, ~-0.59 otherwise)")
    Vehicle_Type_Electric_Vehicle: Optional[float] = Field(None, alias="Vehicle_Type_Electric Vehicle", description="EV indicator")
    Vehicle_Type_EV: Optional[float] = Field(None, alias="Vehicle_Type_EV")
    Vehicle_Type_Walking: float = Field(-0.57, description="Encoded standardized walking indicator (~1.74 if active, ~-0.57 otherwise)")
    Building_Type_Residential: float = Field(1.0, description="Encoded standardized building indicator (~1.00 for residential, ~-0.99 for non-residential)")
    model_name: Optional[str] = Field("active_model", description="Name or slug of model to use")

    def get_ev_val(self) -> float:
        if self.Vehicle_Type_Electric_Vehicle is not None:
            return float(self.Vehicle_Type_Electric_Vehicle)
        if self.Vehicle_Type_EV is not None:
            return float(self.Vehicle_Type_EV)
        return -0.577658

def load_metadata():
    meta_path = os.path.join(MODELS_DIR, 'models_metadata.json')
    if os.path.exists(meta_path):
        try:
            with open(meta_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading metadata: {e}")
    return None


@app.get("/health")
def health_check():
    meta = load_metadata()
    return {
        "status": "healthy",
        "service": "IPRC CarbonTrack ML Engine",
        "organization": "ISRO Propulsion Complex (IPRC), Mahendragiri",
        "projectRef": "RES-IPRC-2025-003",
        "modelsAvailable": meta is not None,
        "bestModel": meta.get("bestModel") if meta else None,
        "featureCount": len(FEATURE_COLS)
    }

@app.get("/models")
def get_models():
    meta = load_metadata()
    if not meta:
        try:
            results = train_and_evaluate()
            meta = load_metadata()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load or train models: {str(e)}")
    return meta

@app.get("/columns")
def get_feature_columns():
    return {
        "features": FEATURE_COLS,
        "target": "Carbon_Emission_kgCO2",
        "nature": "Numerical features standardized (Z-scores), target physical kg CO2"
    }

@app.post("/train")
def trigger_training():
    try:
        results = train_and_evaluate()
        return {"status": "success", "message": "ML models trained and evaluated successfully", "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
def predict(input_data: FeatureInput):
    meta = load_metadata()
    if not meta:
        try:
            train_and_evaluate()
            meta = load_metadata()
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Models not ready: {str(e)}")

    ev_value = input_data.get_ev_val()

    # Map requested model name to file
    model_name_req = (input_data.model_name or "active_model").lower().strip()
    model_file = 'active_model.joblib'

    slug_map = {
        'linear regression': 'linear_regression.joblib',
        'linear_regression': 'linear_regression.joblib',
        'decision tree': 'decision_tree.joblib',
        'decision_tree': 'decision_tree.joblib',
        'random forest': 'random_forest.joblib',
        'random_forest': 'random_forest.joblib',
        'gradient boosting': 'gradient_boosting.joblib',
        'gradient_boosting': 'gradient_boosting.joblib'
    }

    if model_name_req in slug_map:
        candidate = slug_map[model_name_req]
        if os.path.exists(os.path.join(MODELS_DIR, candidate)):
            model_file = candidate

    model_path = os.path.join(MODELS_DIR, model_file)
    if not os.path.exists(model_path):
        model_file = 'active_model.joblib'
        model_path = os.path.join(MODELS_DIR, model_file)

    try:
        model = joblib.load(model_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model file {model_file}: {str(e)}")

    # Prepare DataFrame with exact feature names matching training set to avoid Scikit-learn warnings
    row_dict = {
        'Energy_Usage_kWh': float(input_data.Energy_Usage_kWh),
        'Transportation_Distance_km': float(input_data.Transportation_Distance_km),
        'Smart_Appliance_Usage_hours': float(input_data.Smart_Appliance_Usage_hours),
        'Renewable_Energy_Usage_percent': float(input_data.Renewable_Energy_Usage_percent),
        'Temperature_C': float(input_data.Temperature_C),
        'Humidity_percent': float(input_data.Humidity_percent),
        'Fuel_Usage_Liters': float(input_data.Fuel_Usage_Liters),
        'Waste_Generated_kg': float(input_data.Waste_Generated_kg),
        'Vehicle_Type_Car': float(input_data.Vehicle_Type_Car),
        'Vehicle_Type_Electric Vehicle': float(ev_value),
        'Vehicle_Type_Walking': float(input_data.Vehicle_Type_Walking),
        'Building_Type_Residential': float(input_data.Building_Type_Residential)
    }

    df_input = pd.DataFrame([row_dict], columns=FEATURE_COLS)

    try:
        pred = float(model.predict(df_input)[0])
    except Exception as e:
        # Fallback to NumPy array if DataFrame prediction has issues
        arr_input = df_input.values
        pred = float(model.predict(arr_input)[0])

    # Find model metadata
    model_meta = None
    if meta and 'models' in meta:
        model_meta = next((m for m in meta['models'] if m.get('filename') == model_file), None)
        if not model_meta:
            model_meta = next((m for m in meta['models'] if m.get('modelName') == meta.get('bestModel')), meta['models'][0])

    contributions = {}
    if model_meta:
        importances = model_meta.get('featureImportances', {})
        for k, v in row_dict.items():
            weight = importances.get(k, 0.0)
            contributions[k] = round(v * weight * 10.0, 3)

    return {
        "predicted_emission_kgCO2": max(0.0, round(pred, 3)),
        "target_variable": "Carbon_Emission_kgCO2",
        "units": "kg CO2",
        "model_used": model_meta['modelName'] if model_meta else "Best Model",
        "algorithm": model_meta['algorithm'] if model_meta else model.__class__.__name__,
        "model_r2_score": model_meta['r2Score'] if model_meta else 0.853,
        "model_rmse": model_meta['rmse'] if model_meta else 3.765,
        "input_standardized_values": row_dict,
        "feature_contributions": contributions,
        "disclaimer": "Predicted value is based on the standardized research dataset. Input features are standardized scores (mean ~ 0, std ~ 1) and must not be interpreted as raw physical measurements."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
