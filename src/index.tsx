import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Enrollment from './pages/Enrollment';
import AdminPage from './pages/Admin';
import FeedbackPage from './pages/Feedback';
import { ViewState } from './types';

const isFeedbackMode = () => {
  const qs = new URLSearchParams(window.location.search);
  return qs.get('mode') === 'feedback';
};

const App = () => {
  const [currentView, setView] = useState<ViewState>('DASHBOARD');
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

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

  const getTitle = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return 'Chấm công (Wifi/IP)';
      case 'HISTORY':
        return 'Lịch sử chấm công';
      case 'ENROLL':
        return 'Nhân viên';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Trang chủ';
    }
  };

  return (
    <Layout currentView={currentView} setView={setView} title={getTitle()}>
      {renderContent()}

      {notification && (
        <div
          className={`fixed top-16 left-4 right-4 z-50 p-4 rounded-xl shadow-lg transform transition-all duration-300 ${
            notification.type === 'success' ? 'bg-brand-900 text-white' : 'bg-red-500 text-white'
          } flex items-center space-x-3`}
        >
          <span className="font-medium text-sm">{notification.msg}</span>
        </div>
      )}
    </Layout>
  );
};

const Root = () => {
  if (isFeedbackMode()) return <FeedbackPage />;
  return <App />;
};

createRoot(document.getElementById('root')!).render(<Root />);
