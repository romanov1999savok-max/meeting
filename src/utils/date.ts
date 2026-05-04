/** Локальная дата в формате YYYY-MM-DD (учитывает часовой пояс устройства) */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Локальная дата со сдвигом в днях */
export function localDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Преобразовать Date в YYYY-MM-DD (локально) */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Вычисляет актуальный статус совещания на основе времени.
 * @param now - текущее время (для синхронизации с таймером)
 */
export function getLiveStatus(
  date: string,
  startTime: string,
  endTime: string,
  staticStatus: string,
  now: Date = new Date()
): string {
  // Не меняем статусы, которые не зависят от времени
  if (['pending', 'cancelled', 'rejected'].includes(staticStatus)) return staticStatus;

  // Вычисляем "сегодня" на основе переданного времени now
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Корректируем статус только для совещений на сегодня
  if (date !== todayStr) return staticStatus;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (nowMin >= startMin && nowMin < endMin) return 'ongoing';
  if (nowMin >= endMin) return 'completed';
  return 'scheduled';
}
