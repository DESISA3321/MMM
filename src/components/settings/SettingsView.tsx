import React from 'react';
import {
  Settings,
  Sliders,
  DollarSign,
  Palette,
  Layout,
  Smartphone,
  Info,
  Sparkles,
  Check,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CURRENCIES, CurrencyCode } from '../../utils/currencies';
import { PWAInstallButton } from '../common/PWAInstallButton';

export const SettingsView: React.FC = () => {
  const {
    currency,
    setCurrency,
    appSettings,
    updateAppSettings,
  } = useExpense();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-[#0D0D10] p-4 sm:p-5 rounded-2xl border border-[#1E1E24] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#181820] text-zinc-200 border border-[#262632] flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <span>Application Settings & Customization</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Customize currency defaults, visual interface preferences, and PWA capabilities.
        </p>
      </div>

      {/* Primary Currency Section */}
      <div className="bg-[#111115] rounded-2xl p-6 border border-[#202028] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Default Display Currency</h2>
        </div>
        <p className="text-xs text-zinc-400">
          All multi-currency transactions will automatically be converted to this currency in summaries and charts.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
            const isSelected = currency === code;
            return (
              <button
                key={code}
                onClick={() => {
                  setCurrency(code);
                  updateAppSettings({ defaultCurrency: code });
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-xs'
                    : 'bg-[#0A0A0D] border-[#202028] text-zinc-300 hover:border-[#2E2E3C]'
                }`}
              >
                <div>
                  <span className="font-bold text-xs block">{code}</span>
                  <span className="text-[10px] text-zinc-400">{CURRENCIES[code].name}</span>
                </div>
                <span className="font-mono font-bold text-emerald-400">{CURRENCIES[code].symbol}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual & Interface Preferences */}
      <div className="bg-[#111115] rounded-2xl p-6 border border-[#202028] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-white">Interface & AI Features</h2>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0A0A0D] border border-[#1E1E26] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Show ClearSpends AI Badges</span>
              <span className="text-zinc-400 text-[11px]">Display AI tag on auto-categorized records</span>
            </div>
            <input
              type="checkbox"
              checked={appSettings.showAiBadges}
              onChange={(e) => updateAppSettings({ showAiBadges: e.target.checked })}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#0A0A0D] border border-[#1E1E26] flex items-center justify-between">
            <div>
              <span className="font-semibold text-white block">Compact Ledger Mode</span>
              <span className="text-zinc-400 text-[11px]">Reduce row padding for dense transaction viewing</span>
            </div>
            <input
              type="checkbox"
              checked={appSettings.compactMode}
              onChange={(e) => updateAppSettings({ compactMode: e.target.checked })}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* PWA & Platform Installation */}
      <div className="bg-[#111115] rounded-2xl p-6 border border-[#202028] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-teal-400" />
            <h2 className="text-sm font-bold text-white">Progressive Web App (PWA)</h2>
          </div>
          <PWAInstallButton />
        </div>

        <p className="text-xs text-zinc-400">
          ClearSpends is fully installable on iOS, Android, macOS, and Windows. It operates with offline persistence and client-side encryption.
        </p>

        <div className="p-4 rounded-xl bg-[#0A0A0D] border border-[#1E1E26] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Check className="w-4 h-4" />
            <span>Offline-first Service Worker Active</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Check className="w-4 h-4" />
            <span>Real-time LocalStorage + Cloud Sync</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Check className="w-4 h-4" />
            <span>Zero-dependency native camera OCR</span>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="p-4 rounded-2xl bg-[#0D0D10] border border-[#1E1E24] text-[11px] text-zinc-500 flex items-center justify-between">
        <span>ClearSpends Expense Engine v2.5.0</span>
        <span>Powered by Gemini 2.5 Flash</span>
      </div>

    </div>
  );
};
