import { User } from '../models/User';
import { createNativeFallbackId, readNativeCollection, writeNativeCollection } from './nativeFallbackStore';

const USERS_STORAGE_KEY = 'dividamos-cta-users';

type StoredUser = Omit<User, '_id'> & {
  _id: string;
};

export async function addUser(user: Omit<User, '_id'>) {
  const users = await readNativeCollection<StoredUser>(USERS_STORAGE_KEY);
  const createdUser: StoredUser = {
    ...user,
    _id: createNativeFallbackId(),
  };

  await writeNativeCollection(USERS_STORAGE_KEY, [...users, createdUser]);

  return createdUser;
}

export async function getAllUsers() {
  return readNativeCollection<StoredUser>(USERS_STORAGE_KEY);
}

export async function getUsersByGroup(groupId: string) {
  const users = await getAllUsers();
  return users.filter(user => user.groupId === groupId);
}
