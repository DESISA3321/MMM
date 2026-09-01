export type ViewMode = 'regular' | 'all' | 'projects';

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'auto-tracker'
  | 'analytics'
  | 'ai-assistant'
  | 'scanner'
  | 'statement-import'
  | 'projects'
  | 'recurring'
  | 'categories'
  | 'accounts'
  | 'settings'
  | 'security';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'INR' | 'CHF';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToUSD: number; // e.g., EUR = 1.08, USD = 1.0, JPY = 0.0067
}

export interface LineItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type?: TransactionType; // 'expense' | 'income', default 'expense'
  date: string; // YYYY-MM-DD
  merchant: string; // Store / Vendor / Payee / Income Source
  amount: number; // in base transaction currency
  currency: CurrencyCode;
  amountInUSD: number; // normalized
  category: string;
  subcategory?: string;
  accountId: string;
  tags: string[];
  projectId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
  receiptImage?: string; // base64 or URL
  lineItems?: LineItem[];
  paymentMethod?: string;
  tax?: number;
  tip?: number;
  aiCategorized?: boolean;
  clearSpendsConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
  monthlyBudget?: number;
  isCustom?: boolean;
  type?: 'expense' | 'income' | 'both';
  rulesKeywords?: string[]; // keywords for auto-categorization
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'credit' | 'savings' | 'cash' | 'investment' | 'wallet';
  currency: CurrencyCode;
  balance: number;
  initialBalance: number;
  accountNumberMasked?: string;
  color: string;
  institution?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  currency: CurrencyCode;
  startDate: string;
  endDate?: string;
  color: string;
  icon: string;
  status: 'active' | 'completed' | 'archived';
  categoryIds?: string[];
}

export interface RecurringExpense {
  id: string;
  name: string;
  merchant: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  accountId: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: string;
  billingDayOfMonth?: number;
  status: 'active' | 'paused' | 'cancelled';
  autoLog: boolean;
  notes?: string;
}

export interface SpendingForecast {
  forecastTotal: number;
  confidenceScore: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  projectedSavings: number;
  riskFactors: string[];
  categoryForecasts: {
    category: string;
    projected: number;
    risk: 'low' | 'medium' | 'high';
  }[];
  actionableAdvice: string[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'log_expense' | 'view_chart' | 'export_report';
    data?: any;
    label: string;
  };
}

export interface SecuritySettings {
  isPasscodeEnabled: boolean;
  passcodeHash?: string;
  autoLockMinutes: number;
  isEncrypted: boolean;
  lastBackupDate?: string;
  autoCloudBackup: boolean;
  privacyMode: boolean; // hide sensitive amounts
}

export interface AppSettings {
  defaultCurrency: CurrencyCode;
  theme: 'dark' | 'light' | 'system';
  accentColor: string; // 'emerald' | 'indigo' | 'violet' | 'amber' | 'cyan' | 'rose'
  compactMode: boolean;
  showAiBadges: boolean;
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
}
