import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatMoney, convertCurrency, CURRENCIES, CurrencyCode } from '../../utils/currencies';
import { Project } from '../../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    transactions,
    currency,
    addProject,
    updateProject,
    deleteProject,
    setViewMode,
    setSelectedProjectId,
    setActiveTab,
    security,
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('2500');
  const [projCurrency, setProjCurrency] = useState<CurrencyCode>('USD');
  const [color, setColor] = useState('#8b5cf6');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');

  // Compute spend stats per project
  const projectStats = useMemo(() => {
    return projects.map((p) => {
      const projTxs = transactions.filter((t) => t.projectId === p.id);
      const spentTotal = projTxs.reduce((sum, tx) => {
        return sum + convertCurrency(tx.amount, tx.currency, p.currency);
      }, 0);

      const percent = p.budget > 0 ? (spentTotal / p.budget) * 100 : 0;
      const remaining = Math.max(0, p.budget - spentTotal);

      return {
        ...p,
        spentTotal,
        txCount: projTxs.length,
        percent: Math.round(percent),
        remaining,
        isOverBudget: spentTotal > p.budget,
      };
    });
  }, [projects, transactions]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setBudget('2000');
    setProjCurrency(currency);
    setColor('#8b5cf6');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setDescription(p.description || '');
    setBudget(String(p.budget));
    setProjCurrency(p.currency);
    setColor(p.color);
    setStartDate(p.startDate);
    setEndDate(p.endDate || '');
    setStatus(p.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProject) {
      updateProject(editingProject.id, {
        name,
        description,
        budget: parseFloat(budget) || 0,
        currency: projCurrency,
        color,
        startDate,
        endDate: endDate || undefined,
        status,
      });
    } else {
      addProject({
        name,
        description,
        budget: parseFloat(budget) || 0,
        currency: projCurrency,
        color,
        startDate,
        endDate: endDate || undefined,
        status,
      });
    }

    setIsModalOpen(false);
  };

  const handleViewProjectTransactions = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewMode('projects');
    setActiveTab('transactions');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D0D10] p-4 sm:p-5 rounded-2xl border border-[#1E1E24] shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span>Project-Based Expense Tracking</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Isolate budgets and track spending for trips, client deliverables, home renovations, and events.
          </p>
        </div>

        <button
          id="create-new-project-btn"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-950/50 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projectStats.map((p) => (
          <div
            key={p.id}
            className="bg-[#111115] rounded-2xl p-5 border border-[#202028] hover:border-[#2A2A38] shadow-xs flex flex-col justify-between space-y-4 group transition"
          >
            <div className="space-y-3">
              
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className="w-3.5 h-3.5 rounded-md shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <h3 className="font-bold text-sm text-white truncate">{p.name}</h3>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="p-1 rounded bg-[#181820] hover:bg-[#22222E] text-zinc-300 hover:text-white border border-[#262632]"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete project "${p.name}"? Transactions will remain in ledger.`)) {
                        deleteProject(p.id);
                      }
                    }}
                    className="p-1 rounded bg-[#181820] hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-[#262632]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {p.description && (
                <p className="text-xs text-zinc-400 line-clamp-2">{p.description}</p>
              )}

              {/* Progress & Budget */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Budget Spent</span>
                  <span className="font-mono font-bold text-white">
                    {formatMoney(p.spentTotal, p.currency, security.privacyMode)} / {formatMoney(p.budget, p.currency, security.privacyMode)}
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-[#181820] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.isOverBudget
                        ? 'bg-rose-500'
                        : p.percent > 85
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(p.percent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{p.percent}% used</span>
                  <span>{formatMoney(p.remaining, p.currency, security.privacyMode)} remaining</span>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="pt-3 border-t border-[#1E1E26] flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">{p.txCount} transactions</span>
              <button
                onClick={() => handleViewProjectTransactions(p.id)}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <span>View Transactions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Modal for Project Create/Edit */}
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
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kyoto Trip 2026 or Kitchen Remodel"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes about target deliverables or itinerary"
                  className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Budget Allocation</label>
                  <input
                    type="number"
                    step="1"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-white font-mono font-bold focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Currency</label>
                  <select
                    value={projCurrency}
                    onChange={(e) => setProjCurrency(e.target.value as CurrencyCode)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-purple-500 focus:outline-hidden"
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
                  <label className="block text-zinc-400 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Target End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-[#0A0A0D] border border-[#202028] rounded-xl text-zinc-200 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Color Marker</label>
                <div className="flex items-center gap-2">
                  {['#8b5cf6', '#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#06b6d4'].map((col) => (
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950/50 cursor-pointer transition"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
