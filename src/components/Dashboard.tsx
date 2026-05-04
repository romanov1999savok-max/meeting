import { useState, useEffect, useMemo } from 'react';
import { rooms } from '../data';
import { Meeting } from '../types';
import { getDashboardStats } from '../data';
import { getMonthGrid, MONTH_NAMES_RU, WEEKDAY_SHORT_RU, DayInfo } from '../calendar';
import { localToday, toLocalDateStr, getLiveStatus } from '../utils/date';

interface Props { meetings: Meeting[]; onBookingClick: () => void; }

const RC: Record<string, { bar: string; bg: string; border: string; text: string; grad: string }> = {
  'room-1': { bar: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', grad: 'from-blue-500 to-blue-600' },
  'room-2': { bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', grad: 'from-emerald-500 to-emerald-600' },
};

function visible(m: Meeting) { return m.status !== 'pending' && m.status !== 'rejected' && m.status !== 'cancelled'; }

function SBadge({ status }: { status: Meeting['status'] }) {
  const mp: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-orange-100 text-orange-800 border-orange-200', label: 'На согласовании' },
    scheduled: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Запланировано' },
    ongoing: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Идёт сейчас' },
    completed: { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Завершено' },
    cancelled: { cls: 'bg-red-100 text-red-600 border-red-200', label: 'Отменено' },
    rejected: { cls: 'bg-red-100 text-red-700 border-red-200', label: 'Отклонено' },
  };
  const it = mp[status];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${it.cls}`}>{it.label}</span>;
}

function MeetingModal({ m, onClose, onBack }: { m: Meeting; onClose: () => void; onBack?: () => void }) {
  const c = RC[m.roomId] || RC['room-1'];
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-[55] p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mt-4 sm:mt-10 mb-10" onClick={e => e.stopPropagation()}>
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${c.grad} text-white rounded-t-xl`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              {onBack && (
                <button onClick={onBack} className="mt-0.5 flex-shrink-0 p-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="Вернуться к расписанию дня">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div><h2 className="text-base sm:text-lg font-bold">{m.title}</h2><p className="text-xs text-white/80 mt-1">{m.roomName}</p></div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white flex-shrink-0"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <SBadge status={m.status} />
            {onBack && <span className="text-[10px] text-white/70">← расписание дня</span>}
          </div>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          {m.description && <p className="text-sm text-slate-600">{m.description}</p>}
          <DRow icon="📅" label="Дата">{new Date(m.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</DRow>
          <DRow icon="🕒" label="Время">{m.startTime} — {m.endTime}</DRow>
          <DRow icon="🏛" label="Зал">{m.roomName}</DRow>
          <DRow icon="👤" label="Организатор">{m.organizer}</DRow>
          {m.responsiblePerson && <DRow icon="✅" label="Ответственный">{m.responsiblePerson}</DRow>}
          {m.participants.length > 0 && <DRow icon="👥" label="Участники"><ul className="space-y-0.5">{m.participants.map((p,i) => <li key={i}>• {p}</li>)}</ul></DRow>}
          {m.requirements && <DRow icon="📝" label="Требования">{m.requirements}</DRow>}
          {(m.hasVCS || m.needsItSupport || m.needsCatering) && (
            <div className="border-t border-slate-100 pt-3">
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-2">Сервисы</div>
              <div className="flex flex-wrap gap-1.5">
                {m.hasVCS && <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium border border-indigo-100">🎥 ВКС</span>}
                {m.needsItSupport && <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium border border-purple-100">🛠 IT-поддержка</span>}
                {m.needsCatering && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-100">☕ Кофе-брейк</span>}
              </div>
              {m.vcsLink && <a href={m.vcsLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline break-all">🔗 {m.vcsLink}</a>}
            </div>
          )}
          <div className={`flex gap-2 mt-2 ${onBack ? '' : ''}`}>
            {onBack && (
              <button onClick={onBack} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Назад
              </button>
            )}
            <button onClick={onClose} className={`flex-1 py-2.5 ${c.bg} ${c.text} rounded-lg text-sm font-medium hover:brightness-95 transition-all`}>Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>
        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">{label}</div>
        <div className="text-sm text-slate-700 mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function DayModal({ date, items, onClose, onMeeting }: { date: string; items: Meeting[]; onClose: () => void; onMeeting: (m: Meeting) => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0 sm:p-3 overflow-y-auto" onClick={onClose}>
      {/* Mobile: Full screen sheet | Desktop: Card */}
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl shadow-2xl min-h-screen sm:min-h-0 flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Mobile handle bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2 sm:hidden" />
        <div className="px-4 pb-4 border-b border-slate-100 sm:p-4 sm:border-b-0 sm:rounded-t-xl sm:bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{new Date(date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{items.length} мероприятий</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
        <div className="p-3 sm:p-4 space-y-3 flex-1 overflow-y-auto">
          {items.map(m => {
            const c = RC[m.roomId] || RC['room-1'];
            return (
              <button key={m.id} onClick={() => onMeeting(m)} className={`w-full text-left p-3 sm:p-4 rounded-xl border ${c.bg} ${c.border} hover:shadow-md transition-all active:scale-[0.99]`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-sm sm:text-base font-bold ${c.text}`}>{m.startTime}—{m.endTime}</span>
                  <SBadge status={m.status} />
                </div>
                <div className="text-base font-semibold text-slate-900 leading-tight">{m.title}</div>
                <div className="text-sm text-slate-500 mt-1 truncate">{m.roomName} · {m.organizer}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {m.hasVCS && <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">🎥 ВКС</span>}
                  {m.needsItSupport && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">🛠 IT</span>}
                  {m.needsCatering && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">☕ Кофе-брейк</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalCell({ day, meetings, selected, onSelect, onMeeting, onMore }: {
  day: DayInfo; meetings: Meeting[]; selected: boolean;
  onSelect: () => void; onMeeting: (m: Meeting) => void; onMore: (items: Meeting[]) => void;
}) {
  let bg = day.isCurrentMonth ? (day.isWeekend ? 'bg-red-50 hover:bg-red-100' : 'bg-slate-50 hover:bg-slate-100') : 'bg-white hover:bg-slate-50 opacity-50';
  let border = 'border-transparent';
  let dayColor = day.isCurrentMonth ? (day.isWeekend ? 'text-red-700' : 'text-slate-700') : 'text-slate-300';

  if (day.isToday) { bg = 'bg-green-100 hover:bg-green-200'; border = 'border-green-400'; dayColor = 'text-green-800'; }
  if (selected && !day.isToday) { bg = 'bg-blue-100 hover:bg-blue-200'; border = 'border-blue-400'; dayColor = 'text-blue-800'; }
  if (selected && day.isToday) { border = 'border-green-500 ring-1 ring-green-400'; }

  const shown = meetings.slice(0, 2);
  const more = meetings.length - shown.length;

  return (
    <div onClick={onSelect} className={`relative min-h-[68px] sm:min-h-[86px] rounded-lg border-2 ${border} ${bg} p-1 sm:p-1.5 cursor-pointer transition-all`}>
      <div className="flex items-center justify-between">
        <span className={`text-[11px] sm:text-sm font-semibold ${dayColor}`}>{day.dayOfMonth}</span>
        {day.isToday && <span className="text-[8px] text-green-600 font-bold">●</span>}
      </div>
      <div className="mt-0.5 space-y-0.5">
        {shown.map(m => {
          const c = RC[m.roomId] || RC['room-1'];
          return (
            <button key={m.id} onClick={e => { e.stopPropagation(); onMeeting(m); }}
              className={`block w-full text-left px-1 py-0.5 rounded ${c.bg} ${c.text} text-[8px] sm:text-[10px] font-medium truncate hover:brightness-95`}
              title={`${m.startTime} ${m.title}`}>
              <span className="font-bold">{m.startTime}</span> {m.title}
            </button>
          );
        })}
        {more > 0 && (
          <button onClick={e => { e.stopPropagation(); onMore(meetings); }}
            className="block w-full text-left px-1 py-0.5 text-[8px] sm:text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors">
            ещё {more}…
          </button>
        )}
      </div>
    </div>
  );
}

function Timeline({ meetings, isToday, now, onMeeting }: { meetings: Meeting[]; isToday: boolean; now: Date; onMeeting: (m: Meeting) => void }) {
  const START = 8, END = 20, TOTAL = (END - START) * 60;
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const nowPct = ((now.getHours() * 60 + now.getMinutes() - START * 60) / TOTAL) * 100;
  const hours: number[] = [];
  for (let h = START; h <= END; h++) hours.push(h);

  return (
    <div className="space-y-3">
      <div className="relative h-5 ml-24 sm:ml-32">
        {hours.map(h => (
          <div key={h} className="absolute -translate-x-1/2 text-[9px] sm:text-[10px] text-slate-400 font-medium" style={{ left: `${((h - START) / (END - START)) * 100}%` }}>
            {String(h).padStart(2,'0')}:00
          </div>
        ))}
      </div>
      {rooms.map(room => {
        const inRoom = meetings.filter(m => m.roomId === room.id);
        const c = RC[room.id];
        return (
          <div key={room.id} className="flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0" style={{ width: '90px' }}>
              <div className={`text-[10px] sm:text-xs font-bold ${c.text} truncate`}>{room.name.length > 22 ? room.name.slice(0,20)+'…' : room.name}</div>
              <div className="text-[9px] text-slate-400">{inRoom.length} событий</div>
            </div>
            <div className="flex-1 relative h-10 sm:h-12 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
              {hours.slice(1,-1).map(h => (
                <div key={h} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{ left: `${((h-START)/(END-START))*100}%` }} />
              ))}
              {isToday && nowPct >= 0 && nowPct <= 100 && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{ left: `${nowPct}%` }}>
                  <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-red-500" />
                </div>
              )}
              {inRoom.map(m => {
                const l = Math.max(0, ((toMin(m.startTime) - START*60) / TOTAL) * 100);
                const w = Math.min(Math.max(2, ((toMin(m.endTime)-toMin(m.startTime))/TOTAL)*100), 100-l);
                if (l >= 100) return null;
                return (
                  <button key={m.id} onClick={() => onMeeting(m)} title={`${m.startTime}–${m.endTime} ${m.title}`}
                    className={`absolute top-1 bottom-1 ${c.bar} hover:brightness-110 rounded text-white text-[9px] sm:text-[10px] font-medium px-1 overflow-hidden text-left z-10 shadow-sm transition-all`}
                    style={{ left: `${l}%`, width: `${w}%` }}>
                    <div className="truncate font-bold">{m.startTime}</div>
                    <div className="truncate">{m.title}</div>
                  </button>
                );
              })}
              {inRoom.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300">Свободен</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ meetings, onBookingClick: _ob }: Props) {
  const [now, setNow] = useState(new Date());
  const [selDate, setSelDate] = useState(localToday);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [openMeeting, setOpenMeeting] = useState<Meeting | null>(null);
  const [openMeetingFromDay, setOpenMeetingFromDay] = useState(false); // открыто из DayModal
  const [openDay, setOpenDay] = useState<{ date: string; items: Meeting[] } | null>(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  // Вычисляем "живые" статусы на основе текущего времени
  const liveMeetings = useMemo(() => 
    meetings.map(m => ({ 
      ...m, 
      status: getLiveStatus(m.date, m.startTime, m.endTime, m.status, now) as Meeting['status'] 
    })), 
    [meetings, now]
  );

  const vis = useMemo(() => liveMeetings.filter(visible), [liveMeetings]);
  const stats = useMemo(() => getDashboardStats(meetings, now), [meetings, now]);
  const todayStr = localToday();
  const todayMeetings = vis.filter(m => m.date === todayStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const byDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    for (const m of vis) { if (!map[m.date]) map[m.date] = []; map[m.date].push(m); }
    for (const k of Object.keys(map)) map[k].sort((a,b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [vis]);
  const grid = useMemo(() => getMonthGrid(calMonth.y, calMonth.m), [calMonth]);
  const selMeetings = byDate[selDate] || [];
  const isToday = selDate === todayStr;

  const prevMonth = () => setCalMonth(c => c.m === 0 ? { y: c.y-1, m: 11 } : { y: c.y, m: c.m-1 });
  const nextMonth = () => setCalMonth(c => c.m === 11 ? { y: c.y+1, m: 0 } : { y: c.y, m: c.m+1 });
  const goToday = () => { const d = new Date(); setCalMonth({ y: d.getFullYear(), m: d.getMonth() }); setSelDate(toLocalDateStr(d)); };

  const curTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { icon: '📅', label: 'Совещаний сегодня', value: stats.totalMeetingsToday, color: 'blue' },
          { icon: '🏛', label: 'Занято залов', value: `${stats.roomsOccupied} / ${stats.totalRooms}`, color: 'emerald' },
          { icon: '📊', label: 'Загрузка сегодня', value: `${stats.utilizationRate}%`, color: 'purple' },
          { icon: '👥', label: 'Участников всего', value: todayMeetings.reduce((s,m) => s+m.participants.length, 0), color: 'amber' },
        ].map(({ icon, label, value, color }) => {
          const bg: Record<string,string> = { blue:'bg-blue-100', emerald:'bg-emerald-100', purple:'bg-purple-100', amber:'bg-amber-100' };
          return (
            <div key={label} className="bg-white rounded-lg sm:rounded-xl border border-slate-200 p-3 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg ${bg[color]} flex items-center justify-center text-base sm:text-2xl flex-shrink-0`}>{icon}</div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-sm text-slate-500 truncate">{label}</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-900">{value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Calendar + Selected day */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">{MONTH_NAMES_RU[calMonth.m]} {calMonth.y}</h2>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
              <button onClick={goToday} className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Сегодня</button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_SHORT_RU.map((w,i) => (
              <div key={w} className={`text-center text-[10px] sm:text-xs font-semibold py-1 ${i>=5?'text-red-500':'text-slate-500'}`}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map(day => (
              <CalCell key={day.dateStr} day={day} meetings={byDate[day.dateStr]||[]} selected={selDate===day.dateStr}
                onSelect={() => setSelDate(day.dateStr)} onMeeting={setOpenMeeting} onMore={items => setOpenDay({ date: day.dateStr, items })} />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
            {[
              { color: 'bg-green-100 border-green-300', label: 'Сегодня' },
              { color: 'bg-blue-100 border-blue-300', label: 'Выбранный день' },
              { color: 'bg-red-50 border-red-200', label: 'Выходной / праздник' },
              { color: 'bg-slate-50 border-slate-200', label: 'Будний день' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded border ${l.color}`}></div>
                <span>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
            {isToday ? 'Сегодня' : new Date(selDate).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <p className="text-xs text-slate-400 mb-3">{selMeetings.length} мероприятий</p>
          {selMeetings.length === 0 ? (
            <div className="py-8 text-center"><div className="text-4xl mb-2 opacity-30">📅</div><p className="text-sm text-slate-400">Мероприятий нет</p></div>
          ) : (
            <div className="space-y-2">
              {selMeetings.map(m => {
                const c = RC[m.roomId] || RC['room-1'];
                return (
                  <button key={m.id} onClick={() => setOpenMeeting(m)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-lg border ${c.bg} ${c.border} hover:shadow-md transition-all`}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-xs font-bold ${c.text}`}>{m.startTime}—{m.endTime}</span>
                      <SBadge status={m.status} />
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-slate-900 mt-1 line-clamp-2">{m.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">{m.roomName}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.hasVCS && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">🎥 ВКС</span>}
                      {m.needsItSupport && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">🛠 IT</span>}
                      {m.needsCatering && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">☕</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900">Таймлайн залов</h2>
          <span className="text-xs text-slate-400">{isToday ? 'сегодня' : new Date(selDate).toLocaleDateString('ru-RU')}</span>
        </div>
        <Timeline meetings={selMeetings} isToday={isToday} now={now} onMeeting={setOpenMeeting} />
      </div>

      {/* Room status */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Состояние залов</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {rooms.map(room => {
            const cur = todayMeetings.find(m => m.roomId === room.id && m.startTime <= curTime && m.endTime > curTime);
            const next = todayMeetings.find(m => m.roomId === room.id && m.startTime > curTime);
            const c = RC[room.id];
            return (
              <div key={room.id} className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden ${cur?'border-green-400':'border-slate-200'}`}>
                <div className={`p-3 sm:p-4 bg-gradient-to-r ${c.grad} text-white`}>
                  <h3 className="font-semibold text-sm sm:text-base">{room.name}</h3>
                  <p className="text-xs text-white/80 mt-0.5">{room.floor} этаж · {room.capacity} мест · {room.hasVCS?'ВКС: есть':'ВКС: нет'}</p>
                  <p className="text-[10px] text-white/70 mt-0.5">{room.address}</p>
                </div>
                <div className="p-3 sm:p-4">
                  {cur ? (
                    <button onClick={() => setOpenMeeting(cur)} className="w-full text-left bg-green-50 rounded-lg p-2.5 border border-green-100 hover:bg-green-100 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-[10px] font-bold text-green-700 uppercase">Идёт сейчас</span></div>
                      <p className="text-xs sm:text-sm font-medium text-green-900">{cur.title}</p>
                      <p className="text-xs text-green-700 mt-0.5">{cur.startTime}—{cur.endTime} · {cur.organizer}</p>
                    </button>
                  ) : (
                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                      <p className="text-xs sm:text-sm font-medium text-slate-600">Зал свободен</p>
                      <p className="text-xs text-slate-400 mt-0.5">{next ? `Следующее: ${next.startTime} — ${next.title}` : 'На сегодня мероприятий нет'}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {openMeeting && (
        <MeetingModal
          m={openMeeting}
          onClose={() => { setOpenMeeting(null); setOpenMeetingFromDay(false); }}
          onBack={openMeetingFromDay && openDay ? () => { setOpenMeeting(null); setOpenMeetingFromDay(false); } : undefined}
        />
      )}
      {openDay && !openMeeting && (
        <DayModal
          date={openDay.date}
          items={openDay.items}
          onClose={() => setOpenDay(null)}
          onMeeting={m => { setOpenMeetingFromDay(true); setOpenMeeting(m); }}
        />
      )}
    </div>
  );
}
