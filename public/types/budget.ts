export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Income {
  amount: number;
  frequency: PaymentFrequency;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  dueDate?: number; // Day of the month
  frequency: PaymentFrequency;
  category: string;
}

export interface Budget {
  income: Income;
  expenses: Expense[];
  savings: number;
  remainingBudget: number;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  remainingBudget: number;
} 