# Flowshield AI Public API Documentation v1

Welcome to the Flowshield AI Developer Documentation. Our API allows you to integrate real-time fraud detection into your checkout flow with sub-20ms latency.

## Authentication

All requests to the public API must include your organization's API Key in the `X-API-Key` header.

```http
X-API-Key: fs_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

You can generate and rotate API keys in your **API Keys** tab on the Flowshield AI Dashboard.

---

## 1. Analyze Transaction
**Endpoint:** `POST /api/v1/transactions/analyze` (or alias `/analyze_transaction` at root)

Analyze a transaction for risk and receive a real-time decision (`low_risk`, `medium_risk`, `high_risk`) with actionable recommendations (`approve`, `review_transaction`, `block_transaction`).

### Request Payload (JSON)
The API accepts a structured nested JSON body.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `amount` | Float | Yes | The transaction amount (e.g. 250.00) |
| `currency` | String | Yes | 3-letter ISO currency code (e.g. "INR", "USD") |
| `transaction_id` | String | No | (Optional) Unique external reference ID for the transaction |
| `merchant` | Object | No | Merchant details block |
| `merchant.name` | String | Yes (if merchant block provided) | Name of the merchant/store |
| `customer` | Object | No | Customer intelligence block |
| `customer.id` | String | Yes (if customer block provided) | Unique identifier for the customer |
| `customer.email` | String | No | Customer's email address |
| `customer.city` | String | No | City of transaction origin |
| `device` | Object | No | Device signature block |
| `device.id` | String | No | Unique hardware fingerprint ID |
| `device.ip` | String | No | Customer's IP address |

### Example Request (cURL)
```bash
curl -X POST https://api.flowshieldai.com/api/v1/transactions/analyze \
  -H "X-API-Key: fs_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TXN-90184204",
    "amount": 9500.00,
    "currency": "INR",
    "merchant": {
      "name": "Luxury Retailer Ltd"
    },
    "customer": {
      "id": "cust-90812",
      "email": "purchaser@example.in",
      "city": "Mumbai"
    },
    "device": {
      "id": "dev-fingerprint-abc827",
      "ip": "103.241.12.89"
    }
  }'
```

### Example Request (Node.js)
```javascript
const axios = require('axios');

async function evaluateTransaction(orderPayload) {
  try {
    const { data } = await axios.post('https://api.flowshieldai.com/api/v1/transactions/analyze', orderPayload, {
      headers: { 
        'X-API-Key': 'fs_live_your_key_here',
        'Content-Type': 'application/json'
      }
    });
    
    if (data.decision === 'high_risk') {
      console.warn(`Transaction Blocked. Recommendation: ${data.recommendation}`);
      throw new Error('Transaction rejected due to security policy flags.');
    }
    
    return data;
  } catch (error) {
    console.error('Inference check failed:', error.response?.data || error.message);
    throw error;
  }
}
```

### Example Response
```json
{
  "transaction_id": "TXN-90184204",
  "fraud_risk_score": 88.0,
  "risk_score": 0.88,
  "status": "high_risk",
  "decision": "high_risk",
  "recommendation": "block_transaction",
  "reasons": [
    "high_amount_spike",
    "spatial_anomaly"
  ],
  "detection_latency_ms": 7,
  "model_version": "ensemble_v1.0.0_calibrated"
}
```

---

## Error Codes
| Code | Description |
| :--- | :--- |
| `401` | Unauthorized (Invalid or inactive API Key) |
| `403` | Forbidden (Rate limit exceeded or IP geographic block) |
| `400` | Bad Request (Check your JSON payload format / PII violations) |
| `429` | Too Many Requests (Concurrent limit exceeded) |
| `500` | Internal Server Error |

## Support
For technical integration issues or security questions, contact [dev-support@flowshieldai.com](mailto:dev-support@flowshieldai.com).
