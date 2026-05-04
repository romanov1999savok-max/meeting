import { useMemo } from 'react';
import { listUsers, User } from '../auth';

export default function PublicStaffPage() {
  const all = useMemo(() => listUsers(), []);
  const secretaries = all.filter(u => u.role === 'secretary');
  const itStaff = all.filter(u => u.role === 'it');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-900">Сотрудники</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Контактная информация секретариата и IT-отдела администрации
        </p>
      </div>

      {/* Секретариат */}
      <StaffGroup
        title="Секретариат"
        subtitle="Ответственные за расписание залов и согласование заявок"
        icon="📋"
        accentBg="bg-blue-50"
        accentBorder="border-blue-200"
        accentText="text-blue-700"
        avatarGradient="from-blue-500 to-indigo-600"
        users={secretaries}
        emptyText="В секретариате пока нет сотрудников"
      />

      {/* IT-отдел */}
      <StaffGroup
        title="IT-отдел"
        subtitle="Техническая поддержка ВКС, оборудования и системы бронирования"
        icon="🛠"
        accentBg="bg-purple-50"
        accentBorder="border-purple-200"
        accentText="text-purple-700"
        avatarGradient="from-purple-500 to-indigo-600"
        users={itStaff}
        emptyText="В IT-отделе пока нет сотрудников"
      />

      {/* Информационный блок */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs sm:text-sm text-amber-900">
            <strong>Как забронировать зал?</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside text-amber-800">
              <li>Перейдите на дашборд и нажмите кнопку «Забронировать»</li>
              <li>Заполните контактные данные (ФИО, отдел, телефон)</li>
              <li>Укажите параметры мероприятия (дату, время, зал, требования)</li>
              <li>Заявка попадёт на согласование секретариату</li>
              <li>После одобрения вы увидите её в общем расписании</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StaffGroupProps {
  title: string;
  subtitle: string;
  icon: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  avatarGradient: string;
  users: User[];
  emptyText: string;
}

function StaffGroup({ title, subtitle, icon, accentBg, accentBorder, accentText, avatarGradient, users, emptyText }: StaffGroupProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`${accentBg} ${accentBorder} border-b p-3 sm:p-4`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl sm:text-3xl">{icon}</div>
          <div>
            <h2 className={`text-base sm:text-lg font-bold ${accentText}`}>{title}</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <div className="ml-auto">
            <span className={`px-2 py-1 ${accentBg} ${accentText} rounded-lg text-xs font-bold border ${accentBorder}`}>
              {users.length} {pluralize(users.length, 'сотрудник', 'сотрудника', 'сотрудников')}
            </span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {users.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-400">{emptyText}</div>
        ) : (
          users.map(u => (
            <div key={u.username} className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-sm flex-shrink-0`}>
                {u.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm sm:text-base truncate">{u.fullName}</div>
                <div className="text-xs sm:text-sm text-slate-500 truncate">{u.position}</div>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <div className={`px-2 py-1 ${accentBg} ${accentText} rounded-lg text-[10px] font-medium`}>
                  Внутренний контакт
                </div>
              </div>
            </div>
          ))
        )}
      </div>
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
