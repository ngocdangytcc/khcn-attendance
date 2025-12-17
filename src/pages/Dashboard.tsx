import React, { useEffect, useState } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { getEmployees, saveAttendanceLog } from '../services/storageService';
import { getPublicIP, getWifiConfigs, isWifiConnection } from '../services/networkService';
import { logAttendance } from '../services/attendanceService';

interface DashboardProps {
  onNotification: (msg: string, type: 'success' | 'error') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNotification }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    setEmployees(getEmployees());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const doAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!selectedEmpId) {
      onNotification('Vui lòng chọn nhân viên trước', 'error');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Đang kiểm tra kết nối Wifi/IP...');

    try {
      // Cảnh báo nếu không phải wifi (không chặn ngay, IP mới là điều kiện chính)
      if (!isWifiConnection()) {
        console.warn('Có thể đang dùng 4G/5G, sẽ kiểm tra IP để quyết định.');
      }

      const wifiConfigs = getWifiConfigs();
      let currentIP = '';

      // Nếu đã cấu hình IP wifi hợp lệ => bắt buộc IP phải khớp
      if (wifiConfigs.length > 0) {
        currentIP = await getPublicIP();
        const ok = wifiConfigs.some((c) => c.ip === currentIP);
        if (!ok) {
          const names = wifiConfigs.map((c) => c.name).join(' hoặc ');
          throw new Error(`Vui lòng kết nối Wifi: ${names}. IP hiện tại (${currentIP}) không hợp lệ.`);
        }
      } else {
        // chưa cấu hình => vẫn lấy IP nếu được để ghi log
        try { currentIP = await getPublicIP(); } catch {}
      }

      const employee = employees.find((e) => e.id === selectedEmpId);
      if (!employee) throw new Error('Không tìm thấy nhân viên');

      const now = Date.now();

      // Lưu local cho History
      const record: AttendanceRecord = {
        id: now.toString(),
        employeeId: employee.id,
        employeeName: employee.name,
        timestamp: now,
        type,
        confidence: 1,
        status: 'SUCCESS',
        snapshot: '',
      };
      saveAttendanceLog(record);

      // Gửi lên sheet
      await logAttendance({
        employeeId: employee.id,
        employeeName: employee.name,
        status: type,
        note: 'Chấm công bằng Wifi/IP (không dùng camera)',
        ip: currentIP || '',
      });

      onNotification(
        `Thành công! ${type === 'CHECK_IN' ? 'Vào ca' : 'Ra ca'}${currentIP ? ` (IP: ${currentIP})` : ''}`,
        'success'
      );
    } catch (err: any) {
      onNotification(err?.message || 'Lỗi chấm công', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentEmployee = employees.find((e) => e.id === selectedEmpId);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/30">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium opacity-80 uppercase tracking-wider">
            {time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="text-4xl font-bold mt-2 tabular-nums">
            {time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Chọn Nhân Viên</label>
        <select
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e.target.value)}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow appearance-none"
        >
          <option value="">-- Chọn tên của bạn --</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} - {emp.position}
            </option>
          ))}
        </select>

        {currentEmployee && (
          <div className="mt-4 flex items-center space-x-3 bg-blue-50 p-3 rounded-lg">
            {currentEmployee.avatar ? (
              <img src={currentEmployee.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
                NV
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-800">{currentEmployee.name}</p>
              <p className="text-xs text-gray-500">{currentEmployee.position}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => doAttendance('CHECK_IN')}
          disabled={isProcessing || !selectedEmpId}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 disabled:opacity-50 active:scale-95 transition-all"
        >
          <span className="font-semibold text-gray-700">Vào ca</span>
        </button>

        <button
          onClick={() => doAttendance('CHECK_OUT')}
          disabled={isProcessing || !selectedEmpId}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 disabled:opacity-50 active:scale-95 transition-all"
        >
          <span className="font-semibold text-gray-700">Ra ca</span>
        </button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center flex-col space-y-4 px-8 text-center">
          <div className="w-12 h-12 border-4 border-white rounded-full animate-spin"></div>
          <p className="text-white font-medium animate-pulse">{statusMessage}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
