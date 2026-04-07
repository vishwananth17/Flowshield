# StreamGuard AI: Architecture & Developer Guide

## Overview

StreamGuard AI is a real-time transaction monitoring and anomaly detection platform designed to protect fintech startups and e-commerce platforms from credit card and chargeback fraud. It utilizes a robust decoupled architecture heavily reliant on microservices, stream-processing, and modern web paradigms.

---

## 1. The Tech Stack & Architecture

### Frontend (User Interface & Dashboard)
Built using **React (Vite), TypeScript, Tailwind CSS**, and **framer-motion**, the frontend provides a beautifully animated, high-performance UI. 
*   **Routing**: Protected routes manage authenticated sessions securely.
*   **WebSockets**: The dashboard and transaction feeds subscribe to a direct `wss://` feed from the server, eliminating polling latency and instantly updating graphs/lists when fraud occurs.

### Backend (The Brains)
Built using **FastAPI** (Python). FastAPI handles thousands of concurrent requests natively through `asyncio`.
*   **Core Endpoints**: 
    - `/api/v1/auth`: Handles JWT token issuance and HTTPOnly cookie state.
    - `/api/v1/transactions`: Accepts high-speed raw transaction data and validates it via Pydantic.
    - `/api/v1/api-keys`: Issues hashed tokens for programmatic M2M (machine-to-machine) access logic.
*   **Websocket Manager**: Streams validated AI decisions out to UI clients locally depending on standard authentication.

### Database & Message Broker (The Memory)
*   **PostgreSQL**: Handles persistent normalized relationship structures (Organizations, Users, Transactions). Operated safely through `sqlalchemy` and initialized automatically via `alembic` migrations.
*   **Redis**: Used for short-lived session tracking, token revoking, and caching.
*   **Kafka**: An enterprise-grade stream layer. It guarantees that if the system crashes, unprocessed transactions are sequentially replayed to the AI models when it boots back up.

---

## 2. Docker & Containerization 

The entire framework boots instantly on any operating system because of **Docker**.

### What is Docker?
Docker creates isolated environments called "Containers." Instead of you individually installing Python, Node, PostgreSQL, Kafka, and Redis natively on your computer, Docker virtualizes the exact required OS footprint.

### How `docker-compose.yml` works here:
When you run `docker-compose up -d --build`, the orchestrator reads the `.yml` file and builds all 6 distinct apps, mapping them to a private virtual network. 
1.  `db`: Spins up PostgreSQL on port `5432`.
2.  `redis`: Spins up a Redis store string.
3.  `zookeeper` & `kafka`: Configures the Apache streaming tools to talk to each other globally.
4.  `backend`: Uses our `backend/Dockerfile` to install Python 3.12, load `scikit-learn`/`fastapi`, and expose port `8000`.
5.  `frontend`: Uses `frontend/Dockerfile` to compile the Vite server to port `5173`.

Instead of running six different terminal windows, everything launches harmoniously.

---

## 3. The Machine Learning Engine (Phase 3+)

At the heart of `/api/v1/transactions/analyze`, StreamGuard utilizes an **Ensemble Scoring Architecture**.

1. **Scikit-Learn Isolation Forests**: 
    Because "fraud" patterns constantly change, we implemented an unsupervised AI model (`IsolationForest` in `app/ml/model.py`). This model trains on normalized representations of massive datasets and learns what "normal behavior" is (like average amounts purchased locally during daytime). When a transaction strays too far mathematically across a multidimensional space (like a massive purchase from across borders at 3 AM), the model flags it as an "anomaly".

2. **Hard-Coded Risk Matrix**:
    The AI probability is instantly factored alongside deterministic business logic in `app/services/fraud_detection_service.py` (e.g., blocking immediately if transactions originate from OFAC-sanctioned countries). This creates a zero-trust `FraudResult` that dictates an ALLOW, REVIEW, or BLOCK decision and attaches exactly why it flagged it.

---

## 4. Scaling Upwards (Path to 1M Users)
Because the stack natively deploys to Docker, migrating to AWS or GCP is seamless. 
1. You drag the database to Amazon RDS. 
2. You transition the backend container images directly into AWS Fargate or Elastic Kubernetes Service (EKS). 
3. The load balancer auto-creates more backend instances naturally to handle thousands of requests per second.
