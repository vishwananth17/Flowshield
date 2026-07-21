import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">API Keys</h1>
          <p className="text-zinc-400 text-xs mt-1">Manage secret keys for authenticating with the Flowshield AI API</p>
        </div>
      </div>

      {createdKey && (
        <div className="bg-zinc-950 border border-white text-white p-5 rounded-lg flex flex-col space-y-3">
          <strong className="text-sm font-bold uppercase tracking-wider">Key Generated Successfully</strong>
          <p className="text-xs text-zinc-400 font-mono">Please copy this key now. You will not be able to view it again.</p>
          <div className="flex items-center space-x-2">
            <code className="bg-black border border-zinc-800 px-3 py-2 rounded text-xs select-all font-mono flex-1 text-white">
              {createdKey}
            </code>
            <Button 
              variant="outline" 
              className="bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase"
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
                toast.success('API Key copied to clipboard');
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
          </div>
          <Button variant="outline" className="w-fit mt-1 border-zinc-800 text-zinc-400 hover:text-white text-xs" onClick={() => setCreatedKey(null)}>
            I have saved the key securely
          </Button>
        </div>
      )}

      <Card className="bg-zinc-950 border-zinc-800 rounded-lg">
        <CardHeader className="border-b border-zinc-800 bg-black py-3.5 px-5">
          <CardTitle className="text-white text-sm font-bold">Generate New Key</CardTitle>
          <CardDescription className="text-zinc-500 text-xs">Create an API key scoped to a specific environment</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-[10px] font-mono uppercase text-zinc-400">Key Name</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Web Backend"
                required
                className="bg-black border-zinc-800 text-white placeholder:text-zinc-600 text-xs h-10 rounded"
              />
            </div>
            <div className="w-full sm:w-44 space-y-1.5">
              <label className="text-[10px] font-mono uppercase text-zinc-400">Environment</label>
              <select 
                value={newEnv} 
                onChange={(e) => setNewEnv(e.target.value)}
                className="flex h-10 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="live">Live</option>
                <option value="test">Test</option>
              </select>
            </div>
            <Button type="submit" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider h-10 rounded">
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-950 border-zinc-800 rounded-lg">
        <CardHeader className="border-b border-zinc-800 bg-black py-3.5 px-5">
          <CardTitle className="text-white text-sm font-bold">Active API Keys</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="py-8 text-center text-zinc-500 font-mono text-xs">Loading key registry...</div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 font-mono text-xs">No active keys found. Generate one above.</div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 rounded bg-black border border-zinc-800">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-zinc-900 border border-zinc-800 rounded">
                      <Key className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-xs text-white">{key.name}</p>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {key.environment}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono mt-1">{key.key_prefix}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right font-mono">
                      <p className="text-[10px] text-zinc-500 uppercase">Last Used</p>
                      <p className="text-xs text-zinc-300">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRevoke(key.id)}
                      className="bg-black border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 text-xs font-mono font-bold uppercase"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
