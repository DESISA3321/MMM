import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  BarChart3,
  Bot,
  Camera,
  FileSpreadsheet,
  Briefcase,
  Repeat,
  Tags,
  Wallet,
  ShieldCheck,
  Settings,
  X,
  Sparkles,
  Zap,
  SmartphoneNfc,
} from 'lucide-react';
import { ActiveTab } from '../../types';
import { useExpense } from '../../context/ExpenseContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, transactions, recurring, projects } = useExpense();

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    aiPowered?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard & Overview', icon: LayoutDashboard },
    {
      id: 'transactions',
      label: 'Transactions History',
      icon: ReceiptText,
      badge: transactions.length,
    },
    {
      id: 'auto-tracker',
      label: 'Auto GPay & SMS Tracker',
      icon: SmartphoneNfc,
      badge: 'AUTO',
      aiPowered: true,
    },
    { id: 'analytics', label: 'Smart Analytics', icon: BarChart3 },
    {
      id: 'ai-assistant',
      label: 'AI Spending Copilot',
      icon: Bot,
      aiPowered: true,
      badge: 'AI',
    },
    {
      id: 'scanner',
      label: 'Receipt Scanner',
      icon: Camera,
      badge: 'OCR',
    },
    {
      id: 'statement-import',
      label: 'PDF & Statement Import',
      icon: FileSpreadsheet,
    },
    {
      id: 'projects',
      label: 'Project Tracking',
      icon: Briefcase,
      badge: projects.length,
    },
    {
      id: 'recurring',
      label: 'Recurring & Subscriptions',
      icon: Repeat,
      badge: recurring.length,
    },
    { id: 'categories', label: 'Categories & Rules', icon: Tags },
    { id: 'accounts', label: 'Accounts & Wallets', icon: Wallet },
    { id: 'security', label: 'Security & Encryption', icon: ShieldCheck },
    { id: 'settings', label: 'Customization & Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer / Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0D0D10] border-r border-[#1E1E24] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1E1E24] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-950/60 border border-emerald-400/20">
              MM
            </div>
            <div>
              <span className="font-bold text-sm text-zinc-100 tracking-tight block">My Money Manager</span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-medium">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Smart Income & Expenses
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#18181F] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
            Core Navigation
          </div>

          {navItems.slice(0, 7).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/60 border border-emerald-500/30'
                    : 'text-zinc-400 hover:bg-[#16161C] hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : item.aiPowered ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive
                        ? 'bg-emerald-700/80 text-emerald-100'
                        : item.aiPowered
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#18181F] text-zinc-400 border border-[#24242E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 pb-2 px-3 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
            Organization & Tools
          </div>

          {navItems.slice(7).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/60 border border-emerald-500/30'
                    : 'text-zinc-400 hover:bg-[#16161C] hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? 'bg-emerald-700/80 text-emerald-100' : 'bg-[#18181F] text-zinc-400 border border-[#24242E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ClearSpends Auto-Categorization & Privacy Badge at Bottom */}
        <div className="p-3 border-t border-[#1E1E24] shrink-0 bg-[#0A0A0B]/60">
          <div className="p-2.5 rounded-xl bg-[#121216] border border-[#22222A] text-[11px] text-zinc-300 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between font-semibold text-white">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>ClearSpends AI</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">ACTIVE</span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight">
              Zero-knowledge client encryption & auto-categorization enabled.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
