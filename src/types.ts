export interface Employee {
  id: string;
  name: string;
  position: string;
  avatar: string; // Base64 image (có thể để trống nếu không dùng)
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  type: 'CHECK_IN' | 'CHECK_OUT';
  confidence: number; // giữ field cho tương thích, sẽ set = 1
  status: 'SUCCESS' | 'FAILED';
  snapshot: string; // không dùng ảnh nữa -> để ""
}

export interface AttendanceLog {
  timestamp?: string;
  employeeId: string;
  employeeName: string;
  status: string; // CHECK_IN / CHECK_OUT
  note?: string;
  ip?: string;
}

export interface FeedbackLog {
  timestamp?: string;
  employeeId: string;
  employeeName?: string;
  rating: number; // 1..5
  comment?: string;
  ip?: string;
  userAgent?: string;
}

export type ViewState = 'DASHBOARD' | 'HISTORY' | 'ENROLL' | 'ADMIN';
