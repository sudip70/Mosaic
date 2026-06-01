import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'sync_queue';

export interface SyncItem {
  id: string;
  localUri: string;
  userId: string;
  date: string;
  colorId: string;
  createdAt: string;
}

async function getQueue(): Promise<SyncItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function add(item: SyncItem): Promise<void> {
  const queue = await getQueue();
  if (queue.some((i) => i.id === item.id)) return;
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...queue, item]));
}

async function remove(id: string): Promise<void> {
  const queue = await getQueue();
  await AsyncStorage.setItem(
    QUEUE_KEY,
    JSON.stringify(queue.filter((i) => i.id !== id))
  );
}

export const syncQueue = { getQueue, add, remove };
