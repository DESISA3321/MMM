import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Camera,
  Search,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  CloudCheck,
  CloudUpload,
  Layers,
  Briefcase,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CURRENCIES } from '../../utils/currencies';
import { CurrencyCode, ViewMode } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenAddExpense: () => void;
  onOpenScanner: () => void;
  onOpenQuickNL: (initialText?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenAddExpense,
  onOpenScanner,
  onOpenQuickNL,
}) => {
  const {
    viewMode,
    setViewMode,
    currency,
    setCurrency,
    security,
    updateSecuritySettings,
    lockVault,
    isCloudSyncing,
    lastCloudBackup,
    triggerCloudBackup,
    searchQuery,
    setSearchQuery,
    activeTab,
  } = useExpense();

  const [nlInputText, setNlInputText] = useState('');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const handleNlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nlInputText.trim()) {
      onOpenQuickNL(nlInputText);
      setNlInputText('');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0D0D10]/90 backdrop-blur-md border-b border-[#1E1E24] text-zinc-100 px-3 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
        
        {/* Left Side: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            id="mobile-menu-toggle-btn"
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-[#18181F] lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/40 text-white font-bold text-sm border border-emerald-400/20">
              <span className="tracking-tighter">MM</span>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-zinc-100 tracking-tight">My Money Manager</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Natural Language Quick-Add Bar / Global Search */}
        <div className="flex-1 max-w-xl hidden md:block">
          <form onSubmit={handleNlSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              id="header-nl-quick-input"
              type="text"
              value={nlInputText}
              onChange={(e) => setNlInputText(e.target.value)}
              placeholder='Log via AI (e.g. "Spent $45 on lunch at Chipotle") or press Enter...'
              className="w-full pl-9 pr-20 py-1.5 text-xs bg-[#0A0A0B]/80 border border-[#22222A] focus:border-emerald-500 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!nlInputText.trim()}
              className="absolute inset-y-1 right-1 px-2.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-lg transition-all"
            >
              Parse
            </button>
          </form>
        </div>

        {/* Right Side: View Mode Toggles, Currency Selector, Cloud Sync, & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* View Toggles (Regular | All | Projects) */}
          <div className="hidden xl:flex items-center bg-[#0A0A0B] p-0.5 rounded-lg border border-[#1E1E24] text-xs font-medium text-zinc-400">
            <button
              id="view-toggle-all"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'all'
                  ? 'bg-[#18181F] text-white font-semibold shadow-xs border border-[#262630]'
                  : 'hover:text-zinc-200'
              }`}
            >
              All
            </button>
            <button
              id="view-toggle-regular"
              onClick={() => setViewMode('regular')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewMode === 'regular'
                  ? 'bg-[#18181F] text-white font-semibold shadow-xs border border-[#262630]'
                  : 'hover:text-zinc-200'
              }`}
            >
              Regular
            </button>
            <button
              id="view-toggle-projects"
              onClick={() => setViewMode('projects')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                viewMode === 'projects'
                  ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800/40 shadow-xs'
                  : 'hover:text-zinc-200'
              }`}
            >
              <Briefcase className="w-3 h-3 text-emerald-400" />
              <span>Projects</span>
            </button>
          </div>

          {/* Currency Switcher */}
          <div className="relative">
            <button
              id="currency-selector-btn"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#141418] hover:bg-[#1A1A20] border border-[#24242E] rounded-lg text-xs font-medium text-zinc-200 transition"
              title="Change active display currency"
            >
              <span className="font-semibold text-emerald-400">{CURRENCIES[currency]?.symbol || '$'}</span>
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showCurrencyDropdown && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#121216] border border-[#22222A] shadow-2xl py-1 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-zinc-500 tracking-wider border-b border-[#1E1E24]">
                  Select Currency
                </div>
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((cCode) => (
                  <button
                    key={cCode}
                    onClick={() => {
                      setCurrency(cCode);
                      setShowCurrencyDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#181820] transition ${
                      currency === cCode ? 'bg-[#181820] text-emerald-400 font-bold' : 'text-zinc-300'
                    }`}
                  >
                    <span>{CURRENCIES[cCode].name}</span>
                    <span className="font-mono text-zinc-400 font-bold">{CURRENCIES[cCode].symbol} {cCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Toggle (Hide / Show balances) */}
          <button
            id="privacy-mode-toggle-btn"
            onClick={() => updateSecuritySettings({ privacyMode: !security.privacyMode })}
            className={`p-1.5 rounded-lg border transition ${
              security.privacyMode
                ? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                : 'bg-[#141418] border-[#24242E] text-zinc-400 hover:text-zinc-200'
            }`}
            title={security.privacyMode ? 'Privacy Mode Active (Amounts Hidden)' : 'Hide Sensitive Financial Amounts'}
          >
            {security.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Cloud Sync Button */}
          <button
            id="cloud-backup-sync-btn"
            onClick={() => triggerCloudBackup()}
            disabled={isCloudSyncing}
            className="p-1.5 rounded-lg bg-[#141418] hover:bg-[#1A1A20] border border-[#24242E] text-zinc-300 transition"
            title={isCloudSyncing ? 'Backing up data to cloud...' : `Encrypted Cloud Sync (Last: ${lastCloudBackup ? new Date(lastCloudBackup).toLocaleTimeString() : 'Never'})`}
          >
            <CloudUpload className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin text-emerald-400' : 'text-zinc-400 hover:text-emerald-400'}`} />
          </button>

          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Receipt Scanner Quick Button */}
          <button
            id="header-scan-receipt-btn"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141418] hover:bg-[#1A1A20] border border-[#24242E] text-zinc-200 text-xs font-medium transition cursor-pointer shadow-xs"
            title="Scan Receipt with Camera or Upload"
          >
            <Camera className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Scan</span>
          </button>

          {/* Add Expense Main Button */}
          <button
            id="header-add-expense-btn"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/50 transition cursor-pointer border border-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

        </div>
      </div>
    </header>
  );
};
