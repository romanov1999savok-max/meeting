import { EquipmentItem, Room } from './types';
import { rooms as DEFAULT_ROOMS } from './data';

export const EQUIPMENT_CATALOG: EquipmentItem[] = [
  { id: 'projector', label: 'Проектор', icon: '📽️', category: 'video' },
  { id: 'screen', label: 'Проекционный экран', icon: '🖼️', category: 'video' },
  { id: 'tv', label: 'Телевизор / монитор', icon: '📺', category: 'video' },
  { id: 'camera', label: 'Камера ВКС', icon: '🎥', category: 'video' },
  { id: 'docucam', label: 'Документ-камера', icon: '📸', category: 'video' },
  { id: 'micro_table', label: 'Настольные микрофоны', icon: '🎙️', category: 'audio' },
  { id: 'micro_wireless', label: 'Радиомикрофоны', icon: '🎤', category: 'audio' },
  { id: 'speakers', label: 'Акустическая система', icon: '🔊', category: 'audio' },
  { id: 'mixer', label: 'Микшерный пульт', icon: '🎛️', category: 'audio' },
  { id: 'whiteboard', label: 'Интерактивная доска', icon: '📝', category: 'display' },
  { id: 'led_panel', label: 'LED-панель', icon: '🟦', category: 'display' },
  { id: 'pointer', label: 'Лазерная указка', icon: '🔦', category: 'display' },
  { id: 'pc', label: 'Стационарный ПК', icon: '🖥️', category: 'compute' },
  { id: 'laptop', label: 'Ноутбук докладчика', icon: '💻', category: 'compute' },
  { id: 'wifi', label: 'Усиленный Wi-Fi', icon: '📶', category: 'compute' },
  { id: 'lan', label: 'Проводной Ethernet', icon: '🔌', category: 'compute' },
  { id: 'air_cond', label: 'Кондиционер', icon: '❄️', category: 'other' },
  { id: 'water', label: 'Кулер с водой', icon: '🚰', category: 'other' },
  { id: 'translator', label: 'Синхронный перевод', icon: '🎧', category: 'other' },
];

export const EQUIPMENT_CATEGORIES: Record<string, string> = {
  video: 'Видео', audio: 'Аудио', display: 'Дисплеи', compute: 'Компьютеры', other: 'Прочее',
};

const STORAGE_KEY = 'dmitrov_rooms_overrides';

interface RoomOverride { equipment?: string[]; notes?: string; capacity?: number; description?: string; }

function readOverrides(): Record<string, RoomOverride> {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch { return {}; }
}

function writeOverrides(o: Record<string, RoomOverride>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
}

export function getRooms(): Room[] {
  const ov = readOverrides();
  return DEFAULT_ROOMS.map(r => {
    const o = ov[r.id] || {};
    return { ...r, capacity: o.capacity ?? r.capacity, description: o.description ?? r.description, equipment: o.equipment ?? r.equipment ?? [], notes: o.notes ?? '' };
  });
}

export function updateRoom(id: string, patch: Partial<RoomOverride>): void {
  const ov = readOverrides();
  ov[id] = { ...ov[id], ...patch };
  writeOverrides(ov);
}

export function getEquipmentLabels(ids: string[] | undefined): { id: string; label: string; icon: string }[] {
  if (!ids) return [];
  return ids.map(id => {
    const it = EQUIPMENT_CATALOG.find(e => e.id === id);
    return it ? { id: it.id, label: it.label, icon: it.icon } : { id, label: id, icon: '🔹' };
  });
}
