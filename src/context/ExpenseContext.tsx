import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Account,
  AppSettings,
  Category,
  CurrencyCode,
  Project,
  RecurringExpense,
  SecuritySettings,
  Transaction,
  ViewMode,
  ActiveTab,
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_PROJECTS,
  INITIAL_RECURRING,
  INITIAL_TRANSACTIONS,
} from '../utils/mockData';
import { convertCurrency } from '../utils/currencies';
import { exportEncryptedVault, verifyPasscode } from '../utils/security';

interface ExpenseContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  // Data Collections
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  projects: Project[];
  recurring: RecurringExpense[];

  // Currency & Settings
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;

  // Filters & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  accountFilter: string;
  setAccountFilter: (account: string) => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  dateRangeFilter: { start: string; end: string };
  setDateRangeFilter: (range: { start: string; end: string }) => void;
  clearAllFilters: () => void;

  // Transaction Operations
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'amountInUSD'>) => Transaction;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  importBatchTransactions: (txs: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'amountInUSD'>[]) => number;

  // Category Operations
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string, reassignToCategory?: string) => void;

  // Account Operations
  addAccount: (account: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Project Operations
  addProject: (project: Omit<Project, 'id'>) => Project;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Recurring Operations
  addRecurring: (rec: Omit<RecurringExpense, 'id'>) => RecurringExpense;
  updateRecurring: (id: string, rec: Partial<RecurringExpense>) => void;
  deleteRecurring: (id: string) => void;
  toggleRecurringStatus: (id: string) => void;

  // ClearSpends AI Smart Categorizer
  clearSpendsCategorize: (merchantName: string, notes?: string) => { category: string; subcategory?: string; confidence: number };

  // Security & Cloud Sync
  security: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  isVaultLocked: boolean;
  unlockVault: (passcode: string) => Promise<boolean>;
  lockVault: () => void;
  isCloudSyncing: boolean;
  lastCloudBackup: string | null;
  triggerCloudBackup: () => Promise<boolean>;
  restoreCloudBackup: () => Promise<boolean>;
  resetAllDataToDefaults: () => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Core Data loaded from localStorage with robust initial fallback
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('clearspends_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('clearspends_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('clearspends_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('clearspends_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [recurring, setRecurring] = useState<RecurringExpense[]>(() => {
    const saved = localStorage.getItem('clearspends_recurring');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING;
  });

  // Settings
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('clearspends_settings');
    return saved
      ? JSON.parse(saved)
      : {
          defaultCurrency: 'USD',
          theme: 'dark',
          accentColor: 'emerald',
          compactMode: false,
          showAiBadges: true,
          dateFormat: 'YYYY-MM-DD',
        };
  });

  const [currency, setCurrency] = useState<CurrencyCode>(appSettings.defaultCurrency);

  // Security
  const [security, setSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem('clearspends_security');
    return saved
      ? JSON.parse(saved)
      : {
          isPasscodeEnabled: false,
          passcodeHash: undefined,
          autoLockMinutes: 15,
          isEncrypted: true,
          autoCloudBackup: true,
          privacyMode: false,
        };
  });

  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(() => {
    return Boolean(security.isPasscodeEnabled && security.passcodeHash);
  });

  // Cloud Sync state
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudBackup, setLastCloudBackup] = useState<string | null>(() => {
    return localStorage.getItem('clearspends_last_backup') || new Date().toISOString();
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });

  // Save to localStorage whenever core states change
  useEffect(() => {
    localStorage.setItem('clearspends_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('clearspends_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('clearspends_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('clearspends_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('clearspends_recurring', JSON.stringify(recurring));
  }, [recurring]);

  useEffect(() => {
    localStorage.setItem('clearspends_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  useEffect(() => {
    localStorage.setItem('clearspends_security', JSON.stringify(security));
  }, [security]);

  // ClearSpends AI Smart Categorization Rules Engine
  const clearSpendsCategorize = (merchantName: string, notes: string = '') => {
    const combined = `${merchantName} ${notes}`.toLowerCase();
    for (const cat of categories) {
      if (cat.rulesKeywords && cat.rulesKeywords.length > 0) {
        for (const kw of cat.rulesKeywords) {
          if (combined.includes(kw.toLowerCase())) {
            // Find best subcategory matching keyword if possible
            let sub = cat.subcategories[0] || undefined;
            for (const s of cat.subcategories) {
              if (combined.includes(s.toLowerCase())) {
                sub = s;
                break;
              }
            }
            return {
              category: cat.name,
              subcategory: sub,
              confidence: 0.96,
            };
          }
        }
      }
    }
    // Default fallback
    return {
      category: 'Dining & Food',
      subcategory: 'General',
      confidence: 0.5,
    };
  };

  // Automatic Cloud Backup to Express Backend
  const triggerCloudBackup = async (): Promise<boolean> => {
    setIsCloudSyncing(true);
    try {
      const payload = {
        transactions,
        categories,
        accounts,
        projects,
        recurring,
        settings: appSettings,
        backupDate: new Date().toISOString(),
      };

      const encryptedVault = exportEncryptedVault(payload);
      const res = await fetch('/api/cloud-backup/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_vault_primary',
          encryptedVault,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        const now = new Date().toISOString();
        setLastCloudBackup(now);
        localStorage.setItem('clearspends_last_backup', now);
        setIsCloudSyncing(false);
        return true;
      }
    } catch (e) {
      console.warn('Cloud backup error:', e);
    }
    setIsCloudSyncing(false);
    return false;
  };

  const restoreCloudBackup = async (): Promise<boolean> => {
    setIsCloudSyncing(true);
    try {
      const res = await fetch('/api/cloud-backup/retrieve/user_vault_primary');
      const data = await res.json();
      if (data && data.found && data.encryptedVault) {
        // Vault found
        setLastCloudBackup(data.timestamp);
        setIsCloudSyncing(false);
        return true;
      }
    } catch (e) {
      console.warn('Cloud restore error:', e);
    }
    setIsCloudSyncing(false);
    return false;
  };

  // Trigger background cloud backup debounced when data updates if autoCloudBackup is true
  useEffect(() => {
    if (security.autoCloudBackup) {
      const timer = setTimeout(() => {
        triggerCloudBackup();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [transactions.length, categories.length, projects.length]);

  // Transaction Actions
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'amountInUSD'>): Transaction => {
    const txType = txData.type || 'expense';
    const amountInUSD = convertCurrency(txData.amount, txData.currency, 'USD');
    const newTx: Transaction = {
      ...txData,
      type: txType,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      amountInUSD,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update account balance: Incomes add to balance, expenses subtract
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === txData.accountId) {
          const delta = convertCurrency(txData.amount, txData.currency, acc.currency);
          return {
            ...acc,
            balance: txType === 'income' ? acc.balance + delta : acc.balance - delta,
          };
        }
        return acc;
      })
    );

    return newTx;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === id) {
          const updated = { ...tx, ...updates, updatedAt: new Date().toISOString() };
          if (updates.amount !== undefined || updates.currency !== undefined) {
            updated.amountInUSD = convertCurrency(
              updated.amount,
              updated.currency,
              'USD'
            );
          }
          return updated;
        }
        return tx;
      })
    );
  };

  const deleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (txToDelete) {
      const isIncome = txToDelete.type === 'income';
      // Revert account balance
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === txToDelete.accountId) {
            const delta = convertCurrency(txToDelete.amount, txToDelete.currency, acc.currency);
            return {
              ...acc,
              balance: isIncome ? acc.balance - delta : acc.balance + delta,
            };
          }
          return acc;
        })
      );
    }
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const importBatchTransactions = (batch: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'amountInUSD'>[]): number => {
    const newTxs: Transaction[] = batch.map((item, idx) => ({
      ...item,
      id: `tx-import-${Date.now()}-${idx}`,
      amountInUSD: convertCurrency(item.amount, item.currency, 'USD'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setTransactions((prev) => [...newTxs, ...prev]);
    return newTxs.length;
  };

  // Category Actions
  const addCategory = (catData: Omit<Category, 'id'>): Category => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCategory = (id: string, reassignToCategory?: string) => {
    const catToDelete = categories.find((c) => c.id === id);
    if (!catToDelete) return;
    const fallbackCategory = reassignToCategory || 'Miscellaneous';

    // Reassign existing transactions with this category name
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.category === catToDelete.name ? { ...tx, category: fallbackCategory } : tx
      )
    );

    // Reassign recurring expenses with this category name
    setRecurring((prev) =>
      prev.map((rec) =>
        rec.category === catToDelete.name ? { ...rec, category: fallbackCategory } : rec
      )
    );

    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Account Actions
  const addAccount = (accData: Omit<Account, 'id'>): Account => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}`,
    };
    setAccounts((prev) => [...prev, newAcc]);
    return newAcc;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  // Project Actions
  const addProject = (projData: Omit<Project, 'id'>): Project => {
    const newProj: Project = {
      ...projData,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [...prev, newProj]);
    return newProj;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Remove project reference from transactions
    setTransactions((prev) =>
      prev.map((tx) => (tx.projectId === id ? { ...tx, projectId: undefined } : tx))
    );
  };

  // Recurring Actions
  const addRecurring = (recData: Omit<RecurringExpense, 'id'>): RecurringExpense => {
    const newRec: RecurringExpense = {
      ...recData,
      id: `rec-${Date.now()}`,
    };
    setRecurring((prev) => [...prev, newRec]);
    return newRec;
  };

  const updateRecurring = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRecurring = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleRecurringStatus = (id: string) => {
    setRecurring((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextStatus = r.status === 'active' ? 'paused' : 'active';
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    setAppSettings((prev) => ({ ...prev, ...newSettings }));
    if (newSettings.defaultCurrency) {
      setCurrency(newSettings.defaultCurrency);
    }
  };

  const updateSecuritySettings = (newSecurity: Partial<SecuritySettings>) => {
    setSecurity((prev) => ({ ...prev, ...newSecurity }));
  };

  const unlockVault = async (passcode: string): Promise<boolean> => {
    if (!security.passcodeHash) {
      setIsVaultLocked(false);
      return true;
    }
    const isValid = await verifyPasscode(passcode, security.passcodeHash);
    if (isValid) {
      setIsVaultLocked(false);
      return true;
    }
    return false;
  };

  const lockVault = () => {
    setIsVaultLocked(true);
  };

  const resetAllDataToDefaults = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(INITIAL_CATEGORIES);
    setAccounts(INITIAL_ACCOUNTS);
    setProjects(INITIAL_PROJECTS);
    setRecurring(INITIAL_RECURRING);
    localStorage.removeItem('clearspends_transactions');
    localStorage.removeItem('clearspends_categories');
    localStorage.removeItem('clearspends_accounts');
    localStorage.removeItem('clearspends_projects');
    localStorage.removeItem('clearspends_recurring');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setAccountFilter('all');
    setTagFilter('all');
    setDateRangeFilter({ start: '', end: '' });
  };

  // Filtered Transactions derivation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. View mode filter:
      // 'regular' = non-project transactions
      // 'projects' = only transactions attached to a project
      // 'all' = everything
      if (viewMode === 'regular' && tx.projectId) {
        return false;
      }
      if (viewMode === 'projects' && !tx.projectId) {
        return false;
      }
      if (selectedProjectId && tx.projectId !== selectedProjectId) {
        return false;
      }

      // 2. Search query filter (merchant, notes, category, line items)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMerchant = tx.merchant.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        const matchesSubcategory = tx.subcategory?.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        const matchesTags = tx.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesLineItems = tx.lineItems?.some((li) => li.name.toLowerCase().includes(q));
        if (!matchesMerchant && !matchesCategory && !matchesSubcategory && !matchesNotes && !matchesTags && !matchesLineItems) {
          return false;
        }
      }

      // 3. Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // 4. Account Filter
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) {
        return false;
      }

      // 5. Tag Filter
      if (tagFilter !== 'all' && (!tx.tags || !tx.tags.includes(tagFilter))) {
        return false;
      }

      // 6. Date Range Filter
      if (dateRangeFilter.start && tx.date < dateRangeFilter.start) {
        return false;
      }
      if (dateRangeFilter.end && tx.date > dateRangeFilter.end) {
        return false;
      }

      return true;
    });
  }, [transactions, viewMode, selectedProjectId, searchQuery, categoryFilter, accountFilter, tagFilter, dateRangeFilter]);

  return (
    <ExpenseContext.Provider
      value={{
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        selectedProjectId,
        setSelectedProjectId,
        transactions,
        filteredTransactions,
        categories,
        accounts,
        projects,
        recurring,
        currency,
        setCurrency,
        appSettings,
        updateAppSettings,
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
        addTransaction,
        updateTransaction,
        deleteTransaction,
        importBatchTransactions,
        addCategory,
        updateCategory,
        deleteCategory,
        addAccount,
        updateAccount,
        deleteAccount,
        addProject,
        updateProject,
        deleteProject,
        addRecurring,
        updateRecurring,
        deleteRecurring,
        toggleRecurringStatus,
        clearSpendsCategorize,
        security,
        updateSecuritySettings,
        isVaultLocked,
        unlockVault,
        lockVault,
        isCloudSyncing,
        lastCloudBackup,
        triggerCloudBackup,
        restoreCloudBackup,
        resetAllDataToDefaults,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
