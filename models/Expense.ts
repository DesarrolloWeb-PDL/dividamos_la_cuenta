export type ExpenseId = {
  toString(): string;
} | string;

export type Expense = {
  _id: ExpenseId;
  description: string;
  amount: number;
  date: Date | string;
  participants: string[];
  participantAmounts: number[];
  paidBy: string;
};
