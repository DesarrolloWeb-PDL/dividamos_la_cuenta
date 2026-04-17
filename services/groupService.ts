import { Group } from '../models/Group';
import { didCollectionChange, normalizeEntityId } from './entityId';
import { createNativeFallbackId, readNativeCollection, writeNativeCollection } from './nativeFallbackStore';

const GROUPS_STORAGE_KEY = 'dividamos-cta-groups';

type StoredGroup = Omit<Group, '_id'> & {
  _id: string;
  createdAt: string;
};

function normalizeStoredGroup(group: StoredGroup): StoredGroup {
  return {
    ...group,
    _id: normalizeEntityId(group._id),
  };
}

async function readGroups() {
  const groups = await readNativeCollection<StoredGroup>(GROUPS_STORAGE_KEY);
  const normalizedGroups = groups.map(normalizeStoredGroup);

  if (didCollectionChange(groups, normalizedGroups)) {
    await writeNativeCollection(GROUPS_STORAGE_KEY, normalizedGroups);
  }

  return normalizedGroups;
}

export async function addGroup(group: Omit<Group, '_id'>) {
  const groups = await readGroups();
  const createdGroup: StoredGroup = {
    ...group,
    _id: createNativeFallbackId(),
    createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
  };

  await writeNativeCollection(GROUPS_STORAGE_KEY, [...groups, createdGroup]);

  return createdGroup;
}

export async function getAllGroups() {
  return readGroups();
}

export async function getGroupById(groupId: string) {
  const groups = await getAllGroups();
  const normalizedGroupId = normalizeEntityId(groupId);
  return groups.find(group => group._id === normalizedGroupId) ?? null;
}

export async function updateGroup(groupId: string, updates: Pick<Group, 'name' | 'description' | 'whatsappGroupLink'>) {
  const groups = await readGroups();
  const normalizedGroupId = normalizeEntityId(groupId);
  const nextGroups = groups.map(group => (
    group._id === normalizedGroupId
      ? {
        ...group,
        name: updates.name,
        description: updates.description,
        whatsappGroupLink: updates.whatsappGroupLink ?? '',
      }
      : group
  ));

  await writeNativeCollection(GROUPS_STORAGE_KEY, nextGroups);

  return nextGroups.find(group => group._id === normalizedGroupId) ?? null;
}

export async function deleteGroup(groupId: string) {
  const groups = await readGroups();
  const normalizedGroupId = normalizeEntityId(groupId);
  const nextGroups = groups.filter(group => group._id !== normalizedGroupId);
  await writeNativeCollection(GROUPS_STORAGE_KEY, nextGroups);
}