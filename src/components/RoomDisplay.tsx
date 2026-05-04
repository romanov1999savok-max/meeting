import { useEffect, useState } from 'react';
import { rooms, mockMeetings } from '../data';


interface RoomDisplayProps {
  roomId: string;
}

export default function RoomDisplay({ roomId }: RoomDisplayProps) {
  const room = rooms.find(r => r.id === roomId);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <p className="text-slate-500">Зал не найден</p>
        </div>
      </div>
    );
  }

  const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todayMeetings = mockMeetings
    .filter(m => m.date === today && m.roomId === roomId && m.status !== 'cancelled')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentMeeting = todayMeetings.find(
    m => m.startTime <= currentTime && m.endTime > currentTime
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
          <div className="w-16 h-20 mx-auto mb-3 bg-white/95 rounded-lg p-1.5 shadow-md">
            <img
              src="/images/logo-dmitrov.png"
              alt="Герб Дмитровского округа"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold">{room.name}</h1>
          <p className="text-blue-100 mt-1">{room.floor} этаж · до {room.capacity} человек</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 text-blue-100 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{room.address}</span>
          </div>
          <div className="flex justify-center gap-3 mt-3">
            {room.hasVCS && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">ВКС</span>
            )}
            {room.hasProjector && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Проектор</span>
            )}
          </div>
        </div>

        {/* Current status */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500">
              {now.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <p className="text-4xl font-bold text-slate-900 mt-1">
              {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {currentMeeting ? (
            <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center mb-6">
              <span className="inline-block px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium mb-2">
                ИДЁТ СЕЙЧАС
              </span>
              <h2 className="text-xl font-bold text-green-900">{currentMeeting.title}</h2>
              <p className="text-green-700 mt-1">
                {currentMeeting.startTime} — {currentMeeting.endTime}
              </p>
              <p className="text-green-600 text-sm mt-1">
                Организатор: {currentMeeting.organizer}
              </p>
              {currentMeeting.hasVCS && (
                <p className="text-green-600 text-sm mt-1">ВКС: требуется подготовка</p>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-blue-900">Зал свободен</h2>
            </div>
          )}

          {/* Schedule */}
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Расписание на сегодня
          </h3>
          <div className="space-y-2">
            {todayMeetings.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Мероприятий не запланировано</p>
            ) : (
              todayMeetings.map(meeting => {
                const isCurrent = meeting.id === currentMeeting?.id;
                const isPast = meeting.endTime <= currentTime;
                return (
                  <div
                    key={meeting.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-green-50 border-green-200'
                        : isPast
                        ? 'bg-slate-50 border-slate-100 opacity-60'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isCurrent ? 'bg-green-500 animate-pulse' : isPast ? 'bg-slate-300' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isCurrent ? 'text-green-900' : isPast ? 'text-slate-400' : 'text-slate-800'
                      }`}>
                        {meeting.title}
                      </p>
                      <p className={`text-xs ${
                        isCurrent ? 'text-green-600' : 'text-slate-400'
                      }`}>
                        {meeting.startTime} — {meeting.endTime}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-medium">
                        Сейчас
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Room details */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Администрация Дмитровского муниципального округа · МКУ "Управление по ООД ОМСУ"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
