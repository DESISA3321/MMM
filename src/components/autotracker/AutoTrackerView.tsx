import React, { useState } from 'react';
import {
  Smartphone,
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle2,
  Edit3,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  HelpCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CURRENCIES, CurrencyCode, formatMoney } from '../../utils/currencies';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction } from '../../types';

interface ExtractedItem {
  id: string;
  merchant: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  category: string;
  subcategory?: string;
  accountId: string;
  paymentMethod: string;
  referenceNumber?: string;
  confidence: number;
  notes: string;
  tags: string[];
  rawText?: string;
  status: 'pending' | 'saved' | 'discarded';
}

const PRESET_EXAMPLES = [
  {
    title: 'Google Pay (UPI / Coffee)',
    icon: '☕',
    text: 'Paid ₹380.00 to Blue Tokai Coffee Roasters using Google Pay UPI (Ref: 424192084920) on 01-Sep-2026.',
  },
  {
    title: 'Chase Bank SMS (Groceries)',
    icon: '🛒',
    text: 'Alert: USD 84.60 spent on Chase Card ending 4242 at WHOLE FOODS MARKET on 2026-09-01. Avail Bal: $3,450.20.',
  },
  {
    title: 'Uber Ride Alert',
    icon: '🚗',
    text: 'Your payment of $28.45 to Uber Technologies via Google Pay was successful on 01 Sep 2026. Ref: UBR-883921.',
  },
  {
    title: 'Multi-SMS Batch (3 Txns)',
    icon: '⚡',
    text: `1. Sent $45.00 to Chipotle Mexican Grill using GPay on 2026-09-01.
2. Alert: Debit of $15.99 for NETFLIX.COM on Card ending 8812 on 2026-09-01.
3. Paid $62.30 to Shell Gas Station via Google Pay on 2026-09-01. Ref: SHL-9912.`,
  },
];

export const AutoTrackerView: React.FC = () => {
  const {
    categories,
    accounts,
    currency,
    addTransaction,
    transactions,
    security,
    clearSpendsCategorize,
    setActiveTab,
  } = useExpense();

  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Parse SMS / Google Pay text
  const handleExtract = async (textToParse?: string) => {
    const text = (textToParse || rawInput).trim();
    if (!text) return;

    setIsProcessing(true);

    try {
      const userCategoryNames = categories.map((c) => c.name);
      const userAccountNames = accounts.map((a) => `${a.name} (${a.type})`);

      const res = await fetch('/api/ai/parse-sms-gpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userCategories: userCategoryNames,
          userAccounts: userAccountNames,
          defaultCurrency: currency,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const txList = data.transactions || [];

        const newItems: ExtractedItem[] = txList.map((tx: any, idx: number) => {
          // Check ClearSpends local auto-categorization
          const localMatch = clearSpendsCategorize(tx.merchant || '', tx.notes || '');
          const matchedCategory = localMatch?.category || tx.category || categories[0]?.name || 'Miscellaneous';
          const matchedSub = localMatch?.subcategory || tx.subcategory || '';

          // Match account if mentioned
          let matchedAccountId = accounts[0]?.id || 'acc-1';
          if (tx.paymentMethod) {
            const accFind = accounts.find((a) =>
              tx.paymentMethod.toLowerCase().includes(a.name.toLowerCase()) ||
              tx.paymentMethod.toLowerCase().includes(a.type.toLowerCase())
            );
            if (accFind) matchedAccountId = accFind.id;
          }

          return {
            id: `auto-${Date.now()}-${idx}`,
            merchant: tx.merchant || 'Google Pay Merchant',
            amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0,
            currency: (tx.currency as CurrencyCode) || currency,
            date: tx.date || new Date().toISOString().split('T')[0],
            category: matchedCategory,
            subcategory: matchedSub,
            accountId: matchedAccountId,
            paymentMethod: tx.paymentMethod || 'Google Pay / SMS',
            referenceNumber: tx.referenceNumber || '',
            confidence: tx.confidence || 0.9,
            notes: tx.notes || `Auto-extracted from ${tx.paymentMethod || 'SMS alert'}`,
            tags: ['AutoTracked', tx.paymentMethod?.includes('Google Pay') ? 'GooglePay' : 'SMS-Alert'],
            rawText: tx.rawText || text,
            status: 'pending',
          };
        });

        setExtractedItems((prev) => [...newItems, ...prev]);
        setRawInput('');
      } else {
        throw new Error('API extraction failed');
      }
    } catch (err) {
      console.warn('Fallback to client extraction:', err);
      // Client-side fallback extraction
      const fallbackAmountMatch = text.match(/(?:Rs\.?|INR|USD|\$|EUR|GBP)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
      const amt = fallbackAmountMatch ? parseFloat(fallbackAmountMatch[1].replace(/,/g, '')) : 25.0;
      
      const localMatch = clearSpendsCategorize(text, '');
      const item: ExtractedItem = {
        id: `auto-${Date.now()}`,
        merchant: text.length > 30 ? text.slice(0, 25) + '...' : text,
        amount: amt,
        currency: currency,
        date: new Date().toISOString().split('T')[0],
        category: localMatch?.category || categories[0]?.name || 'Miscellaneous',
        subcategory: localMatch?.subcategory || '',
        accountId: accounts[0]?.id || 'acc-1',
        paymentMethod: text.toLowerCase().includes('google pay') ? 'Google Pay' : 'SMS Alert',
        confidence: 0.8,
        notes: `Extracted text: ${text}`,
        tags: ['AutoTracked'],
        rawText: text,
        status: 'pending',
      };
      setExtractedItems((prev) => [item, ...prev]);
      setRawInput('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          setRawInput(clipboardText);
          handleExtract(clipboardText);
        }
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  // Update item field during in-place editing
  const updateItemField = (id: string, field: keyof ExtractedItem, value: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // If merchant changed, re-check ClearSpends rules
          if (field === 'merchant') {
            const rule = clearSpendsCategorize(value, item.notes);
            if (rule && rule.confidence >= 0.7) {
              updated.category = rule.category;
              if (rule.subcategory) updated.subcategory = rule.subcategory;
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Confirm single extracted expense and add to ledger
  const handleConfirmItem = (item: ExtractedItem) => {
    addTransaction({
      merchant: item.merchant,
      amount: item.amount,
      currency: item.currency,
      date: item.date,
      category: item.category,
      subcategory: item.subcategory,
      accountId: item.accountId,
      paymentMethod: item.paymentMethod,
      tags: item.tags,
      notes: item.notes + (item.referenceNumber ? ` | Ref: ${item.referenceNumber}` : ''),
      aiCategorized: true,
    });

    setExtractedItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'saved' } : i))
    );
    setSavedCount((prev) => prev + 1);
  };

  // Confirm all pending extracted items
  const handleConfirmAll = () => {
    const pending = extractedItems.filter((i) => i.status === 'pending');
    pending.forEach((item) => {
      handleConfirmItem(item);
    });
  };

  // Discard an item
  const handleDiscardItem = (id: string) => {
    setExtractedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'discarded' } : i))
    );
  };

  const pendingItems = extractedItems.filter((i) => i.status === 'pending');
  const processedItems = extractedItems.filter((i) => i.status !== 'pending');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#0D0D10] p-5 sm:p-6 rounded-2xl border border-[#1E1E24] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-black flex items-center justify-center font-bold shadow-md shadow-emerald-950/60">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Auto Expense Tracker</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30">
                  Google Pay & SMS AI
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Automatically extract merchant, amount, date & payment mode from bank SMS alerts and Google Pay receipts. Review & edit before saving to your ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingItems.length > 1 && (
            <button
              onClick={handleConfirmAll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/60 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm All ({pendingItems.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Input Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: SMS & GPay Text Input (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-xs space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Paste SMS / Google Pay Alert</span>
              </span>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-[#181820] border border-[#242430] flex items-center gap-1 cursor-pointer transition"
                title="Paste from system clipboard"
              >
                <Copy className="w-3 h-3 text-emerald-400" />
                <span>Paste Clipboard</span>
              </button>
            </div>

            {/* Input Textarea */}
            <div className="relative">
              <textarea
                id="auto-tracker-input-textarea"
                rows={5}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`Paste your transaction SMS or Google Pay notification here...
e.g. "Paid ₹450 to Starbucks on 01-Sep-2026 using Google Pay UPI."
e.g. "Alert: USD 84.60 spent on Chase Card at Whole Foods on 2026-09-01."`}
                className="w-full p-3 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 text-xs font-mono placeholder-zinc-600 focus:border-emerald-500 focus:outline-hidden resize-none scrollbar-thin"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-zinc-500">
                {rawInput.length > 0 ? `${rawInput.length} chars` : 'Supports multi-line & batch alerts'}
              </span>
              
              <button
                id="auto-tracker-extract-btn"
                type="button"
                disabled={!rawInput.trim() || isProcessing}
                onClick={() => handleExtract()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition cursor-pointer border border-emerald-500/30"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Extract Transaction Fields</span>
                  </>
                )}
              </button>
            </div>

            {/* Instant One-Click Preset Examples */}
            <div className="pt-3 border-t border-[#1C1C24] space-y-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Try Sample Alerts (1-Click Test)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_EXAMPLES.map((ex, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRawInput(ex.text);
                      setActivePreset(ex.title);
                      handleExtract(ex.text);
                    }}
                    className="p-2.5 rounded-xl bg-[#0A0A0D] hover:bg-[#16161C] border border-[#1E1E26] hover:border-emerald-500/50 text-left transition group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 group-hover:text-emerald-400">
                      <span>{ex.icon}</span>
                      <span className="truncate">{ex.title}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 line-clamp-1 font-mono">
                      {ex.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Privacy & Zero-Knowledge Card */}
          <div className="bg-[#111115] rounded-2xl p-4 border border-[#202028] text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Private & Safe Extraction</span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              SMS and Google Pay notifications are processed securely with zero storage of personal identifiers. You maintain 100% control to review and edit every single value before saving to your ledger.
            </p>
          </div>
        </div>

        {/* Right Column: Extracted Cards with In-Place Edit & Confirmation (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Extracted Transactions for Review ({pendingItems.length} Pending)</span>
            </h2>
            {savedCount > 0 && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savedCount} Saved to Ledger</span>
              </span>
            )}
          </div>

          {pendingItems.length === 0 && processedItems.length === 0 && (
            <div className="bg-[#111115] rounded-2xl p-12 border border-[#202028] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="font-bold text-white text-base">No Transaction Extracted Yet</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Paste any SMS alert or Google Pay notification on the left, or click one of the preset sample alerts to test instant field extraction.
                </p>
              </div>
            </div>
          )}

          {/* Pending Items to Confirm & Edit */}
          <div className="space-y-4">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#111115] rounded-2xl p-5 border border-emerald-500/30 shadow-lg shadow-emerald-950/20 space-y-4 transition"
              >
                
                {/* Extracted Header & Confidence Badge */}
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E26]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{Math.round(item.confidence * 100)}% Auto-Matched</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Via {item.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDiscardItem(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-[#181820] transition cursor-pointer"
                      title="Discard extraction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editable Fields Form Grid */}
                <div className="space-y-3 text-xs">
                  
                  {/* Merchant & Amount Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7">
                      <label className="block text-zinc-400 font-semibold mb-1 flex items-center justify-between">
                        <span>Merchant / Payee Name</span>
                        <span className="text-[10px] text-emerald-400 font-normal">Editable</span>
                      </label>
                      <input
                        type="text"
                        value={item.merchant}
                        onChange={(e) => updateItemField(item.id, 'merchant', e.target.value)}
                        placeholder="Merchant name"
                        className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-semibold focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="sm:col-span-5">
                      <label className="block text-zinc-400 font-semibold mb-1 flex items-center justify-between">
                        <span>Total Amount</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{item.currency}</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateItemField(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-emerald-400 font-bold font-mono focus:border-emerald-500 focus:outline-hidden"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">
                          {CURRENCIES[item.currency]?.symbol || '$'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Date, Category, & Account Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Date</label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) => updateItemField(item.id, 'date', e.target.value)}
                        className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItemField(item.id, 'category', e.target.value)}
                        className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Account / Wallet</label>
                      <select
                        value={item.accountId}
                        onChange={(e) => updateItemField(item.id, 'accountId', e.target.value)}
                        className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notes / Reference */}
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Notes / Transaction Memo</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItemField(item.id, 'notes', e.target.value)}
                      placeholder="Transaction notes"
                      className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-300 text-xs focus:border-emerald-500"
                    />
                  </div>

                </div>

                {/* Confirm & Save Button */}
                <div className="pt-3 border-t border-[#1E1E26] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono truncate max-w-xs">
                    {item.rawText ? `Raw: "${item.rawText.slice(0, 45)}..."` : ''}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleConfirmItem(item)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/60 flex items-center gap-1.5 transition cursor-pointer border border-emerald-500/30"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm & Save Expense</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Processed / Saved History in Current Session */}
          {processedItems.length > 0 && (
            <div className="pt-6 space-y-3">
              <h3 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">
                Processed in this session ({processedItems.length})
              </h3>
              <div className="space-y-2">
                {processedItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0D0D10] p-3 rounded-xl border border-[#1E1E24] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200">{item.merchant}</div>
                        <div className="text-[10px] text-zinc-500">
                          {item.date} • {item.category} • {item.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">
                        {formatMoney(item.amount, item.currency, security.privacyMode)}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                        SAVED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
