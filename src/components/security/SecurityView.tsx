import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  CloudUpload,
  CloudDownload,
  Eye,
  EyeOff,
  Database,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { hashPasscode, exportEncryptedVault } from '../../utils/security';

export const SecurityView: React.FC = () => {
  const {
    security,
    updateSecuritySettings,
    isCloudSyncing,
    lastCloudBackup,
    triggerCloudBackup,
    restoreCloudBackup,
    resetAllDataToDefaults,
    lockVault,
  } = useExpense();

  const [passcodeInput, setPasscodeInput] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [passcodeMsg, setPasscodeMsg] = useState<string | null>(null);
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  const handleSetPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput.length < 4) {
      setPasscodeMsg('Passcode must be at least 4 digits.');
      return;
    }
    if (passcodeInput !== confirmPasscode) {
      setPasscodeMsg('Passcodes do not match.');
      return;
    }

    const hash = await hashPasscode(passcodeInput);
    updateSecuritySettings({
      isPasscodeEnabled: true,
      passcodeHash: hash,
    });
    setPasscodeMsg('PIN Passcode activated successfully.');
    setPasscodeInput('');
    setConfirmPasscode('');
  };

  const handleDisablePasscode = () => {
    updateSecuritySettings({
      isPasscodeEnabled: false,
      passcodeHash: undefined,
    });
    setPasscodeMsg('Passcode lock removed.');
  };

  const handleManualBackup = async () => {
    setCloudMsg('Syncing encrypted snapshot to cloud...');
    const ok = await triggerCloudBackup();
    if (ok) {
      setCloudMsg('Cloud backup completed & verified.');
    } else {
      setCloudMsg('Cloud sync failed or offline.');
    }
  };

  const handleManualRestore = async () => {
    setCloudMsg('Fetching encrypted backup...');
    const ok = await restoreCloudBackup();
    if (ok) {
      setCloudMsg('Backup retrieved successfully from cloud vault.');
    } else {
      setCloudMsg('No cloud backup found on server.');
    }
  };

  const handleExportVaultFile = () => {
    const rawData = {
      transactions: localStorage.getItem('clearspends_transactions'),
      categories: localStorage.getItem('clearspends_categories'),
      accounts: localStorage.getItem('clearspends_accounts'),
      projects: localStorage.getItem('clearspends_projects'),
      recurring: localStorage.getItem('clearspends_recurring'),
      exportedAt: new Date().toISOString(),
    };

    const encrypted = exportEncryptedVault(rawData);
    const blob = new Blob([encrypted], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearspends_encrypted_vault_${new Date().toISOString().split('T')[0]}.csbackup`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-[#0D0D10] p-4 sm:p-5 rounded-2xl border border-[#1E1E24] shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Security & Automatic Cloud Backups</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Zero-knowledge client-side encryption, app PIN locks, and automated backup vault.
        </p>
      </div>

      {/* Cloud Backup Section */}
      <div className="bg-[#111115] rounded-2xl p-6 border border-[#202028] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Automatic Encrypted Cloud Backups</h2>
              <p className="text-xs text-zinc-400">
                Last backup: {lastCloudBackup ? new Date(lastCloudBackup).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            {security.autoCloudBackup ? 'Auto-Sync Active' : 'Manual Mode'}
          </span>
        </div>

        {cloudMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{cloudMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleManualBackup}
            disabled={isCloudSyncing}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <CloudUpload className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>Backup Now</span>
          </button>

          <button
            onClick={handleManualRestore}
            disabled={isCloudSyncing}
            className="p-3 rounded-xl bg-[#181820] hover:bg-[#22222E] text-zinc-200 text-xs font-semibold border border-[#262632] flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <CloudDownload className="w-4 h-4 text-emerald-400" />
            <span>Restore from Cloud</span>
          </button>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-zinc-300">
          <span>Auto-sync when logging transactions</span>
          <input
            type="checkbox"
            checked={security.autoCloudBackup}
            onChange={(e) => updateSecuritySettings({ autoCloudBackup: e.target.checked })}
            className="w-4 h-4 accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* PIN Passcode Lock Section */}
      <div className="bg-[#111115] rounded-2xl p-6 border border-[#202028] shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Application PIN Lock</h2>
              <p className="text-xs text-zinc-400">
                Protect sensitive financial history from unauthorized viewing
              </p>
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              security.isPasscodeEnabled
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'bg-[#181820] text-zinc-400 border border-[#262632]'
            }`}
          >
            {security.isPasscodeEnabled ? 'Lock Enabled' : 'Disabled'}
          </span>
        </div>

        {passcodeMsg && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{passcodeMsg}</span>
          </div>
        )}

        {security.isPasscodeEnabled ? (
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#0A0A0D] border border-[#1E1E26] text-xs flex items-center justify-between">
              <span className="text-zinc-300">Passcode protection is currently active on this device.</span>
              <button
                onClick={lockVault}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Now</span>
              </button>
            </div>

            <button
              onClick={handleDisablePasscode}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
            >
              Turn Off Passcode Lock
            </button>
          </div>
        ) : (
          <form onSubmit={handleSetPasscode} className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Set 4-6 Digit Passcode</label>
                <input
                  type="password"
                  maxLength={6}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Confirm Passcode</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value)}
                  placeholder="Confirm PIN"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-mono focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!passcodeInput || !confirmPasscode}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition"
            >
              Enable Passcode Lock
            </button>
          </form>
        )}
      </div>

      {/* Privacy Mode & Encrypted File Export */}
      <div className="bg-[#111115] rounded-2xl p-6 border border-[#202028] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-white">Data Privacy & Vault Export</h2>

        <div className="p-3.5 rounded-xl bg-[#0A0A0D] border border-[#1E1E26] flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-white block">Screen Privacy Mode</span>
            <span className="text-zinc-400 text-[11px]">Obfuscate all balance numbers with asterisks</span>
          </div>
          <button
            onClick={() => updateSecuritySettings({ privacyMode: !security.privacyMode })}
            className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              security.privacyMode
                ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                : 'bg-[#181820] border-[#262632] text-zinc-300 hover:text-white'
            }`}
          >
            {security.privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{security.privacyMode ? 'Privacy On' : 'Privacy Off'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0A0A0D] border border-[#1E1E26] flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-white block">Download Encrypted Vault File</span>
            <span className="text-zinc-400 text-[11px]">Export AES-encrypted backup to offline storage</span>
          </div>
          <button
            onClick={handleExportVaultFile}
            className="px-3 py-1.5 bg-[#181820] hover:bg-[#22222E] text-zinc-200 border border-[#262632] rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export File</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-950/15 rounded-2xl p-6 border border-rose-900/30 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 text-sm font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>Reset All Data</span>
        </div>
        <p className="text-xs text-zinc-400">
          Restore default initial transactions, categories, and wallets.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all data to default samples?')) {
              resetAllDataToDefaults();
            }
          }}
          className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold cursor-pointer transition"
        >
          Reset to Sample Data
        </button>
      </div>

    </div>
  );
};
