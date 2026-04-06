import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import time
import os

st.set_page_config(
    page_title="Continumai Fraud Monitor",
    page_icon="🛡️",
    layout="wide"
)

API_URL = os.getenv("API_URL", "http://localhost:8000")

# Helpers
def run_mock_traffic(count=10):
    try:
        requests.post(f"{API_URL}/generate_mock_traffic", params={"count": count})
    except Exception as e:
        st.error(f"Error connecting to backend: {e}")

def get_fraud_alerts():
    try:
        res = requests.get(f"{API_URL}/fraud_alerts", params={"limit": 50})
        if res.status_code == 200:
            return pd.DataFrame(res.json())
        return pd.DataFrame()
    except Exception:
        return pd.DataFrame()

def get_model_status():
    try:
        res = requests.get(f"{API_URL}/model_status")
        if res.status_code == 200:
            return res.json()
        return {}
    except Exception:
        return {}

# UI structure
st.title("🛡️ Continumai - Fraud Detection Dashboard")
st.markdown("Real-time fraud monitoring API for Fintech startups.")

# Sidebar Controls
st.sidebar.header("Controls & Status")

status = get_model_status()
if status:
    st.sidebar.success(f"Model: {status.get('model_name', 'Unknown')}")
    st.sidebar.info(f"Status: {status.get('status', 'Unknown')}")
    st.sidebar.metric("Estimated Accuracy", f"{status.get('accuracy_estimate', 0)*100:.2f}%")
else:
    st.sidebar.error("Backend Server is Offline or Processing...")

st.sidebar.markdown("---")
st.sidebar.subheader("Simulate Transactions")
traffic_count = st.sidebar.slider("Transactions to generate", min_value=1, max_value=100, value=10)
if st.sidebar.button("Generate Traffic"):
    run_mock_traffic(traffic_count)
    st.sidebar.success(f"Generated {traffic_count} transactions!")

if st.sidebar.button("Refresh Alerts"):
    pass # stream refreshes on click inherently

st.sidebar.markdown("---")
st.sidebar.caption("Continumai - Streaming architecture built with Redis and ML.")

# Main Dashboard View
st.subheader("High & Medium Risk Fraud Alerts")

df_alerts = get_fraud_alerts()

if not df_alerts.empty:
    cols = st.columns((1, 3))
    
    with cols[0]:
        st.metric("Total Suspicious Items", len(df_alerts))
        
        # Risk Distribution
        fig = px.pie(df_alerts, names='status', title='Risk Status Distribution', hole=0.3)
        st.plotly_chart(fig, use_container_width=True)

    with cols[1]:
        # Timeline
        df_alerts['timestamp'] = pd.to_datetime(df_alerts['timestamp'])
        df_alerts = df_alerts.sort_values(by="timestamp", ascending=True)
        
        fig2 = px.scatter(df_alerts, x='timestamp', y='amount', color='status',
                          size='fraud_risk_score', hover_data=['transaction_id', 'user_id'],
                          title='Suspicious Transaction Amounts over Time')
        st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Recent Alert Datafeed")
    st.dataframe(df_alerts.sort_values(by="timestamp", ascending=False), use_container_width=True)
else:
    st.info("No suspicious transactions found or backend not initialized yet.")
    st.write("Click 'Generate Traffic' in the sidebar to simulate fintech transactions.")
