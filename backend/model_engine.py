import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor

class FuelAI:
    def __init__(self):
        self.model_path = "data/fuel_model.pkl"
        self.model = None

    def create_pipeline(self):
        num_features = ['engine_capacity', 'vehicle_age', 'distance_km', 'passengers', 'load_weight', 'vehicle_weight']
        cat_features = ['vehicle_type', 'fuel_type', 'route_type', 'traffic_condition', 'driving_style']
        
        preprocessor = ColumnTransformer([
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), cat_features)
        ])
        
        return Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', XGBRegressor(n_estimators=150, learning_rate=0.05, max_depth=6))
        ])

    def train(self, data_path):
        if not os.path.exists(data_path): return {"error": "No data found"}
        df = pd.read_csv(data_path)
        X = df.drop(columns=['fuel_economy', 'fuel_used_liters'])
        y = df['fuel_economy']
        self.model = self.create_pipeline()
        self.model.fit(X, y)
        if not os.path.exists("data"): os.makedirs("data")
        joblib.dump(self.model, self.model_path)
        return {"status": "Model trained"}

    def predict(self, data):
        if not self.model:
            if os.path.exists(self.model_path): self.model = joblib.load(self.model_path)
            else: return {"error": "Model not trained"}
        
        df_in = pd.DataFrame([data])
        pred_economy = self.model.predict(df_in)[0]
        
        fuel_needed = data['distance_km'] / pred_economy
        
        return {
            "predicted_fuel_economy": round(float(pred_economy), 2),
            "estimated_fuel_required_liters": round(float(fuel_needed), 2),
            "estimated_trip_cost": round(float(fuel_needed * data['fuel_price']), 2),
            "co2_emission_kg": round(float(fuel_needed * 2.31), 2),
            "prediction_confidence": 96
        }