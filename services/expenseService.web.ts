import { Expense } from '../models/Expense';
import { createWebId, readCollection, writeCollection } from './webStore.web';

const EXPENSES_STORAGE_KEY = 'dividamos-cta-expenses';

type StoredExpense = Omit<Expense, '_id'> & {
  _id: string;
  date: string;
};

export async function addExpense(expense: Omit<Expense, '_id'>) {
  const expenses = await readCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
  const createdExpense: StoredExpense = {
    ...expense,
    date: expense.date.toISOString(),
    _id: createWebId(),
  };

  await writeCollection(EXPENSES_STORAGE_KEY, [...expenses, createdExpense]);

  return createdExpense;
}

export async function getAllExpenses() {
  return readCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
}