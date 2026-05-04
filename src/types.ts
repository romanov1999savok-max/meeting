export interface RequesterContact {
  fullName: string;
  department: string;
  phone: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomName: string;
  organizer: string;
  responsiblePerson?: string;
  participants: string[];
  requirements: string;
  hasVCS: boolean;
  vcsLink?: string;
  needsItSupport?: boolean;
  needsCatering?: boolean;
  status: 'pending' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'rejected';
  createdAt: string;
  requesterContact?: RequesterContact;
  requesterUsername?: string;
  rejectionReason?: string;
}

export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  hasVCS: boolean;
  hasProjector: boolean;
  description: string;
  address: string;
  qrCodeUrl?: string;
  equipment?: string[];
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  label: string;
  icon: string;
  category: 'video' | 'audio' | 'display' | 'compute' | 'other';
}

export interface DashboardStats {
  totalMeetingsToday: number;
  roomsOccupied: number;
  totalRooms: number;
  utilizationRate: number;
  upcomingMeetings: Meeting[];
  weeklyData: { day: string; meetings: number }[];
  roomUtilization: { roomName: string; hoursUsed: number; totalHours: number }[];
}

export interface Notification {
  id: string;
  type: 'catering' | 'vcs' | 'it' | 'request';
  meetingId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}
