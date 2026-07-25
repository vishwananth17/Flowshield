import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Heading1, Heading3, Label, Caption } from '@/components/ui/Typography';
import { Key, Copy } from 'lucide-react';
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

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data);
    } catch (e) {
      console.error(e);
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
      toast.success('Encryption node generated successfully');
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error?.message || 'Failed to generate key');
    }
  };

  const handleRevoke = async (id: string) => {
    const confirmRevoke = window.confirm("Are you sure? This will immediately disconnect any systems using this key.");
    if (!confirmRevoke) return;
    
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
      toast.success('Key access revoked permanently');
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error?.message || 'Revocation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left font-body">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Heading1>API Credentials</Heading1>
          <Caption className="mt-1 block">Manage secret keys for authenticating with the Flowshield AI API.</Caption>
        </div>
      </div>

      {createdKey && (
        <Card variant="gold" className="space-y-4">
          <Heading3 className="text-white">Key Generated Successfully</Heading3>
          <Caption className="font-mono text-[var(--text-gold)] block">Please copy this key now. You will not be able to view it again.</Caption>
          <div className="flex items-center space-x-3">
            <code className="bg-[var(--bg-inset)] border border-[var(--border-default)] px-3 py-2.5 rounded text-xs select-all font-mono flex-1 text-white">
              {createdKey}
            </code>
            <Button 
              variant="primary" 
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
                toast.success('API Key copied to clipboard');
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCreatedKey(null)}>
            I have saved the key securely
          </Button>
        </Card>
      )}

      <Card variant="default">
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
          <span className="text-white text-sm font-bold">Generate New Key</span>
        </div>
        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-grow w-full">
            <Input
              label="Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Web Backend"
              required
            />
          </div>
          <div className="w-full sm:w-44 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)]">Environment</label>
            <select 
              value={newEnv} 
              onChange={(e) => setNewEnv(e.target.value)}
              className="w-full h-11 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] px-3 py-2 outline-none focus:border-[var(--color-primary)] transition-colors font-mono"
            >
              <option value="live">Live</option>
              <option value="test">Test</option>
            </select>
          </div>
          <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto">
            Generate Key
          </Button>
        </form>
      </Card>

      <Card variant="default">
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-inset)] py-3 px-5 -mx-6 -mt-6 mb-6">
          <span className="text-white text-sm font-bold">Active API Keys</span>
        </div>
        {loading ? (
          <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">Loading key registry...</div>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)] font-mono text-xs">No active keys found. Generate one above.</div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 rounded bg-[var(--bg-inset)] border border-[var(--border-default)]">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded">
                    <Key className="h-4 w-4 text-[var(--text-gold)]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-xs text-white">{key.name}</p>
                      <Badge variant="outline">
                        {key.environment.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-1">{key.key_prefix}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right font-mono">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">Last Used</p>
                    <p className="text-xs text-[var(--text-secondary)]">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleRevoke(key.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
