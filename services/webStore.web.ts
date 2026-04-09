import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readCollection<T>(key: string) {
  const rawValue = await AsyncStorage.getItem(key);

  if (!rawValue) {
    return [] as T[];
  }

  return JSON.parse(rawValue) as T[];
}

export async function writeCollection<T>(key: string, items: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(items));
}

export function createWebId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}