import { motion } from 'framer-motion';
import { User, Mail, Shield, Building2, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';

export default function Profile() {
  const { user, organization } = useAuthStore();

  const profileItems = [
    { label: 'Full Name', value: user?.full_name || 'N/A', icon: User },
    { label: 'Email Address', value: user?.email || 'N/A', icon: Mail },
    { label: 'Organization', value: organization?.name || 'Personal Workspace', icon: Building2 },
    { label: 'Role', value: user?.role === 'owner' ? 'Administrator' : 'Team Member', icon: Shield },
    { label: 'Member Since', value: user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'N/A', icon: Calendar },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 md:p-12 text-white">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold">Personal Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account identity and security preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 bg-[#111827] border-[#1F2937] flex flex-col items-center justify-center p-8 text-center h-fit">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)] mb-4">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2 className="text-xl font-bold">{user?.full_name || 'StreamGuard User'}</h2>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
          <div className="mt-6 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            {user?.role || 'User'}
          </div>
        </Card>

        <Card className="md:col-span-2 bg-[#111827] border-[#1F2937]">
          <CardHeader className="border-b border-[#1F2937]">
            <CardTitle className="text-lg">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {profileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start space-x-4">
                    <div className="p-2 rounded-lg bg-[#1F2937] text-gray-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{item.label}</p>
                      <p className="text-base text-gray-200 mt-1">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

