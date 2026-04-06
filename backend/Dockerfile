FROM python:3.11-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-train the model (or could do it in a setup script, let's keep it simple)
COPY . .

# Run train_model.py to generate our dummy ML model when building the image
RUN python train_model.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
