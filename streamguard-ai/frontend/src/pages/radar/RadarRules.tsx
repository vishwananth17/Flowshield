import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sliders,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  Shield,
  HelpCircle,
  Clock,
  Trash2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Search,
  Code
} from 'lucide-react';
import { toast } from 'sonner';

interface RadarRule {
  id: string;
  action: 'block' | 'review' | '3ds' | 'allow';
  predicate: string;
  category: string;
  isBuiltIn: boolean;
  enabled: boolean;
  triggeredPast30d: number;
  volumeProtected: string;
}

export default function RadarRules() {
  const [activeTab, setActiveTab] = useState<'all' | 'block' | 'review' | '3ds' | 'allow'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // New Rule Drafting State
  const [newRuleAction, setNewRuleAction] = useState<'block' | 'review' | '3ds' | 'allow'>('block');
  const [newRulePredicate, setNewRulePredicate] = useState("Block if :risk_level: = 'highest' or :is_anonymous_ip: = 'true'");

  // Simulation Running State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationRan, setSimulationRan] = useState(false);

  const [rules, setRules] = useState<RadarRule[]>([
    // Block Rules
    {
      id: 'rule_blk_1',
      action: 'block',
      predicate: "Block if :risk_level: = 'highest'",
      category: 'Machine Learning',
      isBuiltIn: true,
      enabled: true,
      triggeredPast30d: 142,
      volumeProtected: '₹1,248,000',
    },
    {
      id: 'rule_blk_2',
      action: 'block',
      predicate: "Block if :ip_country: != :card_country: and :amount_in_inr: > 25000",
      category: 'Geolocation & Value',
      isBuiltIn: false,
      enabled: true,
      triggeredPast30d: 89,
      volumeProtected: '₹892,500',
    },
    {
      id: 'rule_blk_3',
      action: 'block',
      predicate: "Block if :is_anonymous_ip: = 'true' and :cvc_check: = 'failed'",
      category: 'Network & CVC',
      isBuiltIn: false,
      enabled: true,
      triggeredPast30d: 58,
      volumeProtected: '₹410,000',
    },
    // Review Rules
    {
      id: 'rule_rev_1',
      action: 'review',
      predicate: "Review if :risk_level: = 'elevated'",
      category: 'Machine Learning',
      isBuiltIn: true,
      enabled: true,
      triggeredPast30d: 64,
      volumeProtected: '₹412,000',
    },
    {
      id: 'rule_rev_2',
      action: 'review',
      predicate: "Review if :customer_velocity_1h: > 5",
      category: 'Velocity Burst',
      isBuiltIn: false,
      enabled: true,
      triggeredPast30d: 31,
      volumeProtected: '₹188,000',
    },
    // 3D Secure Rules
    {
      id: 'rule_3ds_1',
      action: '3ds',
      predicate: "Request 3DS if :is_3d_secure_recommended: = 'true'",
      category: 'Card Networks',
      isBuiltIn: true,
      enabled: true,
      triggeredPast30d: 420,
      volumeProtected: '₹3,610,000',
    },
    {
      id: 'rule_3ds_2',
      action: '3ds',
      predicate: "Request 3DS if :amount_in_inr: > 10000 and :has_previous_dispute: = 'false'",
      category: 'High Value Threshold',
      isBuiltIn: false,
      enabled: true,
      triggeredPast30d: 185,
      volumeProtected: '₹1,850,000',
    },
    // Allow Rules
    {
      id: 'rule_alw_1',
      action: 'allow',
      predicate: "Allow if :card_fingerprint: in @corporate_vip_allowlist",
      category: 'Allowlist Match',
      isBuiltIn: false,
      enabled: true,
      triggeredPast30d: 94,
      volumeProtected: '₹940,000',
    },
  ]);

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    toast.info('Rule status updated in Radar engine');
  };

  const handleCreateRule = () => {
    const created: RadarRule = {
      id: `rule_usr_${Date.now()}`,
      action: newRuleAction,
      predicate: newRulePredicate,
      category: 'Custom Merchant Rule',
      isBuiltIn: false,
      enabled: true,
      triggeredPast30d: 0,
      volumeProtected: '₹0',
    };
    setRules([created, ...rules]);
    setIsCreateModalOpen(false);
    toast.success('New Radar rule deployed successfully to production');
  };

  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationRan(true);
    }, 1200);
  };

  const filteredRules = rules.filter((r) => activeTab === 'all' || r.action === activeTab);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E3E8EE] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1F36]">Radar Rules</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#EEF2FF] text-[#635BFF] border border-[#C7D2FE]">
              {rules.filter((r) => r.enabled).length} ACTIVE RULES
            </span>
          </div>
          <p className="text-sm text-[#4F566B] mt-1">
            Control payment outcomes using custom logic, fraud attributes, and real-time velocity signals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setNewRulePredicate("Block if :ip_country: != :card_country: and :amount_in_inr: > 20000");
              setIsSimulatorOpen(true);
              runSimulation();
            }}
            className="text-xs gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-[#635BFF]" />
            <span>Test Past Transactions</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#635BFF] hover:bg-[#4F46E5] text-white text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </Button>
        </div>
      </div>

      {/* Action Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E3E8EE]">
        {[
          { key: 'all', label: 'All Rules', count: rules.length },
          { key: 'block', label: 'Block Rules', count: rules.filter((r) => r.action === 'block').length },
          { key: 'review', label: 'Review Rules', count: rules.filter((r) => r.action === 'review').length },
          { key: '3ds', label: '3D Secure Rules', count: rules.filter((r) => r.action === '3ds').length },
          { key: 'allow', label: 'Allow Rules', count: rules.filter((r) => r.action === 'allow').length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors select-none ${
              activeTab === tab.key
                ? 'border-[#635BFF] text-[#635BFF]'
                : 'border-transparent text-[#697386] hover:text-[#1A1F36]'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <Card variant="data" padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E3E8EE] text-[11px] font-semibold text-[#697386] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Rule Definition</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Triggered (30d)</th>
                <th className="px-4 py-3">Volume Protected</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E8EE] bg-white">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rule.action === 'block'
                          ? 'bg-[#FFD8D8] text-[#A8071A]'
                          : rule.action === 'review'
                          ? 'bg-[#FFECD1] text-[#8A6100]'
                          : rule.action === '3ds'
                          ? 'bg-[#EEF2FF] text-[#635BFF]'
                          : 'bg-[#CBF4C9] text-[#0E6245]'
                      }`}
                    >
                      {rule.action.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-mono text-xs font-semibold text-[#1A1F36]">
                      {rule.predicate}
                    </div>
                    {rule.isBuiltIn && (
                      <span className="text-[10px] text-[#697386] font-sans">
                        Stripe Default Machine Learning Rule
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-xs text-[#4F566B]">
                    {rule.category}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#1A1F36]">
                    {rule.triggeredPast30d}
                  </td>

                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#0E6245]">
                    {rule.volumeProtected}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        rule.enabled ? 'bg-[#635BFF]' : 'bg-[#CBD5E1]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rule Creator Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E3E8EE] overflow-hidden animate-in fade-in zoom-in-95 duration-fast">
            
            <div className="p-5 border-b border-[#E3E8EE] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A1F36]">Create Radar Rule</h3>
                <p className="text-xs text-[#697386]">Write custom evaluation logic evaluated before payment capture</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[#697386] hover:text-[#1A1F36]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#4F566B] block mb-1.5">Action</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['block', 'review', '3ds', 'allow'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setNewRuleAction(act)}
                      className={`h-8 rounded text-xs font-semibold uppercase border transition-all ${
                        newRuleAction === act
                          ? 'border-[#635BFF] bg-[#EEF2FF] text-[#635BFF]'
                          : 'border-[#E3E8EE] bg-white text-[#4F566B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#4F566B]">Rule Syntax</label>
                  <span className="text-[10px] text-[#635BFF] cursor-pointer hover:underline" onClick={() => setNewRulePredicate("Block if :risk_level: = 'highest'")}>
                    Use ML Default
                  </span>
                </div>
                <textarea
                  value={newRulePredicate}
                  onChange={(e) => setNewRulePredicate(e.target.value)}
                  rows={3}
                  className="w-full p-3 font-mono text-xs rounded bg-[#F8FAFC] border border-[#E3E8EE] text-[#1A1F36] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#635BFF]/20"
                />
              </div>

              {/* Autocomplete suggestions strip */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-[#697386]">Available Attributes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[':risk_level:', ':card_country:', ':ip_country:', ':amount_in_inr:', ':cvc_check:', ':is_anonymous_ip:'].map((attr) => (
                    <button
                      key={attr}
                      type="button"
                      onClick={() => setNewRulePredicate((prev) => `${prev} and ${attr}`)}
                      className="px-2 py-0.5 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[11px] font-mono text-[#4F566B]"
                    >
                      {attr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#E3E8EE] bg-[#F8FAFC] flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsSimulatorOpen(true);
                  runSimulation();
                }}
                className="text-xs gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-[#635BFF]" />
                <span>Simulate First</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateRule} className="bg-[#635BFF] hover:bg-[#4F46E5] text-white text-xs">
                  Save & Enable Rule
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Rule Backtesting / Simulation Drawer */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E3E8EE] animate-in slide-in-from-right duration-fast">
            
            <div>
              <div className="p-5 border-b border-[#E3E8EE] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#635BFF]" />
                    <h3 className="text-base font-bold text-[#1A1F36]">Radar Rule Simulator</h3>
                  </div>
                  <p className="text-xs text-[#697386] mt-0.5">
                    Testing proposed rule against past 6 months of historical transactions (48,290 records)
                  </p>
                </div>
                <button onClick={() => setIsSimulatorOpen(false)} className="text-[#697386] hover:text-[#1A1F36]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Tested Predicate Card */}
                <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E3E8EE] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#697386]">Simulated Rule</span>
                  <div className="font-mono text-xs font-semibold text-[#1A1F36]">
                    {newRulePredicate}
                  </div>
                </div>

                {isSimulating ? (
                  <div className="p-12 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-[#635BFF] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#697386]">Re-running transaction history across 48,290 payments...</p>
                  </div>
                ) : simulationRan && (
                  <div className="space-y-6 animate-in fade-in duration-fast">
                    
                    {/* Key Simulation Impact Metrics */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
                        <span className="text-[11px] text-[#697386]">Payments Impacted</span>
                        <div className="text-xl font-bold text-[#1A1F36] mt-0.5">34</div>
                        <span className="text-[10px] text-[#697386]">0.07% of total</span>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
                        <span className="text-[11px] text-[#697386]">Estimated Blocked</span>
                        <div className="text-xl font-bold text-[#A8071A] mt-0.5">₹312,000</div>
                        <span className="text-[10px] text-[#0E6245] font-semibold">Fraud intercepted</span>
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-[#E3E8EE] shadow-sm">
                        <span className="text-[11px] text-[#697386]">Disputes Prevented</span>
                        <div className="text-xl font-bold text-[#0E6245] mt-0.5">8 Cases</div>
                        <span className="text-[10px] text-[#0E6245] font-semibold">100% saved</span>
                      </div>
                    </div>

                    {/* False Positive Guardrail */}
                    <div className="p-4 rounded-lg bg-[#CBF4C9]/40 border border-[#A3E7A0] flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#0E6245] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-[#0E6245]">Extremely Low False Positive Risk (&lt; 0.01%)</h4>
                        <p className="text-xs text-[#4F566B] mt-0.5 leading-relaxed">
                          This rule would not have blocked any of your recognized, repeat customers. It is safe to deploy to production.
                        </p>
                      </div>
                    </div>

                    {/* Sample Historical Charges Affected */}
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#697386]">
                        Historical Transactions Impacted (Past 6 Months)
                      </h4>

                      <div className="divide-y divide-[#E3E8EE] border border-[#E3E8EE] rounded-lg overflow-hidden text-xs">
                        <div className="p-3 bg-[#F8FAFC] flex justify-between font-semibold text-[#1A1F36]">
                          <span>ch_3N8a812eZvKY (₹28,500)</span>
                          <span className="text-[#A8071A]">Later disputed for fraud</span>
                        </div>
                        <div className="p-3 bg-white flex justify-between font-semibold text-[#1A1F36]">
                          <span>ch_3N7b991eZvKY (₹34,000)</span>
                          <span className="text-[#A8071A]">Later disputed for fraud</span>
                        </div>
                        <div className="p-3 bg-white flex justify-between font-semibold text-[#1A1F36]">
                          <span>ch_3N6c410eZvKY (₹21,200)</span>
                          <span className="text-[#A8071A]">Later disputed for fraud</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>

            <div className="p-5 border-t border-[#E3E8EE] bg-[#F8FAFC] flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setIsSimulatorOpen(false)} className="text-xs">
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleCreateRule();
                  setIsSimulatorOpen(false);
                }}
                className="bg-[#635BFF] hover:bg-[#4F46E5] text-white text-xs"
              >
                Deploy Tested Rule
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
