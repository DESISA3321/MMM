import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const PasscodeLockScreen: React.FC = () => {
  const { isVaultLocked, unlockVault } = useExpense();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isVaultLocked) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleUnlock = async () => {
    if (pin.length < 4) {
      setErrorMsg('Please enter your full PIN.');
      return;
    }
    setIsVerifying(true);
    const success = await unlockVault(pin);
    setIsVerifying(false);
    if (!success) {
      setErrorMsg('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">ClearSpends Vault Locked</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your device security passcode to access ledger</p>
        </div>

        {/* PIN Dots Indicator */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                idx < pin.length
                  ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-400 font-semibold animate-shake">{errorMsg}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => {
            if (btn === 'C') {
              return (
                <button
                  key={btn}
                  onClick={() => setPin('')}
                  className="h-14 rounded-2xl bg-slate-800/40 text-slate-400 hover:text-white font-semibold text-sm transition"
                >
                  Clear
                </button>
              );
            }
            if (btn === '⌫') {
              return (
                <button
                  key={btn}
                  onClick={handleDelete}
                  className="h-14 rounded-2xl bg-slate-800/40 text-slate-400 hover:text-white font-semibold text-sm transition"
                >
                  ⌫
                </button>
              );
            }
            return (
              <button
                key={btn}
                onClick={() => handleDigitClick(btn)}
                className="h-14 rounded-2xl bg-slate-800/70 hover:bg-slate-700 text-white font-bold text-lg transition active:scale-95 shadow-sm"
              >
                {btn}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleUnlock}
          disabled={pin.length < 4 || isVerifying}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950/60 transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <span>Verifying Passcode...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Financial Ledger</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
