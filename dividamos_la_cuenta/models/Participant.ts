import Realm, { BSON, ObjectSchema } from 'realm';

export class Participant extends Realm.Object<Participant> {
    id!: BSON.ObjectId;
    name!: string;
    phone?: string;
    contactId?: string;
    createdAt!: Date;

    static schema: ObjectSchema = {
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
}
