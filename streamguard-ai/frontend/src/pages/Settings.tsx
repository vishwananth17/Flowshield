import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Key, Mail, Building, Bell } from 'lucide-react';

export default function Settings() {
  const { organization } = useAuthStore();

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight font-display">System <span className="text-blue-500">Settings</span></h1>
          <p className="text-slate-400 mt-2">Manage your global organization protocols and security layers.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Organization Config */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center">
              <Building className="w-4 h-4 mr-3 text-blue-500" /> Organization Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity Name</p>
                  <p className="text-lg font-bold">{organization?.name || 'Loading...'}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Plan</p>
                  <p className="text-lg font-bold text-blue-500 uppercase">{organization?.plan || 'Free'}</p>
               </div>
            </div>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold px-6 h-10">
                Update Identity
            </Button>
          </CardContent>
        </Card>

        {/* Security Controls */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center">
              <Shield className="w-4 h-4 mr-3 text-emerald-500" /> Security Handshake
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Key className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">API Access Control</p>
                        <p className="text-xs text-slate-500">Rotate master keys and manage scope levels.</p>
                    </div>
                </div>
                <Button variant="ghost" className="text-blue-500 hover:text-blue-400 font-bold text-xs">Configure</Button>
             </div>
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Bell className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Alert Protocols</p>
                        <p className="text-xs text-slate-500">Define routing for critical fraud notifications.</p>
                    </div>
                </div>
                <Button variant="ghost" className="text-emerald-500 hover:text-emerald-400 font-bold text-xs">Manage</Button>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center pt-8">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Flowshield OS v2.4.0-production</p>
      </div>
    </div>
  );
}
