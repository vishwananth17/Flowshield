import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Terminal, 
  Key, 
  Zap, 
  Code, 
  AlertCircle, 
  Webhook, 
  Globe, 
  Cpu, 
  Layers,
  Search,
  BookOpen,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  FileCode,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DOC_CATEGORIES = [
  {
    id: 'intro',
    title: 'Introduction',
    description: 'Get started with Flowshield AI. Learn the core concepts and architecture.',
    icon: Globe,
    color: 'bg-blue-500',
    link: '#introduction'
  },
  {
    id: 'auth',
    title: 'Authentication',
    description: 'Secure your API requests with organization-level secret keys and headers.',
    icon: Key,
    color: 'bg-indigo-500',
    link: '#authentication'
  },
  {
    id: 'integrate',
    title: 'Integrations',
    description: 'Step-by-step guides for Web, Mobile, and Backend environments.',
    icon: Zap,
    color: 'bg-emerald-500',
    link: '#integrate'
  },
  {
    id: 'api',
    title: 'API Reference',
    description: 'Deep dive into the /v1/analyze transaction endpoint and parameters.',
    icon: Terminal,
    color: 'bg-amber-500',
    link: '#api'
  },
  {
    id: 'payments',
    title: 'Payments',
    description: 'Integrate Razorpay and manage subscription billing automation.',
    icon: CreditCard,
    color: 'bg-pink-500',
    link: '#payments'
  },
  {
    id: 'sdks',
    title: 'SDKs & Tools',
    description: 'Official libraries for Node.js, Python, Go, and Ruby.',
    icon: Layers,
    color: 'bg-purple-500',
    link: '#sdks'
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function Docs() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-200 selection:bg-blue-500/30">
      
      {/* HEADER / NAVIGATION */}
      <nav className="h-20 border-b border-slate-800/50 bg-[#0A0E1A]/80 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="text-white h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Flowshield AI</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="/" className="hover:text-blue-400 transition-colors">Home</a>
          <a href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</a>
          <a href="#" className="text-blue-400 font-bold border-b-2 border-blue-500 pb-1">Documentation</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Pricing</a>
        </div>

        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 rounded-full hidden sm:flex">
          Contact Support
        </Button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-[450px] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 space-y-6 max-w-3xl"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <BookOpen className="h-3 w-3" />
            <span>Developer Center V2.5</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
            Documentation
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            Everything you need to integrate Flowshield AI into your payments, banking, and e-commerce infrastructure.
          </p>
          
          <div className="relative mt-12 group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl group-focus-within:bg-blue-500/40 transition-all rounded-full" />
            <div className="relative flex items-center w-full max-w-xl mx-auto">
              <Search className="absolute left-5 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <Input 
                type="text" 
                placeholder="Search the docs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-14 pr-6 bg-slate-900/80 border-slate-800 border-2 rounded-full text-lg focus-visible:ring-blue-500/50 backdrop-blur-xl transition-all"
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* CATEGORY GRID */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {DOC_CATEGORIES.map((cat) => (
            <motion.div
              key={cat.id}
              variants={itemVariants}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="group relative h-[250px] bg-slate-900 border border-slate-800 rounded-[32px] p-8 hover:border-blue-500/50 hover:bg-slate-900/50 transition-all cursor-pointer overflow-hidden"
            >
              {/* Card Detail */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-all" />
              
              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="space-y-4">
                  <div className={`h-14 w-14 ${cat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <cat.icon className="text-white h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">{cat.title}</h3>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-blue-400 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0">
                  Read Guide <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* RESOURCE HIGHLIGHTS */}
      <section className="bg-slate-900/30 border-y border-slate-800/50 py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="h-1 bg-blue-500 w-24" />
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              Start Protecting in <br/> Under 5 Minutes.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Our API is built for speed. With zero-configuration endpoints and pre-built SDKs, you can go from integration to production in record time.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <Webhook className="h-6 w-6 text-emerald-400" />
                <h4 className="font-bold">Event Streams</h4>
                <p className="text-xs text-slate-500">Real-time webhooks for analysis alerts.</p>
              </div>
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <FileCode className="h-6 w-6 text-indigo-400" />
                <h4 className="font-bold">Playground</h4>
                <p className="text-xs text-slate-500">Test live transaction analysis payloads.</p>
              </div>
            </div>
          </div>

          {/* CODE SNIPPET PREVIEW */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-950 border border-slate-800 rounded-[40px] p-10 shadow-2xl shadow-blue-500/5 relative overflow-hidden"
          >
             <div className="flex space-x-2 mb-8">
               <div className="w-3 h-3 bg-red-500/50 rounded-full" />
               <div className="w-3 h-3 bg-amber-500/50 rounded-full" />
               <div className="w-3 h-3 bg-emerald-500/50 rounded-full" />
             </div>
             <pre className="font-mono text-sm text-blue-400 leading-loose">
               <span className="text-slate-500"># Analyze a transaction</span><br/>
               <span className="text-indigo-400">curl</span> -X POST https://api.flowshield.ai/v1/analyze \<br/>
               &nbsp;&nbsp;-H <span className="text-emerald-400">"X-API-Key: fs_live_xxx"</span> \<br/>
               &nbsp;&nbsp;-d <span className="text-white">{'{'}</span><br/>
               &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"amount"</span>: <span className="text-indigo-300">149.99</span>,<br/>
               &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"currency"</span>: <span className="text-emerald-400">"USD"</span>,<br/>
               &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-400">"customer_ip"</span>: <span className="text-emerald-400">"1.2.3.4"</span><br/>
               <span className="text-white">{'}'}</span>
             </pre>
             <div className="absolute top-0 right-0 p-8">
                <FileCode className="h-12 w-12 text-blue-500/20" />
             </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="py-24 px-6 text-center">
         <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-12"
         >
            <div className="flex justify-center space-x-6">
               <div className="flex items-center space-x-2 text-slate-400 text-sm">
                 <MessageSquare className="h-4 w-4" /> <span>Developer Discord</span>
               </div>
               <div className="flex items-center space-x-2 text-slate-400 text-sm">
                 <ExternalLink className="h-4 w-4" /> <span>GitHub Repo</span>
               </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
              Can't find what you need?
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
               <Button className="h-14 px-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-lg shadow-xl shadow-blue-500/20">
                 Talk to an Engineer
               </Button>
               <Button variant="outline" className="h-14 px-10 border-slate-800 text-white font-bold rounded-2xl text-lg hover:bg-slate-900">
                 Visit Community docs
               </Button>
            </div>
         </motion.div>
      </section>

      {/* BOTTOM FOOTER */}
      <footer className="py-12 border-t border-slate-800/50 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs gap-6 font-medium">
         <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">© 2026 Flowshield AI Security.</span>
            <span>All rights reserved. Built for global scale.</span>
         </div>
         <div className="flex items-center space-x-8 uppercase tracking-widest font-bold">
            <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-400 transition-colors">Security</a>
         </div>
      </footer>

    </div>
  );
}

