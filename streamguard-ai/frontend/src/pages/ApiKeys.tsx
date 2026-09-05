import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Key, Copy, Check, Trash2, Code, Terminal, Shield, Plus } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  environment: string;
  created_at: string;
  last_used_at: string | null;
  monthly_requests: number;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [newEnv, setNewEnv] = useState('live');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data);
    } catch (e) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const res = await api.post('/api-keys', { name: newKeyName, environment: newEnv }, { timeout: 15000 });
      setCreatedKey(res.data.raw_key);
      setNewKeyName('');
      fetchKeys();
      toast.success('API key generated successfully');
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.response?.data?.error?.message || 'Failed to generate key';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleRevoke = async (id: string) => {
    const confirmRevoke = window.confirm("Are you sure? This will immediately reject any requests using this key.");
    if (!confirmRevoke) return;
    
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
      toast.success('API key revoked');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || 'Revocation failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success('Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-h1 text-text-primary">API Keys & Access Control</h1>
          <p className="type-sm text-text-secondary mt-0.5">
            Manage authentication tokens for server-side evaluation requests and webhook signatures.
          </p>
        </div>
      </div>

      {/* Reveal Modal / Banner on Creation */}
      {createdKey && (
        <Card variant="alert" padding="md" className="space-y-3 animate-in fade-in duration-fast">
          <div className="flex items-center justify-between">
            <span className="type-label text-status-allow font-bold">API Key Generated</span>
            <span className="text-xs text-text-tertiary">Save this key now. It will not be shown again.</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-surface-100 border border-border-100 rounded px-3 py-2 font-mono text-xs text-cyan-400 select-all truncate">
              {createdKey}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => copyToClipboard(createdKey)}
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          <Button
            variant="secondary"
            size="xs"
            onClick={() => setCreatedKey(null)}
          >
            I have stored this key securely
          </Button>
        </Card>
      )}

      {/* Key Generation Card */}
      <Card variant="data" padding="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <h3 className="type-h3 text-text-primary">Generate New Key</h3>
            <p className="type-sm text-text-tertiary">Create a scoped key for your backend services</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6">
              <Input
                label="Key Label"
                placeholder="e.g. Production Razorpay Webhook Worker"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[13px] font-medium text-text-secondary select-none block mb-1.5">
                Environment
              </label>
              <select
                value={newEnv}
                onChange={(e) => setNewEnv(e.target.value)}
                aria-label="Select environment"
                className="h-10 w-full rounded bg-surface-200 border border-border-200 px-3 text-sm text-text-primary focus:outline-none focus:border-cyan-500"
              >
                <option value="live">Live (Production)</option>
                <option value="test">Test (Sandbox)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                <Plus className="w-4 h-4" />
                <span>Create Key</span>
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Active Keys Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-100 flex items-center justify-between">
          <h3 className="type-label text-text-primary">Active Keys ({keys.length})</h3>
          <span className="text-xs font-mono text-text-tertiary">Bearer Authentication</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Requests (30d)</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-text-tertiary text-xs">
                  Loading keys...
                </TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-text-tertiary text-xs">
                  No active keys found. Generate a key above to get started.
                </TableCell>
              </TableRow>
            ) : (
              keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-semibold text-text-primary text-xs">
                    {k.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-cyan-400">
                    {k.key_prefix}••••••••
                  </TableCell>
                  <TableCell>
                    <Badge variant={k.environment === 'live' ? 'allow' : 'neutral'} size="sm">
                      {k.environment.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-secondary">
                    {(k.monthly_requests || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono text-text-tertiary">
                    {new Date(k.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleRevoke(k.id)}
                      className="text-text-tertiary hover:text-status-block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Quick Start Code Snippet */}
      <Card variant="data" padding="md" className="space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="type-label text-text-primary">Quick Integration Snippet</h3>
        </div>

        <div className="bg-surface-100 border border-border-100 rounded-sm p-4 font-mono text-xs text-text-secondary overflow-x-auto">
          <pre><code>{`curl -X POST https://api.flowshield.ai/v1/radar/evaluate \\
  -H "Authorization: Bearer sk_live_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2450.00,
    "currency": "INR",
    "customer_ip": "103.241.12.89",
    "payment_gateway": "razorpay"
  }'`}</code></pre>
        </div>
      </Card>

    </div>
  );
}
