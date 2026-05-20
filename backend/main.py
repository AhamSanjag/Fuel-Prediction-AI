from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model_engine import FuelAI
import pandas as pd
import os
import uvicorn
from contextlib import asynccontextmanager

FUEL_PRICE_CONST = 107.16

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not os.path.exists("data"): os.makedirs("data")
    data_path = "data/historical_data.csv"
    if not os.path.exists(data_path):
        # AI Training Data - Strictly Numeric
        df = pd.DataFrame([{
            'vehicle_type': 'Sedan', 'engine_capacity': 1.5, 'fuel_type': 'Petrol',
            'vehicle_age': 2, 'distance_km': 346, 'route_type': 'Highway',
            'traffic_condition': 'Low', 'passengers': 1, 'load_weight': 0,
            'vehicle_weight': 1200, 'driving_style': 'Normal', 'fuel_price': FUEL_PRICE_CONST, 
            'fuel_used_liters': 18.2, 'fuel_economy': 19.0
        }] * 100)
        df.to_csv(data_path, index=False)
    ai.train(data_path)
    yield

app = FastAPI(lifespan=lifespan)
ai = FuelAI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

VEHICLE_DB = {
    "Maruti Swift": {"type": "Hatchback", "engine": 1.2, "weight": 950, "fuel": "Petrol"},
    "Hyundai Creta": {"type": "SUV", "engine": 1.5, "weight": 1300, "fuel": "Diesel"},
    "Toyota Innova": {"type": "MUV", "engine": 2.4, "weight": 1800, "fuel": "Diesel"},
    "Honda City": {"type": "Sedan", "engine": 1.5, "weight": 1150, "fuel": "Petrol"},
    "Mahindra XUV700": {"type": "SUV", "engine": 2.2, "weight": 2000, "fuel": "Diesel"}
}

ROUTE_DB = {
    "Bengaluru to Chennai": {"dist": 346, "type": "Highway", "traffic": "Low"},
    "Yelahanka to Jayanagar": {"dist": 22, "type": "City", "traffic": "Heavy"},
    "Silk Board to Electronic City": {"dist": 12, "type": "City", "traffic": "Heavy"},
    "Indiranagar to Airport": {"dist": 35, "type": "Mixed", "traffic": "Normal"}
}

@app.get("/get-catalog")
async def get_catalog():
    return {"vehicles": list(VEHICLE_DB.keys()), "routes": list(ROUTE_DB.keys())}

# Translation Layer: Converts UI strings to AI numbers
def translate_to_ai(data):
    v = VEHICLE_DB.get(data['vehicle_name'], VEHICLE_DB["Maruti Swift"])
    r = ROUTE_DB.get(data['route_name'], ROUTE_DB["Yelahanka to Jayanagar"])
    return {
        'vehicle_type': v['type'], 'engine_capacity': v['engine'], 'fuel_type': v['fuel'],
        'vehicle_age': 2, 'distance_km': r['dist'], 'route_type': r['type'],
        'traffic_condition': r['traffic'], 'passengers': 1, 'load_weight': data.get('load_weight', 0),
        'vehicle_weight': v['weight'], 'driving_style': data.get('driving_style', 'Normal'),
        'fuel_price': FUEL_PRICE_CONST
    }

@app.post("/predict")
async def predict(data: dict):
    clean_data = translate_to_ai(data)
    result = ai.predict(clean_data)
    result['applied_distance'] = clean_data['distance_km']
    return result

@app.post("/save-trip")
async def save_trip(data: dict):
    try:
        data_path = "data/historical_data.csv"
        log_entry = translate_to_ai(data)
        log_entry['fuel_used_liters'] = data.get('estimated_fuel_required_liters')
        log_entry['fuel_economy'] = data.get('predicted_fuel_economy')
        pd.DataFrame([log_entry]).to_csv(data_path, mode='a', header=False, index=False)
        ai.train(data_path)
        return {"status": "Success"}
    except Exception as e: return {"status": "Error", "message": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)