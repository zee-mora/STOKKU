import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../ui/Sidebar';
import Navbar from '../ui/Navbar';

const MainLayout: React.FC = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-emerald-50/50">
      <Sidebar isOpen={sidebarVisible} onClose={() => setSidebarVisible(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarVisible((s) => !s)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
