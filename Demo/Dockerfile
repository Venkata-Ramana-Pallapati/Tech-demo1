FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Set environment variable for Firebase credentials
ENV FIREBASE_CREDENTIALS_PATH="/app/firebase-service-account.json"

# Copy Firebase credentials (Make sure to exclude in .dockerignore)
COPY firebase-service-account.json /app/firebase-service-account.json

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
