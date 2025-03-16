import { Income, Expense, BudgetSummary, PaymentFrequency } from '../types/budget';

const normalizeAmountToMonthly = (amount: number, frequency: PaymentFrequency): number => {
  switch (frequency) {
    case 'weekly':
      return amount * 52 / 12; // Weekly to monthly
    case 'biweekly':
      return amount * 26 / 12; // Biweekly to monthly
    case 'monthly':
      return amount;
    default:
      return amount;
  }
};

export const calculateBudget = (
  income: Income,
  expenses: Expense[],
  savingsPercentage: number = 20 // Default savings goal of 20%
): BudgetSummary => {
  // Normalize income to monthly
  const monthlyIncome = normalizeAmountToMonthly(income.amount, income.frequency);

  // Calculate target savings
  const targetSavings = (monthlyIncome * savingsPercentage) / 100;

  // Calculate total monthly expenses
  const totalExpenses = expenses.reduce((acc, expense) => {
    const monthlyExpense = normalizeAmountToMonthly(expense.amount, expense.frequency);
    return acc + monthlyExpense;
  }, 0);

  // Calculate remaining budget after savings and expenses
  const remainingBudget = monthlyIncome - totalExpenses - targetSavings;

  return {
    totalIncome: monthlyIncome,
    totalExpenses,
    savings: targetSavings,
    remainingBudget
  };
}; 