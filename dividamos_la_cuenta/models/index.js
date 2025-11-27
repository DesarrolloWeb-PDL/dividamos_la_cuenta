import { createRealmContext } from '@realm/react';
import { Group } from './Group';
import { Transaction, Payer, Share } from './Transaction';
import { Participant } from './Participant';

export const RealmContext = createRealmContext({
  schema: [Group, Transaction, Payer, Share, Participant],
});
