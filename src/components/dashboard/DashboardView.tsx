import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Camera,
  Bot,
  Briefcase,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  SmartphoneNfc,
  ChevronDown,
  Edit2,
  Trash2,
  Flame,
  Tag,
  Receipt,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useExpense } from '../../context/ExpenseContext';
import { formatMoney, convertCurrency } from '../../utils/currencies';
import { CategoryIcon } from '../common/CategoryIcon';
import { ViewMode, Transaction } from '../../types';

interface DashboardViewProps {
  onOpenAddExpense: () => void;
  onOpenAddIncome?: () => void;
  onOpenScanner: () => void;
  onOpenQuickNL: () => void;
  onEditExpense?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddExpense,
  onOpenAddIncome,
  onOpenScanner,
  onOpenQuickNL,
  onEditExpense,
}) => {
  const {
    transactions,
    filteredTransactions,
    categories,
    projects,
    recurring,
    currency,
    viewMode,
    setViewMode,
    setActiveTab,
    deleteTransaction,
    security,
  } = useExpense();

  // Filter timeframe for Most Spent Categories
  const [topCategoryTimeframe, setTopCategoryTimeframe] = useState<'all' | 'this_month' | 'last_month'>('this_month');
  const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(null);

  // Current Date calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
  const currentYearMonth = `${currentYear}-${currentMonthStr}`;

  // Last Month calculation
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYearMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // 1. Calculations: Total Expenses vs Total Income
  const { totalLifetimeExpense, totalLifetimeIncome, netCashFlow } = useMemo(() => {
    let expenseSum = 0;
    let incomeSum = 0;
    filteredTransactions.forEach((tx) => {
      const converted = convertCurrency(tx.amount, tx.currency, currency);
      if (tx.type === 'income') {
        incomeSum += converted;
      } else {
        expenseSum += converted;
      }
    });
    return {
      totalLifetimeExpense: expenseSum,
      totalLifetimeIncome: incomeSum,
      netCashFlow: incomeSum - expenseSum,
    };
  }, [filteredTransactions, currency]);

  // 2. This Month spending and income
  const { thisMonthTotalExpenses, thisMonthTotalIncome, thisMonthSavings, thisMonthSavingsRate } = useMemo(() => {
    let expSum = 0;
    let incSum = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.date.startsWith(currentYearMonth)) {
        const converted = convertCurrency(tx.amount, tx.currency, currency);
        if (tx.type === 'income') {
          incSum += converted;
        } else {
          expSum += converted;
        }
      }
    });
    const savings = incSum - expSum;
    const rate = incSum > 0 ? (savings / incSum) * 100 : 0;
    return {
      thisMonthTotalExpenses: expSum,
      thisMonthTotalIncome: incSum,
      thisMonthSavings: savings,
      thisMonthSavingsRate: rate,
    };
  }, [filteredTransactions, currentYearMonth, currency]);

  // 3. Last Month spending
  const lastMonthExpenses = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.date.startsWith(lastYearMonth) && tx.type !== 'income');
  }, [filteredTransactions, lastYearMonth]);

  const lastMonthTotal = useMemo(() => {
    return lastMonthExpenses.reduce((sum, tx) => {
      return sum + convertCurrency(tx.amount, tx.currency, currency);
    }, 0);
  }, [lastMonthExpenses, currency]);

  // Month-over-Month percentage diff for expenses
  const momChangePercent = useMemo(() => {
    if (lastMonthTotal === 0) return 0;
    return ((thisMonthTotalExpenses - lastMonthTotal) / lastMonthTotal) * 100;
  }, [thisMonthTotalExpenses, lastMonthTotal]);

  // 4. Average Transaction & Count
  const expenseTxs = useMemo(() => filteredTransactions.filter((tx) => tx.type !== 'income'), [filteredTransactions]);
  const averageExpense = expenseTxs.length > 0 ? totalLifetimeExpense / expenseTxs.length : 0;

  // 5. Spending by Category (Donut Chart Data)
  const categoryDonutData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string; count: number }>();

    expenseTxs.forEach((tx) => {
      const converted = convertCurrency(tx.amount, tx.currency, currency);
      const catObj = categories.find((c) => c.name.toLowerCase() === tx.category.toLowerCase());
      const catColor = catObj ? catObj.color : '#94a3b8';
      const catName = tx.category || 'Other';

      if (map.has(catName)) {
        const item = map.get(catName)!;
        item.value += converted;
        item.count += 1;
      } else {
        map.set(catName, {
          name: catName,
          value: converted,
          color: catColor,
          count: 1,
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        ...item,
        percentage: totalLifetimeExpense > 0 ? (item.value / totalLifetimeExpense) * 100 : 0,
      }));
  }, [expenseTxs, categories, currency, totalLifetimeExpense]);

  // 6. Most Spent Categories with Deep-Dive Transactions
  const mostSpentCategoriesData = useMemo(() => {
    // Filter transactions based on selected timeframe (only expenses)
    let targetTxs = expenseTxs;
    if (topCategoryTimeframe === 'this_month') {
      targetTxs = expenseTxs.filter((tx) => tx.date.startsWith(currentYearMonth));
    } else if (topCategoryTimeframe === 'last_month') {
      targetTxs = expenseTxs.filter((tx) => tx.date.startsWith(lastYearMonth));
    }

    const totalPeriodSpend = targetTxs.reduce((sum, tx) => {
      return sum + convertCurrency(tx.amount, tx.currency, currency);
    }, 0);

    const map = new Map<
      string,
      {
        name: string;
        totalSpent: number;
        transactions: Transaction[];
        catObj?: (typeof categories)[0];
        percentage: number;
      }
    >();

    targetTxs.forEach((tx) => {
      const converted = convertCurrency(tx.amount, tx.currency, currency);
      const catName = tx.category || 'Miscellaneous';

      if (!map.has(catName)) {
        const catObj = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase());
        map.set(catName, {
          name: catName,
          totalSpent: 0,
          transactions: [],
          catObj,
          percentage: 0,
        });
      }

      const entry = map.get(catName)!;
      entry.totalSpent += converted;
      entry.transactions.push(tx);
    });

    const list = Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);

    list.forEach((item) => {
      item.percentage = totalPeriodSpend > 0 ? (item.totalSpent / totalPeriodSpend) * 100 : 0;
      item.transactions.sort((a, b) => b.date.localeCompare(a.date));
    });

    return { list, totalPeriodSpend };
  }, [expenseTxs, topCategoryTimeframe, currentYearMonth, lastYearMonth, categories, currency]);

  // Auto select highest spent category if none selected
  const activeCategoryDetail = useMemo(() => {
    if (!mostSpentCategoriesData.list.length) return null;
    if (selectedTopCategory) {
      return mostSpentCategoriesData.list.find((c) => c.name === selectedTopCategory) || mostSpentCategoriesData.list[0];
    }
    return mostSpentCategoriesData.list[0];
  }, [mostSpentCategoriesData, selectedTopCategory]);

  // 7. Monthly Spending Trend Line/Area Chart Data
  const monthlyTrendData = useMemo(() => {
    const monthMap = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, 0);
    }

    filteredTransactions.forEach((tx) => {
      const key = tx.date.substring(0, 7);
      if (monthMap.has(key)) {
        const converted = convertCurrency(tx.amount, tx.currency, currency);
        monthMap.set(key, (monthMap.get(key) || 0) + converted);
      }
    });

    return Array.from(monthMap.entries()).map(([key, val]) => {
      const [y, m] = key.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short' });
      return {
        monthKey: key,
        monthLabel: label,
        amount: Math.round(val * 100) / 100,
      };
    });
  }, [filteredTransactions, currency]);

  // Upcoming bills
  const upcomingBills = useMemo(() => {
    return recurring
      .filter((r) => r.status === 'active')
      .sort((a, b) => (a.billingDayOfMonth || 1) - (b.billingDayOfMonth || 1))
      .slice(0, 3);
  }, [recurring]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E0E12] p-4 rounded-2xl border border-[#1F1F26] backdrop-blur-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Financial Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Live Ledger
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time income & expense tracking with automatic SMS & GPay transaction extraction
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAddIncome && (
            <button
              onClick={onOpenAddIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold shadow-xs transition cursor-pointer border border-emerald-500/40"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Add Income</span>
            </button>
          )}

          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/50 transition cursor-pointer border border-emerald-500/30"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center bg-[#09090B] p-1 rounded-xl border border-[#1E1E24] text-xs font-semibold">
            {(['all', 'regular', 'projects'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-emerald-600 text-white shadow-sm font-bold border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {mode === 'all' ? 'All Ledger' : mode === 'regular' ? 'Regular' : 'Projects'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1. KEY METRICS GRID (Net Balance, Monthly Spending, Monthly Income, Monthly Savings) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Net Cash Flow / Balance */}
        <div
          id="kpi-net-balance"
          className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm relative overflow-hidden group hover:border-[#2E2E38] hover:bg-[#141419] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Net Cash Flow</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              netCashFlow >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
              netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {netCashFlow >= 0 ? '+' : ''}{formatMoney(netCashFlow, currency, security.privacyMode)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
              <span>Lifetime Inflow vs Outflow</span>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Metric 2: This Month Spend + Comparison */}
        <div
          id="kpi-this-month-spend"
          className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm relative overflow-hidden group hover:border-[#2E2E38] hover:bg-[#141419] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Spending</span>
            <div className="w-8 h-8 rounded-xl bg-[#181820] border border-[#262632] flex items-center justify-center text-zinc-300">
              <Calendar className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {formatMoney(thisMonthTotalExpenses, currency, security.privacyMode)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {momChangePercent <= 0 ? (
                <span className="inline-flex items-center text-emerald-400 font-semibold gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {Math.abs(momChangePercent).toFixed(1)}% less
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-400 font-semibold gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +{momChangePercent.toFixed(1)}% more
                </span>
              )}
              <span className="text-zinc-500">vs last month</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Monthly Income */}
        <div
          id="kpi-monthly-income"
          className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm relative overflow-hidden group hover:border-[#2E2E38] hover:bg-[#141419] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Income</span>
            <div className="w-8 h-8 rounded-xl bg-[#181820] border border-[#262632] flex items-center justify-center text-zinc-300">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
              +{formatMoney(thisMonthTotalIncome, currency, security.privacyMode)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">Earned this month</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Monthly Net Savings & Savings Rate */}
        <div
          id="kpi-monthly-savings"
          className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm relative overflow-hidden group hover:border-[#2E2E38] hover:bg-[#141419] transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Monthly Savings</span>
            <div className="w-8 h-8 rounded-xl bg-[#181820] border border-[#262632] flex items-center justify-center text-zinc-300">
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${
              thisMonthSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {thisMonthSavings >= 0 ? '+' : ''}{formatMoney(thisMonthSavings, currency, security.privacyMode)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-purple-400">{thisMonthSavingsRate.toFixed(0)}%</span>
              <span>savings rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MOST SPENT CATEGORIES & TRANSACTIONS BREAKDOWN (Highlighted Feature) */}
      <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E1E26]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">Most Spent Categories & Transactions</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Deep-dive into top expenditure categories and inspect their exact itemized transactions
            </p>
          </div>

          {/* Timeframe Toggles */}
          <div className="flex items-center bg-[#09090D] p-1 rounded-xl border border-[#1E1E24] text-xs">
            <button
              onClick={() => setTopCategoryTimeframe('this_month')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                topCategoryTimeframe === 'this_month'
                  ? 'bg-[#1E1E28] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTopCategoryTimeframe('last_month')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                topCategoryTimeframe === 'last_month'
                  ? 'bg-[#1E1E28] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setTopCategoryTimeframe('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                topCategoryTimeframe === 'all'
                  ? 'bg-[#1E1E28] text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Most Spent Categories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mostSpentCategoriesData.list.slice(0, 4).map((cat, idx) => {
            const isSelected = activeCategoryDetail?.name === cat.name;
            const color = cat.catObj?.color || '#10b981';
            const icon = cat.catObj?.icon || 'Tag';

            return (
              <div
                key={cat.name}
                onClick={() => setSelectedTopCategory(cat.name)}
                className={`p-3.5 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#181822] border-emerald-500/60 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'bg-[#0E0E12] border-[#202028] hover:border-[#2E2E3C] hover:bg-[#141419]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <CategoryIcon name={icon} className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">{cat.name}</span>
                      <span className="text-[10px] text-zinc-400">{cat.transactions.length} transactions</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1A1A24] text-zinc-300 font-mono">
                    #{idx + 1}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-base font-extrabold text-white font-mono">
                    {formatMoney(cat.totalSpent, currency, security.privacyMode)}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#1F1F2C] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, cat.percentage)}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Top Category - Itemized Transactions Ledger */}
        {activeCategoryDetail && (
          <div className="bg-[#0A0A0D] rounded-xl p-4 border border-[#1E1E26] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-300">
                  Transactions in <span className="text-emerald-400 font-semibold">{activeCategoryDetail.name}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181822] text-zinc-400 font-mono">
                  {activeCategoryDetail.transactions.length} items ({topCategoryTimeframe === 'all' ? 'All Time' : topCategoryTimeframe === 'this_month' ? 'This Month' : 'Last Month'})
                </span>
              </div>

              <span className="text-xs font-bold font-mono text-zinc-300">
                Total: {formatMoney(activeCategoryDetail.totalSpent, currency, security.privacyMode)}
              </span>
            </div>

            <div className="divide-y divide-[#1A1A22] max-h-72 overflow-y-auto">
              {activeCategoryDetail.transactions.slice(0, 10).map((tx) => (
                <div
                  key={tx.id}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-[#121217] rounded-lg transition group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-emerald-400 transition">
                          {tx.merchant}
                        </span>
                        {tx.aiCategorized && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{tx.date}</span>
                        {tx.notes && <span>• {tx.notes}</span>}
                        {tx.tags && tx.tags.length > 0 && <span className="text-zinc-500">#{tx.tags[0]}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono text-white">
                      -{formatMoney(convertCurrency(tx.amount, tx.currency, currency), currency, security.privacyMode)}
                    </span>

                    {/* Edit Transaction Button */}
                    {onEditExpense && (
                      <button
                        onClick={() => onEditExpense(tx)}
                        className="p-1 rounded-lg bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632] cursor-pointer"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-3 h-3 text-emerald-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. CHARTS SECTION (Spending Trend & Spending by Category) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Spending Trend Chart (Line / Area Chart) */}
        <div className="lg:col-span-7 bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E26]">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Spending Trend Over Time</h2>
              <p className="text-[11px] text-zinc-400">Monthly expense trajectory and pattern</p>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 sm:h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F28" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#52525B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#121217] border border-[#262632] rounded-xl p-3 shadow-2xl text-xs">
                          <p className="font-bold text-zinc-200">{data.monthLabel} Total</p>
                          <p className="text-emerald-400 font-extrabold text-sm mt-1">
                            {formatMoney(data.amount, currency, security.privacyMode)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category (Donut Chart with Percentages) */}
        <div className="lg:col-span-5 bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E26]">
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Spending by Category</h2>
              <p className="text-[11px] text-zinc-400">Breakdown with percentage share</p>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-52 sm:h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDonutData.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryDonutData.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#111115" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#121217] border border-[#262632] rounded-xl p-3 shadow-2xl text-xs">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-zinc-200 mt-1">
                            {formatMoney(data.value, currency, security.privacyMode)} ({data.percentage.toFixed(1)}%)
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{data.count} transactions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top 3 Category Legend Chips */}
          <div className="space-y-1.5 pt-2 border-t border-[#1E1E26]">
            {categoryDonutData.slice(0, 3).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-zinc-300 truncate">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-zinc-200 shrink-0">
                  <span className="font-semibold">{formatMoney(cat.value, currency, security.privacyMode)}</span>
                  <span className="text-zinc-500 text-[10px]">({cat.percentage.toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. QUICK ACTIONS & RECENT TRANSACTIONS & UPCOMING BILLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Transactions List */}
        <div className="lg:col-span-8 bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Recent Transactions</h3>
              <p className="text-[11px] text-zinc-400">ClearSpends AI auto-categorized records</p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {filteredTransactions.slice(0, 5).map((tx) => {
              const catObj = categories.find((c) => c.name.toLowerCase() === tx.category.toLowerCase());
              const catColor = catObj ? catObj.color : '#94a3b8';
              const catIcon = catObj ? catObj.icon : 'CircleDot';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0C0C0F] hover:bg-[#16161C] border border-[#1E1E26] transition group"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: `${catColor}20`, color: catColor }}
                    >
                      <CategoryIcon name={catIcon} className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-100 truncate group-hover:text-emerald-400 transition">
                          {tx.merchant}
                        </span>
                        {tx.type === 'income' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wider">
                            Income
                          </span>
                        ) : (
                          tx.aiCategorized && (
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono hidden sm:inline"
                              title="Categorized automatically by ClearSpends AI"
                            >
                              AI
                            </span>
                          )
                        )}
                        {tx.projectId && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Project
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span className="truncate">{tx.category}</span>
                        {tx.tags && tx.tags.length > 0 && (
                          <span className="text-zinc-500 hidden md:inline">#{tx.tags[0]}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`font-bold text-xs font-mono ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatMoney(convertCurrency(tx.amount, tx.currency, currency), currency, security.privacyMode)}
                      </div>
                      {tx.currency !== currency && (
                        <div className="text-[10px] text-zinc-400 font-mono">
                          ({tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount, tx.currency, security.privacyMode)})
                        </div>
                      )}
                    </div>

                    {onEditExpense && (
                      <button
                        onClick={() => onEditExpense(tx)}
                        className="p-1.5 rounded-lg bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632] cursor-pointer"
                        title="Edit Transaction"
                      >
                        <Edit2 className="w-3 h-3 text-emerald-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launchpad & Upcoming Subscriptions */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Action Tiles */}
          <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setActiveTab('auto-tracker')}
                className="p-3 rounded-xl bg-[#15151A] hover:bg-[#1A1A22] border border-emerald-500/30 text-left transition group cursor-pointer"
              >
                <SmartphoneNfc className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Auto GPay/SMS</span>
                <span className="block text-[10px] text-emerald-400/80">Paste SMS / Alerts</span>
              </button>

              <button
                onClick={onOpenAddIncome || onOpenAddExpense}
                className="p-3 rounded-xl bg-[#15151A] hover:bg-[#1A1A22] border border-emerald-500/20 text-left transition group cursor-pointer"
              >
                <TrendingUp className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">+ Add Income</span>
                <span className="block text-[10px] text-zinc-400">Salary / Transfer</span>
              </button>

              <button
                onClick={onOpenAddExpense}
                className="p-3 rounded-xl bg-[#15151A] hover:bg-[#1A1A22] border border-[#22222C] text-left transition group cursor-pointer"
              >
                <Plus className="w-5 h-5 text-zinc-300 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">+ Add Expense</span>
                <span className="block text-[10px] text-zinc-400">Detailed Form</span>
              </button>

              <button
                onClick={onOpenScanner}
                className="p-3 rounded-xl bg-[#15151A] hover:bg-[#1A1A22] border border-[#22222C] text-left transition group cursor-pointer"
              >
                <Camera className="w-5 h-5 text-teal-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="block text-xs font-bold text-white">Scan Receipt</span>
                <span className="block text-[10px] text-zinc-400">Camera / OCR</span>
              </button>

              <button
                onClick={() => setActiveTab('ai-assistant')}
                className="p-3 rounded-xl bg-[#15151A] hover:bg-[#1A1A22] border border-[#22222C] text-left transition group cursor-pointer col-span-2"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-white">AI Financial Copilot</span>
                    <span className="block text-[10px] text-zinc-400">Chat, advice & natural language commands</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Upcoming Recurring Subscriptions */}
          <div className="bg-[#111115] rounded-2xl p-5 border border-[#202028] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Upcoming Renewals</span>
              </h4>
              <button
                onClick={() => setActiveTab('recurring')}
                className="text-[11px] text-zinc-400 hover:text-white"
              >
                View
              </button>
            </div>

            <div className="space-y-2">
              {upcomingBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0C0C0F] border border-[#1E1E26] text-xs"
                >
                  <div className="truncate">
                    <span className="font-semibold text-zinc-200 block truncate">{bill.name}</span>
                    <span className="text-[10px] text-zinc-400">
                      {bill.frequency === 'daily' ? 'Daily frequency' : `Day ${bill.billingDayOfMonth || 1} of month`}
                    </span>
                  </div>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatMoney(bill.amount, bill.currency, security.privacyMode)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
