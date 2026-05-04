import { Room, Meeting, DashboardStats } from './types';
import { getLiveStatus } from './utils/date';

export const rooms: Room[] = [
  {
    id: 'room-1',
    name: 'Ул. Советская, д. 2, кабинет №20',
    floor: 2,
    capacity: 50,
    hasVCS: true,
    hasProjector: true,
    description: 'Зал для совещаний с возможностью видеоконференцсвязи',
    address: 'г. Дмитров, ул. Советская, д. 2, кабинет №20',
    qrCodeUrl: '/images/qr-room1.svg',
    equipment: ['projector', 'screen', 'micro_table', 'speakers', 'camera', 'pc', 'wifi', 'air_cond', 'water'],
  },
  {
    id: 'room-2',
    name: 'Ул. Советская, д. 4, кабинет №10',
    floor: 3,
    capacity: 20,
    hasVCS: true,
    hasProjector: true,
    description: 'Зал для оперативных совещаний',
    address: 'г. Дмитров, ул. Советская, д. 4, кабинет №10',
    qrCodeUrl: '/images/qr-room2.svg',
    equipment: ['tv', 'micro_table', 'speakers', 'camera', 'laptop', 'wifi', 'water'],
  },
];

const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || '';
function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const today = localDate(0);
const tomorrow = localDate(1);

export const mockMeetings: Meeting[] = [
  {
    id: '1', title: 'Оперативное совещание с заместителями Главы',
    description: 'Еженедельное оперативное совещание по текущим вопросам',
    date: today, startTime: '09:00', endTime: '11:00', roomId: 'room-1', roomName: getRoomName('room-1'),
    organizer: 'Зосимова С.Р.', responsiblePerson: 'Зосимова С.Р.',
    participants: ['Заместители Главы', 'Начальники отделов'],
    requirements: 'ВКС, проектор, презентация', hasVCS: true,
    vcsLink: 'https://vks.mosreg.ru/meeting/oper-12345',
    needsItSupport: true, needsCatering: true,
    status: 'ongoing', createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2', title: 'Планёрка отдела ЖКХ',
    description: 'Плановое совещание по вопросам жилищно-коммунального хозяйства',
    date: today, startTime: '11:00', endTime: '12:00', roomId: 'room-2', roomName: getRoomName('room-2'),
    organizer: 'Иванов П.А.', responsiblePerson: 'Иванов П.А.',
    participants: ['Сотрудники отдела ЖКХ'],
    requirements: 'Проектор', hasVCS: false, needsCatering: false,
    status: 'scheduled', createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3', title: 'ВКС с Правительством Московской области',
    description: 'Видеоконференция с участием руководства региона',
    date: today, startTime: '14:00', endTime: '16:00', roomId: 'room-1', roomName: getRoomName('room-1'),
    organizer: 'Кирюхин А.С.', responsiblePerson: 'Кирюхин А.С.',
    participants: ['Глава округа', 'Заместители', 'IT-отдел'],
    requirements: 'ВКС, обязательная проверка оборудования за 30 минут',
    hasVCS: true, vcsLink: 'https://vks.mosreg.ru/meeting/gov-67890',
    needsItSupport: true, needsCatering: true,
    status: 'scheduled', createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '4', title: 'Совещание по благоустройству',
    description: 'Обсуждение плана благоустройства территорий',
    date: tomorrow, startTime: '10:00', endTime: '12:00', roomId: 'room-2', roomName: getRoomName('room-2'),
    organizer: 'Петров Д.И.', participants: ['Отдел благоустройства', 'Подрядчики'],
    requirements: 'Проектор, карты территорий', hasVCS: false,
    status: 'scheduled', createdAt: new Date().toISOString(),
  },
  {
    id: '5', title: 'Заседание комиссии по чрезвычайным ситуациям',
    description: 'Внеплановое заседание КЧС',
    date: tomorrow, startTime: '14:00', endTime: '17:00', roomId: 'room-1', roomName: getRoomName('room-1'),
    organizer: 'Зосимова С.Р.', responsiblePerson: 'Зосимова С.Р.',
    participants: ['Члены КЧС', 'МЧС', 'Службы спасения'],
    requirements: 'ВКС, проектор, карта округа',
    hasVCS: true, vcsLink: 'https://vks.mosreg.ru/meeting/kchs-2026',
    needsItSupport: true, needsCatering: true,
    status: 'scheduled', createdAt: new Date().toISOString(),
  },
  {
    id: '6', title: 'Политпланирование',
    description: 'Планирование политических мероприятий на месяц',
    date: today, startTime: '08:00', endTime: '09:00', roomId: 'room-1', roomName: getRoomName('room-1'),
    organizer: 'Административный отдел', participants: ['Руководство'],
    requirements: 'Проектор', hasVCS: false,
    status: 'completed', createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: '7', title: 'Совещание по подготовке к отопительному сезону',
    description: 'Заявка с дашборда — требует согласования',
    date: tomorrow, startTime: '09:00', endTime: '10:30', roomId: 'room-2', roomName: getRoomName('room-2'),
    organizer: 'Сидоров К.М. (Отдел ЖКХ)', participants: ['Главный инженер', 'Начальник котельной'],
    requirements: 'Проектор', hasVCS: false, needsCatering: true,
    status: 'pending', createdAt: new Date().toISOString(),
    requesterContact: { fullName: 'Сидоров Константин Михайлович', department: 'Отдел ЖКХ', phone: '+7 (495) 123-45-67' },
  },
];

export function checkRoomAvailability(roomId: string, date: string, startTime: string, endTime: string, excludeId?: string): boolean {
  return !mockMeetings.some(m => {
    if (m.id === excludeId) return false;
    if (m.roomId !== roomId || m.date !== date) return false;
    if (m.status === 'cancelled' || m.status === 'rejected') return false;
    return startTime < m.endTime && endTime > m.startTime;
  });
}

export function getDashboardStats(meetings: Meeting[], now: Date = new Date()): DashboardStats {
  // Создаём "живую" версию встреч с актуальными статусами
  const liveMeetings = meetings.map(m => ({
    ...m,
    status: getLiveStatus(m.date, m.startTime, m.endTime, m.status, now) as Meeting['status']
  }));

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const visible = liveMeetings.filter(m => m.status !== 'pending' && m.status !== 'rejected' && m.status !== 'cancelled');
  const todayMeetings = visible.filter(m => m.date === todayStr);
  const ongoing = todayMeetings.filter(m => m.status === 'ongoing');
  const upcoming = todayMeetings.filter(m => m.status === 'scheduled').sort((a, b) => a.startTime.localeCompare(b.startTime));
  const occupiedRooms = new Set(ongoing.map(m => m.roomId)).size;
  const totalHoursPerDay = 10;
  const roomUtilization = rooms.map(room => {
    const inRoom = todayMeetings.filter(m => m.roomId === room.id);
    const hoursUsed = inRoom.reduce((s, m) => {
      const [sh, sm] = m.startTime.split(':').map(Number);
      const [eh, em] = m.endTime.split(':').map(Number);
      return s + (eh - sh) + (em - sm) / 60;
    }, 0);
    return { roomName: room.name, hoursUsed: Math.round(hoursUsed * 10) / 10, totalHours: totalHoursPerDay };
  });
  const totalUtil = roomUtilization.reduce((s, r) => s + r.hoursUsed, 0);
  const maxUtil = roomUtilization.reduce((s, r) => s + r.totalHours, 0);
  const utilizationRate = maxUtil > 0 ? Math.round((totalUtil / maxUtil) * 100) : 0;
  const weeklyData = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((day, i) => {
    const d = new Date(now); d.setDate(d.getDate() - d.getDay() + i + 1);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { day, meetings: liveMeetings.filter(m => m.date === ds && !['pending', 'rejected', 'cancelled'].includes(m.status)).length };
  });
  return { totalMeetingsToday: todayMeetings.length, roomsOccupied: occupiedRooms, totalRooms: rooms.length, utilizationRate, upcomingMeetings: upcoming, weeklyData, roomUtilization };
}
