export interface DocEntry {
  id: string;
  section: string;
  title: string;
  content: string;
  anchor: string;
}

const DOC_INDEX: DocEntry[] = [
  { 
    id: '1', section: 'Getting Started',
    title: 'Introduction',
    content: 'Flowshield AI Real-Time Fraud Detection API Core Infrastructure Reference Manual sub-100ms ML models uptime integration',
    anchor: '#introduction' 
  },
  { 
    id: '2', section: 'Getting Started',
    title: 'Merchant Guide (Non-Technical)',
    content: 'general overview non-technical chargebacks dispute manual shipping tracking delhivery express courier setup walkthrough video checklists',
    anchor: '#merchant-guide' 
  },
  { 
    id: '13', section: 'Getting Started',
    title: 'Quick Start',
    content: 'API key authentication X-API-Key header analyze transaction fraud detection post json curl Python Node.js',
    anchor: '#quick-start' 
  },
  {
    id: '3', section: 'Authentication',
    title: 'API Keys',
    content: 'live keys test keys prefix fs_live_ fs_test_ authorization security basic auth rotating keys backend javascript',
    anchor: '#authentication'
  },
  {
    id: '4', section: 'Core API',
    title: 'Request Schema',
    content: 'transaction_id amount currency merchant customer card channel ip POST transactions analyze JSON payload body',
    anchor: '#request-schema'
  },
  {
    id: '5', section: 'Core API',
    title: 'Response Schema',
    content: 'risk_score risk_label safe suspicious fraud decision allow review block confidence detection_latency_ms reasons model_version',
    anchor: '#response-schema'
  },
  {
    id: '6', section: 'Integrations',
    title: 'Razorpay',
    content: 'razorpay_order_id razorpay_payment_id razorpay_signature verify payment middleware express crypto hmac',
    anchor: '#razorpay'
  },
  {
    id: '7', section: 'Integrations',
    title: 'Python / Django',
    content: 'django python requests middleware process_payment analyze_transaction',
    anchor: '#python'
  },
  {
    id: '8', section: 'Webhooks',
    title: 'Webhooks',
    content: 'webhook signature x-flowshield-signature fraud.detected transaction.flagged alert.created event verification',
    anchor: '#webhooks'
  },
  {
    id: '9', section: 'Reference',
    title: 'Error Codes',
    content: 'INVALID_API_KEY RATE_LIMIT_EXCEEDED INVALID_REQUEST VALIDATION_ERROR PLAN_LIMIT INTERNAL_ERROR SERVICE_UNAVAILABLE 401 429 400 422 403 500 503',
    anchor: '#error-codes'
  },
  {
    id: '10', section: 'Reference',
    title: 'Rate Limits',
    content: 'free basic growth enterprise headers X-RateLimit-Limit X-RateLimit-Remaining X-RateLimit-Reset retry',
    anchor: '#rate-limits'
  },
  {
    id: '11', section: 'Reference',
    title: 'Changelog',
    content: 'version history v1.0.0 initial release isolation forest xgboost shap',
    anchor: '#changelog'
  }
];

export function searchDocs(query: string): DocEntry[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  
  // Scored search
  const results = DOC_INDEX.map(entry => {
    let score = 0;
    const titleMatch = entry.title.toLowerCase().includes(q);
    const contentMatch = entry.content.toLowerCase().includes(q);
    const sectionMatch = entry.section.toLowerCase().includes(q);
    
    if (titleMatch) score += 10;
    if (sectionMatch) score += 5;
    if (contentMatch) score += 1;
    
    return { entry, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => item.entry)
  .slice(0, 8);
  
  return results;
}
