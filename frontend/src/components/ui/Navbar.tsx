import React from 'react';
import { Bell, PowerCircle, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useModal } from '../../hooks/UseModal';

interface NavbarProps {
    onToggleSidebar?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
        const { logout } = useAuth();
        const { show, close } = useModal();

    const handleLogout = () => {
        show(
            <div className="space-y-4">
                <p className="text-sm text-emerald-950">
                    Apakah Anda yakin ingin logout?
                </p>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => close()}
                        className="px-3 py-1.5 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            logout();
                        }}
                        className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>,
            {
                title: 'Konfirmasi Logout',
                size: 'md',
                closable: true,
                backdropClose: false,
            },
        );
    };

    return (
        <header className="h-16 rounded-b-2xl shadow-lg border-b border-emerald-100 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky ml-2 mr-2 top-0 z-20">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onToggleSidebar?.()}
                    className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors mr-2"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={18} />
                </button>
                <h1 className="text-base md:text-lg font-bold text-emerald-900">STOKKU Dashboard</h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                <button
                    type="button"
                    className="p-2 rounded-xl text-emerald-700 hover:bg-emerald-100 transition-colors"
                    aria-label="Notifications"
                >
                    <Bell size={18} />
                </button>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-red-800 hover:bg-red-50 hover:cursor-pointer transition-colors"
                    aria-label="Logout"
                >
                    <PowerCircle size={18} />
                </button>
            </div>
        </header>
    );
};

export default Navbar;
