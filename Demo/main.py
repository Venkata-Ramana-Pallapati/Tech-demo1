import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth
import pandas as pd
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from io import BytesIO
from datetime import datetime
from typing import Dict, Optional
import numpy as np
from pydantic import BaseModel

# Initialize Firebase Admin SDK
# Ensure you have the path to your Firebase service account key
cred = credentials.Certificate('/home/sigmoid/Pictures/project_root /Demo/firebase-service-account.json')
firebase_admin.initialize_app(cred)

app = FastAPI(title="ForecastPro API", description="Predictive Analytics API")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Security scheme for Bearer token
security = HTTPBearer()

# Token verification dependency
def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=403, 
            detail="Invalid authentication credentials"
        )

# Prediction result model
class PredictionResult(BaseModel):
    ds: str
    yhat: float
    Metric: str
    Model: str
    Group: Optional[Dict[str, str]] = None

# Main prediction endpoint
@app.post("/predict/")
async def predict(
    file: UploadFile = File(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    model_name: str = Form(...),
    token_data: dict = Depends(verify_firebase_token)
):
    try:
        # Additional authorization check (optional)
        # You can add more specific checks based on user roles or permissions
        user_email = token_data.get('email')
        user_uid = token_data.get('uid')
        
        # Log user information (optional)
        print(f"Prediction request by user: {user_email} (UID: {user_uid})")

        # Parse dates
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")

        # Read uploaded file
        contents = await file.read()
        data = pd.read_csv(BytesIO(contents))

        # Detect datetime column
        datetime_columns = data.select_dtypes(include=['object', 'datetime64']).columns
        time_column = None

        for col in datetime_columns:
            try:
                data[col] = pd.to_datetime(data[col])
                time_column = col
                break
            except:
                continue

        if not time_column:
            raise HTTPException(status_code=400, detail="No datetime column detected")

        # Detect grouping and metric columns
        grouping_columns = data.select_dtypes(include=['object']).columns.difference([time_column]).tolist()
        metric_columns = data.select_dtypes(include=['number']).columns.tolist()

        if not metric_columns:
            raise HTTPException(status_code=400, detail="No metric columns detected")

        # Prediction results storage
        results = []
        unique_group_data = {col: data[col].unique().tolist() for col in grouping_columns}

        # Prediction for each metric and group
        for metric in metric_columns:
            group = data.groupby(grouping_columns) if grouping_columns else [(None, data)]

            for group_name, group_data in group:
                # Prepare data for time series models
                prophet_df = group_data[[time_column, metric]].rename(columns={time_column: 'ds', metric: 'y'})
                prophet_df = prophet_df.dropna()

                if prophet_df.empty:
                    continue

                # Generate future dates
                future = pd.date_range(start=start_date, end=end_date, freq='D')
                future = pd.DataFrame({'ds': future})

                # Model selection and forecasting
                if model_name == "Prophet":
                    model = Prophet()
                    model.fit(prophet_df)
                    forecast = model.predict(future)
                    predictions = forecast[['ds', 'yhat']]

                elif model_name == "ARIMA":
                    model = ARIMA(prophet_df['y'], order=(5, 1, 0))
                    model_fit = model.fit()
                    forecast = model_fit.forecast(steps=len(future))
                    predictions = pd.DataFrame({'yhat': forecast})
                    predictions['ds'] = future['ds'].values

                elif model_name == "SARIMA":
                    model = SARIMAX(prophet_df['y'], order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
                    model_fit = model.fit()
                    forecast = model_fit.forecast(steps=len(future))
                    predictions = pd.DataFrame({'yhat': forecast})
                    predictions['ds'] = future['ds'].values

                elif model_name == "ETS":
                    model = ExponentialSmoothing(prophet_df['y'], seasonal='add', seasonal_periods=12)
                    model_fit = model.fit()
                    forecast = model_fit.forecast(steps=len(future))
                    predictions = pd.DataFrame({'yhat': forecast})
                    predictions['ds'] = future['ds'].values

                else:
                    raise HTTPException(status_code=400, detail="Invalid model name")

                # Process and store predictions
                for _, row in predictions.iterrows():
                    group_dict = {col: group_name[idx] for idx, col in enumerate(grouping_columns)} if grouping_columns else None
                    result = {
                        "ds": row['ds'].strftime("%Y-%m-%d"),
                        "yhat": float(row['yhat']),  # Ensure it's a float for JSON serialization
                        "Metric": metric,
                        "Model": model_name,
                        "Group": group_dict
                    }
                    results.append(result)

        return {
            "predictions": results, 
            "unique_group_data": unique_group_data,
            "user_info": {
                "email": user_email,
                "uid": user_uid
            }
        }

    except Exception as e:
        # Detailed error logging
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint

# Optional: Startup event for additional initialization
