export type ExpensePayment = {
  userId: string;
  amount: number;
};

export type ExpenseId = {
  toString(): string;
} | string;

export type Expense = {
  _id: ExpenseId;
  groupId: string;
  description: string;
  amount: number;
  date: Date | string;
  participants: string[];
  participantAmounts: number[];
  payments: ExpensePayment[];
};
