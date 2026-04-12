import { useState, useEffect } from 'react';
import { 
  Zap, 
  Settings, 
  CheckCircle2, 
  BarChart3, 
  Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { toast } from 'sonner';

interface SubscriptionData {
  plan: string;
  monthly_request_count: number;
  monthly_request_limit: number;
  percentage_used: number;
  billing_period_start: string | null;
  stripe_portal_url: string | null;
}

export default function Billing() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/billing/subscription');
      setData(response.data);
    } catch (e) {
      console.error("Failed to fetch subscription", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const response = await api.post('/billing/create-checkout-session');
      window.location.href = response.data.checkout_url;
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || "Failed to initiate upgrade");
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isGrowth = data?.plan === 'growth';

  const avgPerDay = data ? Math.round(data.monthly_request_count / (Math.max(1, new Date().getDate()))) : 0;
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projection = avgPerDay * daysInMonth;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6 md:p-12 text-white bg-[#0A0E1A]">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Billing & Quota</h1>
          <p className="text-gray-400 mt-1">Manage your plan and track API consumption.</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest ${
          isGrowth ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
        }`}>
          {data?.plan} PLAN
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CURRENT PLAN & USAGE */}
        <Card className="lg:col-span-2 bg-[#111827] border-[#1F2937] overflow-hidden">
          <CardHeader className="bg-[#1F2937]/30 border-b border-[#1F2937]">
            <CardTitle className="text-lg flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-blue-500" />
              Monthly Request Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex justify-between items-end mb-4">
              <div>
                <span className="text-4xl font-bold">{data?.monthly_request_count.toLocaleString()}</span>
                <span className="text-gray-500 ml-2">/ {data?.monthly_request_limit.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${data && data.percentage_used > 80 ? 'text-amber-400' : 'text-blue-400'}`}>
                  {data?.percentage_used}% used
                </span>
              </div>
            </div>

            <div className="h-4 w-full bg-[#0A0E1A] rounded-full overflow-hidden border border-[#1F2937]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data?.percentage_used}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full ${data && data.percentage_used > 90 ? 'bg-red-500' : data && data.percentage_used > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-[#1F2937]">
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Daily Average</p>
                  <p className="text-xl font-bold mt-1">{avgPerDay.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Projection</p>
                  <p className="text-xl font-bold mt-1">{projection.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Resets In</p>
                  <p className="text-xl font-bold mt-1">{daysInMonth - new Date().getDate()} days</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* ACCOUNT STATUS & ACTIONS */}
        <div className="space-y-6">
          {!isGrowth ? (
            <Card className="bg-blue-600 border-none shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <CardContent className="p-8">
                <Zap className="h-8 w-8 text-white mb-6" />
                <h3 className="text-2xl font-bold text-white">Upgrade to Growth</h3>
                <p className="text-blue-100 mt-2 text-sm leading-relaxed">Unlock massive scale for your business with 100,000 monthly transactions.</p>
                <div className="mt-8 space-y-3">
                   {['100k requests/mo', 'Priority AI processing', 'Custom risk thresholds', 'Webhooks integration'].map(feature => (
                     <div key={feature} className="flex items-center text-sm text-blue-50">
                        <CheckCircle2 className="h-4 w-4 mr-2 opacity-50" /> {feature}
                     </div>
                   ))}
                </div>
                <Button 
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full mt-8 bg-white text-blue-600 hover:bg-blue-50 font-bold py-6 text-lg"
                >
                  {upgrading ? "Contacting Stripe..." : "$99 / month"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#111827] border-[#1F2937]">
               <CardContent className="p-8">
                 <div className="flex items-center justify-between mb-8">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    <span className="text-xs font-mono text-gray-500">ID: PRO_TIER</span>
                 </div>
                 <h3 className="text-xl font-bold">Active Subscription</h3>
                 <p className="text-gray-400 mt-2 text-sm leading-relaxed">Your organization is currently on the high-performance Growth plan.</p>
                 
                 <div className="mt-8 pt-8 border-t border-[#1F2937] space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Next Billing</span>
                        <span className="font-bold">Next Month</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-bold text-blue-400">$99.00</span>
                    </div>
                 </div>

                 {data?.stripe_portal_url && (
                    <Button 
                      onClick={() => window.location.href = data.stripe_portal_url!}
                      variant="outline" 
                      className="w-full mt-8 border-[#1F2937] hover:bg-[#1F2937] text-gray-300"
                    >
                      <Settings className="h-4 w-4 mr-2" /> Manage Billing
                    </Button>
                 )}
               </CardContent>
            </Card>
          )}

          <Card className="bg-[#111827] border-[#1F2937] p-6">
             <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-500 mt-1" />
                <div>
                   <p className="text-sm font-bold">Billing Cycle</p>
                   <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                     Usage resets automatically on the 1st of every month at 00:00 UTC.
                   </p>
                </div>
             </div>
          </Card>
        </div>

      </div>

      <div className="pt-12 text-center">
         <p className="text-gray-500 text-xs">
           Need unlimited scale? <span className="text-blue-500 cursor-pointer hover:underline font-bold">Contact our enterprise sales team</span>.
         </p>
      </div>
    </div>
  );
}
