import { User } from '../models/User';
import { createWebId, readCollection, writeCollection } from './webStore.web';

const USERS_STORAGE_KEY = 'dividamos-cta-users';

type StoredUser = Omit<User, '_id'> & {
  _id: string;
};

export async function addUser(user: Omit<User, '_id'>) {
  const users = await readCollection<StoredUser>(USERS_STORAGE_KEY);
  const createdUser: StoredUser = {
    ...user,
    _id: createWebId(),
  };

  await writeCollection(USERS_STORAGE_KEY, [...users, createdUser]);

  return createdUser;
}

export async function getAllUsers() {
  return readCollection<StoredUser>(USERS_STORAGE_KEY);
}