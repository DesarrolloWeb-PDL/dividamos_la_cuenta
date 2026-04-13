import { Group } from '../models/Group';
import { createWebId, readCollection, writeCollection } from './webStore.web';

const GROUPS_STORAGE_KEY = 'dividamos-cta-groups';

type StoredGroup = Omit<Group, '_id'> & {
  _id: string;
  createdAt: string;
};

export async function addGroup(group: Omit<Group, '_id'>) {
  const groups = await readCollection<StoredGroup>(GROUPS_STORAGE_KEY);
  const createdGroup: StoredGroup = {
    ...group,
    _id: createWebId(),
    createdAt: group.createdAt instanceof Date ? group.createdAt.toISOString() : group.createdAt,
  };

  await writeCollection(GROUPS_STORAGE_KEY, [...groups, createdGroup]);

  return createdGroup;
}

export async function getAllGroups() {
  return readCollection<StoredGroup>(GROUPS_STORAGE_KEY);
}

export async function getGroupById(groupId: string) {
  const groups = await getAllGroups();
  return groups.find(group => group._id.toString() === groupId) ?? null;
}

export async function updateGroup(groupId: string, updates: Pick<Group, 'name' | 'description' | 'whatsappGroupLink'>) {
  const groups = await readCollection<StoredGroup>(GROUPS_STORAGE_KEY);
  const nextGroups = groups.map(group => (
    group._id.toString() === groupId
      ? {
        ...group,
        name: updates.name,
        description: updates.description,
        whatsappGroupLink: updates.whatsappGroupLink ?? '',
      }
      : group
  ));

  await writeCollection(GROUPS_STORAGE_KEY, nextGroups);

  return nextGroups.find(group => group._id.toString() === groupId) ?? null;
}

export async function deleteGroup(groupId: string) {
  const groups = await readCollection<StoredGroup>(GROUPS_STORAGE_KEY);
  const nextGroups = groups.filter(group => group._id.toString() !== groupId);
  await writeCollection(GROUPS_STORAGE_KEY, nextGroups);
}