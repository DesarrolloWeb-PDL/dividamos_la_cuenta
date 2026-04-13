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

export async function updateUser(userId: string, updates: Pick<User, 'name' | 'phone' | 'alias' | 'paymentHandle'>) {
  const users = await readNativeCollection<StoredUser>(USERS_STORAGE_KEY);
  const nextUsers = users.map(user => (
    user._id.toString() === userId
      ? {
        ...user,
        name: updates.name,
        phone: updates.phone,
        alias: updates.alias,
        paymentHandle: updates.paymentHandle ?? '',
      }
      : user
  ));

  await writeNativeCollection(USERS_STORAGE_KEY, nextUsers);

  return nextUsers.find(user => user._id.toString() === userId) ?? null;
}

export async function deleteUser(userId: string) {
  const users = await readNativeCollection<StoredUser>(USERS_STORAGE_KEY);
  const nextUsers = users.filter(user => user._id.toString() !== userId);
  await writeNativeCollection(USERS_STORAGE_KEY, nextUsers);
}

export async function deleteUsersByGroup(groupId: string) {
  const users = await readNativeCollection<StoredUser>(USERS_STORAGE_KEY);
  const nextUsers = users.filter(user => user.groupId !== groupId);
  await writeNativeCollection(USERS_STORAGE_KEY, nextUsers);
}
