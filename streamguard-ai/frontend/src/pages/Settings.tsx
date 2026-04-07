import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck } from 'lucide-react';
import api from '@/services/api';

export default function Settings() {
  const handleUpgrade = async () => {
    try {
      const response = await api.post('/billing/create-checkout-session');
      window.location.href = response.data.url;
    } catch (e) {
      console.error('Failed to create checkout session', e);
      alert('Stripe configuration missing. Add STRIPE_SECRET_KEY to your .env');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6 md:p-12 text-white">
      <div>
        <h1 className="text-3xl font-display font-bold">Workspace Settings</h1>
        <p className="text-gray-400 mt-1">Manage your organization's billing and subscription tiers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Free Tier */}
        <Card className="bg-[#111827] border-[#1F2937]">
          <CardHeader>
            <CardTitle>Developer (Free)</CardTitle>
            <CardDescription>Perfect for prototyping and testing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-4xl font-bold">$0 <span className="text-lg font-normal text-gray-500">/mo</span></h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-blue-500" /> 1,000 requests / month</li>
              <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-blue-500" /> Standard community support</li>
              <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-blue-500" /> Basic rule-based engine</li>
            </ul>
            <Button variant="outline" className="w-full mt-4 border-[#374151] hover:bg-[#1F2937]" disabled>Current Plan</Button>
          </CardContent>
        </Card>

        {/* Pro Tier */}
        <Card className="bg-[#111827] border-blue-600 relative overflow-hidden shadow-2xl shadow-blue-900/20">
          <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-bl-lg">Most Popular</div>
          <CardHeader>
            <CardTitle className="text-blue-400">Pro Tier</CardTitle>
            <CardDescription>For production marketplaces and stores.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-4xl font-bold">$99 <span className="text-lg font-normal text-gray-500">/mo</span></h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-blue-500" /> 100,000 requests / month</li>
              <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-blue-500" /> AI Ensemble ML Models (Isolation Forest)</li>
              <li className="flex items-center"><ShieldCheck className="h-4 w-4 mr-2 text-blue-500" /> Webhook notifications</li>
            </ul>
            <Button onClick={handleUpgrade} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
              <CreditCard className="h-4 w-4 mr-2" /> Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
