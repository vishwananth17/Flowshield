import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Activity, Shield, FileText, Zap, Key, Settings, Users, CreditCard, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  group: 'Transactions' | 'Pages' | 'Actions' | 'Documentation';
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTransaction?: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenTransaction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const allItems: CommandItem[] = [
    // Transactions
    {
      id: 'tx_1',
      title: 'TXN-10483 (₹98,500)',
      subtitle: 'CUS-8124 · Critical Risk (Score 92)',
      group: 'Transactions',
      shortcut: '↵',
      onSelect: () => {
        onClose();
        if (onOpenTransaction) onOpenTransaction('TXN-10483');
        else navigate('/dashboard/transactions');
      },
    },
    {
      id: 'tx_2',
      title: 'TXN-10482 (₹14,200)',
      subtitle: 'CUS-5510 · Moderate Risk (Score 48)',
      group: 'Transactions',
      shortcut: '↵',
      onSelect: () => {
        onClose();
        if (onOpenTransaction) onOpenTransaction('TXN-10482');
        else navigate('/dashboard/transactions');
      },
    },
    {
      id: 'tx_3',
      title: 'TXN-10481 (₹4,500)',
      subtitle: 'CUS-9912 · Low Risk (Score 12)',
      group: 'Transactions',
      shortcut: '↵',
      onSelect: () => {
        onClose();
        if (onOpenTransaction) onOpenTransaction('TXN-10481');
        else navigate('/dashboard/transactions');
      },
    },

    // Pages
    {
      id: 'pg_overview',
      title: 'Overview Dashboard',
      subtitle: 'Real-time telemetry and KPI metrics',
      group: 'Pages',
      shortcut: 'G O',
      onSelect: () => {
        onClose();
        navigate('/dashboard');
      },
    },
    {
      id: 'pg_transactions',
      title: 'Transactions Feed',
      subtitle: 'Live stream and historical transaction ledger',
      group: 'Pages',
      shortcut: 'G T',
      onSelect: () => {
        onClose();
        navigate('/dashboard/transactions');
      },
    },
    {
      id: 'pg_disputes',
      title: 'Disputes & Evidence Desk',
      subtitle: 'Manage active chargebacks and submit evidence packets',
      group: 'Pages',
      shortcut: 'G D',
      onSelect: () => {
        onClose();
        navigate('/dashboard/disputes');
      },
    },
    {
      id: 'pg_simulator',
      title: 'Attack Simulator',
      subtitle: 'Simulate high-velocity card testing attacks',
      group: 'Pages',
      shortcut: 'G S',
      onSelect: () => {
        onClose();
        navigate('/dashboard/simulator');
      },
    },

    // Actions
    {
      id: 'act_export',
      title: 'Export 24h Transactions (CSV)',
      subtitle: 'Download complete ledger with risk scores',
      group: 'Actions',
      shortcut: '⌘ E',
      onSelect: () => {
        onClose();
        window.alert('Exporting transactions for last 24h...');
      },
    },
    {
      id: 'act_keys',
      title: 'Manage API Keys',
      subtitle: 'Generate and roll production keys',
      group: 'Actions',
      shortcut: '⌘ K',
      onSelect: () => {
        onClose();
        navigate('/dashboard/api-keys');
      },
    },

    // Documentation
    {
      id: 'doc_api',
      title: 'API Reference',
      subtitle: 'POST /v1/transactions/analyze endpoint docs',
      group: 'Documentation',
      onSelect: () => {
        onClose();
        navigate('/docs');
      },
    },
    {
      id: 'doc_rules',
      title: 'Rule Builder Documentation',
      subtitle: 'Custom velocity and heuristic expressions',
      group: 'Documentation',
      onSelect: () => {
        onClose();
        navigate('/docs');
      },
    },
  ];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query.toLowerCase())) ||
      item.group.toLowerCase().includes(query.toLowerCase())
  );

  // Group items
  const groups = ['Transactions', 'Pages', 'Actions', 'Documentation'] as const;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    inputRef.current?.focus();
    setSelectedIndex(0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-[560px] max-h-[480px] bg-[var(--surface-overlay)] border border-[var(--border-default)] rounded-[var(--radius-xl)] shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 h-[44px] border-b border-[var(--border-default)] bg-[var(--surface-page)]">
          <Search size={16} className="text-[var(--text-tertiary)] flex-shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search transactions, navigate..."
            className="w-full bg-transparent border-none text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] px-1.5 py-0.5 rounded border border-[var(--border-default)] select-none">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4 max-h-[430px]">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
              No matching transactions or commands found
            </div>
          ) : (
            groups.map((group) => {
              const groupItems = filteredItems.filter((i) => i.group === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="space-y-1">
                  <div className="px-3 text-[11px] font-semibold uppercase text-[var(--text-tertiary)] tracking-wider">
                    {group}
                  </div>
                  {groupItems.map((item) => {
                    const globalIdx = filteredItems.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] cursor-pointer text-[13px] transition-colors select-none',
                          isSelected
                            ? 'bg-[var(--brand-500)] text-white'
                            : 'hover:bg-[var(--surface-secondary)] text-[var(--text-primary)]'
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <div className={cn('font-medium truncate', isSelected ? 'text-white' : 'text-[var(--text-primary)]')}>
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className={cn('text-[11px] truncate', isSelected ? 'text-white/80' : 'text-[var(--text-tertiary)]')}>
                              {item.subtitle}
                            </div>
                          )}
                        </div>

                        {item.shortcut && (
                          <span
                            className={cn(
                              'text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0',
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[var(--surface-subtle)] text-[var(--text-tertiary)] border border-[var(--border-default)]'
                            )}
                          >
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
