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
