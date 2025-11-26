// Modelo de Participante para Realm
import {BSON} from 'realm';

export class Participant {
  static schema = {
    name: 'Participant',
    primaryKey: 'id',
    properties: {
      id: 'objectId',
      name: 'string',
      phone: 'string?',
      contactId: 'string?',
      createdAt: 'date',
    },
  };

  constructor({name, phone = '', contactId = ''}) {
    this.id = new BSON.ObjectId();
    this.name = name;
    this.phone = phone;
    this.contactId = contactId;
    this.createdAt = new Date();
  }
}
