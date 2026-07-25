import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Key, Building, Bell } from 'lucide-react';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';

export default function Settings() {
  const { organization } = useAuthStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left font-body">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-subtle)] pb-4 gap-4">
        <div>
          <Heading1>System Settings</Heading1>
          <Caption className="mt-1 block">Manage your global organization protocols and security layers.</Caption>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Organization Config */}
        <Card variant="default">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
            <Heading3 className="text-white flex items-center">
              <Building className="w-4 h-4 mr-2 text-[var(--text-gold)]" /> Organization Profile
            </Heading3>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <Label className="block text-[var(--text-muted)]">Entity Name</Label>
                <p className="text-lg font-bold text-white">{organization?.name || 'Loading...'}</p>
              </div>
              <div className="space-y-1">
                <Label className="block text-[var(--text-muted)]">Active Plan</Label>
                <div className="mt-1">
                  <Badge variant="gold">
                    {(organization?.plan || 'Free').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Update Identity
            </Button>
          </div>
        </Card>

        {/* Security Controls */}
        <Card variant="default">
          <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
            <Heading3 className="text-white flex items-center">
              <Shield className="w-4 h-4 mr-2 text-[var(--text-gold)]" /> Security Handshake
            </Heading3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[var(--bg-inset)] rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded">
                  <Key className="w-4 h-4 text-[var(--text-gold)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">API Access Control</p>
                  <Caption>Rotate master keys and manage scope levels.</Caption>
                </div>
              </div>
              <Button variant="ghost" size="sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-[var(--bg-inset)] rounded-[var(--radius-lg)] border border-[var(--border-default)]">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded">
                  <Bell className="w-4 h-4 text-[var(--text-gold)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Alert Protocols</p>
                  <Caption>Define routing for critical fraud notifications.</Caption>
                </div>
              </div>
              <Button variant="ghost" size="sm">Manage</Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-center pt-8">
        <p className="text-[var(--text-muted)] text-[10px] font-mono tracking-widest uppercase">Flowshield OS v2.4.0-production</p>
      </div>
    </div>
  );
}
