import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Code, Terminal, FileJson } from 'lucide-react';
import React, { useState } from 'react';

export default function Docs() {
  const [activeTab, setActiveTab] = useState('curl');
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 md:p-12 text-white bg-[#0A0E1A] h-full overflow-y-auto">
      <div>
        <h1 className="text-4xl font-display font-bold">API Documentation</h1>
        <p className="text-gray-400 mt-2 text-lg">Integrate Flowshield AI fraud detection into your infrastructure in 3 lines of code.</p>
      </div>

      <Card className="bg-[#111827] border-[#1F2937]">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <FileJson className="mr-2 h-5 w-5 text-blue-500" /> Endpoint Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 bg-[#1F2937] p-4 rounded-lg">
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold tracking-wider">POST</span>
            <code className="text-blue-300 font-mono">https://api.flowshield.ai/v1/transactions/analyze</code>
          </div>
          <p className="text-gray-400">
            Send raw transaction parameters (amount, card details, IP address) to receive an instant machine-learning backed score determining if the transaction should be Allowed, Reviewed, or Blocked.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#111827] border-[#1F2937] mt-8">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Code className="mr-2 h-5 w-5 text-emerald-500" /> Implementation Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="bg-[#1F2937] border-b border-[#374151] w-full flex overflow-hidden">
              <button 
                onClick={() => setActiveTab('curl')} 
                className={`px-6 py-3 transition-colors ${activeTab === 'curl' ? 'bg-[#374151] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                cURL
              </button>
              <button 
                onClick={() => setActiveTab('python')} 
                className={`px-6 py-3 transition-colors ${activeTab === 'python' ? 'bg-[#374151] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Python
              </button>
              <button 
                onClick={() => setActiveTab('node')} 
                className={`px-6 py-3 transition-colors ${activeTab === 'node' ? 'bg-[#374151] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Node.js
              </button>
            </div>
            
            {activeTab === 'curl' && (
              <div className="bg-[#0A0E1A] p-4 rounded-b-lg border border-t-0 border-[#374151]">
<pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "https://api.flowshield.ai/v1/transactions/analyze" \\
     -H "X-API-Key: fs_live_your_api_key_here" \\
     -H "Content-Type: application/json" \\
     -d '{
           "transaction_id": "req_847192",
           "amount": 149.99,
           "currency": "USD",
           "card": {
               "last_four": "4242",
               "type": "visa",
               "issuing_country": "US"
           },
           "customer": {
               "id": "cust_123",
               "ip": "192.168.1.1",
               "country": "US"
           },
           "merchant": {
               "category": "5960"
           },
           "channel": "web"
         }'`}
</pre>
              </div>
            )}

            {activeTab === 'python' && (
              <div className="bg-[#0A0E1A] p-4 rounded-b-lg border border-t-0 border-[#374151]">
<pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{`import requests

url = "https://api.flowshield.ai/v1/transactions/analyze"
headers = {
    "X-API-Key": "fs_live_your_api_key_here",
    "Content-Type": "application/json"
}

payload = {
    "transaction_id": "req_847192",
    "amount": 149.99,
    "currency": "USD",
    "card": {"last_four": "4242", "type": "visa", "issuing_country": "US"},
    "customer": {"id": "cust_123", "ip": "192.168.1.1", "country": "US"},
    "merchant": {"category": "5960"},
    "channel": "web"
}

response = requests.post(url, json=payload, headers=headers)
decision = response.json()

if decision.get("decision") == "block":
    # Halt checkout process
    print("Transaction Blocked:", decision.get("reasons"))`}
</pre>
              </div>
            )}

            {activeTab === 'node' && (
              <div className="bg-[#0A0E1A] p-4 rounded-b-lg border border-t-0 border-[#374151]">
<pre className="text-emerald-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{`const axios = require('axios');

async function checkFraudRisk() {
  try {
    const response = await axios.post(
      'https://api.flowshield.ai/v1/transactions/analyze',
      {
        transaction_id: "req_847192",
        amount: 149.99,
        currency: "USD",
        card: { last_four: "4242", type: "visa", issuing_country: "US" },
        customer: { id: "cust_123", ip: "192.168.1.1", country: "US" },
        merchant: { category: "5960" },
        channel: "web"
      },
      {
        headers: { 'X-API-Key': 'fs_live_your_api_key_here' }
      }
    );
    
    const result = response.data;
    if (result.decision === 'block') {
        console.warn('Fraud Detected:', result.reasons);
    }
  } catch (error) {
    console.error('API Error:', error.message);
  }
}
checkFraudRisk();`}
</pre>
              </div>
            )}

          </div>
        </CardContent>
      </Card>
      
      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-4">Response Object</h2>
        <div className="bg-[#111827] border border-[#1F2937] p-6 rounded-lg">
<pre className="text-blue-300 font-mono text-sm">
{`{
  "transaction_id": "fs_e23bc994-dfbb-41...",
  "risk_score": 0.89,
  "risk_label": "fraud",
  "decision": "block",
  "confidence": 0.89,
  "detection_latency_ms": 34,
  "reasons": [
    "AI Anomaly Model spotted high deviation (score: 0.89)",
    "IP geolocation mismatch with card country",
    "High-risk merchant category"
  ],
  "model_version": "ensemble_v2_isolation_forest"
}`}
</pre>
        </div>
      </div>
    </div>
  );
}
