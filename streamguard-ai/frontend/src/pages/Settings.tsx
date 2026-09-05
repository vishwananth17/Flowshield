import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Key, Building, Bell, Lock, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { organization, user } = useAuthStore();
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourstore.com/webhooks/flowshield');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('System preferences and webhook endpoint saved');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="type-h1 text-text-primary">System & Security Settings</h1>
        <p className="type-sm text-text-secondary mt-0.5">
          Configure organization identity, outbound fraud webhooks, and security access policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Organization Profile Card */}
        <Card variant="data" padding="md" className="space-y-4">
          <div className="border-b border-border-100 pb-3">
            <h3 className="type-h3 text-text-primary">Organization Profile</h3>
            <p className="type-sm text-text-tertiary">Workspace identity and billing metadata</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Entity Name"
              defaultValue={organization?.name || 'Production Workspace'}
              required
            />
            <Input
              label="Primary Admin Email"
              defaultValue={user?.email || 'admin@flowshield.ai'}
              disabled
            />
          </div>
        </Card>

        {/* Real-time Alert Webhook Config */}
        <Card variant="data" padding="md" className="space-y-4">
          <div className="border-b border-border-100 pb-3">
            <h3 className="type-h3 text-text-primary">Outbound Alert Webhook</h3>
            <p className="type-sm text-text-tertiary">Receive instant HTTP POST payloads when critical (P1) anomalies trigger</p>
          </div>

          <div className="space-y-3">
            <Input
              label="Endpoint URL"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.domain.com/flowshield-webhook"
            />
            <p className="text-[11px] font-mono text-text-tertiary">
              Payloads signed with SHA-256 HMAC key using header <code className="text-cyan-400">X-Flowshield-Signature</code>
            </p>
          </div>
        </Card>

        {/* Security & Access Policies */}
        <Card variant="data" padding="md" className="space-y-4">
          <div className="border-b border-border-100 pb-3">
            <h3 className="type-h3 text-text-primary">Security & Compliance</h3>
            <p className="type-sm text-text-tertiary">Enforce zero-trust policies for all workspace operators</p>
          </div>

          <div className="divide-y divide-border-100 text-xs">
            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary block">Two-Factor Authentication (2FA)</span>
                <span className="text-text-tertiary">Mandatory TOTP authenticator prompt on login</span>
              </div>
              <Badge variant="allow" size="sm">ENFORCED</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary block">DPDP Act 2023 Telemetry Anonymization</span>
                <span className="text-text-tertiary">Mask customer PII in analytics logs after 90 days</span>
              </div>
              <Badge variant="allow" size="sm">ENABLED</Badge>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary block">IP Whitelisting for API Dispatch</span>
                <span className="text-text-tertiary">Restrict evaluate calls to trusted server CIDRs</span>
              </div>
              <Badge variant="neutral" size="sm">DISABLED</Badge>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            <span>Save Settings</span>
          </Button>
        </div>

      </form>

    </div>
  );
}
