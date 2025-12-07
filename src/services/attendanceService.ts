// src/services/attendanceService.ts

export interface AttendanceLog {
  timestamp?: string;
  employeeId: string;
  employeeName: string;
  status: string;          // 'CHECK_IN' | 'CHECK_OUT' | ...
  note?: string;
  ip?: string;             // IP Wifi
}

const API_URL = process.env.ATTENDANCE_API_URL || '';

if (!API_URL) {
  console.warn('ATTENDANCE_API_URL chưa được cấu hình trong môi trường (Vercel ENV).');
}

/**
 * Gửi 1 bản ghi chấm công lên Google Sheet (Apps Script)
 * - Dùng mode: "no-cors" để tránh bị chặn CORS.
 * - Không đọc response, chỉ cố gắng gửi đi.
 */
export async function logAttendance(log: AttendanceLog): Promise<boolean> {
  if (!API_URL) return false;

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', // ⚠️ Quan trọng: tránh CORS, chấp nhận không đọc response
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    });

    // Với no-cors không kiểm tra được HTTP status,
    // nên cứ xem là "đã gửi" nếu không throw error.
    return true;
  } catch (err) {
    console.error('logAttendance error:', err);
    return false;
  }
}

/**
 * Lấy toàn bộ lịch sử chấm công (dùng cho trang Admin)
 * - Vẫn dùng fetch bình thường để đọc JSON.
 */
export async function fetchAllAttendance(): Promise<AttendanceLog[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error('fetchAllAttendance HTTP error:', res.status);
      return [];
    }

    const data = await res.json();
    return data as AttendanceLog[];
  } catch (err) {
    console.error('fetchAllAttendance error:', err);
    return [];
  }
}
