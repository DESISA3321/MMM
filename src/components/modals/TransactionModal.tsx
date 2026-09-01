import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  Sparkles,
  Zap,
  Tag,
  DollarSign,
  Calendar,
  Wallet,
  Briefcase,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CURRENCIES, CurrencyCode } from '../../utils/currencies';
import { Transaction, TransactionType } from '../../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
  initialNaturalText?: string;
  initialType?: TransactionType;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
  initialNaturalText,
  initialType = 'expense',
}) => {
  const {
    categories,
    accounts,
    projects,
    currency,
    addTransaction,
    updateTransaction,
    clearSpendsCategorize,
  } = useExpense();

  // Form State
  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState<CurrencyCode>(currency);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [tax, setTax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [lineItems, setLineItems] = useState<{ name: string; price: number; quantity: number }[]>([]);
  const [isAiCategorized, setIsAiCategorized] = useState(false);
  const [isParsingNL, setIsParsingNL] = useState(false);

  // Filter categories based on transaction type
  const availableCategories = categories.filter((c) => {
    if (txType === 'income') {
      return c.type === 'income' || c.name.toLowerCase().includes('salary') || c.name.toLowerCase().includes('income') || c.name.toLowerCase().includes('freelance') || c.name.toLowerCase().includes('dividend') || c.name.toLowerCase().includes('refund');
    }
    return c.type !== 'income';
  });

  // Fallback to all categories if filtered is empty
  const displayCategories = availableCategories.length > 0 ? availableCategories : categories;

  // Initialize or reset form
  useEffect(() => {
    if (initialTransaction) {
      setTxType(initialTransaction.type || 'expense');
      setMerchant(initialTransaction.merchant);
      setAmount(String(initialTransaction.amount));
      setTxCurrency(initialTransaction.currency);
      setDate(initialTransaction.date);
      setCategory(initialTransaction.category);
      setSubcategory(initialTransaction.subcategory || '');
      setAccountId(initialTransaction.accountId);
      setProjectId(initialTransaction.projectId || '');
      setTagsInput(initialTransaction.tags ? initialTransaction.tags.join(', ') : '');
      setNotes(initialTransaction.notes || '');
      setTax(initialTransaction.tax !== undefined ? String(initialTransaction.tax) : '');
      setPaymentMethod(initialTransaction.paymentMethod || 'Card');
      setLineItems(initialTransaction.lineItems || []);
      setIsAiCategorized(Boolean(initialTransaction.aiCategorized));
    } else {
      const defaultType = initialType || 'expense';
      setTxType(defaultType);
      setMerchant('');
      setAmount('');
      setTxCurrency(currency);
      setDate(new Date().toISOString().split('T')[0]);
      
      const defaultCat = defaultType === 'income'
        ? (categories.find(c => c.type === 'income')?.name || 'Salary & Wages')
        : (categories.find(c => c.type !== 'income')?.name || categories[0]?.name || 'Dining & Food');
        
      setCategory(defaultCat);
      setSubcategory('');
      setAccountId(accounts[0]?.id || 'acc-1');
      setProjectId('');
      setTagsInput('');
      setNotes('');
      setTax('');
      setPaymentMethod(defaultType === 'income' ? 'Direct Deposit' : 'Card');
      setLineItems([]);
      setIsAiCategorized(false);

      if (initialNaturalText) {
        parseNaturalLanguageInput(initialNaturalText);
      }
    }
  }, [initialTransaction, initialNaturalText, initialType, isOpen]);

  // Handle switching transaction type
  const handleTypeSwitch = (type: TransactionType) => {
    setTxType(type);
    if (type === 'income') {
      const incomeCat = categories.find(c => c.type === 'income')?.name || 'Salary & Wages';
      setCategory(incomeCat);
      setPaymentMethod('Direct Deposit');
    } else {
      const expenseCat = categories.find(c => c.type !== 'income')?.name || 'Dining & Food';
      setCategory(expenseCat);
      setPaymentMethod('Card');
    }
  };

  // Smart auto-categorization when typing merchant
  const handleMerchantChange = (val: string) => {
    setMerchant(val);
    if (!initialTransaction && val.trim().length > 2) {
      const match = clearSpendsCategorize(val, notes);
      if (match && match.confidence >= 0.7) {
        setCategory(match.category);
        if (match.subcategory) setSubcategory(match.subcategory);
        setIsAiCategorized(true);
      }
    }
  };

  const parseNaturalLanguageInput = async (nlText: string) => {
    setIsParsingNL(true);
    try {
      const res = await fetch('/api/gemini/parse-expense-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: nlText,
          defaultCurrency: currency,
        }),
      });

      if (res.ok) {
        const parsed = await res.json();
        if (parsed.merchant) setMerchant(parsed.merchant);
        if (parsed.amount) setAmount(String(parsed.amount));
        if (parsed.currency) setTxCurrency(parsed.currency);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.subcategory) setSubcategory(parsed.subcategory);
        if (parsed.date) setDate(parsed.date);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.tags && Array.isArray(parsed.tags)) setTagsInput(parsed.tags.join(', '));
        if (parsed.type) setTxType(parsed.type);
        setIsAiCategorized(true);
      }
    } catch (e) {
      console.warn('NL Parser fallback:', e);
    } finally {
      setIsParsingNL(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload = {
      type: txType,
      merchant: merchant.trim(),
      amount: parseFloat(amount) || 0,
      currency: txCurrency,
      category,
      subcategory: subcategory || undefined,
      date,
      accountId: accountId || accounts[0]?.id || 'acc-1',
      projectId: projectId || undefined,
      tags,
      notes: notes || undefined,
      tax: tax ? parseFloat(tax) : undefined,
      paymentMethod,
      lineItems: lineItems.length > 0 ? lineItems : undefined,
      aiCategorized: isAiCategorized,
    };

    if (initialTransaction) {
      updateTransaction(initialTransaction.id, payload);
    } else {
      addTransaction(payload);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#101014] border border-[#22222A] rounded-2xl p-5 sm:p-6 shadow-2xl text-zinc-100 relative my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#181820]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs border ${
            txType === 'income'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}>
            {txType === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {initialTransaction
                ? (txType === 'income' ? 'Edit Income Entry' : 'Edit Expense Entry')
                : (txType === 'income' ? 'Record New Income' : 'Record New Expense')}
            </h2>
            <p className="text-xs text-zinc-400">
              My Money Manager multi-currency financial ledger
            </p>
          </div>
        </div>

        {/* Transaction Type Segmented Toggle (Expense vs Income) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#0A0A0D] border border-[#202028] rounded-xl mb-4">
          <button
            type="button"
            id="tx-type-expense-btn"
            onClick={() => handleTypeSwitch('expense')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              txType === 'expense'
                ? 'bg-rose-950/70 text-rose-200 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#15151C]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>Expense (Money Out)</span>
          </button>

          <button
            type="button"
            id="tx-type-income-btn"
            onClick={() => handleTypeSwitch('income')}
            className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              txType === 'income'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#15151C]'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Income (Money In)</span>
          </button>
        </div>

        {/* Loading banner if AI parsing text */}
        {isParsingNL && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
            <span>AI is parsing your text into transaction fields...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Merchant / Source */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-zinc-300 font-semibold">
                {txType === 'income' ? 'Income Source / Payer' : 'Merchant / Store Name'}
              </label>
              {isAiCategorized && (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Auto-Matched
                </span>
              )}
            </div>
            <input
              id="tx-modal-merchant-input"
              type="text"
              required
              value={merchant}
              onChange={(e) => handleMerchantChange(e.target.value)}
              placeholder={txType === 'income' ? 'e.g. Acme Tech Payroll, Client XYZ, Marcus HYSA Interest' : 'e.g. Whole Foods, Amazon, Shell, Uber'}
              className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-medium focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Amount & Currency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Amount</label>
              <div className="relative">
                <input
                  id="tx-modal-amount-input"
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-bold text-sm font-mono focus:outline-hidden ${
                    txType === 'income' ? 'focus:border-emerald-500 text-emerald-400' : 'focus:border-rose-500'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-semibold">
                  {CURRENCIES[txCurrency]?.symbol || '$'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Currency</label>
              <select
                value={txCurrency}
                onChange={(e) => setTxCurrency(e.target.value as CurrencyCode)}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              >
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCIES[c].symbol} - {CURRENCIES[c].name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  const catObj = categories.find((c) => c.name === e.target.value);
                  if (catObj && catObj.subcategories.length > 0) {
                    setSubcategory(catObj.subcategories[0]);
                  }
                }}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              >
                {displayCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.type === 'income' ? '(Income)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subcategory & Account Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Subcategory</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder={txType === 'income' ? 'e.g. Direct Deposit, Bonus, Dividends' : 'e.g. Groceries, Coffee, Fast Food'}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">
                {txType === 'income' ? 'Deposit Into Account' : 'Paid From Account'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project & Tags Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Assign to Project (Optional)</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              >
                <option value="">None (Personal)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Tags (Comma Separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={txType === 'income' ? 'salary, bonus, side-hustle' : 'tax-deductible, business, travel'}
                className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Notes / Memo</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details or reference notes"
              className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
            />
          </div>

          {/* Itemized Line Items (Optional) */}
          {txType === 'expense' && (
            <div className="space-y-2 pt-2 border-t border-[#1E1E26]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-teal-400" />
                  <span>Line Items ({lineItems.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setLineItems([...lineItems, { name: '', price: 0, quantity: 1 }])}
                  className="text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Item</span>
                </button>
              </div>

              {lineItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => {
                      const next = [...lineItems];
                      next[idx].name = e.target.value;
                      setLineItems(next);
                    }}
                    className="flex-1 p-1.5 bg-[#0A0A0D] border border-[#202028] rounded-lg text-zinc-200"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const next = [...lineItems];
                      next[idx].quantity = parseInt(e.target.value) || 1;
                      setLineItems(next);
                    }}
                    className="w-14 p-1.5 bg-[#0A0A0D] border border-[#202028] rounded-lg text-zinc-200 text-center font-mono"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => {
                      const next = [...lineItems];
                      next[idx].price = parseFloat(e.target.value) || 0;
                      setLineItems(next);
                    }}
                    className="w-20 p-1.5 bg-[#0A0A0D] border border-[#202028] rounded-lg text-zinc-200 text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                    className="p-1 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#1E1E26]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#181820] hover:bg-[#1E1E28] border border-[#262632] text-zinc-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              id="tx-modal-save-btn"
              type="submit"
              className={`px-6 py-2 text-white font-bold rounded-xl shadow-lg transition cursor-pointer border ${
                txType === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60 border-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/60 border-emerald-500/30'
              }`}
            >
              {initialTransaction
                ? 'Save Changes'
                : (txType === 'income' ? 'Record Income' : 'Add Expense to Ledger')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
