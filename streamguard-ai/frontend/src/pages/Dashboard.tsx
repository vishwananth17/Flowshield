import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, ShieldAlert, DollarSign, Clock, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { motion, type Variants, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('http', 'ws') + '/api/v1/stream/ws'
      : 'ws://localhost:8000/api/v1/stream/ws';
      
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const newTx = JSON.parse(event.data);
        setLiveTransactions(prev => [newTx, ...prev].slice(0, 5));
      } catch (err) {}
    };
    
    return () => ws.close();
  }, []);

  const stats = [
    { title: 'Total Transactions (24h)', value: '12,345', trend: '+12.5%', isUp: true, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Fraud Detected', value: '42', trend: '-2.4%', isUp: false, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Amount Protected', value: '$24,500', trend: '+18.2%', isUp: true, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Avg Latency', value: '45ms', trend: '-5.0%', isUp: true, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Overview</h1>
          <p className="text-gray-400 mt-1">Here's what's happening with your traffic today.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">System fully operational</span>
        </div>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div variants={item} key={i}>
              <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80 hover:bg-[#111827]/80 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.color.replace('text-', 'bg-')}`} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2 text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} shadow-inner`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className={`flex items-center font-medium ${stat.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.isUp ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                      {stat.trend}
                    </span>
                    <span className="text-gray-500 ml-2">vs last week</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card className="col-span-2 backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80 overflow-hidden">
          <CardHeader className="border-b border-[#1F2937]/50 bg-[#111827]/40 pb-4">
            <CardTitle className="text-white text-lg font-medium flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-400" />
              Live Transactions Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {liveTransactions.length === 0 ? (
              <div className="flex h-[350px] items-center justify-center relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
                <div className="text-center z-10">
                  <div className="relative inline-flex mb-4">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 rounded-full border border-blue-500/10 blur-sm" />
                  </div>
                  <p className="text-gray-400 font-medium font-mono text-sm">Waiting for live events...</p>
                  <p className="text-gray-500 text-xs mt-1">Listening on wss://streamguard.ai/feed</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[350px] overflow-hidden p-2">
                <AnimatePresence>
                  {liveTransactions.map((tx) => (
                    <motion.div 
                      key={tx.id || Math.random()}
                      initial={{ opacity: 0, x: -20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex items-center justify-between p-3 mb-2 rounded-lg bg-[#1F2937]/30 border border-[#374151]/50"
                    >
                      <div>
                        <p className="text-white font-mono text-sm">{tx.amount} {tx.currency}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{tx.merchant_name || 'Unknown Merchant'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tx.risk_label === 'fraud' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                          tx.risk_label === 'review' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {tx.risk_label?.toUpperCase() || "SAFE"}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="backdrop-blur-xl bg-[#111827]/60 border-[#1F2937]/80">
          <CardHeader className="border-b border-[#1F2937]/50 bg-[#111827]/40 pb-4">
            <CardTitle className="text-white text-lg font-medium flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-red-400" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-[350px] items-center justify-center flex-col p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#1F2937] flex items-center justify-center mb-4 border border-[#374151]">
                <ShieldAlert className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium">All clear</p>
              <p className="text-gray-500 text-sm mt-1">No anomalous patterns detected in the last hour.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
