import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Enrollment from './pages/Enrollment';
import AdminPage from './pages/Admin';
import { ViewState } from './types';

const App = () => {
  const [currentView, setView] = useState<ViewState>('DASHBOARD');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ============================
  // CHỌN MÀN HÌNH ĐỂ HIỂN THỊ
  // ============================
  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard onNotification={showNotification} />;

      case 'HISTORY':
        return <History />;

      case 'ENROLL':
        return <Enrollment onNotification={showNotification} />;

      case 'ADMIN':
        return <AdminPage />;

      default:
        return <Dashboard onNotification={showNotification} />;
    }
  };

  // ============================
  // TIÊU ĐỀ TRÊN THANH HEADER
  // ============================
  const getTitle = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return 'Bảng điều khiển';
      case 'HISTORY':
        return 'Lịch sử chấm công';
      case 'ENROLL':
        return 'Quản lý nhân sự';
      case 'ADMIN':
        return 'Quản trị chấm công';
      default:
        return 'Trang chủ';
    }
  };

  return (
    <Layout currentView={currentView} setView={setView} title={getTitle()}>
      {renderContent()}

      {/* ============================ */}
      {/*          NOTIFICATION        */}
      {/* ============================ */}
      {notification && (
        <div
          className={`fixed top-16 left-4 right-4 z-50 p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-brand-900 text-white'
              : 'bg-red-500 text-white'
          } flex items-center space-x-3`}
        >
          {notification.type === 'success' ? (
            // SUCCESS ICON
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                 fill="currentColor" className="w-5 h-5 text-green-400">
              <path fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75
                       0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75
                       0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"/>
            </svg>
          ) : (
            // ERROR ICON
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                 fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 
                       0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 
                       0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 
                       10a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"/>
            </svg>
          )}

          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}
    </Layout>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
