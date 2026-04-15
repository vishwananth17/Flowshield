import { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Key, 
  Zap, 
  Code, 
  AlertCircle, 
  Webhook, 
  Copy, 
  Check, 
  Lock, 
  ExternalLink,
  Menu,
  Play,
  Database,
  Globe,
  Cpu,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTIONS = [
  { id: 'introduction', title: 'Introduction', icon: Globe },
  { id: 'authentication', title: 'Authentication', icon: Key },
  { id: 'analyze', title: 'Analyze Transaction', icon: Cpu },
  { id: 'request-schema', title: 'Full API Reference', icon: Database },
  { id: 'code-examples', title: 'Live Benchmarks', icon: Play },
  { id: 'errors', title: 'Error Library', icon: AlertCircle },
  { id: 'webhooks', title: 'Event Streams', icon: Webhook },
];

const LANGUAGES = [
  { id: 'bash', name: 'cURL', icon: Terminal },
  { id: 'python', name: 'Python', icon: Code },
  { id: 'javascript', name: 'Node.js', icon: Code },
  { id: 'go', name: 'Go', icon: Code },
];

const CODE_EXAMPLES = {
  bash: `curl -X POST "https://api.flowshield.ai/v1/analyze" \\
  -H "X-API-Key: fs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "transaction_id": "txn_84729",
    "amount": 149.99,
    "currency": "USD",
    "card": {
      "last_four": "4242",
      "issuing_country": "US"
    },
    "customer": {
      "email": "user@example.com",
      "ip": "1.1.1.1"
    }
  }'`,
  python: `import requests

response = requests.post(
    "https://api.flowshield.ai/v1/analyze",
    headers={"X-API-Key": "fs_live_..."},
    json={
        "transaction_id": "txn_84729",
        "amount": 149.99,
        "currency": "USD",
        "card": {"last_four": "4242", "issuing_country": "US"},
        "customer": {"email": "user@example.com", "ip": "1.1.1.1"}
    }
)
print(response.json())`,
  javascript: `const response = await fetch('https://api.flowshield.ai/v1/analyze', {
  method: 'POST',
  headers: {
    'X-API-Key': 'fs_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    transaction_id: 'txn_84729',
    amount: 149.99,
    currency: 'USD',
    card: { last_four: '4242', issuing_country: 'US' },
    customer: { email: 'user@example.com', ip: '1.1.1.1' }
  })
});
const result = await response.json();`,
  go: `// Standard net/http implementation...
resp, _ := http.Post("https://api.flowshield.ai/v1/analyze", 
  "application/json", 
  bytes.NewBuffer(payload))`
};

const RESPONSE_PREVIEW = `{
  "id": "fs_txn_9a2b...",
  "risk_score": 0.89,
  "decision": "BLOCK",
  "confidence": 0.94,
  "latence_ms": 42,
  "reasons": [
    "Geographic Mismatch (IP vs Card)",
    "Velocity Threshold Exceeded",
    "Device Fingerprint Blacklisted"
  ]
}`;

export default function Docs() {
  const [activeLang, setActiveLang] = useState('bash');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#020617] border-r border-slate-800/50 flex flex-col z-50 transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center space-x-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="text-white h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tighter text-white">Flowshield</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Documentation</div>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                activeSection === s.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <s.icon className={`mr-3 h-4 w-4 ${activeSection === s.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
              {s.title}
            </button>
          ))}
          
          <div className="pt-8 px-4 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Resources</div>
          <a href="#" className="flex items-center px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            <Layers className="mr-3 h-4 w-4 opacity-50" /> API Status
          </a>
          <a href="#" className="flex items-center px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ExternalLink className="mr-3 h-4 w-4 opacity-50" /> Community
          </a>
        </nav>

        <div className="p-6">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">Need custom integration support for enterprise?</p>
            <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs py-2 h-auto font-bold border border-slate-700">Talk to Sales</Button>
          </div>
        </div>
      </aside>

      {/* CONTENT & CODE AREA */}
      <div className="flex-1 overflow-hidden flex flex-col">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-slate-800/50 px-8 flex items-center justify-between lg:hidden sticky top-0 bg-[#020617] z-40">
           <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-400"><Menu /></button>
           <div className="font-bold text-white tracking-tighter">Flowshield AI</div>
           <div className="w-8" />
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth flex lg:flex-row flex-col">
           
           {/* TEXT CONTENT */}
           <div className="flex-1 lg:max-w-3xl px-8 lg:px-20 py-20 space-y-24 pb-40">
              
              <section id="introduction" className="space-y-6">
                <div className="flex items-center space-x-2 text-indigo-400 text-sm font-bold tracking-tight mb-2">
                   <div className="w-6 h-[1px] bg-indigo-500/50" />
                   <span>V1.4.0 CURRENT</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter">API Infrastructure</h1>
                <p className="text-xl text-slate-400 leading-relaxed font-medium">
                  Integrate Flowshield AI into your fintech stack to protect every transaction with sub-100ms fraud detection models. Our API sits between your customers and your payment gateway, identifying risk before captures happen.
                </p>

                <div className="p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-3xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 blur-sm group-hover:blur-none transition-all">
                      <Zap className="h-24 w-24 text-indigo-400" />
                   </div>
                   <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4">Core Principles</h3>
                   <ul className="space-y-3">
                      <li className="flex items-center text-sm text-slate-300">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3" />
                         Ultra-low latency inference (P99 &lt; 85ms)
                      </li>
                      <li className="flex items-center text-sm text-slate-300">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3" />
                         Deterministic risk labeling and thresholding
                      </li>
                      <li className="flex items-center text-sm text-slate-300">
                         <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3" />
                         Zero-downtime global endpoint distribution
                      </li>
                   </ul>
                </div>
              </section>

              <section id="authentication" className="space-y-8">
                <h2 className="text-3xl font-black text-white tracking-tighter flex items-center">
                   Authentication
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  Authenticate your requests by including your secret key in the <code className="text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded font-mono">X-API-Key</code> header. Secret keys are created at the organization level in your dashboard.
                </p>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                   <div className="font-mono text-sm">
                      <span className="text-slate-500">X-API-Key:</span> <span className="text-emerald-400">fs_live_your_secret_key</span>
                   </div>
                   <Button variant="ghost" size="sm" onClick={() => handleCopy('fs_live_your_secret_key')} className="text-slate-500 hover:text-white">
                      <Copy className="h-4 w-4" />
                   </Button>
                </div>
                <div className="flex items-start space-x-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                   <Lock className="text-amber-500 h-5 w-5 mt-1 flex-shrink-0" />
                   <p className="text-xs text-amber-500/80 leading-relaxed font-medium">
                      Never expose your secret keys in client-side code (browsers, mobile apps). Flowshield AI is designed to be called from your secure backend environment.
                   </p>
                </div>
              </section>

              <section id="analyze" className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-white tracking-tighter">Analyze Transaction</h2>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 uppercase tracking-widest">POST Endpoint</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The flagship inquiry endpoint. It accepts structured transaction data and returns a fraud risk score, deterministic decision recommendation, and behavioral breakdown.
                </p>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center space-x-4 font-mono text-sm overflow-hidden">
                   <span className="text-indigo-400 font-bold">POST</span>
                   <span className="text-slate-300">/v1/analyze</span>
                </div>
              </section>

              <section id="request-schema" className="space-y-8">
                 <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Full Payload Reference</h3>
                 <div className="space-y-12">
                    {[
                      { field: 'transaction_id', type: 'string', desc: 'Your internal unique identifier for the payment attempt.' },
                      { field: 'amount', type: 'float', desc: 'The absolute transaction value in the specified currency.' },
                      { field: 'merchant', type: 'object', desc: 'Metadata about where the purchase is happening.' },
                      { field: 'customer', type: 'object', desc: 'Detailed identifiers including IP, email, and fingerprint.' },
                    ].map(f => (
                      <div key={f.field} className="flex flex-col space-y-2 group">
                         <div className="flex items-center space-x-3">
                            <span className="font-mono text-indigo-400 text-sm font-bold group-hover:text-indigo-300 transition-colors uppercase">{f.field}</span>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{f.type}</span>
                            <div className="h-[1px] flex-1 bg-slate-800/50" />
                         </div>
                         <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                 </div>
              </section>

           </div>

           {/* RIGTH CODE AREA */}
           <div className="lg:w-[500px] xl:w-[600px] bg-[#020617] border-l border-slate-800/50 flex flex-col min-h-screen lg:h-screen lg:sticky lg:top-0">
              
              {/* CODE TAB BAR */}
              <div className="h-16 border-b border-slate-800/50 px-6 flex items-center space-x-4 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-30">
                 {LANGUAGES.map(lang => (
                   <button 
                      key={lang.id}
                      onClick={() => setActiveLang(lang.id)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                        activeLang === lang.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                      }`}
                   >
                     {lang.name}
                   </button>
                 ))}
                 <div className="flex-1" />
                 <button className="text-slate-500 hover:text-white p-2" onClick={() => handleCopy(CODE_EXAMPLES[activeLang as keyof typeof CODE_EXAMPLES])}>
                    {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-[#020617]">
                 
                 {/* REQUEST BLOCK */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execute Inquiry</h3>
                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden group">
                       <pre className="p-6 text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto selection:bg-indigo-500/20 hide-scrollbar">
                          {CODE_EXAMPLES[activeLang as keyof typeof CODE_EXAMPLES]}
                       </pre>
                    </div>
                 </div>

                 {/* RESPONSE BLOCK */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inference Response</h3>
                       <div className="flex items-center space-x-1">
                          <span className="w-1 h-1 bg-slate-700 rounded-full" />
                          <span className="w-1 h-3 bg-indigo-500 rounded-full" />
                          <span className="w-1 h-1 bg-slate-700 rounded-full" />
                       </div>
                    </div>
                    <div className="bg-[#020617] border border-slate-800/80 rounded-2xl overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-3">
                          <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">JSON</span>
                       </div>
                       <pre className="p-6 text-xs font-mono text-slate-400 leading-relaxed overflow-x-auto selection:bg-slate-500/20 hide-scrollbar">
                          {RESPONSE_PREVIEW}
                       </pre>
                    </div>
                 </div>

                 {/* MINI CONSOLE */}
                 <div className="p-6 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl">
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mb-4 font-bold tracking-widest uppercase">
                       <Terminal className="h-3 w-3" />
                       <span>Debugger Output</span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono italic">Listening for requests to /api/v1/analyze...</p>
                 </div>

              </div>

           </div>

        </div>

      </div>

    </div>
  );
}

