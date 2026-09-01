import React, { useState, useMemo } from 'react';
import {
  Wallet,
  CreditCard,
  Building,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  X,
  PiggyBank,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatMoney, convertCurrency, CURRENCIES, CurrencyCode } from '../../utils/currencies';
import { Account } from '../../types';

export const AccountsView: React.FC = () => {
  const { accounts, currency, addAccount, updateAccount, deleteAccount, transactions, security } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'checking' | 'credit_card' | 'savings' | 'cash' | 'investment'>('checking');
  const [balance, setBalance] = useState('2500');
  const [accCurrency, setAccCurrency] = useState<CurrencyCode>('USD');
  const [color, setColor] = useState('#10b981');
  const [institution, setInstitution] = useState('Chase Bank');

  // Compute Net Worth across accounts
  const netWorth = useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const converted = convertCurrency(acc.balance, acc.currency, currency);
      return sum + converted;
    }, 0);
  }, [accounts, currency]);

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setName('');
    setType('checking');
    setBalance('1000');
    setAccCurrency(currency);
    setColor('#10b981');
    setInstitution('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(String(acc.balance));
    setAccCurrency(acc.currency);
    setColor(acc.color || '#10b981');
    setInstitution(acc.institution || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingAccount) {
      updateAccount(editingAccount.id, {
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency: accCurrency,
        color,
        institution,
      });
    } else {
      addAccount({
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency: accCurrency,
        color,
        institution,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D10] p-4 sm:p-5 rounded-2xl border border-[#1E1E24] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span>Accounts & Multi-Currency Wallets</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage debit, credit cards, cash wallets, and foreign currency accounts.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-950/50 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Net Worth Highlight Card */}
      <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Consolidated Balance</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
            {formatMoney(netWorth, currency, security.privacyMode)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">Across {accounts.length} active wallets and cards</span>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
          <PiggyBank className="w-6 h-6" />
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const accTxs = transactions.filter((t) => t.accountId === acc.id);
          const isNegative = acc.balance < 0;

          return (
            <div
              key={acc.id}
              className="bg-[#111115] rounded-2xl p-5 border border-[#202028] hover:border-[#2A2A38] shadow-xs flex flex-col justify-between space-y-4 group transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: `${acc.color || '#10b981'}20`, color: acc.color || '#10b981' }}
                    >
                      {acc.type === 'credit_card' ? (
                        <CreditCard className="w-5 h-5" />
                      ) : acc.type === 'savings' ? (
                        <PiggyBank className="w-5 h-5" />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{acc.name}</h3>
                      <span className="text-[10px] text-zinc-400 capitalize">
                        {acc.institution ? `${acc.institution} • ` : ''}{acc.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1 rounded bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632]"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove account "${acc.name}"?`)) {
                            deleteAccount(acc.id);
                          }
                        }}
                        className="p-1 rounded bg-[#181820] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-[#262632]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className={`text-xl font-bold font-mono ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {formatMoney(acc.balance, acc.currency, security.privacyMode)}
                  </div>
                  {acc.currency !== currency && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      ≈ {formatMoney(convertCurrency(acc.balance, acc.currency, currency), currency, security.privacyMode)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1E1E26] flex items-center justify-between text-[11px] text-zinc-500">
                <span>{accTxs.length} linked transactions</span>
                <span className="px-2 py-0.5 rounded bg-[#0A0A0D] border border-[#202028] font-mono text-zinc-400">
                  {acc.currency}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#101014] border border-[#22222A] rounded-2xl p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#181820]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-4">
              {editingAccount ? 'Edit Account' : 'Add Financial Account'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Account Nickname</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chase Sapphire, Main Checking, Cash Wallet"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Account Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="checking">Checking / Debit</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="savings">Savings Account</option>
                    <option value="cash">Cash Wallet</option>
                    <option value="investment">Investment / Crypto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Account Currency</label>
                  <select
                    value={accCurrency}
                    onChange={(e) => setAccCurrency(e.target.value as CurrencyCode)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-teal-500 focus:outline-hidden"
                  >
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                      <option key={c} value={c}>
                        {c} ({CURRENCIES[c].symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Current Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-mono font-bold focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Bank / Institution (Optional)</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Chase, Bank of America, Revolut"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#181820] text-zinc-300 rounded-xl border border-[#262632] hover:bg-[#22222E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-950/50 cursor-pointer transition"
                >
                  {editingAccount ? 'Save Changes' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
