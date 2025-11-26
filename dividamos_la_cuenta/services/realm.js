// Configuración de Realm DB
import Realm from 'realm';
import {Group} from '../models/Group';
import {Participant} from '../models/Participant';
import {Transaction, Payer, Share} from '../models/Transaction';

export const realmConfig = {
  schema: [Group.schema, Participant.schema, Transaction.schema, Payer.schema, Share.schema],
  schemaVersion: 1,
  encryptionKey: undefined, // Aquí se puede agregar la clave de encriptación
};

export const getRealm = async () => {
  return await Realm.open(realmConfig);
};
