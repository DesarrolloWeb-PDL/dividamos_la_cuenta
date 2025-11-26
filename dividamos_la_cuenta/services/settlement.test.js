// Tests para settlement.js
const { calculateNetPositions, minimizeTransactions } = require('./settlement');

describe('Algoritmo de liquidación', () => {
  it('calcula posiciones netas correctamente', () => {
    const participants = [
      { id: 'A', name: 'Ana' },
      { id: 'B', name: 'Beto' },
      { id: 'C', name: 'Caro' },
    ];
    const transactions = [
      {
        payers: [ { participantId: 'A', amount: 3000 }, { participantId: 'B', amount: 2000 } ],
        shares: [ { participantId: 'A', amount: 1666.67 }, { participantId: 'B', amount: 1666.67 }, { participantId: 'C', amount: 1666.67 } ],
      },
    ];
    const net = calculateNetPositions(participants, transactions);
    expect(net['A']).toBeCloseTo(1333.33, 1);
    expect(net['B']).toBeCloseTo(333.33, 1);
    expect(net['C']).toBeCloseTo(-1666.67, 1);
  });

  it('minimiza transacciones correctamente', () => {
    const net = { 'A': 1333.33, 'B': 333.33, 'C': -1666.67 };
    const payments = minimizeTransactions(net);
    expect(payments.length).toBe(2);
    expect(payments).toEqual([
      { from: 'C', to: 'A', amount: 1333.33 },
      { from: 'C', to: 'B', amount: 333.33 },
    ]);
  });
});
