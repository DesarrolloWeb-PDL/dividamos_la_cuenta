import { Expense } from '../models/Expense';
import { createNativeFallbackId, readNativeCollection, writeNativeCollection } from './nativeFallbackStore';

const EXPENSES_STORAGE_KEY = 'dividamos-cta-expenses';

type StoredExpense = Omit<Expense, '_id'> & {
  _id: string;
  date: string;
};

export async function addExpense(expense: Omit<Expense, '_id'>) {
  const expenses = await readNativeCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
  const createdExpense: StoredExpense = {
    ...expense,
    _id: createNativeFallbackId(),
    date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
  };

  await writeNativeCollection(EXPENSES_STORAGE_KEY, [...expenses, createdExpense]);

  return createdExpense;
}

export async function getAllExpenses() {
  return readNativeCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
}

export async function getExpensesByGroup(groupId: string) {
  const expenses = await getAllExpenses();
  return expenses.filter(expense => expense.groupId === groupId);
}

export async function updateExpense(expenseId: string, updates: Omit<Expense, '_id'>) {
  const expenses = await readNativeCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
  const nextExpenses = expenses.map(expense => (
    expense._id.toString() === expenseId
      ? {
        ...expense,
        ...updates,
        date: updates.date instanceof Date ? updates.date.toISOString() : updates.date,
      }
      : expense
  ));

  await writeNativeCollection(EXPENSES_STORAGE_KEY, nextExpenses);

  return nextExpenses.find(expense => expense._id.toString() === expenseId) ?? null;
}

export async function deleteExpense(expenseId: string) {
  const expenses = await readNativeCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
  const nextExpenses = expenses.filter(expense => expense._id.toString() !== expenseId);
  await writeNativeCollection(EXPENSES_STORAGE_KEY, nextExpenses);
}

export async function deleteExpensesByGroup(groupId: string) {
  const expenses = await readNativeCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
  const nextExpenses = expenses.filter(expense => expense.groupId !== groupId);
  await writeNativeCollection(EXPENSES_STORAGE_KEY, nextExpenses);
}

export async function isUserLinkedToGroupExpenses(groupId: string, userId: string) {
  const expenses = await getExpensesByGroup(groupId);

  return expenses.some(expense => (
    expense.participants.includes(userId)
    || expense.payments.some(payment => payment.userId === userId)
  ));
}
