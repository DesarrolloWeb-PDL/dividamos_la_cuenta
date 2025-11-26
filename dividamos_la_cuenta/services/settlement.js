// Algoritmo de liquidación y minimización de transacciones
// Recibe lista de participantes y transacciones, devuelve pagos mínimos

/**
 * Calcula la posición neta de cada participante
 * @param {Array} participants - [{id, name}]
 * @param {Array} transactions - [{payers, shares}]
 * @returns {Object} - {participantId: netAmount}
 */
function calculateNetPositions(participants, transactions) {
  const net = {};
  participants.forEach(p => net[p.id] = 0);
  transactions.forEach(tx => {
    tx.payers.forEach(payer => {
      net[payer.participantId] += payer.amount;
    });
    tx.shares.forEach(share => {
      net[share.participantId] -= share.amount;
    });
  });
  return net;
}

/**
 * Minimiza el número de transacciones para saldar deudas
 * @param {Object} netPositions - {participantId: netAmount}
 * @returns {Array} - [{from, to, amount}]
 */
function minimizeTransactions(netPositions) {
  const creditors = [];
  const debtors = [];
  Object.entries(netPositions).forEach(([id, amount]) => {
    if (amount > 0) creditors.push({id, amount});
    else if (amount < 0) debtors.push({id, amount: -amount});
  });
  const payments = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    payments.push({from: debtors[i].id, to: creditors[j].id, amount: pay});
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount === 0) i++;
    if (creditors[j].amount === 0) j++;
  }
  return payments;
}

module.exports = {
  calculateNetPositions,
  minimizeTransactions,
};
