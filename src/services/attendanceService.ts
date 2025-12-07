// src/services/attendanceService.ts

export interface AttendanceLog {
  timestamp?: string;
  employeeId: string;
  employeeName: string;
  status: string;   // CHECK_IN | CHECK_OUT
  note?: string;
}

// Lấy API URL từ .env được inject bởi Vite
const API_URL = process.env.ATTENDANCE_API_URL || "";

if (!API_URL) {
  console.warn("⚠ ATTENDANCE_API_URL chưa được cấu hình trong .env hoặc Vercel.");
}

/**
 * Gửi bản ghi chấm công lên Google Sheet
 * Dùng no-cors để tránh lỗi CORS của Google Apps Script
 * Khi no-cors → không đọc được response → coi như thành công nếu fetch không throw
 */
export async function logAttendance(log: AttendanceLog): Promise<boolean> {
  if (!API_URL) return false;

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      mode: "no-cors", // 👈 QUAN TRỌNG
      body: JSON.stringify(log)
    });

    // Nếu fetch không lỗi → coi như thành công
    return true;

  } catch (err) {
    console.error("logAttendance ERROR:", err);
    return false;
  }
}

/**
 * Lấy toàn bộ lịch sử chấm công từ Google Sheet (cho trang Admin)
 * GET không cần no-cors vì Apps Script GET trả JSON hợp lệ
 */
export async function fetchAllAttendance(): Promise<AttendanceLog[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(API_URL);

    if (!res.ok) {
      console.error("fetchAllAttendance HTTP error:", res.status);
      return [];
    }

    const data = await res.json();
    return data as AttendanceLog[];

  } catch (err) {
    console.error("fetchAllAttendance ERROR:", err);
    return [];
  }
}
