import { Expense } from '../models/Expense';
import { didCollectionChange, normalizeEntityId } from './entityId';
import { createNativeFallbackId, readNativeCollection, writeNativeCollection } from './nativeFallbackStore';

const EXPENSES_STORAGE_KEY = 'dividamos-cta-expenses';

type StoredExpense = Omit<Expense, '_id'> & {
  _id: string;
  date: string;
};

function normalizeStoredExpense(expense: StoredExpense): StoredExpense {
  return {
    ...expense,
    _id: normalizeEntityId(expense._id),
    groupId: normalizeEntityId(expense.groupId),
    participants: Array.isArray(expense.participants)
      ? expense.participants.map(participantId => normalizeEntityId(participantId))
      : [],
    payments: Array.isArray(expense.payments)
      ? expense.payments.map(payment => ({
        ...payment,
        userId: normalizeEntityId(payment.userId),
      }))
      : [],
  };
}

async function readExpenses() {
  const expenses = await readNativeCollection<StoredExpense>(EXPENSES_STORAGE_KEY);
  const normalizedExpenses = expenses.map(normalizeStoredExpense);

  if (didCollectionChange(expenses, normalizedExpenses)) {
    await writeNativeCollection(EXPENSES_STORAGE_KEY, normalizedExpenses);
  }

  return normalizedExpenses;
}

export async function addExpense(expense: Omit<Expense, '_id'>) {
  const expenses = await readExpenses();
  const createdExpense: StoredExpense = {
    ...expense,
    groupId: normalizeEntityId(expense.groupId),
    _id: createNativeFallbackId(),
    date: expense.date instanceof Date ? expense.date.toISOString() : expense.date,
    participants: expense.participants.map(participantId => normalizeEntityId(participantId)),
    payments: expense.payments.map(payment => ({
      ...payment,
      userId: normalizeEntityId(payment.userId),
    })),
  };

  await writeNativeCollection(EXPENSES_STORAGE_KEY, [...expenses, createdExpense]);

  return createdExpense;
}

export async function getAllExpenses() {
  return readExpenses();
}

export async function getExpensesByGroup(groupId: string) {
  const normalizedGroupId = normalizeEntityId(groupId);
  const expenses = await getAllExpenses();
  return expenses.filter(expense => expense.groupId === normalizedGroupId);
}

export async function updateExpense(expenseId: string, updates: Omit<Expense, '_id'>) {
  const expenses = await readExpenses();
  const normalizedExpenseId = normalizeEntityId(expenseId);
  const nextExpenses = expenses.map(expense => (
    expense._id === normalizedExpenseId
      ? {
        ...expense,
        ...updates,
        groupId: normalizeEntityId(updates.groupId),
        date: updates.date instanceof Date ? updates.date.toISOString() : updates.date,
        participants: updates.participants.map(participantId => normalizeEntityId(participantId)),
        payments: updates.payments.map(payment => ({
          ...payment,
          userId: normalizeEntityId(payment.userId),
        })),
      }
      : expense
  ));

  await writeNativeCollection(EXPENSES_STORAGE_KEY, nextExpenses);

  return nextExpenses.find(expense => expense._id === normalizedExpenseId) ?? null;
}

export async function deleteExpense(expenseId: string) {
  const expenses = await readExpenses();
  const normalizedExpenseId = normalizeEntityId(expenseId);
  const nextExpenses = expenses.filter(expense => expense._id !== normalizedExpenseId);
  await writeNativeCollection(EXPENSES_STORAGE_KEY, nextExpenses);
}

export async function deleteExpensesByGroup(groupId: string) {
  const expenses = await readExpenses();
  const normalizedGroupId = normalizeEntityId(groupId);
  const nextExpenses = expenses.filter(expense => expense.groupId !== normalizedGroupId);
  await writeNativeCollection(EXPENSES_STORAGE_KEY, nextExpenses);
}

export async function isUserLinkedToGroupExpenses(groupId: string, userId: string) {
  const normalizedUserId = normalizeEntityId(userId);
  const expenses = await getExpensesByGroup(groupId);

  return expenses.some(expense => (
    expense.participants.includes(normalizedUserId)
    || expense.payments.some(payment => payment.userId === normalizedUserId)
  ));
}
