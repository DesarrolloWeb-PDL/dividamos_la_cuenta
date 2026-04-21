import { formatPaymentHandleForMessage } from './paymentHandle';

type PaymentLike = {
  userId: string;
  amount: number;
};

type ExpenseLike = {
  amount: number;
  participants: string[];
  participantAmounts?: number[];
  payments: PaymentLike[];
};

type UserLike = {
  _id: { toString(): string } | string;
  name: string;
  alias?: string;
};

export type UserBalance = {
  userId: string;
  userName: string;
  balance: number;
};

export type SettlementTransfer = {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
};

export type SettlementSummary = {
  balances: UserBalance[];
  transfers: SettlementTransfer[];
};

export type SettlementMemberSummary = {
  userId: string;
  userName: string;
  paid: number;
  consumed: number;
  balance: number;
};

export type SettlementPayerSummary = {
  userId: string;
  userName: string;
  paid: number;
  amountToReceive: number;
};

export type DetailedSettlementSummary = SettlementSummary & {
  totalAmount: number;
  members: SettlementMemberSummary[];
  payers: SettlementPayerSummary[];
};

export type SettlementMessageVariant = 'full' | 'transfers-only' | 'short';

export type ExpenseShareDetail = {
  userId: string;
  userName: string;
  share: number;
};

const toCents = (amount: number) => Math.round(amount * 100);
const fromCents = (amountInCents: number) => amountInCents / 100;

function buildUserDirectory(users: UserLike[]) {
  return new Map(
    users.map(user => [user._id.toString(), user.alias?.trim() || user.name]),
  );
}

function hasCustomAmounts(expense: ExpenseLike) {
  return expense.participantAmounts && expense.participantAmounts.length === expense.participants.length;
}

function splitExpenseInCents(amount: number, participants: string[], participantAmounts?: number[]) {
  if (participantAmounts && participantAmounts.length === participants.length) {
    const customShares = participantAmounts.map(toCents);
    const customTotal = customShares.reduce((sum, share) => sum + share, 0);

    if (customTotal === toCents(amount)) {
      return participants.map((participantId, index) => ({
        participantId,
        shareInCents: customShares[index],
      }));
    }
  }

  const amountInCents = toCents(amount);
  const splitInCents = Math.floor(amountInCents / participants.length);
  const remainder = amountInCents - splitInCents * participants.length;

  return participants.map((participantId, index) => ({
    participantId,
    shareInCents: splitInCents + (index < remainder ? 1 : 0),
  }));
}

export function calculateExpenseBreakdown(expense: ExpenseLike, users: UserLike[]) {
  const userDirectory = buildUserDirectory(users);

  const payments = expense.payments
    .filter(payment => payment.amount > 0)
    .map(payment => ({
      userId: payment.userId,
      userName: userDirectory.get(payment.userId) ?? 'Sin asignar',
      amount: payment.amount,
    }));

  return {
    paymentSummary: payments,
    isCustom: hasCustomAmounts(expense),
    shares: splitExpenseInCents(expense.amount, expense.participants, expense.participantAmounts).map(share => ({
      userId: share.participantId,
      userName: userDirectory.get(share.participantId) ?? 'Usuario desconocido',
      share: fromCents(share.shareInCents),
    })),
  };
}

function calculateSettlementData(expenses: ExpenseLike[], users: UserLike[]) {
  const userDirectory = buildUserDirectory(users);
  const balancesInCents = new Map<string, number>();
  const paidInCents = new Map<string, number>();
  const consumedInCents = new Map<string, number>();
  let totalAmountInCents = 0;

  users.forEach(user => {
    const userId = user._id.toString();
    balancesInCents.set(userId, 0);
    paidInCents.set(userId, 0);
    consumedInCents.set(userId, 0);
  });

  expenses.forEach(expense => {
    if (expense.participants.length === 0 || expense.payments.length === 0) {
      return;
    }

    totalAmountInCents += toCents(expense.amount);

    const shares = splitExpenseInCents(expense.amount, expense.participants, expense.participantAmounts);

    expense.payments.forEach(payment => {
      if (payment.amount <= 0) {
        return;
      }

      const paymentInCents = toCents(payment.amount);

      balancesInCents.set(
        payment.userId,
        (balancesInCents.get(payment.userId) ?? 0) + paymentInCents,
      );
      paidInCents.set(
        payment.userId,
        (paidInCents.get(payment.userId) ?? 0) + paymentInCents,
      );
    });

    shares.forEach(share => {
      balancesInCents.set(
        share.participantId,
        (balancesInCents.get(share.participantId) ?? 0) - share.shareInCents,
      );
      consumedInCents.set(
        share.participantId,
        (consumedInCents.get(share.participantId) ?? 0) + share.shareInCents,
      );
    });
  });

  const balances = Array.from(balancesInCents.entries())
    .map(([userId, balanceInCents]) => ({
      userId,
      userName: userDirectory.get(userId) ?? 'Usuario desconocido',
      balanceInCents,
    }))
    .filter(balance => balance.balanceInCents !== 0)
    .sort((left, right) => right.balanceInCents - left.balanceInCents);

  const creditors = balances
    .filter(balance => balance.balanceInCents > 0)
    .map(balance => ({ ...balance }));
  const debtors = balances
    .filter(balance => balance.balanceInCents < 0)
    .map(balance => ({ ...balance, balanceInCents: Math.abs(balance.balanceInCents) }));

  const transfers: SettlementTransfer[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const transferInCents = Math.min(creditor.balanceInCents, debtor.balanceInCents);

    transfers.push({
      fromUserId: debtor.userId,
      fromUserName: debtor.userName,
      toUserId: creditor.userId,
      toUserName: creditor.userName,
      amount: fromCents(transferInCents),
    });

    creditor.balanceInCents -= transferInCents;
    debtor.balanceInCents -= transferInCents;

    if (creditor.balanceInCents === 0) {
      creditorIndex += 1;
    }

    if (debtor.balanceInCents === 0) {
      debtorIndex += 1;
    }
  }

  return {
    userDirectory,
    balances,
    transfers,
    paidInCents,
    consumedInCents,
    totalAmountInCents,
  };
}

export function calculateSettlement(expenses: ExpenseLike[], users: UserLike[]): SettlementSummary {
  const { balances, transfers } = calculateSettlementData(expenses, users);

  return {
    balances: balances.map(balance => ({
      userId: balance.userId,
      userName: balance.userName,
      balance: fromCents(balance.balanceInCents),
    })),
    transfers,
  };
}

export function calculateDetailedSettlement(expenses: ExpenseLike[], users: UserLike[]): DetailedSettlementSummary {
  const {
    balances,
    transfers,
    paidInCents,
    consumedInCents,
    totalAmountInCents,
    userDirectory,
  } = calculateSettlementData(expenses, users);

  const allUserIds = new Set<string>([
    ...Array.from(paidInCents.keys()),
    ...Array.from(consumedInCents.keys()),
  ]);

  const members = Array.from(allUserIds)
    .map(userId => {
      const paid = paidInCents.get(userId) ?? 0;
      const consumed = consumedInCents.get(userId) ?? 0;
      const balance = balances.find(entry => entry.userId === userId)?.balanceInCents ?? 0;

      return {
        userId,
        userName: userDirectory.get(userId) ?? 'Usuario desconocido',
        paid: fromCents(paid),
        consumed: fromCents(consumed),
        balance: fromCents(balance),
      };
    })
    .filter(member => member.paid > 0 || member.consumed > 0)
    .sort((left, right) => {
      if (right.consumed !== left.consumed) {
        return right.consumed - left.consumed;
      }

      return right.paid - left.paid;
    });

  const payers = members
    .filter(member => member.paid > 0)
    .map(member => ({
      userId: member.userId,
      userName: member.userName,
      paid: member.paid,
      amountToReceive: member.balance > 0 ? member.balance : 0,
    }))
    .sort((left, right) => {
      if (right.amountToReceive !== left.amountToReceive) {
        return right.amountToReceive - left.amountToReceive;
      }

      return right.paid - left.paid;
    });

  return {
    totalAmount: fromCents(totalAmountInCents),
    members,
    payers,
    balances: balances.map(balance => ({
      userId: balance.userId,
      userName: balance.userName,
      balance: fromCents(balance.balanceInCents),
    })),
    transfers,
  };
}

export function formatSettlementMessage(summary: SettlementSummary, variant: SettlementMessageVariant = 'full') {
  const balanceLines = summary.balances.length === 0
    ? ['- No hay saldos pendientes.']
    : summary.balances.map(balance => (
      `- ${balance.userName}: ${balance.balance > 0 ? 'a favor' : 'debe'} $${Math.abs(balance.balance).toFixed(2)}`
    ));

  const transferLines = summary.transfers.length === 0
    ? ['- No hace falta transferir nada.']
    : summary.transfers.map(transfer => (
      `- ${transfer.fromUserName} le paga a ${transfer.toUserName} $${transfer.amount.toFixed(2)}`
    ));

  if (variant === 'transfers-only') {
    return [
      'Liquidación sugerida:',
      ...transferLines,
    ].join('\n');
  }

  if (variant === 'short') {
    if (summary.transfers.length === 0) {
      return 'No hay transferencias pendientes.';
    }

    return summary.transfers
      .map(transfer => `${transfer.fromUserName} -> ${transfer.toUserName} $${transfer.amount.toFixed(2)}`)
      .join('\n');
  }

  return [
    'Resumen de cuentas',
    '',
    'Saldos:',
    ...balanceLines,
    '',
    'Liquidación sugerida:',
    ...transferLines,
  ].join('\n');
}

export function formatDirectTransferMessage(transfer: SettlementTransfer, groupName: string, paymentHandle?: string) {
  return [
    `Hola ${transfer.fromUserName},`,
    '',
    `en ${groupName} te toca transferir $${transfer.amount.toFixed(2)} a ${transfer.toUserName}.`,
    formatPaymentHandleForMessage(paymentHandle),
    '',
    'Te paso este mensaje para que lo tengas a mano.',
  ].filter(Boolean).join('\n');
}