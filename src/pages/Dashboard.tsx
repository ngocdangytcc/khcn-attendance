import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord } from '../types';
import { getEmployees, saveAttendanceLog } from '../services/storageService';
import { getPublicIP, getWifiConfigs, isWifiConnection } from '../services/networkService';
import { verifyFace } from '../services/geminiService';
import { logAttendance } from '../services/attendanceService';
import Camera from '../components/Camera';

interface DashboardProps {
  onNotification: (msg: string, type: 'success' | 'error') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNotification }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [checkType, setCheckType] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [time, setTime] = useState(new Date());
  const [currentIp, setCurrentIp] = useState<string | null>(null); // LƯU IP HIỆN TẠI

  useEffect(() => {
    setEmployees(getEmployees());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartCheck = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!selectedEmpId) {
      onNotification('Vui lòng chọn nhân viên trước', 'error');
      return;
    }

    setCheckType(type);
    setIsProcessing(true);
    setStatusMessage('Đang kiểm tra kết nối Wifi...');

    try {
      // 1. Kiểm tra loại kết nối (wifi / 4G)
      if (!isWifiConnection()) {
        console.warn('Không phát hiện kết nối wifi (có thể đang dùng 4G/5G).');
        // Không chặn luôn, vì đôi khi API không báo đúng – kiểm tra IP mới là chính
      }

      const wifiConfigs = getWifiConfigs();
      let ip = '';

      if (wifiConfigs.length > 0) {
        // Có cấu hình wifi → bắt buộc IP phải khớp
        ip = await getPublicIP();
        const validConfig = wifiConfigs.find((config) => config.ip === ip);

        if (!validConfig) {
          const names = wifiConfigs.map((c) => c.name).join(' hoặc ');
          throw new Error(
            `Vui lòng kết nối Wifi: ${names}. IP hiện tại (${ip}) không hợp lệ.`
          );
        }
      } else {
        // Chưa cấu hình wifi → vẫn cố gắng lấy IP để ghi log
        try {
          ip = await getPublicIP();
        } catch (err) {
          console.warn('Không lấy được IP hiện tại:', err);
        }
      }

      // Lưu IP lại để dùng khi ghi log chấm công
      setCurrentIp(ip || null);

      // 3. Cho phép mở camera chấm công
      setIsProcessing(false);
      setShowCamera(true);
    } catch (error: any) {
      setIsProcessing(false);
      setCheckType(null);
      onNotification(error.message || 'Lỗi kiểm tra mạng', 'error');
    }
  };

  const handleCapture = async (imageSrc: string) => {
    setShowCamera(false);
    setIsProcessing(true);
    setStatusMessage('Đang xác thực khuôn mặt...');

    try {
      const employee = employees.find((e) => e.id === selectedEmpId);
      if (!employee) throw new Error('Không tìm thấy dữ liệu nhân viên');

      // Xác thực khuôn mặt bằng Gemini
      const result = await verifyFace(employee.avatar, imageSrc);

      if (result.isMatch) {
        const record: AttendanceRecord = {
          id: Date.now().toString(),
          employeeId: employee.id,
          employeeName: employee.name,
          timestamp: Date.now(),
          type: checkType!,
          confidence: result.confidence,
          status: 'SUCCESS',
          snapshot: imageSrc,
        };

        // Lưu local (trong trình duyệt) như cũ
        saveAttendanceLog(record);

        // Gửi log lên Google Sheet (Apps Script)
        const ipForLog = currentIp || ''; // nếu vì lý do gì đó chưa có IP thì gửi chuỗi rỗng
        try {
          await logAttendance({
            employeeId: employee.id,
            employeeName: employee.name,
            status: checkType!,
            note: 'Xác thực bằng AI',
            ip: ipForLog,
          });
        } catch (err) {
          console.error('Không ghi được log lên Google Sheet:', err);
          // Không báo lỗi cho người dùng để tránh làm họ hoang mang
        }

        onNotification(
          `Thành công! ${
            checkType === 'CHECK_IN' ? 'Vào ca' : 'Ra ca'
          } xác thực ${Math.round(result.confidence * 100)}%`,
          'success'
        );
      } else {
        onNotification(
          `Thất bại: Khuôn mặt không khớp (${result.reasoning})`,
          'error'
        );
      }
    } catch (error) {
      onNotification('Lỗi hệ thống khi xác thực', 'error');
      console.error(error);
    } finally {
      setIsProcessing(false);
      setCheckType(null);
    }
  };

  const currentEmployee = employees.find((e) => e.id === selectedEmpId);

  return (
    <div className="space-y-6">
      {/* Time Card */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/30">
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium opacity-80 uppercase tracking-wider">
            {time.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
          <span className="text-4xl font-bold mt-2 tabular-nums">
            {time.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* User Selection */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
          Chọn Nhân Viên
        </label>
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
            <img
              src={currentEmployee.avatar}
              alt="ref"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <div>
              <p className="text-sm font-bold text-gray-800">
                {currentEmployee.name}
              </p>
              <p className="text-xs text-gray-500">
                {currentEmployee.position}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleStartCheck('CHECK_IN')}
          disabled={isProcessing || !selectedEmpId}
          className="relative overflow-hidden group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 disabled:opacity-50 active:scale-95 transition-all"
        >
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-700">Vào ca</span>
        </button>

        <button
          onClick={() => handleStartCheck('CHECK_OUT')}
          disabled={isProcessing || !selectedEmpId}
          className="relative overflow-hidden group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 disabled:opacity-50 active:scale-95 transition-all"
        >
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
              />
            </svg>
          </div>
          <span className="font-semibold text-gray-700">Ra ca</span>
        </button>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center flex-col space-y-4 px-8 text-center">
          <div className="w-12 h-12 border-4 border-white border-t-brand-500 rounded-full animate-spin"></div>
          <p className="text-white font-medium animate-pulse">
            {statusMessage}
          </p>
          {statusMessage.includes('Wifi') && (
            <p className="text-white/60 text-xs">
              Đang kiểm tra địa chỉ IP mạng...
            </p>
          )}
        </div>
      )}

      {showCamera && (
        <Camera
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          instruction={`Vui lòng nhìn thẳng để ${
            checkType === 'CHECK_IN' ? 'Vào ca' : 'Ra ca'
          }`}
        />
      )}
    </div>
  );
};

export default Dashboard;
