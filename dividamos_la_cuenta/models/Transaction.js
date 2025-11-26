// Modelo de Transacción para Realm
import {BSON} from 'realm';

export class Transaction {
  static schema = {
    name: 'Transaction',
    primaryKey: 'id',
    properties: {
      id: 'objectId',
      description: 'string',
      amount: 'double',
      payers: 'Payer[]',
      shares: 'Share[]',
      createdAt: 'date',
    },
  };

  constructor({description, amount, payers = [], shares = []}) {
    this.id = new BSON.ObjectId();
    this.description = description;
    this.amount = amount;
    this.payers = payers;
    this.shares = shares;
    this.createdAt = new Date();
  }
}

// Submodelo para pagadores
export class Payer {
  static schema = {
    name: 'Payer',
    embedded: true,
    properties: {
      participantId: 'objectId',
      amount: 'double',
    },
  };
}

// Submodelo para participación
export class Share {
  static schema = {
    name: 'Share',
    embedded: true,
    properties: {
      participantId: 'objectId',
      amount: 'double',
    },
  };
}
