import requests
from typing import Dict, Any, Optional

class FlowshieldClient:
    """
    Flowshield AI - Python SDK (Base v1.0.0)
    Surgical fraud intelligence for institutional fintech.
    """
    
    def __init__(self, api_key: str, base_url: str = "https://api.flowshield.ai/api/v1", timeout: int = 5):
        if not api_key:
            raise ValueError("Flowshield: API Key is required for initialization.")
        
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "X-SDK-Platform": "python",
            "X-SDK-Version": "1.0.0"
        })

    def analyze(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform AI-driven risk assessment on a single transaction.
        """
        try:
            url = f"{self.base_url}/transactions/analyze"
            response = self.session.post(url, json=transaction_data, timeout=self.timeout)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self._handle_error(e)

    def _handle_error(self, error: Exception):
        if isinstance(error, requests.exceptions.HTTPError):
            status_code = error.response.status_code
            try:
                error_data = error.response.json()
                message = error_data.get("message", str(error_data))
            except:
                message = str(error)
            raise Exception(f"Flowshield API Error [{status_code}]: {message}")
        raise Exception(f"Flowshield Network Error: {str(error)}")
