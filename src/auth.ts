export type UserRole = 'it' | 'secretary';

export interface User {
  username: string;
  fullName: string;
  role: UserRole;
  position: string;
  phone?: string;
  ext?: string; // добавочный номер
}

interface StoredUser extends User {
  password: string;
  phone?: string;
  ext?: string;
}

const USERS_KEY = 'dmitrov_users';
const SESSION_KEY = 'dmitrov_session';
const USERS_VERSION = 'v3'; // Увеличить при изменении SEED_USERS
const VERSION_KEY = 'dmitrov_users_version';

const PHONE = '496-221-98-05';

const SEED_USERS: StoredUser[] = [
  // ──── Секретариат ────
  { username: 'roldugina',    password: 'roldugina1001',    fullName: 'Ролдугина Валерия Всеволодовна',     role: 'secretary', position: 'Секретарь Главы',                                          phone: PHONE, ext: '1001' },
  { username: 'chikalova',    password: 'chikalova1006',    fullName: 'Чикалова Ольга Сергеевна',           role: 'secretary', position: 'Советник Главы Администрации Дмитровского м.о.',           phone: PHONE, ext: '1006' },
  { username: 'majorova',     password: 'majorova1487',     fullName: 'Майорова Алёна Алексеевна',          role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1487' },
  { username: 'shikova',      password: 'shikova1486',      fullName: 'Шикова Анастасия Алексеевна',        role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1486' },
  { username: 'vojlova',      password: 'vojlova1385',      fullName: 'Войлова Наталья Андреевна',          role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1385' },
  { username: 'kovalenko',    password: 'kovalenko1485',    fullName: 'Коваленко Алёна Игоревна',           role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1485' },
  { username: 'konkova',      password: 'konkova1547',      fullName: 'Конькова Анастасия Александровна',   role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1547' },
  { username: 'lapina',       password: 'lapina6003',       fullName: 'Лапина Анастасия Алексеевна',        role: 'secretary', position: 'Секретарь',                                                phone: '496-225-45-80', ext: '6003' },
  { username: 'kovalkina',    password: 'kovalkina1121',    fullName: 'Ковалкина Екатерина Викторовна',     role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1121' },
  { username: 'arefyeva_v',   password: 'arefyeva1272',     fullName: 'Арефьева Валентина Алексеевна',      role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1272' },
  { username: 'arefyeva_a',   password: 'arefyeva1203',     fullName: 'Арефьева Алина Евгеньевна',          role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1203' },
  { username: 'glukhova',     password: 'glukhova1312',     fullName: 'Глухова Александра Викторовна',      role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '1312' },
  { username: 'chernova',     password: 'chernova4012',     fullName: 'Чернова Ольга Юрьевна',              role: 'secretary', position: 'Секретарь',                                                phone: PHONE, ext: '4012' },
  // ──── IT-отдел (МКУ «УСР» — Отдел программно-технического взаимодействия) ────
  { username: 'romanov',      password: 'romanov1294',      fullName: 'Романов Вячеслав Сергеевич',         role: 'it', position: 'Начальник отдела',    phone: PHONE, ext: '1294' },
  { username: 'sizyakov',     password: 'sizyakov1337',     fullName: 'Сизяков Сергей Александрович',       role: 'it', position: 'Главный инспектор',  phone: PHONE, ext: '1337' },
  { username: 'khudaiberdin', password: 'khudaiberdin1243', fullName: 'Худайбердин Денис Амирович',          role: 'it', position: 'Главный инспектор',  phone: PHONE, ext: '1243' },
  { username: 'kiryukhin',    password: 'kiryukhin1515',    fullName: 'Кирюхин Артем Сергеевич',            role: 'it', position: 'Главный инспектор',  phone: PHONE, ext: '1515' },
  { username: 'zherebin',     password: 'zherebin1516',     fullName: 'Жеребин Егор Алексеевич',            role: 'it', position: 'Ведущий инспектор',  phone: PHONE, ext: '1516' },
  { username: 'ovechkin',     password: 'ovechkin1518',     fullName: 'Овечкин Денис Романович',            role: 'it', position: 'Главный специалист', phone: PHONE, ext: '1518' },
];

function readUsers(): StoredUser[] {
  try {
    // Сброс если версия изменилась (новый состав пользователей)
    const ver = localStorage.getItem(VERSION_KEY);
    if (ver !== USERS_VERSION) {
      localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
      localStorage.setItem(VERSION_KEY, USERS_VERSION);
      localStorage.removeItem(SESSION_KEY); // сбрасываем сессию — старые логины недействительны
      return SEED_USERS;
    }
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) { localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS)); return SEED_USERS; }
    return JSON.parse(raw) as StoredUser[];
  } catch { return SEED_USERS; }
}

function writeUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function login(username: string, password: string): User | null {
  const users = readUsers();
  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
  if (!found) return null;
  const session: User = { username: found.username, fullName: found.fullName, role: found.role, position: found.position };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout(): void { localStorage.removeItem(SESSION_KEY); }

export function getCurrentUser(): User | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) as User : null; }
  catch { return null; }
}

export function listUsers(): User[] {
  return readUsers().map(({ password: _p, ...rest }) => rest);
}

export interface CreateUserInput {
  username: string; password: string; fullName: string; role: UserRole; position: string;
}

export function createUser(creator: User, input: CreateUserInput): { ok: true; user: User } | { ok: false; error: string } {
  if (creator.role === 'secretary' && input.role !== 'secretary')
    return { ok: false, error: 'Секретари могут создавать только пользователей с ролью «Секретарь»' };
  const username = input.username.toLowerCase().trim();
  if (!username) return { ok: false, error: 'Логин обязателен' };
  if (!/^[a-z0-9_.-]+$/i.test(username)) return { ok: false, error: 'Логин: только латиница, цифры, точка, дефис, подчёркивание' };
  if (input.password.length < 4) return { ok: false, error: 'Пароль — минимум 4 символа' };
  if (!input.fullName.trim()) return { ok: false, error: 'ФИО обязательно' };
  const users = readUsers();
  if (users.some(u => u.username.toLowerCase() === username)) return { ok: false, error: 'Пользователь с таким логином уже существует' };
  const newUser: StoredUser = { username, password: input.password, fullName: input.fullName.trim(), role: input.role, position: input.position.trim() || (input.role === 'it' ? 'Сотрудник IT-отдела' : 'Секретарь') };
  users.push(newUser);
  writeUsers(users);
  const { password: _p, ...publicUser } = newUser;
  return { ok: true, user: publicUser };
}

export function deleteUser(actor: User, username: string): { ok: true } | { ok: false; error: string } {
  if (actor.username === username) return { ok: false, error: 'Нельзя удалить собственную учётную запись' };
  const users = readUsers();
  const target = users.find(u => u.username === username);
  if (!target) return { ok: false, error: 'Пользователь не найден' };
  if (actor.role === 'secretary' && target.role !== 'secretary') return { ok: false, error: 'Секретари могут удалять только секретарей' };
  writeUsers(users.filter(u => u.username !== username));
  return { ok: true };
}

export function canEditUser(actor: User, target: User): boolean {
  if (actor.role === 'it') return true;
  return actor.username === target.username;
}

export function updateUser(actor: User, username: string, patch: { fullName?: string; position?: string; password?: string; role?: UserRole }): { ok: true; user: User } | { ok: false; error: string } {
  const users = readUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) return { ok: false, error: 'Пользователь не найден' };
  const target = users[idx];
  const targetPublic: User = { username: target.username, fullName: target.fullName, role: target.role, position: target.position };
  if (!canEditUser(actor, targetPublic)) return { ok: false, error: 'Недостаточно прав' };
  if (patch.role && patch.role !== target.role) {
    if (actor.role !== 'it') return { ok: false, error: 'Только IT-отдел может менять роли' };
    if (actor.username === username) return { ok: false, error: 'Нельзя изменить собственную роль' };
    if (target.role === 'it' && patch.role === 'secretary') {
      const itCount = users.filter(u => u.role === 'it').length;
      if (itCount <= 1) return { ok: false, error: 'В системе должен оставаться хотя бы один IT-сотрудник' };
    }
  }
  if (patch.fullName !== undefined) { if (!patch.fullName.trim()) return { ok: false, error: 'ФИО не может быть пустым' }; target.fullName = patch.fullName.trim(); }
  if (patch.position !== undefined) target.position = patch.position.trim() || target.position;
  if (patch.password) { if (patch.password.length < 4) return { ok: false, error: 'Пароль — минимум 4 символа' }; target.password = patch.password; }
  if (patch.role && actor.role === 'it') target.role = patch.role;
  users[idx] = target;
  writeUsers(users);
  if (actor.username === username) {
    const session: User = { username: target.username, fullName: target.fullName, role: target.role, position: target.position };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  const { password: _p, ...publicUser } = target;
  return { ok: true, user: publicUser };
}

export function canCreateRole(actor: User, role: UserRole): boolean {
  if (actor.role === 'it') return true;
  return role === 'secretary';
}

export const DEMO_CREDENTIALS = [
  { login: 'romanov', password: 'romanov1294', desc: 'IT-отдел', sub: 'Романов В.С.' },
  { login: 'roldugina', password: 'roldugina1001', desc: 'Секретарь', sub: 'Ролдугина В.В.' },
];

// Пароль для быстрого входа в окне авторизации
// login: romanov / romanov1294
// login: roldugina / roldugina1001
