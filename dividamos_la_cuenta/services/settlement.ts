import { BSON } from 'realm';
import { Participant } from '../models/Participant';
import { Transaction } from '../models/Transaction';

interface NetPositions {
    [key: string]: number;
}

interface Payment {
    from: BSON.ObjectId;
    to: BSON.ObjectId;
    amount: number;
}

/**
 * Calcula la posición neta de cada participante
 */
export function calculateNetPositions(
    participants: Realm.List<Participant> | Participant[],
    transactions: Realm.List<Transaction> | Transaction[]
): NetPositions {
    const net: NetPositions = {};
    participants.forEach(p => (net[p.id.toString()] = 0));
    transactions.forEach(tx => {
        tx.payers.forEach(payer => {
            const pid = payer.participantId.toString();
            if (net[pid] !== undefined) net[pid] += payer.amount;
        });
        tx.shares.forEach(share => {
            const pid = share.participantId.toString();
            if (net[pid] !== undefined) net[pid] -= share.amount;
        });
    });
    return net;
}

/**
 * Minimiza el número de transacciones para saldar deudas
 */
export function minimizeTransactions(netPositions: NetPositions): Payment[] {
    const creditors: { id: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];

    Object.entries(netPositions).forEach(([id, amount]) => {
        if (amount > 0.01) creditors.push({ id, amount });
        else if (amount < -0.01) debtors.push({ id, amount: -amount });
    });

    const payments: Payment[] = [];
    let i = 0,
        j = 0;
    while (i < debtors.length && j < creditors.length) {
        const pay = Math.min(debtors[i].amount, creditors[j].amount);
        payments.push({
            from: new BSON.ObjectId(debtors[i].id),
            to: new BSON.ObjectId(creditors[j].id),
            amount: pay,
        });
        debtors[i].amount -= pay;
        creditors[j].amount -= pay;
        if (debtors[i].amount < 0.01) i++;
        if (creditors[j].amount < 0.01) j++;
    }
    return payments;
}
