// src/services/attendanceService.ts

/**
 * Một bản ghi chấm công trong hệ thống
 * - timestamp: thời điểm chấm công (ISO string, backend sinh ra)
 * - employeeId: mã nhân viên
 * - employeeName: họ tên nhân viên
 * - status: CHECK_IN / CHECK_OUT
 * - note: ghi chú (VD: "Xác thực bằng AI")
 * - ip: địa chỉ IP Wifi khi chấm công (nếu frontend gửi lên)
 */
export interface AttendanceLog {
  timestamp?: string;
  employeeId: string;
  employeeName: string;
  status: string;
  note?: string;
  ip?: string;
}

// URL của Google Apps Script / API nhận & trả dữ liệu chấm công
const API_URL = process.env.ATTENDANCE_API_URL || "";

if (!API_URL) {
  console.warn("⚠ ATTENDANCE_API_URL chưa được cấu hình trong biến môi trường.");
}

/**
 * Gửi 1 bản ghi chấm công lên Google Sheet / API.
 * Phía frontend có thể gọi:
 *   logAttendance({
 *     employeeId,
 *     employeeName,
 *     status: "CHECK_IN" | "CHECK_OUT",
 *     note: "Xác thực bằng AI",
 *     ip: currentIp
 *   })
 */
export async function logAttendance(log: AttendanceLog): Promise<boolean> {
  if (!API_URL) return false;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(log),
    });

    if (!res.ok) {
      console.error("logAttendance HTTP error:", res.status);
      return false;
    }

    // Apps Script đang trả { success: true } hoặc { success: false, error: ... }
    const data = await res.json().catch(() => ({}));
    return !!(data as any).success;
  } catch (err) {
    console.error("logAttendance error:", err);
    return false;
  }
}

/**
 * Lấy toàn bộ lịch sử chấm công cho trang Admin.
 * Apps Script doGet() đã chỉnh để trả về mảng:
 * [
 *   {
 *     timestamp: "2025-12-07T09:56:11.000Z",
 *     employeeId: "...",
 *     employeeName: "...",
 *     status: "...",
 *     note: "...",
 *     ip: "203.113.xxx.xxx"
 *   },
 *   ...
 * ]
 */
export async function fetchAllAttendance(): Promise<AttendanceLog[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(API_URL, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("fetchAllAttendance HTTP error:", res.status);
      return [];
    }

    const data = await res.json();

    if (Array.isArray(data)) {
      return data as AttendanceLog[];
    }

    if (data && Array.isArray((data as any).logs)) {
      return (data as any).logs as AttendanceLog[];
    }

    console.warn("Định dạng dữ liệu trả về không như mong đợi:", data);
    return [];
  } catch (err) {
    console.error("fetchAllAttendance error:", err);
    return [];
  }
}
