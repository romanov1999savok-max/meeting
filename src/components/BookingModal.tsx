import { useState } from 'react';
import { rooms, checkRoomAvailability } from '../data';
import { Meeting, RequesterContact } from '../types';
import { User } from '../auth';

interface Props { user: User | null; onClose: () => void; onSubmit: (m: Meeting) => void; }

export default function BookingModal({ user, onClose, onSubmit }: Props) {
  const isGuest = !user;
  const [form, setForm] = useState({
    title: '', description: '', date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })(),
    startTime: '09:00', endTime: '10:00', roomId: '', participants: '',
    requirements: '', hasVCS: false, vcsLink: '', needsItSupport: false, needsCatering: false,
    responsiblePerson: '', guestFullName: '', guestDepartment: '', guestPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Название обязательно';
    if (!form.roomId) e.roomId = 'Выберите зал';
    if (form.startTime >= form.endTime) e.endTime = 'Время окончания позже начала';
    if (form.roomId && !e.endTime && !checkRoomAvailability(form.roomId, form.date, form.startTime, form.endTime))
      e.roomId = 'Зал занят на это время';
    if (isGuest) {
      if (!form.guestFullName.trim()) e.guestFullName = 'ФИО обязательно';
      if (!form.guestDepartment.trim()) e.guestDepartment = 'Отдел обязателен';
      if (!form.guestPhone.trim()) e.guestPhone = 'Телефон обязателен';
    }
    if (!isGuest && !form.responsiblePerson.trim()) e.responsiblePerson = 'Укажите ответственного';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const roomName = rooms.find(r => r.id === form.roomId)?.name || '';
    const participants = form.participants.split('\n').map(p => p.trim()).filter(Boolean);
    const rc: RequesterContact | undefined = isGuest ? { fullName: form.guestFullName.trim(), department: form.guestDepartment.trim(), phone: form.guestPhone.trim() } : undefined;
    onSubmit({
      id: String(Date.now()), title: form.title.trim(), description: form.description.trim(),
      date: form.date, startTime: form.startTime, endTime: form.endTime,
      roomId: form.roomId, roomName, organizer: user ? user.fullName : `${form.guestFullName} (${form.guestDepartment})`,
      responsiblePerson: form.responsiblePerson.trim() || undefined,
      participants, requirements: form.requirements.trim(),
      hasVCS: form.hasVCS, vcsLink: form.vcsLink.trim() || undefined,
      needsItSupport: form.needsItSupport, needsCatering: form.needsCatering,
      status: 'pending', createdAt: new Date().toISOString(),
      requesterContact: rc, requesterUsername: user?.username,
    });
  };

  const F = (label: string, err?: string, children?: React.ReactNode) => (
    <div><label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">{label}</label>{children}{err && <p className="mt-0.5 text-xs text-red-500">{err}</p>}</div>
  );
  const inp = `w-full px-3 py-2 sm:py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500`;
  const ok = `${inp} border-slate-200`;
  const err = (k: string) => errors[k] ? `${inp} border-red-300 bg-red-50` : ok;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-3 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mt-0 sm:mt-10 mb-10" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between">
          <div><h2 className="text-base sm:text-lg font-bold text-slate-900">Заявка на бронирование</h2><p className="text-xs text-slate-500 mt-0.5">Передаётся секретарю на согласование</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          {isGuest && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">👤 Контакты заявителя</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">{F('ФИО *', errors.guestFullName, <input type="text" value={form.guestFullName} onChange={e => setForm(f=>({...f,guestFullName:e.target.value}))} className={err('guestFullName')} placeholder="Иванов И.И." />)}</div>
                <div>{F('Отдел *', errors.guestDepartment, <input type="text" value={form.guestDepartment} onChange={e => setForm(f=>({...f,guestDepartment:e.target.value}))} className={err('guestDepartment')} />)}</div>
                <div>{F('Телефон *', errors.guestPhone, <input type="tel" value={form.guestPhone} onChange={e => setForm(f=>({...f,guestPhone:e.target.value}))} className={err('guestPhone')} placeholder="+7 (___) ___-__-__" />)}</div>
              </div>
            </div>
          )}
          {!isGuest && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{user!.fullName.charAt(0)}</div>
              <div className="text-sm"><span className="text-slate-500">Заявитель: </span><span className="font-medium text-slate-900">{user!.fullName}</span></div>
            </div>
          )}
          {F('Название *', errors.title, <input type="text" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={err('title')} />)}
          {!isGuest && F('Ответственный со стороны организатора *', errors.responsiblePerson, <input type="text" value={form.responsiblePerson} onChange={e=>setForm(f=>({...f,responsiblePerson:e.target.value}))} className={err('responsiblePerson')} placeholder="ФИО ответственного" />)}
          <div className="grid grid-cols-2 gap-3">
            {F('Дата *', undefined, <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className={ok} />)}
            {F('Зал *', errors.roomId, <select value={form.roomId} onChange={e=>{const r=rooms.find(x=>x.id===e.target.value);setForm(f=>({...f,roomId:e.target.value,hasVCS:r?.hasVCS||false}));}} className={err('roomId')}><option value="">Выберите...</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>)}
            {F('Начало *', undefined, <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} className={ok} />)}
            {F('Окончание *', errors.endTime, <input type="time" value={form.endTime} onChange={e=>setForm(f=>({...f,endTime:e.target.value}))} className={err('endTime')} />)}
          </div>
          {F('Описание', undefined, <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={2} className={ok} />)}
          {F('Участники (по одному в строке)', undefined, <textarea value={form.participants} onChange={e=>setForm(f=>({...f,participants:e.target.value}))} rows={2} className={ok} />)}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Дополнительные сервисы</h3>
            {[
              { key: 'hasVCS', icon: '🎥', title: 'Видеоконференцсвязь (ВКС)', desc: 'Подключение оборудования', checked: form.hasVCS, color: 'indigo' },
              { key: 'needsItSupport', icon: '🛠️', title: 'IT-поддержка', desc: 'Сотрудник IT-отдела на мероприятии', checked: form.needsItSupport, color: 'purple' },
              { key: 'needsCatering', icon: '☕', title: 'Кофе-брейк', desc: 'Секретарю придёт уведомление', checked: form.needsCatering, color: 'amber' },
            ].map(({ key, icon, title, desc, checked, color }) => {
              const brd: Record<string,string> = { indigo:'border-indigo-400 bg-indigo-50', purple:'border-purple-400 bg-purple-50', amber:'border-amber-400 bg-amber-50' };
              const chk: Record<string,string> = { indigo:'text-indigo-600', purple:'text-purple-600', amber:'text-amber-600' };
              return (
                <label key={key} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${checked ? brd[color] : 'border-slate-200 hover:border-slate-300'}`}>
                  <input type="checkbox" checked={checked} onChange={e=>setForm(f=>({...f,[key]:e.target.checked}))} className="sr-only" />
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1"><div className="text-sm font-medium text-slate-900">{title}</div><div className="text-xs text-slate-500">{desc}</div></div>
                  {checked && <svg className={`w-5 h-5 ${chk[color]}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}
                </label>
              );
            })}
            {form.hasVCS && F('Ссылка на ВКС (необязательно)', undefined, <input type="url" value={form.vcsLink} onChange={e=>setForm(f=>({...f,vcsLink:e.target.value}))} className={ok} placeholder="https://vks.mosreg.ru/..." />)}
            {F('Технические требования', undefined, <input type="text" value={form.requirements} onChange={e=>setForm(f=>({...f,requirements:e.target.value}))} className={ok} placeholder="проектор, микрофоны..." />)}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">ℹ️ Заявка будет рассмотрена секретариатом. После одобрения — появится в расписании.</div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md">Отправить заявку</button>
            <button type="button" onClick={onClose} className="px-5 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
