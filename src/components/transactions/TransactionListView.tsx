import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit2,
  Copy,
  Receipt,
  FileText,
  CheckSquare,
  Square,
  Plus,
  Camera,
  Sparkles,
  X,
  ChevronDown,
  Calendar,
  Layers,
  Tag,
  Wallet,
  Briefcase,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatMoney, convertCurrency, CURRENCIES } from '../../utils/currencies';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction } from '../../types';

interface TransactionListViewProps {
  onOpenAddExpense: () => void;
  onOpenAddIncome?: () => void;
  onEditExpense: (tx: Transaction) => void;
  onOpenScanner: () => void;
}

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  onOpenAddExpense,
  onOpenAddIncome,
  onEditExpense,
  onOpenScanner,
}) => {
  const {
    filteredTransactions,
    categories,
    accounts,
    projects,
    currency,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    setAccountFilter,
    tagFilter,
    setTagFilter,
    dateRangeFilter,
    setDateRangeFilter,
    clearAllFilters,
    deleteTransaction,
    addTransaction,
    security,
  } = useExpense();

  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'merchant'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [activeReceiptModal, setActiveReceiptModal] = useState<Transaction | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filter transactions by type (income vs expense)
  const typeFilteredTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      if (typeFilter === 'all') return true;
      const txType = tx.type || 'expense';
      return txType === typeFilter;
    });
  }, [filteredTransactions, typeFilter]);

  // Totals calculations
  const { totalInflow, totalOutflow, netCashFlow } = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    filteredTransactions.forEach((tx) => {
      const converted = convertCurrency(tx.amount, tx.currency, currency);
      if (tx.type === 'income') {
        inflow += converted;
      } else {
        outflow += converted;
      }
    });
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      netCashFlow: inflow - outflow,
    };
  }, [filteredTransactions, currency]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    filteredTransactions.forEach((tx) => {
      tx.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [filteredTransactions]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...typeFilteredTransactions].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amountInUSD - b.amountInUSD;
      } else if (sortField === 'merchant') {
        comparison = a.merchant.localeCompare(b.merchant);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [typeFilteredTransactions, sortField, sortOrder]);

  const toggleSort = (field: 'date' | 'amount' | 'merchant') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedTxIds.length === sortedTransactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(sortedTransactions.map((tx) => tx.id));
    }
  };

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selectedTxIds.length} selected transactions?`)) {
      selectedTxIds.forEach((id) => deleteTransaction(id));
      setSelectedTxIds([]);
    }
  };

  const handleDuplicate = (tx: Transaction) => {
    const { id, createdAt, updatedAt, amountInUSD, ...rest } = tx;
    addTransaction({
      ...rest,
      notes: `${rest.notes || ''} (Duplicated)`.trim(),
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Merchant', 'Amount', 'Currency', 'Category', 'Subcategory', 'Account', 'Project', 'Tags', 'Notes'];
    const rows = sortedTransactions.map((tx) => {
      const acc = accounts.find((a) => a.id === tx.accountId)?.name || 'Default';
      const proj = projects.find((p) => p.id === tx.projectId)?.name || '';
      return [
        tx.date,
        `"${tx.merchant.replace(/"/g, '""')}"`,
        tx.amount,
        tx.currency,
        `"${tx.category}"`,
        `"${tx.subcategory || ''}"`,
        `"${acc}"`,
        `"${proj}"`,
        `"${(tx.tags || []).join(';')}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `clearspends_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0D0D10] p-4 rounded-2xl border border-[#1E1E24] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Transactions History</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#181820] border border-[#262632] text-zinc-300 font-mono">
              {sortedTransactions.length} records
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full ledger with multi-currency tracking, income & expense logging
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181820] hover:bg-[#1E1E28] border border-[#262632] text-xs font-semibold text-zinc-200 transition cursor-pointer"
            title="Export filtered transactions as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#181820] hover:bg-[#1E1E28] border border-[#262632] text-xs font-semibold text-teal-400 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>

          {onOpenAddIncome && (
            <button
              id="list-add-income-btn"
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold shadow-xs transition cursor-pointer border border-emerald-500/40"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Income</span>
            </button>
          )}

          <button
            id="list-add-expense-btn"
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/50 transition cursor-pointer border border-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards (Inflow, Outflow, Net) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-[#1E1E24] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Total Income (Inflow)</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
              +{formatMoney(totalInflow, currency, security.privacyMode)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowUpDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-[#1E1E24] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Total Expenses (Outflow)</span>
            <span className="text-base sm:text-lg font-bold text-rose-400 font-mono mt-0.5 block">
              -{formatMoney(totalOutflow, currency, security.privacyMode)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <ArrowUpDown className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0D0D10] border border-[#1E1E24] flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">Net Balance Flow</span>
            <span className={`text-base sm:text-lg font-bold font-mono mt-0.5 block ${
              netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {netCashFlow >= 0 ? '+' : ''}{formatMoney(netCashFlow, currency, security.privacyMode)}
            </span>
          </div>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
            netCashFlow >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#0D0D10] rounded-2xl p-4 border border-[#1E1E24] shadow-xs space-y-3">
        {/* Transaction Type Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0A0A0D] border border-[#202028] rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setTypeFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'expense'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-rose-300'
            }`}
          >
            Expenses Only
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              typeFilter === 'income'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-xs'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            Incomes Only
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              id="tx-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchant, payer, category, notes, tags, line items..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#0A0A0D] border border-[#202028] focus:border-emerald-500 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Dropdown */}
          <select
            id="tx-category-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 text-xs bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Quick Account Dropdown */}
          <select
            id="tx-account-filter-select"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full sm:w-44 py-2 px-3 text-xs bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Filter Drawer Toggle Button */}
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer shrink-0 ${
              showFilterDrawer || tagFilter !== 'all' || dateRangeFilter.start || dateRangeFilter.end
                ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-400'
                : 'bg-[#181820] border-[#262632] text-zinc-300 hover:bg-[#1E1E28]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>More Filters</span>
          </button>

          {(searchQuery || categoryFilter !== 'all' || accountFilter !== 'all' || tagFilter !== 'all' || dateRangeFilter.start) && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 shrink-0"
            >
              Reset
            </button>
          )}
        </div>

        {/* Extended Filter Drawer (Date Range & Tags) */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-[#1E1E24] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Date Range (Start)</label>
              <input
                type="date"
                value={dateRangeFilter.start}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-lg text-zinc-200 text-xs focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Date Range (End)</label>
              <input
                type="date"
                value={dateRangeFilter.end}
                onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-lg text-zinc-200 text-xs focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Filter by Tag</label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full p-2 bg-[#0A0A0D] border border-[#202028] rounded-lg text-zinc-200 text-xs focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Selection Bar if any checked */}
      {selectedTxIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-xs text-emerald-300">
          <span className="font-semibold">{selectedTxIds.length} transactions selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedTxIds([])}
              className="px-2.5 py-1 text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Transactions Table / List */}
      <div className="bg-[#111115] rounded-2xl border border-[#202028] shadow-xs overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[#0A0A0D] border-b border-[#202028] text-[11px] font-bold uppercase tracking-wider text-zinc-400 items-center">
          <div className="col-span-1 flex items-center gap-2">
            <button onClick={handleSelectAll} className="cursor-pointer text-zinc-400 hover:text-white">
              {selectedTxIds.length > 0 && selectedTxIds.length === sortedTransactions.length ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </div>

          <div
            onClick={() => toggleSort('merchant')}
            className="col-span-4 sm:col-span-4 flex items-center gap-1 cursor-pointer hover:text-zinc-200"
          >
            <span>Merchant / Details</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>

          <div
            onClick={() => toggleSort('date')}
            className="col-span-3 sm:col-span-2 flex items-center gap-1 cursor-pointer hover:text-zinc-200"
          >
            <span>Date</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>

          <div className="col-span-2 hidden md:block">
            <span>Category & Account</span>
          </div>

          <div
            onClick={() => toggleSort('amount')}
            className="col-span-4 sm:col-span-3 md:col-span-3 text-right flex items-center justify-end gap-1 cursor-pointer hover:text-zinc-200"
          >
            <span>Amount</span>
            <ArrowUpDown className="w-3 h-3" />
          </div>
        </div>

        {/* Empty State */}
        {sortedTransactions.length === 0 && (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <Receipt className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">No transactions match your search</h3>
            <p className="text-xs max-w-sm mx-auto">
              Try adjusting your filter criteria or log a new transaction with our AI assistant or receipt scanner.
            </p>
            <button
              onClick={clearAllFilters}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Table Rows */}
        <div className="divide-y divide-[#1E1E26]">
          {sortedTransactions.map((tx) => {
            const isSelected = selectedTxIds.includes(tx.id);
            const catObj = categories.find((c) => c.name.toLowerCase() === tx.category.toLowerCase());
            const catColor = catObj ? catObj.color : '#94a3b8';
            const catIcon = catObj ? catObj.icon : 'CircleDot';
            const accObj = accounts.find((a) => a.id === tx.accountId);
            const projObj = projects.find((p) => p.id === tx.projectId);

            return (
              <div
                key={tx.id}
                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-[#16161D] transition group ${
                  isSelected ? 'bg-emerald-950/30' : ''
                }`}
              >
                {/* Checkbox Column */}
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={() => toggleSelectTx(tx.id)}
                    className="cursor-pointer text-zinc-500 hover:text-zinc-300"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Merchant & Line Items Column */}
                <div className="col-span-4 sm:col-span-4 flex items-center gap-3 truncate">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}
                  >
                    <CategoryIcon name={catIcon} className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-zinc-100 truncate group-hover:text-emerald-400 transition">
                        {tx.merchant}
                      </span>
                      {tx.type === 'income' ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                          Income
                        </span>
                      ) : (
                        tx.aiCategorized && (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono hidden sm:inline"
                            title="AI Categorized"
                          >
                            AI
                          </span>
                        )
                      )}
                      {tx.lineItems && tx.lineItems.length > 0 && (
                        <button
                          onClick={() => setActiveReceiptModal(tx)}
                          className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center gap-0.5 cursor-pointer hover:bg-teal-500/20"
                          title="View Itemized Breakdown"
                        >
                          <Receipt className="w-2.5 h-2.5" />
                          <span>{tx.lineItems.length} items</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {tx.notes ? tx.notes : tx.subcategory || tx.category}
                      {tx.tags && tx.tags.length > 0 && (
                        <span className="text-zinc-400 ml-1.5">#{tx.tags.join(' #')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date Column */}
                <div className="col-span-3 sm:col-span-2 text-xs text-zinc-300">
                  <div className="font-medium">{tx.date}</div>
                  {tx.isRecurring && (
                    <span className="text-[10px] text-indigo-400 font-semibold block">Recurring</span>
                  )}
                </div>

                {/* Category & Account (Desktop) */}
                <div className="col-span-2 hidden md:block text-xs truncate">
                  <div className="font-semibold text-zinc-200 truncate">{tx.category}</div>
                  <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                    <span>{accObj?.name || 'Main Account'}</span>
                    {projObj && (
                      <span className="text-purple-400 font-semibold">[{projObj.name}]</span>
                    )}
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="col-span-4 sm:col-span-3 md:col-span-3 text-right">
                  <div className={`font-bold text-xs sm:text-sm font-mono ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(convertCurrency(tx.amount, tx.currency, currency), currency, security.privacyMode)}
                  </div>
                  {tx.currency !== currency && (
                    <div className="text-[10px] text-zinc-400 font-mono">
                      ({tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount, tx.currency, security.privacyMode)})
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-1.5 mt-1 sm:opacity-75 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      id={`edit-tx-${tx.id}`}
                      onClick={() => onEditExpense(tx)}
                      className="p-1.5 rounded-lg bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632] cursor-pointer"
                      title="Edit Transaction"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-400" />
                    </button>
                    <button
                      id={`duplicate-tx-${tx.id}`}
                      onClick={() => handleDuplicate(tx)}
                      className="p-1.5 rounded-lg bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632] cursor-pointer hidden sm:block"
                      title="Duplicate Transaction"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      id={`delete-tx-${tx.id}`}
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1.5 rounded-lg bg-[#181820] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-[#262632] cursor-pointer"
                      title="Delete Transaction"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Itemized Line Items & Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#101014] border border-[#22222A] rounded-2xl p-6 shadow-2xl text-zinc-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveReceiptModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#181820]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{activeReceiptModal.merchant}</h3>
                <p className="text-xs text-zinc-400">{activeReceiptModal.date} • {activeReceiptModal.category}</p>
              </div>
            </div>

            <div className="bg-[#0A0A0D] rounded-xl p-4 border border-[#202028] mb-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-zinc-400 pb-2 border-b border-[#202028] text-[10px] uppercase">
                <span>Item Description</span>
                <span>Price</span>
              </div>
              {activeReceiptModal.lineItems?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-zinc-200">
                  <div className="truncate">
                    <span className="font-medium">{item.name}</span>
                    {item.quantity > 1 && (
                      <span className="text-[10px] text-zinc-400 ml-1.5">x{item.quantity}</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold">
                    {formatMoney(item.price * (item.quantity || 1), activeReceiptModal.currency)}
                  </span>
                </div>
              ))}
              
              {activeReceiptModal.tax !== undefined && activeReceiptModal.tax > 0 && (
                <div className="flex justify-between pt-2 border-t border-[#1E1E26] text-zinc-400">
                  <span>Sales Tax</span>
                  <span className="font-mono">{formatMoney(activeReceiptModal.tax, activeReceiptModal.currency)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-[#1E1E26] text-sm font-bold text-white">
                <span>Total</span>
                <span className="text-emerald-400 font-mono">
                  {formatMoney(activeReceiptModal.amount, activeReceiptModal.currency)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveReceiptModal(null)}
              className="w-full py-2.5 bg-[#181820] hover:bg-[#1E1E28] border border-[#262632] text-white font-semibold text-xs rounded-xl"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
