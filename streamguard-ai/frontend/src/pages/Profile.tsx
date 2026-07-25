import { motion } from 'framer-motion';
import { User, Mail, Shield, Building2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { format } from 'date-fns';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';

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
    <div className="max-w-4xl mx-auto space-y-8 text-left font-body">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Heading1>Personal Profile</Heading1>
        <Caption className="mt-1 block">Manage your account identity and security preferences.</Caption>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card variant="default" className="md:col-span-1 flex flex-col items-center justify-center p-8 text-center h-fit">
          <div className="h-24 w-24 rounded-full bg-gradient-gold text-[var(--text-inverse)] flex items-center justify-center text-3xl font-bold shadow-[var(--shadow-gold)] mb-4">
            {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h2 className="text-xl font-bold text-white">{user?.full_name || 'StreamGuard User'}</h2>
          <Caption className="mt-1 block">{user?.email}</Caption>
          <div className="mt-6 px-4 py-1.5 rounded-full bg-[var(--color-primary-muted)] border border-[var(--color-primary-border)] text-[var(--text-gold)] text-xs font-bold uppercase tracking-wider">
            {user?.role || 'User'}
          </div>
        </Card>

        <Card variant="default" className="md:col-span-2">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
            <Heading3 className="text-white">Account Details</Heading3>
          </div>
          <div className="space-y-6">
            {profileItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start space-x-4">
                  <div className="p-2 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-gold)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Label className="block text-[var(--text-muted)]">{item.label}</Label>
                    <p className="text-base text-gray-200 mt-1">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
