import Realm, { BSON, ObjectSchema } from 'realm';
import { Participant } from './Participant';
import { Transaction } from './Transaction';

export class Group extends Realm.Object<Group> {
    id!: BSON.ObjectId;
    name!: string;
    participants!: Realm.List<Participant>;
    transactions!: Realm.List<Transaction>;
    createdAt!: Date;

    static schema: ObjectSchema = {
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
}
