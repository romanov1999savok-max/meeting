import { Notification } from './types';

const KEY = 'dmitrov_notifications';

export function listNotifications(): Notification[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Notification[];
  } catch {
    return [];
  }
}

export function saveNotifications(items: Notification[]): void {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const item: Notification = {
    ...n,
    id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const all = listNotifications();
  all.unshift(item);
  saveNotifications(all.slice(0, 50));
  return item;
}

export function markAllRead(): void {
  const all = listNotifications().map(n => ({ ...n, read: true }));
  saveNotifications(all);
}

export function clearAll(): void {
  saveNotifications([]);
}
