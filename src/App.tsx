/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionListView } from './components/transactions/TransactionListView';
import { AutoTrackerView } from './components/autotracker/AutoTrackerView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AIAssistantView } from './components/ai/AIAssistantView';
import { ReceiptScannerView } from './components/scanner/ReceiptScannerView';
import { StatementImportView } from './components/import/StatementImportView';
import { ProjectsView } from './components/projects/ProjectsView';
import { RecurringView } from './components/recurring/RecurringView';
import { CategoriesView } from './components/categories/CategoriesView';
import { AccountsView } from './components/accounts/AccountsView';
import { SecurityView } from './components/security/SecurityView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionModal } from './components/modals/TransactionModal';
import { PasscodeLockScreen } from './components/security/PasscodeLockScreen';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { Transaction } from './types';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab } = useExpense();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [modalTxType, setModalTxType] = useState<'expense' | 'income'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [initialNaturalText, setInitialNaturalText] = useState<string | undefined>(undefined);

  const handleOpenAddExpense = () => {
    setEditingTransaction(null);
    setModalTxType('expense');
    setInitialNaturalText(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenAddIncome = () => {
    setEditingTransaction(null);
    setModalTxType('income');
    setInitialNaturalText(undefined);
    setIsTxModalOpen(true);
  };

  const handleEditExpense = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalTxType(tx.type || 'expense');
    setInitialNaturalText(undefined);
    setIsTxModalOpen(true);
  };

  const handleOpenQuickNL = (text?: string) => {
    setEditingTransaction(null);
    setModalTxType('expense');
    setInitialNaturalText(text || '');
    setIsTxModalOpen(true);
  };

  const handleOpenScanner = () => {
    setActiveTab('scanner');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Passcode Lock Screen Barrier (if active) */}
      <PasscodeLockScreen />

      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Top Header Bar */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header
          onOpenMobileMenu={() => setIsSidebarOpen(true)}
          onOpenAddExpense={handleOpenAddExpense}
          onOpenScanner={handleOpenScanner}
          onOpenQuickNL={handleOpenQuickNL}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 md:p-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
              onEditExpense={handleEditExpense}
              onOpenScanner={handleOpenScanner}
              onOpenQuickNL={() => handleOpenQuickNL()}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionListView
              onOpenAddExpense={handleOpenAddExpense}
              onOpenAddIncome={handleOpenAddIncome}
              onEditExpense={handleEditExpense}
              onOpenScanner={handleOpenScanner}
            />
          )}

          {activeTab === 'auto-tracker' && (
            <AutoTrackerView
              onOpenAddExpense={handleOpenAddExpense}
              onEditExpense={handleEditExpense}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'ai-assistant' && <AIAssistantView />}

          {activeTab === 'scanner' && <ReceiptScannerView />}

          {activeTab === 'statement-import' && <StatementImportView />}

          {activeTab === 'projects' && <ProjectsView />}

          {activeTab === 'recurring' && <RecurringView />}

          {activeTab === 'categories' && <CategoriesView />}

          {activeTab === 'accounts' && <AccountsView />}

          {activeTab === 'security' && <SecurityView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Transaction Modal (Add / Edit / NL Parse) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
          setInitialNaturalText(undefined);
        }}
        initialTransaction={editingTransaction}
        initialNaturalText={initialNaturalText}
        initialType={modalTxType}
      />

    </div>
  );
};

export default function App() {
  return (
    <ExpenseProvider>
      <MainAppContent />
    </ExpenseProvider>
  );
}
