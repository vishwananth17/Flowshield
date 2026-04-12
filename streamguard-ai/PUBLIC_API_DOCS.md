# StreamGuard AI Public API Documentation v1

Welcome to the StreamGuard AI Developer Documentation. Our API allows you to integrate real-time fraud detection into your checkout flow with under 200ms latency.

## Authentication

All requests to the public API must include your organization's API Key in the `X-API-Key` header.

```bash
X-API-Key: sg_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

You can generate API keys in your [Dashboard Settings](https://dashboard.streamguard.ai/settings).

---

## 1. Analyze Transaction
**Endpoint:** `POST /api/v1/transactions/analyze`

Analyze a transaction for risk and receive a decision (Allow, Review, Block).

### Request Body
| Field | Type | Description |
| :--- | :--- | :--- |
| `amount` | Float | The transaction amount (e.g. 99.50) |
| `currency` | String | ISO currency code (e.g. "USD") |
| `customer_email` | String | Email of the purchaser |
| `customer_ip` | String | IPv4/IPv6 address of the customer |
| `merchant_name` | String | Your store/merchant name |
| `card_bin` | String | (Optional) First 6 digits of the card |
| `card_last_four` | String | Last 4 digits of the card |
| `card_country` | String | 2-letter ISO country code of the card |

### Example Request (cURL)
```bash
curl -X POST https://api.streamguard.ai/api/v1/transactions/analyze \
  -H "X-API-Key: sg_live_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250.00,
    "currency": "USD",
    "customer_email": "jane.doe@example.com",
    "customer_ip": "192.168.1.1",
    "merchant_name": "MyElectronicsStore",
    "card_last_four": "4242"
  }'
```

### Example Request (Node.js)
```javascript
const axios = require('axios');

async function checkFraud(order) {
  const { data } = await axios.post('https://api.streamguard.ai/api/v1/transactions/analyze', order, {
    headers: { 'X-API-Key': 'sg_live_your_key_here' }
  });
  
  if (data.decision === 'block') {
    throw new Error('Transaction flagged as fraudulent');
  }
  return data;
}
```

### Response
```json
{
  "transaction_id": "sg_tx_abc123",
  "risk_score": 0.85,
  "risk_label": "fraud",
  "decision": "block",
  "reasons": ["Unusual purchase velocity", "IP Address mismatch"],
  "detection_latency_ms": 45
}
```

---

## Error Codes
| Code | Description |
| :--- | :--- |
| `401` | Unauthorized (Invalid or missing API Key) |
| `429` | Rate Limit Exceeded (Upgrade to Pro plan) |
| `400` | Bad Request (Check your JSON payload) |
| `500` | Internal Server Error |

## Support
For technical integration issues, contact [dev-support@streamguard.ai](mailto:dev-support@streamguard.ai).
