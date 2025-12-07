// src/pages/Admin.tsx
import React, { useState } from "react";
import { AttendanceLog, fetchAllAttendance } from "../services/attendanceService";

// Mật khẩu admin: ưu tiên lấy từ ENV, fallback chuỗi mặc định
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KHCN2025!";

const AdminPage: React.FC = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Format thời gian về giờ Hà Nội (Asia/Ho_Chi_Minh)
  const formatTime = (raw?: string) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) {
      // Nếu parse không được, trả lại chuỗi gốc để đỡ mất dữ liệu
      return raw;
    }
    return d.toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Xử lý đăng nhập admin
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError(null);
    } else {
      setError("Mật khẩu admin không đúng");
    }
  };

  // Tải log từ Google Sheet / API
  const handleLoadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllAttendance();
      setLogs(data || []);
    } catch (err) {
      console.error("Lỗi tải lịch sử chấm công:", err);
      setError("Không tải được dữ liệu chấm công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Chưa đăng nhập → hiển thị form đăng nhập
  if (!authenticated) {
    return (
      <div style={{ maxWidth: 400, margin: "40px auto" }}>
        <h2>Đăng nhập Admin</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label>Mật khẩu admin:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </div>
          {error && (
            <div style={{ color: "red", marginBottom: 8 }}>{error}</div>
          )}
          <button type="submit" style={{ padding: "8px 16px" }}>
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  // Đã đăng nhập → giao diện quản lý
  return (
    <div style={{ padding: 16 }}>
      <h2>Quản lý chấm công - Admin</h2>

      <button
        onClick={handleLoadLogs}
        style={{ marginBottom: 16, padding: "8px 16px" }}
      >
        Tải lịch sử chấm công
      </button>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && logs.length === 0 && !error && (
        <p>Chưa có dữ liệu hoặc chưa bấm tải.</p>
      )}

      {logs.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: 800,
              background: "#fff",
            }}
          >
            <thead style={{ background: "#f2f2f2" }}>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  Thời gian (giờ Hà Nội)
                </th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Mã NV</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Họ tên</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>
                  Trạng thái
                </th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>Ghi chú</th>
                <th style={{ border: "1px solid #ddd", padding: 8 }}>IP Wifi</th>
              </tr>
            </thead>

            <tbody>
              {logs.map((l, idx) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {formatTime(l.timestamp as string | undefined)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {l.employeeId}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {l.employeeName}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {l.status}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {l.note || ""}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: 8 }}>
                    {(l as any).ip || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
