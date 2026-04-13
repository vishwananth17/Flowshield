import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Copy } from 'lucide-react';
import api from '@/services/api';

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
      const res = await api.post('/api-keys', { name: newKeyName, environment: newEnv });
      setCreatedKey(res.data.raw_key);
      setNewKeyName('');
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">API Keys</h1>
          <p className="text-gray-400 mt-1">Manage keys for authenticating with the Flowshield AI API</p>
        </div>
      </div>

      {createdKey && (
        <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-500 p-4 rounded-lg flex flex-col space-y-2">
          <strong>Key Created Successfully!</strong>
          <p className="text-sm">Please copy this key now. You won't be able to see it again.</p>
          <div className="flex items-center space-x-2">
            <code className="bg-[#1F2937] px-3 py-2 rounded text-emerald-300 select-all font-mono flex-1">
              {createdKey}
            </code>
            <Button 
              variant="outline" 
              className="border-emerald-500 bg-emerald-500 text-emerald-900 hover:bg-emerald-400"
              onClick={() => {
                navigator.clipboard.writeText(createdKey);
                alert('API Key copied to clipboard!');
              }}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </div>
          <Button variant="outline" className="w-fit mt-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20" onClick={() => setCreatedKey(null)}>
            I have saved the key securely
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create new API key</CardTitle>
          <CardDescription>Generate a new key for a specific environment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-200">Key Name</label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Web Backend"
                required
              />
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium text-gray-200">Environment</label>
              <select 
                value={newEnv} 
                onChange={(e) => setNewEnv(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-[#374151] bg-[#1F2937] px-3 py-2 text-sm text-white"
              >
                <option value="live">Live</option>
                <option value="test">Test</option>
              </select>
            </div>
            <Button type="submit">Generate Key</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading keys...</div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No API keys found. Create one above.</div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div key={key.id} className="flex items-center justify-between p-4 rounded-lg border border-[#1F2937] bg-[#111827]">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-[#1F2937] rounded-full">
                      <Key className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-white">{key.name}</p>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${key.environment === 'live' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {key.environment}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 font-mono mt-1">{key.key_prefix}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Last Used</p>
                      <p className="text-sm text-gray-300">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleRevoke(key.id)}>
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
