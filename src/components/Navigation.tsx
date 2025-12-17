import React from 'react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Chấm công' },
    { id: 'HISTORY', label: 'Lịch sử' },
    { id: 'ENROLL', label: 'Nhân viên' },
    { id: 'ADMIN', label: 'Admin' },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center z-40">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id)}
          className={`flex flex-col items-center justify-center w-full py-2 space-y-1 ${
            currentView === item.id ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wide">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Navigation;
