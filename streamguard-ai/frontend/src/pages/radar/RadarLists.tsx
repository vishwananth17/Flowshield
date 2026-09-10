import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ListFilter,
  Plus,
  Trash2,
  CheckCircle2,
  Ban,
  Shield,
  Search,
  Globe,
  CreditCard,
  Mail,
  Smartphone,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface ListItem {
  id: string;
  listType: 'block' | 'allow';
  itemType: 'card' | 'ip' | 'email' | 'upi';
  value: string;
  reason: string;
  addedBy: string;
  addedAt: string;
}

export default function RadarLists() {
  const [activeTab, setActiveTab] = useState<'block' | 'allow'>('block');
  const [itemTypeFilter, setItemTypeFilter] = useState<'all' | 'card' | 'ip' | 'email' | 'upi'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Item State
  const [newItemType, setNewItemType] = useState<'card' | 'ip' | 'email' | 'upi'>('card');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemReason, setNewItemReason] = useState('Card testing attack bot signature');

  const [items, setItems] = useState<ListItem[]>([
    {
      id: 'lst_1',
      listType: 'block',
      itemType: 'ip',
      value: '185.220.101.42',
      reason: 'Known Tor exit node used for automated card cracking',
      addedBy: 'Radar ML Automation',
      addedAt: 'Yesterday',
    },
    {
      id: 'lst_2',
      listType: 'block',
      itemType: 'card',
      value: 'card_fingerprint_w9k12j8h0',
      reason: 'Excessive dispute history across 3 merchant accounts',
      addedBy: 'Risk Operator (Vishwanath)',
      addedAt: '3 days ago',
    },
    {
      id: 'lst_3',
      listType: 'block',
      itemType: 'email',
      value: '*@tempmail-disposable.org',
      reason: 'Disposable temporary email domain frequently linked to chargebacks',
      addedBy: 'Risk Operator',
      addedAt: '1 week ago',
    },
    {
      id: 'lst_4',
      listType: 'block',
      itemType: 'upi',
      value: 'botrunner991@okaxis',
      reason: 'High velocity micro-payment test bot',
      addedBy: 'Risk Operator',
      addedAt: '2 weeks ago',
    },
    {
      id: 'lst_5',
      listType: 'allow',
      itemType: 'email',
      value: '*@tatamotors.com',
      reason: 'Verified Enterprise procurement partner',
      addedBy: 'Admin',
      addedAt: '1 month ago',
    },
    {
      id: 'lst_6',
      listType: 'allow',
      itemType: 'card',
      value: 'card_fingerprint_vip_44129',
      reason: 'Verified VIP corporate fleet account',
      addedBy: 'Admin',
      addedAt: '2 months ago',
    },
  ]);

  const handleAddItem = () => {
    if (!newItemValue) {
      toast.error('Please enter a value');
      return;
    }
    const item: ListItem = {
      id: `lst_${Date.now()}`,
      listType: activeTab,
      itemType: newItemType,
      value: newItemValue,
      reason: newItemReason,
      addedBy: 'Current Operator',
      addedAt: 'Just now',
    };
    setItems([item, ...items]);
    setIsAddModalOpen(false);
    setNewItemValue('');
    toast.success(`Entry added to ${activeTab === 'block' ? 'Blocklist' : 'Allowlist'}`);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    toast.info('Item removed from list');
  };

  const filteredItems = items
    .filter((i) => i.listType === activeTab)
    .filter((i) => itemTypeFilter === 'all' || i.itemType === itemTypeFilter);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E3E8EE] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1F36]">Radar Lists</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#EEF2FF] text-[#635BFF] border border-[#C7D2FE]">
              {items.length} ENTRIES
            </span>
          </div>
          <p className="text-sm text-[#4F566B] mt-1">
            Maintain custom allowlists and blocklists for card fingerprints, IPs, customer emails, and UPI VPAs.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#635BFF] hover:bg-[#4F46E5] text-white text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add to {activeTab === 'block' ? 'Blocklist' : 'Allowlist'}</span>
        </Button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#E3E8EE]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('block')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'block'
                ? 'border-[#A8071A] text-[#A8071A]'
                : 'border-transparent text-[#697386] hover:text-[#1A1F36]'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>Blocklist ({items.filter((i) => i.listType === 'block').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('allow')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'allow'
                ? 'border-[#0E6245] text-[#0E6245]'
                : 'border-transparent text-[#697386] hover:text-[#1A1F36]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Allowlist ({items.filter((i) => i.listType === 'allow').length})</span>
          </button>
        </div>

        {/* Filter by item type */}
        <div className="flex items-center gap-1">
          {(['all', 'card', 'ip', 'email', 'upi'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setItemTypeFilter(type)}
              className={`px-2.5 py-1 rounded text-xs capitalize ${
                itemTypeFilter === type
                  ? 'bg-[#E2E8F0] text-[#1A1F36] font-bold'
                  : 'text-[#697386] hover:text-[#1A1F36]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* List Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#697386]">
            No entries found in this list. Click "Add" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E3E8EE] text-[11px] font-semibold text-[#697386] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Added By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8EE] bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-[#4F566B]">
                        {item.itemType === 'ip' && <Globe className="w-3.5 h-3.5 text-[#635BFF]" />}
                        {item.itemType === 'card' && <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />}
                        {item.itemType === 'email' && <Mail className="w-3.5 h-3.5 text-[#635BFF]" />}
                        {item.itemType === 'upi' && <Smartphone className="w-3.5 h-3.5 text-[#635BFF]" />}
                        <span>{item.itemType}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#1A1F36]">
                      {item.value}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-[#4F566B]">
                      {item.reason}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-[#697386]">
                      {item.addedBy}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-[#697386]">
                      {item.addedAt}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-[#697386] hover:text-[#A8071A] p-1 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-[#E3E8EE] overflow-hidden animate-in fade-in zoom-in-95 duration-fast">
            
            <div className="p-5 border-b border-[#E3E8EE] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1A1F36]">
                Add to {activeTab === 'block' ? 'Blocklist' : 'Allowlist'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#697386] hover:text-[#1A1F36]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#4F566B] block mb-1.5">Identifier Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['card', 'ip', 'email', 'upi'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewItemType(t)}
                      className={`h-8 rounded text-xs font-semibold uppercase border transition-all ${
                        newItemType === t
                          ? 'border-[#635BFF] bg-[#EEF2FF] text-[#635BFF]'
                          : 'border-[#E3E8EE] bg-white text-[#4F566B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4F566B] block mb-1.5">
                  {newItemType === 'ip' ? 'IP Address or Subnet (CIDR)' :
                   newItemType === 'email' ? 'Email or Wildcard Domain (*@domain.com)' :
                   newItemType === 'upi' ? 'UPI VPA Handle (e.g. user@okhdfcbank)' :
                   'Card Fingerprint or BIN'}
                </label>
                <input
                  type="text"
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                  placeholder={
                    newItemType === 'ip' ? '185.220.101.0/24' :
                    newItemType === 'email' ? '*@fraudulent-domain.xyz' :
                    newItemType === 'upi' ? 'scammer@okaxis' :
                    '424242******4242'
                  }
                  className="w-full h-9 px-3 font-mono text-xs rounded bg-[#F8FAFC] border border-[#E3E8EE] text-[#1A1F36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#4F566B] block mb-1.5">Reason / Note</label>
                <input
                  type="text"
                  value={newItemReason}
                  onChange={(e) => setNewItemReason(e.target.value)}
                  placeholder="Why is this item being added?"
                  className="w-full h-9 px-3 text-xs rounded bg-[#F8FAFC] border border-[#E3E8EE] text-[#1A1F36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#E3E8EE] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddItem} className="bg-[#635BFF] hover:bg-[#4F46E5] text-white text-xs">
                Add Entry
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
