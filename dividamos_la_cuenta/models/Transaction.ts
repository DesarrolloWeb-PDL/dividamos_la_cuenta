import Realm, { BSON, ObjectSchema } from 'realm';

export class Payer extends Realm.Object<Payer> {
    participantId!: BSON.ObjectId;
    amount!: number;

    static schema: ObjectSchema = {
        name: 'Payer',
        embedded: true,
        properties: {
            participantId: 'objectId',
            amount: 'double',
        },
    };
}

export class Share extends Realm.Object<Share> {
    participantId!: BSON.ObjectId;
    amount!: number;

    static schema: ObjectSchema = {
        name: 'Share',
        embedded: true,
        properties: {
            participantId: 'objectId',
            amount: 'double',
        },
    };
}

export class Transaction extends Realm.Object<Transaction> {
    id!: BSON.ObjectId;
    description!: string;
    amount!: number;
    payers!: Realm.List<Payer>;
    shares!: Realm.List<Share>;
    createdAt!: Date;

    static schema: ObjectSchema = {
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
}
