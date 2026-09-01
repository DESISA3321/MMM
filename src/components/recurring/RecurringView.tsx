import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  PauseCircle,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  Clock,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatMoney, convertCurrency, CURRENCIES, CurrencyCode } from '../../utils/currencies';
import { RecurringExpense } from '../../types';

export const RecurringView: React.FC = () => {
  const {
    recurring,
    categories,
    accounts,
    currency,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    toggleRecurringStatus,
    security,
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);

  // Form
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('15');
  const [recCurrency, setRecCurrency] = useState<CurrencyCode>('USD');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [category, setCategory] = useState(categories[0]?.name || 'Subscriptions');
  const [accountId, setAccountId] = useState(accounts[0]?.id || 'acc-1');
  const [billingDay, setBillingDay] = useState(1);
  const [nextBillingDate, setNextBillingDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculations: Total Monthly and Total Yearly Subscription Drain
  const { monthlyTotal, yearlyTotal, activeCount } = useMemo(() => {
    let mSum = 0;
    let ySum = 0;
    let count = 0;

    recurring.forEach((item) => {
      if (item.status === 'active') {
        count += 1;
        const converted = convertCurrency(item.amount, item.currency, currency);
        if (item.frequency === 'daily') {
          mSum += converted * 30.416;
          ySum += converted * 365;
        } else if (item.frequency === 'weekly') {
          mSum += converted * 4.33;
          ySum += converted * 52;
        } else if (item.frequency === 'biweekly') {
          mSum += converted * 2.166;
          ySum += converted * 26;
        } else if (item.frequency === 'monthly') {
          mSum += converted;
          ySum += converted * 12;
        } else if (item.frequency === 'quarterly') {
          mSum += converted / 3;
          ySum += converted * 4;
        } else if (item.frequency === 'yearly') {
          mSum += converted / 12;
          ySum += converted;
        }
      }
    });

    return {
      monthlyTotal: mSum,
      yearlyTotal: ySum,
      activeCount: count,
    };
  }, [recurring, currency]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setName('');
    setAmount('15.99');
    setRecCurrency(currency);
    setFrequency('monthly');
    setCategory(categories[0]?.name || 'Subscriptions');
    setAccountId(accounts[0]?.id || 'acc-1');
    setBillingDay(1);
    setNextBillingDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RecurringExpense) => {
    setEditingItem(item);
    setName(item.name);
    setAmount(String(item.amount));
    setRecCurrency(item.currency);
    setFrequency(item.frequency);
    setCategory(item.category);
    setAccountId(item.accountId || accounts[0]?.id || 'acc-1');
    setBillingDay(item.billingDayOfMonth || 1);
    setNextBillingDate(item.nextBillingDate);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingItem) {
      updateRecurring(editingItem.id, {
        name: name.trim(),
        amount: parseFloat(amount) || 0,
        currency: recCurrency,
        frequency,
        category,
        accountId,
        billingDayOfMonth: billingDay,
        nextBillingDate,
      });
    } else {
      addRecurring({
        name: name.trim(),
        merchant: name.trim(),
        amount: parseFloat(amount) || 0,
        currency: recCurrency,
        frequency,
        category,
        accountId,
        billingDayOfMonth: billingDay,
        nextBillingDate,
        status: 'active',
        autoLog: false,
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
            <span>Recurring Expenses & Subscriptions</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track daily, weekly, monthly, and yearly subscriptions and fixed overhead costs.
          </p>
        </div>

        <button
          id="add-recurring-btn"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-950/50 transition cursor-pointer self-start sm:self-auto border border-indigo-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Item</span>
        </button>
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-xs">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Overhead</span>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {formatMoney(monthlyTotal, currency, security.privacyMode)} / mo
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">{activeCount} active recurring items</span>
        </div>

        <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-xs">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Projected Annual Cost</span>
          <div className="text-2xl font-bold text-indigo-400 mt-2 font-mono">
            {formatMoney(yearlyTotal, currency, security.privacyMode)} / yr
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Full 12-month recurring forecast</span>
        </div>

        <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-xs">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Next Renewal</span>
          <div className="text-2xl font-bold text-teal-400 mt-2 truncate">
            {recurring.find((r) => r.status === 'active')?.name || 'None'}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Upcoming scheduled auto-charge</span>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurring.map((item) => {
          const acc = accounts.find((a) => a.id === item.accountId);
          const isActive = item.status === 'active';

          return (
            <div
              key={item.id}
              className={`bg-[#111115] rounded-2xl p-5 border transition flex flex-col justify-between space-y-4 group shadow-xs ${
                isActive ? 'border-[#202028] hover:border-[#2A2A38]' : 'border-[#202028]/50 opacity-60'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="truncate">
                    <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                    <span className="text-[10px] text-zinc-400 block">{item.category}</span>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-bold text-base text-white">
                      {formatMoney(item.amount, item.currency, security.privacyMode)}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 font-semibold uppercase tracking-wider font-mono">
                      {item.frequency}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0A0A0D] p-3 rounded-xl border border-[#1E1E26] space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Billing Schedule</span>
                    <span className="font-semibold text-zinc-200 capitalize">
                      {item.frequency === 'daily'
                        ? 'Repeats Daily'
                        : item.frequency === 'weekly'
                        ? 'Repeats Weekly'
                        : `Day ${item.billingDayOfMonth || 1} of month`}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Account</span>
                    <span className="font-semibold text-zinc-200">{acc?.name || 'Default Card'}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Next Due Date</span>
                    <span className="font-semibold text-teal-400">{item.nextBillingDate}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#1E1E26] flex items-center justify-between">
                <button
                  onClick={() => toggleRecurringStatus(item.id)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition ${
                    isActive
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60'
                      : 'bg-[#181820] text-zinc-400 hover:text-zinc-200 border border-[#262632]'
                  }`}
                >
                  {isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  <span>{isActive ? 'Active' : 'Paused'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632] cursor-pointer"
                    title="Edit Recurring Item"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove subscription "${item.name}"?`)) {
                        deleteRecurring(item.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-[#181820] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-[#262632] cursor-pointer"
                    title="Delete Recurring Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal for Subscription */}
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
              {editingItem ? 'Edit Recurring Expense' : 'Add Recurring Expense / Subscription'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Service / Expense Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daily Coffee, Netflix, Spotify, AWS, Gym"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-mono font-bold focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Currency</label>
                  <select
                    value={recCurrency}
                    onChange={(e) => setRecCurrency(e.target.value as CurrencyCode)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-hidden"
                  >
                    {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                      <option key={c} value={c}>
                        {c} ({CURRENCIES[c].symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Frequency</label>
                  <select
                    id="recurring-frequency-select"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-hidden font-medium"
                  >
                    <option value="daily">Daily (Every Day)</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">
                    {frequency === 'daily' ? 'Active Schedule' : 'Billing Day of Month'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    disabled={frequency === 'daily'}
                    value={billingDay}
                    onChange={(e) => setBillingDay(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-hidden disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Payment Account</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Next Billing / Start Date</label>
                <input
                  type="date"
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-indigo-500 focus:outline-hidden"
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
                  id="recurring-modal-save-btn"
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-950/50 cursor-pointer transition border border-indigo-500/30"
                >
                  {editingItem ? 'Save Changes' : 'Add Recurring Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
