import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Mail, Globe, Users, Plus, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Analyst' | 'Developer';
  status: 'Active' | 'Pending';
  last_active: string;
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([
    {
      id: 'usr_1',
      name: 'Vishwananth B',
      email: 'bsvishwananth@gmail.com',
      role: 'Owner',
      status: 'Active',
      last_active: 'Just now',
    },
    {
      id: 'usr_2',
      name: 'Security Operations Lead',
      email: 'soc-lead@flowshield.ai',
      role: 'Analyst',
      status: 'Active',
      last_active: '12m ago',
    },
    {
      id: 'usr_3',
      name: 'Gateway Integration Engineer',
      email: 'dev@flowshield.ai',
      role: 'Developer',
      status: 'Active',
      last_active: '2h ago',
    }
  ]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Analyst' | 'Developer'>('Analyst');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setMembers(prev => [
      ...prev,
      {
        id: `usr_${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'Pending',
        last_active: 'Invited',
      }
    ]);
    toast.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="type-h1 text-text-primary">Team & Access Management</h1>
        <p className="type-sm text-text-secondary mt-0.5">
          Manage workspace members, role-based permission scopes, and audit logging.
        </p>
      </div>

      {/* Founder & Lead Architect Spotlight Card */}
      <Card variant="data" padding="md" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-100 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-sm bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-lg flex items-center justify-center">
              V
            </div>
            <div>
              <h2 className="type-h2 text-text-primary">Vishwananth B</h2>
              <p className="text-xs text-cyan-400 font-mono">Founder & CEO, Flowshield AI</p>
            </div>
          </div>
          <Badge variant="allow" size="sm">Workspace Owner</Badge>
        </div>

        <p className="type-sm text-text-secondary leading-relaxed max-w-3xl">
          Architected Flowshield AI to replace legacy rule-based payment fraud engines with real-time distributed machine learning ensembles capable of sub-43ms transaction evaluation across Indian and global commerce payment pipelines.
        </p>
      </Card>

      {/* Invite Member Card */}
      <Card variant="data" padding="md">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <h3 className="type-h3 text-text-primary">Invite Workspace Member</h3>
            <p className="type-sm text-text-tertiary">Send an invitation email to grant access</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6">
              <Input
                label="Work Email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-[13px] font-medium text-text-secondary select-none block mb-1.5">
                Role Scope
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                aria-label="Select role scope"
                className="h-10 w-full rounded bg-surface-200 border border-border-200 px-3 text-sm text-text-primary focus:outline-none focus:border-cyan-500"
              >
                <option value="Analyst">Analyst (Dispute Triage)</option>
                <option value="Developer">Developer (API Keys)</option>
                <option value="Admin">Admin (Full Access)</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                <Plus className="w-4 h-4" />
                <span>Send Invite</span>
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Members Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-border-100 flex items-center justify-between">
          <h3 className="type-label text-text-primary">Active Workspace Members ({members.length})</h3>
          <span className="text-xs font-mono text-text-tertiary">RBAC Permissions</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-semibold text-text-primary text-xs">
                  {m.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-text-secondary">
                  {m.email}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="font-mono font-semibold text-cyan-400">{m.role}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={m.status === 'Active' ? 'allow' : 'neutral'} size="sm">
                    {m.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs font-mono text-text-tertiary">
                  {m.last_active}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

    </div>
  );
}
