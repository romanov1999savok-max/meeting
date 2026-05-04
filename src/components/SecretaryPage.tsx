import { useState, useEffect } from 'react';
import { rooms, checkRoomAvailability } from '../data';
import { Meeting } from '../types';
import { User, listUsers, createUser, deleteUser, updateUser, canEditUser, canCreateRole, UserRole } from '../auth';
import { getRooms, updateRoom, getEquipmentLabels, EQUIPMENT_CATALOG, EQUIPMENT_CATEGORIES } from '../equipment';
import { localToday } from '../utils/date';

interface Props { meetings: Meeting[]; setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>; user: User; onNotify: (m: string) => void; }
type Tab = 'meetings' | 'requests' | 'users' | 'rooms';

function SBadge({ status }: { status: Meeting['status'] }) {
  const mp: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-orange-100 text-orange-800', label: 'На согласовании' },
    scheduled: { cls: 'bg-yellow-100 text-yellow-800', label: 'Запланировано' },
    ongoing: { cls: 'bg-green-100 text-green-800', label: 'Идёт' },
    completed: { cls: 'bg-gray-100 text-gray-600', label: 'Завершено' },
    cancelled: { cls: 'bg-red-100 text-red-600', label: 'Отменено' },
    rejected: { cls: 'bg-red-100 text-red-700', label: 'Отклонено' },
  };
  const it = mp[status];
  return <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${it.cls}`}>{it.label}</span>;
}

function TabBtn({ active, onClick, icon, children, badge }: { active: boolean; onClick: () => void; icon: string; children: React.ReactNode; badge?: number }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
      <span>{icon}</span><span>{children}</span>
      {badge !== undefined && badge > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">{badge}</span>}
    </button>
  );
}

function FF({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{label}</label>{children}{error && <p className="mt-0.5 text-xs text-red-500">{error}</p>}</div>;
}

const IC = `w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40`;

interface MF {
  title: string; description: string; date: string; startTime: string; endTime: string;
  roomId: string; organizer: string; responsiblePerson: string; participants: string;
  requirements: string; hasVCS: boolean; vcsLink: string; needsItSupport: boolean; needsCatering: boolean;
}
const EF: MF = { title:'',description:'',date:localToday(),startTime:'09:00',endTime:'10:00',roomId:'',organizer:'',responsiblePerson:'',participants:'',requirements:'',hasVCS:false,vcsLink:'',needsItSupport:false,needsCatering:false };

// ===== MEETINGS TAB =====
function MeetingsTab({ meetings, setMeetings, onNotify, user }: { meetings: Meeting[]; setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>; onNotify: (m:string) => void; user: User }) {
  const [filterDate, setFilterDate] = useState(localToday);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MF>({ ...EF, organizer: user.fullName });
  const [editId, setEditId] = useState<string|null>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const todayStr = localToday();
  const visible = meetings.filter(m => m.status !== 'pending' && m.status !== 'rejected').filter(m => m.date === filterDate).sort((a,b) => a.startTime.localeCompare(b.startTime));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.title.trim()) e.title = 'Название обязательно';
    if (!form.roomId) e.roomId = 'Выберите зал';
    if (!form.organizer.trim()) e.organizer = 'Организатор обязателен';
    if (form.startTime >= form.endTime) e.endTime = 'Время окончания позже начала';
    if (form.roomId && !e.endTime && !checkRoomAvailability(form.roomId, form.date, form.startTime, form.endTime, editId||undefined)) e.roomId = 'Зал занят';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); if (!validate()) return;
    const roomName = rooms.find(r => r.id === form.roomId)?.name || '';
    const participants = form.participants.split('\n').map(p=>p.trim()).filter(Boolean);
    if (editId) {
      setMeetings(prev => prev.map(m => m.id === editId ? { ...m, ...form, roomName, participants, vcsLink: form.vcsLink||undefined } : m));
      onNotify('Совещание обновлено');
    } else {
      setMeetings(prev => [...prev, { id: String(Date.now()), ...form, roomName, participants, vcsLink: form.vcsLink||undefined, responsiblePerson: form.responsiblePerson||undefined, status: 'scheduled' as const, createdAt: new Date().toISOString(), requesterUsername: user.username }]);
      onNotify('Совещание создано');
    }
    setShowForm(false); setEditId(null); setForm({ ...EF, organizer: user.fullName });
  };

  const handleEdit = (m: Meeting) => {
    setForm({ title:m.title, description:m.description, date:m.date, startTime:m.startTime, endTime:m.endTime, roomId:m.roomId, organizer:m.organizer, responsiblePerson:m.responsiblePerson||'', participants:m.participants.join('\n'), requirements:m.requirements, hasVCS:m.hasVCS, vcsLink:m.vcsLink||'', needsItSupport:m.needsItSupport||false, needsCatering:m.needsCatering||false });
    setEditId(m.id); setShowForm(true); setErrors({});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs sm:text-sm font-medium text-slate-600">Дата:</label>
          <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
          {filterDate === todayStr && <span className="text-xs text-slate-400">(сегодня)</span>}
        </div>
        <button onClick={() => { setForm({...EF,date:filterDate,organizer:user.fullName}); setEditId(null); setErrors({}); setShowForm(true); }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Новое совещание
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {visible.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">На выбранную дату совещаний нет</div> : visible.map(m => (
          <div key={m.id} className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-900 text-sm sm:text-base">{m.title}</span>
                  <SBadge status={m.status} />
                  {m.hasVCS && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium">🎥 ВКС</span>}
                  {m.needsItSupport && <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">🛠 IT</span>}
                  {m.needsCatering && <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium">☕ Кофе-брейк</span>}
                </div>
                <div className="text-xs text-slate-500 mt-1">{m.startTime}—{m.endTime} · {m.roomName}</div>
                <div className="text-xs text-slate-400 mt-0.5">{m.organizer}{m.responsiblePerson && ` · Отв: ${m.responsiblePerson}`}</div>
                {m.vcsLink && <a href={m.vcsLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 hover:underline mt-0.5 block truncate">🔗 {m.vcsLink}</a>}
              </div>
              {(m.status === 'scheduled' || m.status === 'ongoing') && (
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Редактировать"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => { setMeetings(prev=>prev.map(x=>x.id===m.id?{...x,status:'cancelled' as const}:x)); onNotify('Отменено'); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded" title="Отменить"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <button onClick={() => { setMeetings(prev=>prev.filter(x=>x.id!==m.id)); onNotify('Удалено'); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Удалить"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-3 overflow-y-auto" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mt-0 sm:mt-10 mb-10" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{editId?'Редактировать':'Новое совещание'}</h2>
              <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
              <FF label="Название *" error={errors.title}><input type="text" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={IC} /></FF>
              <div className="grid grid-cols-2 gap-3">
                <FF label="Дата *"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className={IC} /></FF>
                <FF label="Зал *" error={errors.roomId}><select value={form.roomId} onChange={e=>{const r=rooms.find(x=>x.id===e.target.value);setForm(f=>({...f,roomId:e.target.value,hasVCS:r?.hasVCS||false}));}} className={IC}><option value="">Выберите...</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></FF>
                <FF label="Начало *"><input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} className={IC} /></FF>
                <FF label="Окончание *" error={errors.endTime}><input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} className={IC} /></FF>
              </div>
              <FF label="Организатор *" error={errors.organizer}><input type="text" value={form.organizer} onChange={e=>setForm(f=>({...f,organizer:e.target.value}))} className={IC} /></FF>
              <FF label="Ответственный со стороны организатора"><input type="text" value={form.responsiblePerson} onChange={e=>setForm(f=>({...f,responsiblePerson:e.target.value}))} className={IC} placeholder="ФИО ответственного" /></FF>
              <FF label="Описание"><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className={IC} /></FF>
              <FF label="Участники"><textarea value={form.participants} onChange={e=>setForm(f=>({...f,participants:e.target.value}))} rows={2} className={IC} placeholder="Каждый с новой строки" /></FF>
              <div className="border-t border-slate-100 pt-3">
                <div className="text-sm font-semibold text-slate-700 mb-2">ВКС и техническое обеспечение</div>
                <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={form.hasVCS} onChange={e=>setForm(f=>({...f,hasVCS:e.target.checked}))} className="rounded" /><span className="text-sm">🎥 Требуется ВКС</span></label>
                {form.hasVCS && <FF label="Ссылка на ВКС (необязательно)"><input type="url" value={form.vcsLink} onChange={e=>setForm(f=>({...f,vcsLink:e.target.value}))} className={IC} placeholder="https://..." /></FF>}
                <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={form.needsItSupport} onChange={e=>setForm(f=>({...f,needsItSupport:e.target.checked}))} className="rounded" /><span className="text-sm">🛠 IT-поддержка</span></label>
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.needsCatering?'border-amber-400 bg-amber-50':'border-slate-200'}`}>
                  <input type="checkbox" checked={form.needsCatering} onChange={e=>setForm(f=>({...f,needsCatering:e.target.checked}))} className="sr-only" />
                  <span className="text-2xl">☕</span>
                  <div><div className="text-sm font-medium">Кофе-брейк (чай / кофе)</div><div className="text-xs text-slate-500">Секретарю придёт уведомление о подготовке</div></div>
                </label>
                <div className="mt-2"><FF label="Технические требования"><input type="text" value={form.requirements} onChange={e=>setForm(f=>({...f,requirements:e.target.value}))} className={IC} placeholder="проектор, микрофоны..." /></FF></div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">{editId?'Сохранить':'Создать'}</button>
                <button type="button" onClick={()=>setShowForm(false)} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== REQUESTS TAB =====
function RequestsTab({ meetings, setMeetings, onNotify }: { meetings: Meeting[]; setMeetings: React.Dispatch<React.SetStateAction<Meeting[]>>; onNotify: (m:string)=>void }) {
  const pending = meetings.filter(m=>m.status==='pending').sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const [rejectId, setRejectId] = useState<string|null>(null);
  const [reason, setReason] = useState('');

  const approve = (id: string) => {
    const m = meetings.find(x=>x.id===id);
    if (!m) return;
    if (!checkRoomAvailability(m.roomId, m.date, m.startTime, m.endTime, id)) { onNotify('⚠️ Конфликт расписания — зал уже занят'); return; }
    setMeetings(prev=>prev.map(x=>x.id===id?{...x,status:'scheduled' as const}:x));
    onNotify('Заявка одобрена и добавлена в план');
  };
  const reject = (id: string) => {
    setMeetings(prev=>prev.map(x=>x.id===id?{...x,status:'rejected' as const,rejectionReason:reason.trim()||'Отклонено секретариатом'}:x));
    setRejectId(null); setReason(''); onNotify('Заявка отклонена');
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <div className="text-xs sm:text-sm text-orange-800"><strong>Заявки на бронирование</strong> — поступают с дашборда от сотрудников и гостей. После одобрения автоматически попадают в план.</div>
      </div>
      {pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center"><div className="text-4xl mb-2">✅</div><p className="text-sm text-slate-500">Нет заявок на согласовании</p></div>
      ) : pending.map(m => (
        <div key={m.id} className="bg-white rounded-xl border-l-4 border-l-orange-400 border border-slate-200 shadow-sm p-3 sm:p-4 space-y-3">
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900 text-sm sm:text-base">{m.title}</h3><SBadge status={m.status} /></div>
            <p className="text-xs text-slate-500 mt-1">{m.description}</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600">
            <div className="flex items-center gap-2"><span>📅</span><span>{new Date(m.date).toLocaleDateString('ru-RU')} · {m.startTime}—{m.endTime}</span></div>
            <div className="flex items-center gap-2"><span>🏛</span><span className="truncate">{m.roomName}</span></div>
          </div>
          {m.requesterContact && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-[10px] font-semibold text-amber-700 uppercase mb-1.5">Контакты заявителя</div>
              <div className="space-y-1 text-xs sm:text-sm">
                <div><span className="text-slate-500 w-14 inline-block">ФИО:</span><span className="font-medium text-slate-900">{m.requesterContact.fullName}</span></div>
                <div><span className="text-slate-500 w-14 inline-block">Отдел:</span><span>{m.requesterContact.department}</span></div>
                <div><span className="text-slate-500 w-14 inline-block">Тел:</span><a href={`tel:${m.requesterContact.phone}`} className="text-blue-600 hover:underline">{m.requesterContact.phone}</a></div>
              </div>
            </div>
          )}
          {m.responsiblePerson && <div className="text-xs text-slate-500">✅ Ответственный: <span className="font-medium text-slate-700">{m.responsiblePerson}</span></div>}
          {(m.hasVCS||m.needsItSupport||m.needsCatering) && (
            <div className="flex flex-wrap gap-1.5">
              {m.hasVCS && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium">🎥 ВКС</span>}
              {m.needsItSupport && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium">🛠 IT-поддержка</span>}
              {m.needsCatering && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium">☕ Кофе-брейк</span>}
            </div>
          )}
          {rejectId === m.id ? (
            <div className="space-y-2">
              <input type="text" value={reason} onChange={e=>setReason(e.target.value)} placeholder="Причина отклонения (необязательно)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40" autoFocus />
              <div className="flex gap-2">
                <button onClick={()=>reject(m.id)} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Подтвердить</button>
                <button onClick={()=>{setRejectId(null);setReason('');}} className="px-4 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Отмена</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={()=>approve(m.id)} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Одобрить
              </button>
              <button onClick={()=>setRejectId(m.id)} className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Отклонить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== USERS TAB =====
function UsersTab({ user, onNotify }: { user: User; onNotify: (m:string)=>void }) {
  const [users, setUsers] = useState<User[]>(listUsers());
  const [showForm, setShowForm] = useState(false);
  const [editingUsername, setEditingUsername] = useState<string|null>(null);
  const [form, setForm] = useState({ username:'', password:'', fullName:'', role:'secretary' as UserRole, position:'' });
  const [error, setError] = useState('');
  const isEdit = editingUsername !== null;
  const canIT = canCreateRole(user, 'it');
  const refresh = () => setUsers(listUsers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (isEdit) {
      const r = updateUser(user, editingUsername, { fullName: form.fullName, position: form.position, password: form.password||undefined, role: user.role==='it'?form.role:undefined });
      if (!r.ok) { setError(r.error); return; }
      refresh(); setShowForm(false); setEditingUsername(null); onNotify(`Пользователь «${r.user.fullName}» обновлён`);
    } else {
      const r = createUser(user, form);
      if (!r.ok) { setError(r.error); return; }
      refresh(); setShowForm(false); onNotify(`Пользователь ${r.user.fullName} создан`);
    }
    setForm({ username:'', password:'', fullName:'', role:'secretary', position:'' });
  };

  const openEdit = (u: User) => { setEditingUsername(u.username); setForm({ username:u.username, password:'', fullName:u.fullName, role:u.role, position:u.position }); setError(''); setShowForm(true); };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-900">
        <strong>Управление пользователями.</strong> {user.role==='it'?'IT-отдел может создавать сотрудников IT-отдела и секретарей.':'Секретари могут создавать только других секретарей.'}
      </div>
      <div className="flex justify-end">
        <button onClick={()=>{setShowForm(true);setEditingUsername(null);setError('');setForm({username:'',password:'',fullName:'',role:'secretary',position:''}); }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Добавить
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {users.map(u => {
          const isMe = u.username === user.username;
          const canEdit = canEditUser(user, u);
          const canDel = !isMe && (user.role==='it'||u.role==='secretary');
          return (
            <div key={u.username} className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${u.role==='it'?'from-purple-500 to-indigo-600':'from-blue-500 to-indigo-600'} flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0`}>{u.fullName.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-slate-900 text-sm sm:text-base truncate">{u.fullName}</span>
                  {isMe && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">Это вы</span>}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${u.role==='it'?'bg-purple-50 text-purple-700':'bg-slate-100 text-slate-700'}`}>{u.role==='it'?'🛠 IT-отдел':'📋 Секретарь'}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate"><code className="bg-slate-100 px-1 rounded">{u.username}</code> · {u.position}</div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {canEdit && <button onClick={()=>openEdit(u)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Редактировать"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>}
                {canDel && <button onClick={()=>{ if(!confirm(`Удалить ${u.username}?`))return; const r=deleteUser(user,u.username); if(!r.ok){onNotify('⚠️ '+r.error);return;} refresh(); onNotify('Пользователь удалён'); }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Удалить"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
              </div>
            </div>
          );
        })}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-3 overflow-y-auto" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mt-10 mb-10" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{isEdit?`Редактирование: ${form.fullName||form.username}`:'Новый пользователь'}</h2>
              <button onClick={()=>setShowForm(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
              <FF label="Роль *">
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.role==='secretary'?'border-blue-400 bg-blue-50':'border-slate-200'}`}>
                    <input type="radio" checked={form.role==='secretary'} onChange={()=>setForm(f=>({...f,role:'secretary'}))} disabled={isEdit&&editingUsername===user.username} className="sr-only" />
                    <div className="text-2xl">📋</div><div className="text-sm font-medium text-slate-900">Секретарь</div>
                  </label>
                  <label className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${!canIT?'opacity-50 cursor-not-allowed':'cursor-pointer'} ${form.role==='it'?'border-purple-400 bg-purple-50':'border-slate-200'}`}>
                    <input type="radio" checked={form.role==='it'} onChange={()=>setForm(f=>({...f,role:'it'}))} disabled={!canIT||isEdit&&editingUsername===user.username} className="sr-only" />
                    <div className="text-2xl">🛠</div><div className="text-sm font-medium text-slate-900">IT-отдел{!canIT&&<div className="text-[10px] text-slate-400">Недоступно</div>}</div>
                  </label>
                </div>
              </FF>
              <FF label="ФИО *"><input type="text" value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} className={IC} placeholder="Иванов Иван Иванович" /></FF>
              <FF label="Должность"><input type="text" value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} className={IC} placeholder={form.role==='it'?'Сотрудник IT-отдела':'Секретарь'} /></FF>
              <div className="grid grid-cols-2 gap-3">
                <FF label="Логин *"><input type="text" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value.toLowerCase()}))} disabled={isEdit} className={isEdit?`${IC} bg-slate-50 text-slate-400 cursor-not-allowed`:IC} placeholder="login" />{isEdit&&<p className="mt-0.5 text-[10px] text-slate-400">Нельзя изменить</p>}</FF>
                <FF label={isEdit?'Новый пароль':'Пароль *'}><input type="text" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} className={IC} placeholder={isEdit?'оставьте пустым':'мин. 4 символа'} /></FF>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2.5 text-xs">{error}</div>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">{isEdit?'Сохранить':'Создать'}</button>
                <button type="button" onClick={()=>{setShowForm(false);setEditingUsername(null);}} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ROOMS TAB =====
function RoomsTab({ onNotify }: { onNotify: (m:string)=>void }) {
  const [roomsList, setRoomsList] = useState(()=>getRooms());
  const [editId, setEditId] = useState<string|null>(null);
  const refresh = () => setRoomsList(getRooms());

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-purple-900">
        <strong>🛠 Управление залами.</strong> Редактирование описания, вместимости, заметок IT-отдела и состава оборудования.
      </div>
      {roomsList.map(room => (
        <RoomCard key={room.id} room={room} isEditing={editId===room.id}
          onEdit={()=>setEditId(room.id)} onCancel={()=>setEditId(null)}
          onSaved={()=>{ setEditId(null); refresh(); onNotify(`Зал «${room.name}» обновлён`); }} />
      ))}
    </div>
  );
}

function RoomCard({ room, isEditing, onEdit, onCancel, onSaved }: { room: ReturnType<typeof getRooms>[number]; isEditing: boolean; onEdit:()=>void; onCancel:()=>void; onSaved:()=>void }) {
  const [capacity, setCapacity] = useState(room.capacity);
  const [description, setDescription] = useState(room.description);
  const [notes, setNotes] = useState(room.notes||'');
  const [equipment, setEquipment] = useState<string[]>(room.equipment||[]);

  useEffect(() => {
    if (!isEditing) { setCapacity(room.capacity); setDescription(room.description); setNotes(room.notes||''); setEquipment(room.equipment||[]); }
  }, [isEditing, room]);

  const toggle = (id: string) => setEquipment(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const save = () => { updateRoom(room.id,{capacity,description,notes,equipment}); onSaved(); };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-100 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <img src="/images/logo-dmitrov.png" alt="Герб" className="w-9 h-11 flex-shrink-0 object-contain" />
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{room.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{room.address}</p>
            <div className="flex gap-3 mt-1 text-[10px] text-slate-400"><span>📍 {room.floor} этаж</span><span>👥 {room.capacity} мест</span>{room.hasVCS&&<span>🎥 ВКС</span>}</div>
          </div>
        </div>
        {!isEditing && <button onClick={onEdit} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-all flex-shrink-0"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Редактировать</button>}
      </div>
      <div className="p-3 sm:p-5">
        {!isEditing ? (
          <div className="space-y-3">
            <div><div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Описание</div><div className="text-xs sm:text-sm text-slate-700">{room.description}</div></div>
            {room.notes && <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5"><div className="text-[10px] font-semibold text-amber-700 uppercase mb-1">📌 Заметки IT-отдела</div><div className="text-xs text-amber-900 whitespace-pre-wrap">{room.notes}</div></div>}
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400 mb-2">Оборудование ({getEquipmentLabels(room.equipment).length})</div>
              {room.equipment?.length===0 ? <div className="text-xs text-slate-400 italic">Не указано</div> : (
                <div className="flex flex-wrap gap-1.5">
                  {getEquipmentLabels(room.equipment).map(eq => <span key={eq.id} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200"><span>{eq.icon}</span><span>{eq.label}</span></span>)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Вместимость</label><input type="number" min={1} max={500} value={capacity} onChange={e=>setCapacity(Number(e.target.value))} className={IC} /></div>
            </div>
            <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Описание</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className={IC} /></div>
            <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">📌 Заметки IT-отдела</label><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} className={IC} placeholder="IP-адреса, нюансы оборудования..." /></div>
            <div>
              <div className="flex items-center justify-between mb-2"><label className="text-xs sm:text-sm font-medium text-slate-700">Оборудование зала</label><span className="text-[10px] text-slate-400">Выбрано: <span className="font-bold text-slate-700">{equipment.length}</span> / {EQUIPMENT_CATALOG.length}</span></div>
              <div className="space-y-3">
                {Object.keys(EQUIPMENT_CATEGORIES).map(cat => {
                  const items = EQUIPMENT_CATALOG.filter(e=>e.category===cat);
                  return (
                    <div key={cat}>
                      <div className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{EQUIPMENT_CATEGORIES[cat]}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {items.map(eq => {
                          const checked = equipment.includes(eq.id);
                          return (
                            <label key={eq.id} className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${checked?'border-blue-400 bg-blue-50':'border-slate-200 bg-white hover:border-slate-300'}`}>
                              <input type="checkbox" checked={checked} onChange={()=>toggle(eq.id)} className="sr-only" />
                              <span className="text-base sm:text-lg flex-shrink-0">{eq.icon}</span>
                              <span className={`flex-1 text-xs sm:text-sm font-medium ${checked?'text-blue-900':'text-slate-700'}`}>{eq.label}</span>
                              {checked && <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={save} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">Сохранить</button>
              <button onClick={onCancel} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Отмена</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== MAIN =====
export default function SecretaryPage({ meetings, setMeetings, user, onNotify }: Props) {
  const [tab, setTab] = useState<Tab>('meetings');
  const pending = meetings.filter(m=>m.status==='pending').length;
  return (
    <div className="space-y-4 sm:space-y-6 sm:pb-0 pb-20">
      <div><h1 className="text-lg sm:text-2xl font-bold text-slate-900">Управление</h1><p className="text-xs sm:text-sm text-slate-500 mt-0.5">{user.fullName} · {user.position}</p></div>
      <div className="border-b border-slate-200 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <nav className="flex gap-1 sm:gap-2 min-w-max">
          <TabBtn active={tab==='meetings'} onClick={()=>setTab('meetings')} icon="📅">Совещания</TabBtn>
          <TabBtn active={tab==='requests'} onClick={()=>setTab('requests')} icon="📝" badge={pending}>Заявки</TabBtn>
          <TabBtn active={tab==='users'} onClick={()=>setTab('users')} icon="👥">Пользователи</TabBtn>
          {user.role==='it' && <TabBtn active={tab==='rooms'} onClick={()=>setTab('rooms')} icon="🏛">Залы</TabBtn>}
        </nav>
      </div>
      {tab==='meetings' && <MeetingsTab meetings={meetings} setMeetings={setMeetings} onNotify={onNotify} user={user} />}
      {tab==='requests' && <RequestsTab meetings={meetings} setMeetings={setMeetings} onNotify={onNotify} />}
      {tab==='users' && <UsersTab user={user} onNotify={onNotify} />}
      {tab==='rooms' && user.role==='it' && <RoomsTab onNotify={onNotify} />}

      {/* Мобильная навигация */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 pb-2">
        <div className="flex items-stretch h-14">
          <button onClick={()=>{onNotify(''); (window as any).__goHome?.()}}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 active:bg-slate-50 transition-colors">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            <span className="text-[10px] font-medium text-slate-400">Назад</span>
          </button>
          <button onClick={()=>setTab('meetings')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 active:bg-slate-50 transition-colors relative">
            <span className="text-lg">📅</span>
            <span className={`text-[10px] font-medium ${tab==='meetings'?'text-blue-600':'text-slate-400'}`}>Совещания</span>
          </button>
          <button onClick={()=>setTab('requests')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 active:bg-slate-50 transition-colors relative">
            <span className="text-lg">📝</span>
            <span className={`text-[10px] font-medium ${tab==='requests'?'text-blue-600':'text-slate-400'}`}>Заявки</span>
            {pending > 0 && <span className="absolute top-0.5 right-3 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">{pending}</span>}
          </button>
          <button onClick={()=>setTab('users')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 active:bg-slate-50 transition-colors">
            <span className="text-lg">👥</span>
            <span className={`text-[10px] font-medium ${tab==='users'?'text-blue-600':'text-slate-400'}`}>Пользователи</span>
          </button>
          {user.role==='it' && (
            <button onClick={()=>setTab('rooms')} className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1.5 pb-1 active:bg-slate-50 transition-colors">
              <span className="text-lg">🏛</span>
              <span className={`text-[10px] font-medium ${tab==='rooms'?'text-blue-600':'text-slate-400'}`}>Залы</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
