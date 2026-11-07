import os
import json
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from train_models import train_and_evaluate, FEATURE_COLS, MODELS_DIR

app = FastAPI(
    title="IPRC CarbonTrack ML Prediction Service",
    description="Machine Learning Service for Carbon Footprint Target Prediction (RES-IPRC-2025-003)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FeatureInput(BaseModel):
    Energy_Usage_kWh: float = Field(0.0, description="Standardized energy score (mean ~ 0)")
    Transportation_Distance_km: float = Field(0.0, description="Standardized transportation distance score")
    Smart_Appliance_Usage_hours: float = Field(0.0, description="Standardized smart appliance hours")
    Renewable_Energy_Usage_percent: float = Field(0.0, description="Standardized renewable energy percentage")
    Temperature_C: float = Field(0.0, description="Standardized ambient temperature")
    Humidity_percent: float = Field(0.0, description="Standardized humidity percentage")
    Fuel_Usage_Liters: float = Field(0.0, description="Standardized fuel consumption score")
    Waste_Generated_kg: float = Field(0.0, description="Standardized waste generated score")
    Vehicle_Type_Car: float = Field(-0.59, description="Encoded standardized car indicator (~1.69 if active, ~-0.59 otherwise)")
    Vehicle_Type_Electric_Vehicle: float = Field(-0.58, description="Encoded standardized EV indicator (~1.73 if active, ~-0.58 otherwise)")
    Vehicle_Type_Walking: float = Field(-0.57, description="Encoded standardized walking indicator (~1.74 if active, ~-0.57 otherwise)")
    Building_Type_Residential: float = Field(1.0, description="Encoded standardized building indicator (~1.00 for residential, ~-0.99 for non-residential)")
    model_name: Optional[str] = Field("active_model", description="Name or slug of model to use")

def load_metadata():
    meta_path = os.path.join(MODELS_DIR, 'models_metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            return json.load(f)
    return None

@app.get("/health")
def health_check():
    meta = load_metadata()
    return {
        "status": "healthy",
        "service": "IPRC CarbonTrack ML Engine",
        "modelsAvailable": meta is not None,
        "bestModel": meta.get("bestModel") if meta else None
    }

@app.get("/models")
def get_models():
    meta = load_metadata()
    if not meta:
        raise HTTPException(status_code=404, detail="No models trained yet. Please train models first.")
    return meta

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
        raise HTTPException(status_code=503, detail="Models not loaded. Run training first.")

    # Select model file
    model_file = 'active_model.joblib'
    if input_data.model_name and input_data.model_name != 'active_model':
        slug = input_data.model_name.lower().replace(' ', '_')
        candidate = f"{slug}.joblib"
        if os.path.exists(os.path.join(MODELS_DIR, candidate)):
            model_file = candidate

    model_path = os.path.join(MODELS_DIR, model_file)
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail=f"Model file {model_file} not found")

    model = joblib.load(model_path)

    # Prepare feature vector
    feature_vector = np.array([[
        input_data.Energy_Usage_kWh,
        input_data.Transportation_Distance_km,
        input_data.Smart_Appliance_Usage_hours,
        input_data.Renewable_Energy_Usage_percent,
        input_data.Temperature_C,
        input_data.Humidity_percent,
        input_data.Fuel_Usage_Liters,
        input_data.Waste_Generated_kg,
        input_data.Vehicle_Type_Car,
        input_data.Vehicle_Type_Electric_Vehicle,
        input_data.Vehicle_Type_Walking,
        input_data.Building_Type_Residential
    ]])

    pred = float(model.predict(feature_vector)[0])

    # Calculate approximate feature impact
    feature_dict = {
        'Energy_Usage_kWh': input_data.Energy_Usage_kWh,
        'Transportation_Distance_km': input_data.Transportation_Distance_km,
        'Smart_Appliance_Usage_hours': input_data.Smart_Appliance_Usage_hours,
        'Renewable_Energy_Usage_percent': input_data.Renewable_Energy_Usage_percent,
        'Temperature_C': input_data.Temperature_C,
        'Humidity_percent': input_data.Humidity_percent,
        'Fuel_Usage_Liters': input_data.Fuel_Usage_Liters,
        'Waste_Generated_kg': input_data.Waste_Generated_kg,
        'Vehicle_Type_Car': input_data.Vehicle_Type_Car,
        'Vehicle_Type_Electric Vehicle': input_data.Vehicle_Type_Electric_Vehicle,
        'Vehicle_Type_Walking': input_data.Vehicle_Type_Walking,
        'Building_Type_Residential': input_data.Building_Type_Residential
    }

    # Find model metadata
    model_meta = next((m for m in meta['models'] if m['filename'] == model_file), None)
    if not model_meta:
        model_meta = next((m for m in meta['models'] if m['modelName'] == meta['bestModel']), meta['models'][0])

    contributions = {}
    importances = model_meta.get('featureImportances', {})
    for k, v in feature_dict.items():
        weight = importances.get(k, 0.0)
        contributions[k] = round(v * weight * 10.0, 3)

    return {
        "predicted_emission_kgCO2": round(pred, 3),
        "target_variable": "Carbon_Emission_kgCO2",
        "units": "kg CO2",
        "model_used": model_meta['modelName'],
        "algorithm": model_meta['algorithm'],
        "model_r2_score": model_meta['r2Score'],
        "model_rmse": model_meta['rmse'],
        "input_standardized_values": feature_dict,
        "feature_contributions": contributions,
        "disclaimer": "Predicted value is based on the standardized research dataset. Input features are standardized scores (mean ~ 0, std ~ 1) and must not be interpreted as raw physical measurements."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)

