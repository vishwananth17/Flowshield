import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity, ShieldAlert, CheckCircle2, TrendingUp } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-12 text-white">
      <div>
        <h1 className="text-3xl font-display font-bold">Analytics Engine</h1>
        <p className="text-gray-400 mt-1">High-level insights into your transaction volume and fraud velocity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[#1F2937]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Analyzed</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142,394</div>
            <p className="text-xs text-blue-400 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" /> +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1F2937]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Fraud Blocked</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,240</div>
            <p className="text-xs text-gray-500 mt-1">
              Prevented ~$1.2M in chargebacks
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1F2937]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Safe Transactions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">138,401</div>
            <p className="text-xs text-gray-500 mt-1">
              97.2% overall safety rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[#1F2937]">
           <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Decision Latency</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42ms</div>
            <p className="text-xs text-purple-400 mt-1">
              Well within 200ms SLA
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="bg-[#111827] border-[#1F2937] h-96 flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent z-10"></div>
             <p className="z-20 text-gray-400 text-sm border border-[#374151] px-4 py-2 rounded-full bg-[#1F2937]">Connecting to Live Chart Stream...</p>
             <div className="absolute bottom-0 w-full flex items-end justify-between px-8 gap-2 opacity-20">
                {[40, 70, 45, 90, 65, 85, 120, 50, 80, 110, 60, 40].map((h, i) => (
                    <div key={i} className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${h}px` }} />
                ))}
             </div>
        </Card>

        <Card className="bg-[#111827] border-[#1F2937] h-96 p-6">
          <CardTitle className="text-lg font-bold mb-4">Top AI Risk Factors</CardTitle>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#1F2937] p-3 rounded-lg border border-[#374151]">
              <span className="text-sm font-medium">IP Distance from Card Origin</span>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">42% impact</span>
            </div>
            <div className="flex justify-between items-center bg-[#1F2937] p-3 rounded-lg border border-[#374151]">
              <span className="text-sm font-medium">Time-Of-Day Anomalies</span>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">28% impact</span>
            </div>
            <div className="flex justify-between items-center bg-[#1F2937] p-3 rounded-lg border border-[#374151]">
              <span className="text-sm font-medium">High-Risk Merchant Categories</span>
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">17% impact</span>
            </div>
            <div className="flex justify-between items-center bg-[#1F2937] p-3 rounded-lg border border-[#374151]">
              <span className="text-sm font-medium">Fast Purchasing Velocity</span>
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">13% impact</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
