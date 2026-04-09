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

export function calculateSettlement(expenses: ExpenseLike[], users: UserLike[]): SettlementSummary {
  const userDirectory = buildUserDirectory(users);

  const balancesInCents = new Map<string, number>();

  users.forEach(user => {
    balancesInCents.set(user._id.toString(), 0);
  });

  expenses.forEach(expense => {
    if (expense.participants.length === 0 || expense.payments.length === 0) {
      return;
    }

    const shares = splitExpenseInCents(expense.amount, expense.participants, expense.participantAmounts);

    expense.payments.forEach(payment => {
      if (payment.amount <= 0) {
        return;
      }

      balancesInCents.set(
        payment.userId,
        (balancesInCents.get(payment.userId) ?? 0) + toCents(payment.amount),
      );
    });

    shares.forEach(share => {
      balancesInCents.set(
        share.participantId,
        (balancesInCents.get(share.participantId) ?? 0) - share.shareInCents,
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
    balances: balances.map(balance => ({
      userId: balance.userId,
      userName: balance.userName,
      balance: fromCents(balance.balanceInCents),
    })),
    transfers,
  };
}

export function formatSettlementMessage(summary: SettlementSummary) {
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