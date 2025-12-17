// src/services/attendanceService.ts
import type { AttendanceLog, FeedbackLog } from '../types';

const API_URL = process.env.ATTENDANCE_API_URL || '';

if (!API_URL) {
  console.warn('ATTENDANCE_API_URL chưa được cấu hình trên Vercel ENV');
}

/** POST ghi log chấm công (không đọc response để tránh CORS) */
export async function logAttendance(log: AttendanceLog): Promise<boolean> {
  if (!API_URL) return false;
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'ATTENDANCE', ...log }),
    });
    return true;
  } catch (err) {
    console.error('logAttendance error:', err);
    return false;
  }
}

/** GET lấy toàn bộ log chấm công (Admin) */
export async function fetchAllAttendance(): Promise<AttendanceLog[]> {
  if (!API_URL) return [];
  try {
    const res = await fetch(`${API_URL}?kind=ATTENDANCE`);
    if (!res.ok) return [];
    return (await res.json()) as AttendanceLog[];
  } catch (err) {
    console.error('fetchAllAttendance error:', err);
    return [];
  }
}

/** POST gửi feedback khách hàng (không đọc response để tránh CORS) */
export async function submitFeedback(log: FeedbackLog): Promise<boolean> {
  if (!API_URL) return false;
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'FEEDBACK', ...log }),
    });
    return true;
  } catch (err) {
    console.error('submitFeedback error:', err);
    return false;
  }
}

/** GET lấy toàn bộ feedback (Admin) */
export async function fetchAllFeedback(): Promise<FeedbackLog[]> {
  if (!API_URL) return [];
  try {
    const res = await fetch(`${API_URL}?kind=FEEDBACK`);
    if (!res.ok) return [];
    return (await res.json()) as FeedbackLog[];
  } catch (err) {
    console.error('fetchAllFeedback error:', err);
    return [];
  }
}
