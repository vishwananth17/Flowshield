import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ShieldAlert, Check, X, ShieldQuestion } from 'lucide-react';

export default function Alerts() {
  const alerts = [
    { id: "tx_9f81a7", amount: 450.00, user: "john.doe@example.com", risk: "review", reason: "Device fingerprint mismatch and unverified IP address.", time: "2 mins ago" },
    { id: "tx_3b62c1", amount: 2199.99, user: "anon_849@domain.com", risk: "fraud", reason: "AI Model detected high-velocity pattern across multiple borders.", time: "14 mins ago" },
    { id: "tx_1a44d8", amount: 12.50, user: "test.acc@stripe.com", risk: "review", reason: "Card issuer declined AVS check.", time: "1 hour ago" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 md:p-12 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Actionable Alerts</h1>
          <p className="text-gray-400 mt-1">Manual review queue for transactions flagged by the AI engine.</p>
        </div>
        <div className="flex items-center bg-[#1F2937] rounded-lg px-3 py-2 border border-[#374151] w-64">
           <Search className="h-4 w-4 text-gray-400 mr-2" />
           <input type="text" placeholder="Search ID or rule..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder:text-gray-500" />
        </div>
      </div>

      <Card className="bg-[#111827] border-[#1F2937]">
        <CardHeader>
           <CardTitle className="text-lg">Needs Manual Review ({alerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-[#1F2937]/50 rounded-lg border border-[#374151]">
                <div className="flex items-start space-x-4 mb-4 md:mb-0">
                  <div className={`p-3 rounded-full mt-1 ${alert.risk === 'fraud' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                    {alert.risk === 'fraud' ? <ShieldAlert className="h-5 w-5" /> : <ShieldQuestion className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-blue-400 text-sm">{alert.id}</span>
                      <span className="font-bold">${(alert.amount).toFixed(2)}</span>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">{alert.user}</p>
                    <p className="text-xs text-red-300 mt-2 bg-red-900/20 py-1 px-2 rounded-sm inline-block border border-red-900/50">
                       Reason: {alert.reason}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300">
                        <Check className="h-4 w-4 mr-1" /> Allow
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-none border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300">
                        <X className="h-4 w-4 mr-1" /> Block
                    </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
