import { useState, useEffect, useMemo } from 'react';
import { rooms } from '../data';
import { Meeting } from '../types';

interface Props {
  meetings: Meeting[];
  onMeetingClick: (m: Meeting) => void;
}

const roomColors: Record<string, { bar: string; text: string; bg: string; border: string }> = {
  'room-1': { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  'room-2': { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

function visibleStatuses(m: Meeting): boolean {
  return m.status !== 'pending' && m.status !== 'rejected' && m.status !== 'cancelled';
}

export default function PublicTimelinePage({ meetings, onMeetingClick }: Props) {
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => meetings.filter(visibleStatuses), [meetings]);
  const dayMeetings = useMemo(
    () => visible.filter(m => m.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [visible, selectedDate]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  // Шкала
  const START_HOUR = 8;
  const END_HOUR = 19;
  const totalMin = (END_HOUR - START_HOUR) * 60;
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowOffset = ((nowMin - START_HOUR * 60) / totalMin) * 100;
  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  // Навигация по датам
  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Таймлайн залов</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Визуальное расписание мероприятий по каждому залу заседаний
        </p>
      </div>

      {/* Навигация по датам */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Предыдущий день">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm sm:text-base font-bold text-slate-900">
              {new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              {isToday ? '🟢 Сегодня' : ''}
              {isToday && ' · '}
              {dayMeetings.length} {pluralize(dayMeetings.length, 'мероприятие', 'мероприятия', 'мероприятий')}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isToday && (
              <button onClick={() => setSelectedDate(todayStr)} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Сегодня
              </button>
            )}
            <button onClick={() => shiftDate(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Следующий день">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Сам таймлайн */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5">
        {/* Шкала времени */}
        <div className="relative h-5 ml-24 sm:ml-32 mb-2">
          {hours.map(h => {
            const pct = ((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
            return (
              <div key={h} className="absolute -translate-x-1/2 text-[9px] sm:text-[10px] text-slate-400 font-medium" style={{ left: `${pct}%` }}>
                {String(h).padStart(2, '0')}:00
              </div>
            );
          })}
        </div>

        <div className="space-y-3 sm:space-y-4">
          {rooms.map(room => {
            const inRoom = dayMeetings.filter(m => m.roomId === room.id);
            const c = roomColors[room.id];
            return (
              <div key={room.id} className="flex items-center gap-2 sm:gap-3">
                <div className="w-22 sm:w-30 flex-shrink-0" style={{ width: '90px' }}>
                  <div className={`text-[10px] sm:text-xs font-bold ${c.text} truncate`}>
                    {room.name.length > 22 ? room.name.slice(0, 20) + '…' : room.name}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                    {inRoom.length} {pluralize(inRoom.length, 'событие', 'события', 'событий')}
                  </div>
                </div>
                <div className="flex-1 relative h-12 sm:h-16 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                  {/* Сетка часов */}
                  {hours.slice(1, -1).map(h => {
                    const pct = ((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
                    return <div key={h} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left: `${pct}%` }} />;
                  })}
                  {/* Линия "сейчас" */}
                  {isToday && nowOffset >= 0 && nowOffset <= 100 && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: `${nowOffset}%` }}>
                      <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500"></div>
                    </div>
                  )}
                  {/* Совещания */}
                  {inRoom.map(m => {
                    const startMin = toMin(m.startTime);
                    const endMin = toMin(m.endTime);
                    const left = Math.max(0, ((startMin - START_HOUR * 60) / totalMin) * 100);
                    const width = Math.max(2, ((endMin - startMin) / totalMin) * 100);
                    if (left >= 100) return null;
                    const finalWidth = Math.min(width, 100 - left);
                    return (
                      <button
                        key={m.id}
                        onClick={() => onMeetingClick(m)}
                        className={`absolute top-1 bottom-1 ${c.bar} hover:brightness-110 rounded-md text-white text-[9px] sm:text-[11px] font-medium px-1.5 sm:px-2 overflow-hidden text-left z-10 shadow-sm transition-all`}
                        style={{ left: `${left}%`, width: `${finalWidth}%` }}
                        title={`${m.startTime}–${m.endTime} ${m.title}`}
                      >
                        <div className="truncate font-bold">{m.startTime}</div>
                        <div className="truncate">{m.title}</div>
                      </button>
                    );
                  })}
                  {inRoom.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] sm:text-xs text-slate-300 font-medium">
                      Зал свободен
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Легенда */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>{rooms[0]?.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span>{rooms[1]?.name}</span>
          </div>
          {isToday && (
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-red-500"></div>
              <span>Текущее время</span>
            </div>
          )}
        </div>
      </div>

      {/* Список мероприятий дня */}
      {dayMeetings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Список мероприятий</h3>
          <div className="space-y-2">
            {dayMeetings.map(m => {
              const c = roomColors[m.roomId];
              return (
                <button
                  key={m.id}
                  onClick={() => onMeetingClick(m)}
                  className={`w-full text-left p-3 rounded-lg border ${c.bg} ${c.border} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs sm:text-sm font-bold ${c.text}`}>{m.startTime}—{m.endTime}</span>
                        <span className="text-xs sm:text-sm font-medium text-slate-900">{m.title}</span>
                      </div>
                      <div className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                        {m.roomName} · {m.organizer}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
