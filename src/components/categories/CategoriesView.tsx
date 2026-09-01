import React, { useState, useMemo } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Zap,
  Sparkles,
  DollarSign,
  X,
  PlusCircle,
  AlertTriangle,
  Receipt,
  PieChart,
  Check,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { Category } from '../../types';
import { formatMoney, convertCurrency } from '../../utils/currencies';

export const CategoriesView: React.FC = () => {
  const {
    categories,
    transactions,
    currency,
    addCategory,
    updateCategory,
    deleteCategory,
    security,
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Delete Confirmation Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryName, setReassignCategoryName] = useState<string>('Miscellaneous');

  // Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('ShoppingCart');
  const [monthlyBudget, setMonthlyBudget] = useState('500');
  const [subcategoriesInput, setSubcategoriesInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');

  // Calculate current month spending per category
  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const categorySpendStats = useMemo(() => {
    const map: Record<string, { currentMonthSpend: number; totalCount: number }> = {};
    
    transactions.forEach((tx) => {
      const isThisMonth = tx.date.startsWith(currentMonthStr);
      const converted = convertCurrency(tx.amount, tx.currency, currency);

      if (!map[tx.category]) {
        map[tx.category] = { currentMonthSpend: 0, totalCount: 0 };
      }
      map[tx.category].totalCount += 1;
      if (isThisMonth) {
        map[tx.category].currentMonthSpend += converted;
      }
    });

    return map;
  }, [transactions, currentMonthStr, currency]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setColor('#10b981');
    setIcon('ShoppingCart');
    setMonthlyBudget('400');
    setSubcategoriesInput('Groceries, Snacks');
    setKeywordsInput('market, store, supermarket');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setMonthlyBudget(String(cat.monthlyBudget || 0));
    setSubcategoriesInput(cat.subcategories.join(', '));
    setKeywordsInput(cat.rulesKeywords?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (cat: Category) => {
    setCategoryToDelete(cat);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setReassignCategoryName(otherCats[0]?.name || 'Miscellaneous');
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id, reassignCategoryName);
      setCategoryToDelete(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const subcategories = subcategoriesInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const rulesKeywords = keywordsInput
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        color,
        icon,
        monthlyBudget: parseFloat(monthlyBudget) || 0,
        subcategories: subcategories.length > 0 ? subcategories : ['General'],
        rulesKeywords,
      });
    } else {
      addCategory({
        name: name.trim(),
        color,
        icon,
        monthlyBudget: parseFloat(monthlyBudget) || 0,
        subcategories: subcategories.length > 0 ? subcategories : ['General'],
        rulesKeywords,
      });
    }

    setIsModalOpen(false);
  };

  const availableIcons = [
    'UtensilsCrossed',
    'ShoppingCart',
    'Home',
    'Zap',
    'Car',
    'Film',
    'Repeat',
    'HeartPulse',
    'Plane',
    'Briefcase',
    'Laptop',
    'GraduationCap',
    'Sparkles',
    'CreditCard',
    'Wallet',
    'Coffee',
    'PiggyBank',
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D10] p-4 sm:p-5 rounded-2xl border border-[#1E1E24] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Tags className="w-4 h-4" />
            </div>
            <span>Manage Categories & Auto-Match Rules</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Create, edit, or delete spending categories. Set monthly budget limits and ClearSpends keyword auto-matching triggers.
          </p>
        </div>

        <button
          id="create-new-category-btn"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/50 transition cursor-pointer self-start sm:self-auto border border-emerald-500/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const stats = categorySpendStats[cat.name] || { currentMonthSpend: 0, totalCount: 0 };
          const budget = cat.monthlyBudget || 0;
          const pct = budget > 0 ? Math.min(100, (stats.currentMonthSpend / budget) * 100) : 0;
          const isOverBudget = budget > 0 && stats.currentMonthSpend > budget;

          return (
            <div
              key={cat.id}
              className="bg-[#111115] rounded-2xl p-5 border border-[#202028] hover:border-[#2A2A38] shadow-xs flex flex-col justify-between space-y-4 group transition"
            >
              <div className="space-y-3">
                
                {/* Category Card Header with visible Edit and Delete buttons */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Budget: {formatMoney(cat.monthlyBudget || 0, currency, security.privacyMode)}/mo
                      </span>
                    </div>
                  </div>

                  {/* Always accessible Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id={`edit-category-${cat.id}`}
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg bg-[#181820] hover:bg-[#242432] text-zinc-300 hover:text-white border border-[#262632] transition cursor-pointer"
                      title={`Edit ${cat.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                    </button>
                    <button
                      id={`delete-category-${cat.id}`}
                      onClick={() => handleOpenDelete(cat)}
                      className="p-1.5 rounded-lg bg-[#181820] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-[#262632] transition cursor-pointer"
                      title={`Delete ${cat.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spending Progress in Current Month */}
                <div className="bg-[#0A0A0D] p-2.5 rounded-xl border border-[#1E1E26] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">This Month:</span>
                    <span className={`font-mono font-bold ${isOverBudget ? 'text-rose-400' : 'text-zinc-200'}`}>
                      {formatMoney(stats.currentMonthSpend, currency, security.privacyMode)}
                      {budget > 0 && (
                        <span className="text-zinc-500 font-normal"> / {formatMoney(budget, currency, security.privacyMode)}</span>
                      )}
                    </span>
                  </div>
                  {budget > 0 && (
                    <div className="w-full bg-[#181820] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{stats.totalCount} total transactions</span>
                    {budget > 0 && <span>{Math.round(pct)}% of budget</span>}
                  </div>
                </div>

                {/* Subcategories Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Subcategories ({cat.subcategories.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.map((sub) => (
                      <span
                        key={sub}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#0A0A0D] text-zinc-300 border border-[#1E1E26]"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ClearSpends Auto-Categorization Keywords */}
                {cat.rulesKeywords && cat.rulesKeywords.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>Auto-Match Rules</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cat.rulesKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-mono"
                        >
                          *{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#1E1E26] text-[10px] text-zinc-500 flex items-center justify-between">
                <span>{cat.isCustom ? 'Custom Category' : 'Standard Category'}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal for Category Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#101014] border border-[#22222A] rounded-2xl p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#181820]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Tags className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white">
                {editingCategory ? `Edit Category "${editingCategory.name}"` : 'Create Custom Category'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Category Name</label>
                <input
                  id="category-modal-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fitness & Wellness"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white focus:border-emerald-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Monthly Budget ({currency})</label>
                  <input
                    type="number"
                    step="10"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-mono font-bold focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Select Icon</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500 focus:outline-hidden"
                  >
                    {availableIcons.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Color Marker</label>
                <div className="flex items-center gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#64748b'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === col ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">
                  Subcategories (Comma separated)
                </label>
                <input
                  type="text"
                  value={subcategoriesInput}
                  onChange={(e) => setSubcategoriesInput(e.target.value)}
                  placeholder="e.g. Gym Membership, Supplements, Equipment"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1 flex items-center gap-1 text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>ClearSpends Auto-Match Keywords</span>
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g. equinox, 24hour, planetfitness, creatine"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-emerald-500 focus:outline-hidden font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Transactions containing these words will be automatically assigned to this category.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#181820] text-zinc-300 rounded-xl border border-[#262632] hover:bg-[#22222E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="category-modal-save-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 cursor-pointer transition border border-emerald-500/30"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Transaction Reassignment */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#101014] border border-rose-900/40 rounded-2xl p-6 shadow-2xl text-zinc-100 relative">
            <button
              onClick={() => setCategoryToDelete(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#181820]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Category</h3>
                <p className="text-xs text-zinc-400">
                  Are you sure you want to delete <span className="text-rose-400 font-semibold">"{categoryToDelete.name}"</span>?
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#0A0A0D] p-3 rounded-xl border border-[#202028] space-y-2">
                <span className="text-zinc-300 font-semibold block">
                  Reassign existing transactions to:
                </span>
                <select
                  value={reassignCategoryName}
                  onChange={(e) => setReassignCategoryName(e.target.value)}
                  className="w-full p-2 bg-[#141418] border border-[#262632] rounded-lg text-white font-medium focus:border-emerald-500"
                >
                  {categories
                    .filter((c) => c.id !== categoryToDelete.id)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  <option value="Miscellaneous">Miscellaneous (Default)</option>
                </select>
                <p className="text-[11px] text-zinc-500">
                  Transactions tagged with this category will be smoothly reassigned to avoid orphaned records.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="px-4 py-2 bg-[#181820] text-zinc-300 rounded-xl border border-[#262632] hover:bg-[#22222E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-category-btn"
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 cursor-pointer transition border border-rose-500/30"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
