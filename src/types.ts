// ========================
// Thông tin nhân viên
// ========================
export interface Employee {
  id: string;
  name: string;
  position: string;
  avatar: string; // Base64 image
  createdAt: number;
}

// ========================
// Bản ghi chấm công
// ========================
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  type: 'CHECK_IN' | 'CHECK_OUT';
  confidence: number;
  status: 'SUCCESS' | 'FAILED';
  snapshot: string; // Base64 image
}

// ========================
// Các màn hình trong ứng dụng
// ========================
export type ViewState =
  | 'DASHBOARD'
  | 'HISTORY'
  | 'ENROLL'
  | 'PROFILE'
  | 'ADMIN';   // 👈 THÊM MÀN HÌNH ADMIN

// ========================
// Kết quả đối chiếu khuôn mặt
// ========================
export enum VerificationResult {
  MATCH = 'MATCH',
  NO_MATCH = 'NO_MATCH',
  ERROR = 'ERROR'
}
