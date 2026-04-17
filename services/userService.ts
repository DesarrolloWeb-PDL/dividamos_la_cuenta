import { User } from '../models/User';
import { didCollectionChange, normalizeEntityId } from './entityId';
import { createNativeFallbackId, readNativeCollection, writeNativeCollection } from './nativeFallbackStore';

const USERS_STORAGE_KEY = 'dividamos-cta-users';

type StoredUser = Omit<User, '_id'> & {
  _id: string;
};

function normalizeStoredUser(user: StoredUser): StoredUser {
  return {
    ...user,
    _id: normalizeEntityId(user._id),
    groupId: normalizeEntityId(user.groupId),
  };
}

async function readUsers() {
  const users = await readNativeCollection<StoredUser>(USERS_STORAGE_KEY);
  const normalizedUsers = users.map(normalizeStoredUser);

  if (didCollectionChange(users, normalizedUsers)) {
    await writeNativeCollection(USERS_STORAGE_KEY, normalizedUsers);
  }

  return normalizedUsers;
}

export async function addUser(user: Omit<User, '_id'>) {
  const users = await readUsers();
  const createdUser: StoredUser = {
    ...user,
    groupId: normalizeEntityId(user.groupId),
    _id: createNativeFallbackId(),
  };

  await writeNativeCollection(USERS_STORAGE_KEY, [...users, createdUser]);

  return createdUser;
}

export async function getAllUsers() {
  return readUsers();
}

export async function getUsersByGroup(groupId: string) {
  const normalizedGroupId = normalizeEntityId(groupId);
  const users = await getAllUsers();
  return users.filter(user => user.groupId === normalizedGroupId);
}

export async function updateUser(userId: string, updates: Pick<User, 'name' | 'phone' | 'alias' | 'paymentHandle'>) {
  const users = await readUsers();
  const normalizedUserId = normalizeEntityId(userId);
  const nextUsers = users.map(user => (
    user._id === normalizedUserId
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

  return nextUsers.find(user => user._id === normalizedUserId) ?? null;
}

export async function deleteUser(userId: string) {
  const users = await readUsers();
  const normalizedUserId = normalizeEntityId(userId);
  const nextUsers = users.filter(user => user._id !== normalizedUserId);
  await writeNativeCollection(USERS_STORAGE_KEY, nextUsers);
}

export async function deleteUsersByGroup(groupId: string) {
  const users = await readUsers();
  const normalizedGroupId = normalizeEntityId(groupId);
  const nextUsers = users.filter(user => user.groupId !== normalizedGroupId);
  await writeNativeCollection(USERS_STORAGE_KEY, nextUsers);
}
