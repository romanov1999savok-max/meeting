import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SecretaryPage from './components/SecretaryPage';
import LoginModal from './components/LoginModal';
import BookingModal from './components/BookingModal';
import { getCurrentUser, logout, User, listUsers } from './auth';
import { mockMeetings, rooms } from './data';
import { Meeting } from './types';
import { localToday, toLocalDateStr } from './utils/date';

type Page = 'dashboard' | 'timeline' | 'staff';

/* ─── Иконки ─── */
function IconDashboard({ active }: { active: boolean }) {
  return (<svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>);
}
function IconTimeline({ active }: { active: boolean }) {
  return (<svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>);
}
function IconStaff({ active }: { active: boolean }) {
  return (<svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>);
}
function IconPlus() {
  return (<svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>);
}
function IconManage({ active }: { active: boolean }) {
  return (<svg className={`w-6 h-6 ${active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>);
}

/* ═══════════ Мобильная навигация: ПУБЛИЧНАЯ ═══════════ */
function PublicTabBar({ page, setPage, setShowBooking, setShowLogin, user, pending }: {
  page: Page; setPage: (p: Page) => void; setShowBooking: (v: boolean) => void;
  setShowLogin: (v: boolean) => void; user: User | null; pending: number;
}) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 pb-2">
      <div className="flex items-stretch h-16">
        <button onClick={() => setPage('dashboard')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 active:bg-slate-50 transition-colors">
          <IconDashboard active={page === 'dashboard'} />
          <span className={`text-[10px] font-medium ${page === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>Дашборд</span>
        </button>
        <button onClick={() => setPage('timeline')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 active:bg-slate-50 transition-colors">
          <IconTimeline active={page === 'timeline'} />
          <span className={`text-[10px] font-medium ${page === 'timeline' ? 'text-blue-600' : 'text-slate-400'}`}>Таймлайн</span>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <button onClick={() => setShowBooking(true)}
            className="w-14 h-14 -mt-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-300 flex items-center justify-center active:scale-95 transition-transform">
            <IconPlus />
          </button>
        </div>
        <button onClick={() => setPage('staff')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 active:bg-slate-50 transition-colors">
          <IconStaff active={page === 'staff'} />
          <span className={`text-[10px] font-medium ${page === 'staff' ? 'text-blue-600' : 'text-slate-400'}`}>Сотрудники</span>
        </button>
        <button onClick={() => user ? (window as any).__goMgmt?.() : setShowLogin(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1 active:bg-slate-50 transition-colors relative">
          <div className="relative">
            <IconManage active={false} />
            {pending > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{pending}</span>}
          </div>
          <span className="text-[10px] font-medium text-slate-400">{user ? 'Управление' : 'Войти'}</span>
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(getCurrentUser);
  const [page, setPage] = useState<Page>('dashboard');
  const [inMgmt, setInMgmt] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [showLogin, setShowLogin] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  // Проброс функции для мобильных
  useEffect(() => { (window as any).__goMgmt = () => setInMgmt(true); (window as any).__goHome = goHome; }, []);

  const pending = meetings.filter(m => m.status === 'pending').length;

  useEffect(() => { if (!user) setInMgmt(false); }, [user]);
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }
  }, [toast]);

  const handleLoginSuccess = (u: User) => { setUser(u); setShowLogin(false); setInMgmt(true); };
  const handleLogout = () => { logout(); setUser(null); setInMgmt(false); };
  const goHome = () => { setInMgmt(false); setPage('dashboard'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleBookingSubmit = (m: Meeting) => {
    setMeetings(prev => [...prev, m]);
    setShowBooking(false);
    setPage('dashboard');
    setInMgmt(false);
    setShowSuccess(true);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ═══════════ ШАПКА ═══════════ */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            <button onClick={goHome} className="flex items-center gap-2 min-w-0 text-left">
              <img src="/images/logo-dmitrov.png" alt="Герб" className="w-8 h-10 sm:w-10 sm:h-12 flex-shrink-0 object-contain" />
              <div className="min-w-0">
                <div className="sm:hidden">
                  <div className="text-sm font-bold text-slate-900 leading-tight">Залы заседаний</div>
                  <div className="text-[10px] text-slate-400 leading-tight">Дмитровский м.о.</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-base font-bold text-slate-900 leading-tight">Единая система бронирования и координации</div>
                  <div className="text-xs text-slate-500 leading-tight">Управление залами заседаний администрации Дмитровского м.о.</div>
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {user ? (
                <div className="relative">
                  <button onClick={() => setMenuOpen(o => !o)}
                    className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-50 transition-all">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${user.role === 'it' ? 'from-purple-500 to-indigo-600' : 'from-blue-500 to-indigo-600'} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-xs font-semibold text-slate-700 leading-tight">{user.fullName.split(' ')[0]}</div>
                      <div className="text-[10px] text-slate-400">{user.role === 'it' ? '🛠 IT' : '📋 Секретарь'}</div>
                    </div>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <div className="text-sm font-semibold text-slate-900">{user.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{user.position}</div>
                        </div>
                        {!inMgmt && <button onClick={() => { setInMgmt(true); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <IconManage active={false} />Управление {pending > 0 && `(${pending})`}
                        </button>}
                        {inMgmt && <button onClick={() => { setInMgmt(false); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                          К дашборду
                        </button>}
                        <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Выйти
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* TOAST */}
      {toast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
          <div className="bg-green-600 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* ═══════════ ОСНОВНОЙ КОНТЕНТ ═══════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 sm:pb-6">
        {user && inMgmt ? (
          <SecretaryPage meetings={meetings} setMeetings={setMeetings} user={user} onNotify={setToast} />
        ) : (
          <>
            {/* Мобильный */}
            <div className="sm:hidden">
              {page === 'dashboard' && <Dashboard meetings={meetings} onBookingClick={() => setShowBooking(true)} />}
              {page === 'timeline' && <MobileTimelinePage meetings={meetings} />}
              {page === 'staff' && <MobileStaffPage />}
            </div>
            {/* Десктоп — боковой сайдбар */}
            <div className="hidden sm:flex gap-6">
              <aside className="w-64 flex-shrink-0 self-start sticky top-20">
                <nav className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 space-y-1">
                  {[
                    { id: 'dashboard' as Page, icon: '📊', label: 'Дашборд', desc: 'Обзор и календарь' },
                    { id: 'timeline' as Page, icon: '📅', label: 'Таймлайн', desc: 'Расписание по залам' },
                    { id: 'staff' as Page, icon: '👥', label: 'Сотрудники', desc: 'Контакты' },
                  ].map(it => (
                    <button key={it.id} onClick={() => setPage(it.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${page === it.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>
                      <span className="text-xl">{it.icon}</span>
                      <div><div className="text-sm font-semibold">{it.label}</div><div className="text-[11px] text-slate-400">{it.desc}</div></div>
                    </button>
                  ))}
                </nav>
                <button onClick={() => setShowBooking(true)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Забронировать зал
                </button>
                {user && (
                  <button onClick={() => setInMgmt(true)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all relative">
                    <IconManage active={false} />Управление
                    {pending > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pending}</span>}
                  </button>
                )}
                {!user && (
                  <button onClick={() => setShowLogin(true)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all">
                    🔒 Войти для управления
                  </button>
                )}
              </aside>
              <div className="flex-1 min-w-0">
                {page === 'dashboard' && <Dashboard meetings={meetings} onBookingClick={() => setShowBooking(true)} />}
                {page === 'timeline' && <MobileTimelinePage meetings={meetings} />}
                {page === 'staff' && <MobileStaffPage />}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Мобильная навигация — Публичная */}
      {!inMgmt && (
        <PublicTabBar page={page} setPage={setPage} setShowBooking={setShowBooking} setShowLogin={setShowLogin} user={user} pending={pending} />
      )}

      {/* FOOTER (десктоп) */}
      <footer className="hidden sm:block border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/images/logo-dmitrov.png" alt="Герб" className="w-8 h-10 object-contain" />
              <div className="text-xs text-slate-400 leading-tight">
                МКУ «УОДОМС»<br />
                <span className="text-slate-300">Управление по обеспечению деятельности ОМСУ</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Разработчик:</span><span className="font-medium text-slate-500">Романов В.С.</span>
              <span className="mx-1">·</span><span>2026</span>
            </div>
          </div>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />}
      {showBooking && <BookingModal user={user} onClose={() => setShowBooking(false)} onSubmit={handleBookingSubmit} />}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} />}
    </div>
  );
}

/* ═══════════ МОБИЛЬНЫЕ СТРАНИЦЫ ═══════════ */
function MobileTimelinePage({ meetings }: { meetings: Meeting[] }) {
  const [selDate, setSelDate] = useState(localToday);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);
  const vis = meetings.filter(m => !['pending','rejected','cancelled'].includes(m.status));
  const dayMeetings = vis.filter(m => m.date === selDate).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const todayStr = localToday();
  const isToday = selDate === todayStr;
  const shiftDate = (d: number) => { const dt = new Date(selDate); dt.setDate(dt.getDate()+d); setSelDate(toLocalDateStr(dt)); };
  const RC: Record<string, { bar: string; bg: string; border: string; text: string }> = {
    'room-1': { bar: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    'room-2': { bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  };
  const START=8, END=20, TOTAL=(END-START)*60;
  const toMin=(t:string)=>{const[h,m]=t.split(':').map(Number);return h*60+m;};
  const nowPct=((now.getHours()*60+now.getMinutes()-START*60)/TOTAL)*100;
  const hours:number[]=[]; for(let h=START;h<=END;h++)hours.push(h);

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-slate-900">Таймлайн залов</h1><p className="text-sm text-slate-500 mt-0.5">Расписание мероприятий по залам</p></div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex items-center gap-2">
        <button onClick={()=>shiftDate(-1)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 flex-shrink-0">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-slate-900">{new Date(selDate).toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</div>
          <div className="text-xs text-slate-400 mt-0.5">{isToday?'🟢 Сегодня · ':''}{dayMeetings.length} мероприятий</div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {!isToday&&<button onClick={()=>setSelDate(todayStr)} className="px-3 h-10 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold active:bg-blue-100">Сегодня</button>}
          <button onClick={()=>shiftDate(1)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200">
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      {/* Горизонтальный скролл для таймлайна на мобильных */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto p-4">
          <div className="min-w-[640px]">
            <div className="relative h-5 ml-20 mb-3">
              {hours.map(h=><div key={h} className="absolute -translate-x-1/2 text-[9px] text-slate-400" style={{left:`${((h-START)/(END-START))*100}%`}}>{String(h).padStart(2,'0')}</div>)}
            </div>
            <div className="space-y-3">
              {rooms.map(room=>{
                const inRoom=dayMeetings.filter(m=>m.roomId===room.id);
                const c=RC[room.id]||RC['room-1'];
                return (
                  <div key={room.id} className="flex items-center gap-2">
                    <div className="w-20 flex-shrink-0">
                      <div className={`text-[10px] font-bold ${c.text} leading-tight`}>д. {room.id==='room-1'?'2, каб. 20':'4, каб. 10'}</div>
                      <div className="text-[9px] text-slate-400">{inRoom.length} соб.</div>
                    </div>
                    <div className="flex-1 relative h-11 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                      {hours.slice(1,-1).map(h=><div key={h} className="absolute top-0 bottom-0 w-px bg-slate-200" style={{left:`${((h-START)/(END-START))*100}%`}} />)}
                      {isToday&&nowPct>=0&&nowPct<=100&&<div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20" style={{left:`${nowPct}%`}}><div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-red-500"/></div>}
                      {inRoom.map(m=>{
                        const l=Math.max(0,((toMin(m.startTime)-START*60)/TOTAL)*100);
                        const w=Math.min(Math.max(2,((toMin(m.endTime)-toMin(m.startTime))/TOTAL)*100),100-l);
                        if(l>=100)return null;
                        return(<div key={m.id} className={`absolute top-1 bottom-1 ${c.bar} rounded-lg text-white text-[9px] font-medium px-1 overflow-hidden z-10 shadow-sm`} style={{left:`${l}%`,width:`${w}%`}}><div className="truncate font-bold">{m.startTime}</div><div className="truncate">{m.title}</div></div>);
                      })}
                      {inRoom.length===0&&<div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-300">Свободен</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {dayMeetings.length>0&&(
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-slate-700 px-1">Мероприятия дня</h2>
          {dayMeetings.map(m=>{const c=RC[m.roomId]||RC['room-1'];return(
            <div key={m.id} className={`bg-white rounded-2xl border ${c.border} p-4 shadow-sm`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-xs font-bold ${c.text}`}>{m.startTime} — {m.endTime}</span>
                <div className="flex gap-1">{m.hasVCS&&<span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-medium">🎥 ВКС</span>}{m.needsCatering&&<span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[10px] font-medium">☕</span>}</div>
              </div>
              <div className="text-sm font-semibold text-slate-900">{m.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{m.roomName}</div>
            </div>
          );})}
        </div>
      )}
      {dayMeetings.length===0&&<div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm"><div className="text-4xl mb-2">📅</div><p className="text-sm text-slate-400">Мероприятий на этот день нет</p></div>}
    </div>
  );
}

function MobileStaffPage() {
  const all = listUsers();
  const secretaries = all.filter(u => u.role === 'secretary');
  const itStaff = all.filter(u => u.role === 'it');
  const Group = ({ title, icon, desc, users, accentBg, accentText, accentBorder }: {
    title: string; icon: string; desc: string; users: User[]; accentBg: string; accentText: string; accentBorder: string;
  }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`${accentBg} ${accentBorder} border-b px-4 py-3`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="flex-1"><h2 className={`text-base font-bold ${accentText}`}>{title}</h2><p className="text-xs text-slate-500 mt-0.5">{desc}</p></div>
          <span className={`px-2 py-1 bg-white/60 ${accentText} rounded-lg text-xs font-bold`}>{users.length}</span>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {users.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">Нет сотрудников</div>
        ) : users.map(u => (
          <div key={u.username} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-900 leading-tight">{u.fullName}</div>
              <div className="text-xs text-slate-400 mt-0.5">{u.position}</div>
            </div>
            <div className="flex-shrink-0 text-right space-y-0.5">
              {u.phone && <a href={`tel:${u.phone}`} className="block text-xs text-blue-600 font-medium hover:underline">{u.phone}</a>}
              {u.ext && <div className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono font-bold">{u.ext}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-bold text-slate-900">Сотрудники</h1><p className="text-sm text-slate-500 mt-0.5">Контакты секретариата и IT-отдела</p></div>
      <Group title="Секретариат" icon="📋" desc="Расписание и согласование заявок" users={secretaries} accentBg="bg-blue-50" accentText="text-blue-700" accentBorder="border-blue-200" />
      <Group title="IT-отдел" icon="🛠" desc="МКУ «УСР» — отдел программно-технического взаимодействия" users={itStaff} accentBg="bg-purple-50" accentText="text-purple-700" accentBorder="border-purple-200" />
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div className="text-sm text-amber-900"><strong className="block mb-1">Как забронировать зал?</strong><ol className="space-y-1 text-amber-800 list-decimal list-inside"><li>Нажмите <strong>+</strong> внизу экрана</li><li>Заполните контактные данные</li><li>Укажите параметры мероприятия</li><li>Заявка уйдёт на согласование</li></ol></div>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden pb-6" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold">Заявка отправлена!</h2>
          <p className="text-sm text-white/90 mt-1">Спасибо за обращение</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 text-center">Заявка передана секретариату на согласование. После одобрения мероприятие появится в общем расписании.</p>
          <button onClick={onClose} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">Понятно</button>
        </div>
      </div>
    </div>
  );
}
