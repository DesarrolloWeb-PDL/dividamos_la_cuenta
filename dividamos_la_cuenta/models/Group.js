// Modelo de Grupo para Realm
import {BSON} from 'realm';

export class Group {
  static schema = {
    name: 'Group',
    primaryKey: 'id',
    properties: {
      id: 'objectId',
      name: 'string',
      participants: 'Participant[]',
      transactions: 'Transaction[]',
      createdAt: 'date',
    },
  };

  constructor({name, participants = [], transactions = []}) {
    this.id = new BSON.ObjectId();
    this.name = name;
    this.participants = participants;
    this.transactions = transactions;
    this.createdAt = new Date();
  }
}
