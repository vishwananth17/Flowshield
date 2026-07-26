import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Copy, Check, Terminal, ShieldAlert } from 'lucide-react';

export default function DeveloperFlow() {
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python' | 'php' | 'script'>('curl');
  const [copied, setCopied] = useState(false);
  const { organization } = useAuthStore();

  const orgId = organization?.id || 'org_id_placeholder';
  const apiKey = 'YOUR_API_KEY'; // Instruction: instruct user to create an API key in the Keys section

  const snippets = {
    curl: `curl -X POST https://flowshield-stdr.onrender.com/api/v1/transactions/analyze \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "tx_981240",
    "amount": 2500.0,
    "currency": "INR",
    "location": "Mumbai, IN",
    "device_id": "device_fingerprint"
  }'`,
    node: `const axios = require('axios');

axios.post('https://flowshield-stdr.onrender.com/api/v1/transactions/analyze', {
  transaction_id: 'tx_981240',
  amount: 2500.0,
  currency: 'INR',
  location: 'Mumbai, IN',
  device_id: 'device_fingerprint'
}, {
  headers: { 'X-API-Key': '${apiKey}' }
})
.then(res => console.log(res.data))
.catch(err => console.error(err));`,
    python: `import requests

response = requests.post(
    "https://flowshield-stdr.onrender.com/api/v1/transactions/analyze",
    headers={"X-API-Key": "${apiKey}"},
    json={
        "transaction_id": "tx_981240",
        "amount": 2500.0,
        "currency": "INR",
        "location": "Mumbai, IN",
        "device_id": "device_fingerprint"
    }
)
print(response.json())`,
    php: `<?php
$ch = curl_init('https://flowshield-stdr.onrender.com/api/v1/transactions/analyze');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ${apiKey}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'transaction_id' => 'tx_981240',
    'amount' => 2500.0,
    'currency' => 'INR',
    'location' => 'Mumbai, IN',
    'device_id' => 'device_fingerprint'
]));
$response = curl_exec($ch);
curl_close($ch);
echo $response;`,
    script: `<!-- Paste this inside your website's <head> tags -->
<script 
  src="https://flowshield-stdr.onrender.com/cdn/flowshield.js" 
  data-flowshield-id="${orgId}"
  async>
</script>

<!-- Add this data attribute to checkout or payment buttons to track clicks -->
<button data-flowshield-checkout data-flowshield-amount="2500" data-flowshield-currency="INR">
  Proceed to Checkout
</button>`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    toast.success('Code snippet copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-xl max-w-4xl">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="h-5 w-5 text-blue-400" />
        <h3 className="font-semibold text-lg text-white">Developer Integration</h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        Integrate Flowshield directly into your transaction flow. For standard server-side SDKs, make sure to generate an API key first.
      </p>

      {/* Tabs */}
      <div className="flex border-b border-[#1F2937] mb-5 overflow-x-auto">
        {(Object.keys(snippets) as Array<keyof typeof snippets>).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab === 'script' ? 'Script Tag (Basic)' : tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Snippet Code block */}
      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 p-1.5 rounded bg-[#1F2937] border border-[#374151] hover:bg-[#374151] transition-colors text-gray-400 hover:text-white"
          title="Copy to clipboard"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>

        <pre className="bg-[#0b0f19] border border-[#1F2937] rounded-lg p-5 overflow-x-auto text-xs text-gray-300 font-mono leading-relaxed max-h-[300px]">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>

      {activeTab === 'script' && (
        <div className="mt-5 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300 leading-relaxed">
            <span className="font-semibold text-amber-400 block mb-1">⚠️ Basic Monitoring Only</span>
            The HTML script tag is client-side and is intended for visibility and analytics monitoring only. 
            It computes risk signals (browser fingerprint, IP reputation) on checkout button clicks but does 
            <b> NOT</b> block suspicious checkouts automatically to prevent user experience bugs. 
            For transaction enforcement and secure blocking decisions, use server-side integrations (API/SDK) or one of our supported store connectors.
          </div>
        </div>
      )}
    </div>
  );
}
