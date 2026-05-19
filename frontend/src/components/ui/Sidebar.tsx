import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, LogOut, Home, Users, Receipt,
    TrendingDown, FileBarChart2, ChevronLeft, Menu, X,
    FolderTree, Circle, Shield
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { NavigationItem } from '../../context/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onToggle: () => void;
}

const iconMap = {
    LayoutDashboard,
    Home,
    Users,
    Receipt,
    TrendingDown,
    FileBarChart2,
    FolderTree,
    Shield,
};

const resolveIcon = (icon?: string | null) => {
    if (!icon) {
        return Circle;
    }

    return iconMap[icon as keyof typeof iconMap] ?? Circle;
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onToggle }) => {
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const menus = user?.menus ?? [];

    const renderMenuItem = (item: NavigationItem, depth = 0) => {
        const Icon = resolveIcon(item.icon);
        const hasChildren = (item.children?.length ?? 0) > 0;
        
        // Check permission based on menu.permissions array
        const menuPermissions = item.permissions ?? [];
        const hasMenuPermissions = menuPermissions.length > 0;
        const hasPermission = !hasMenuPermissions || menuPermissions.some(perm => user?.permissions?.includes(perm.slug));

        // Group menu (parent without route)
        if (!item.route && hasChildren) {
            return (
                <div key={item.id} className="space-y-0.5">
                    {!isCollapsed && (
                        <div className="mt-3 px-3 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                            {item.label}
                        </div>
                    )}
                    <div className={`${depth > 0 && !isCollapsed ? 'pl-2' : ''} space-y-0.5`}>
                        {item.children?.map((child) => renderMenuItem(child, depth + 1))}
                    </div>
                </div>
            );
        }

        // Menu tanpa route dan tanpa children
        if (!item.route) {
            return null;
        }

        // Hide menu jika user tidak punya permission
        if (!hasPermission) {
            return null;
        }

        return (
            <NavLink
                key={item.id}
                to={item.route}
                onClick={onClose}
                className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150
                    ${isCollapsed ? 'justify-center' : ''}
                    ${depth > 0 && !isCollapsed ? 'ml-2' : ''}
                    ${isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                        : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900'
                    }
                `}
                title={isCollapsed ? item.label : undefined}
            >
                <Icon size={16} className="flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
        );
    };
    
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="
                        fixed top-4 left-4 z-50 md:hidden
                        flex items-center justify-center
                        h-10 w-10 rounded-xl
                        bg-emerald-600 text-white shadow-lg shadow-emerald-500/30
                        hover:bg-emerald-700 active:scale-95
                        transition-all duration-200
                    "
                    aria-label="Open sidebar"
                >
                    <Menu size={18} />
                </button>
            )}

            <aside
                className={`
                    fixed md:sticky md:top-0 z-40 top-0 left-0
                    h-screen flex-shrink-0
                    flex flex-col
                    border-r border-emerald-100 bg-white/95 backdrop-blur-md shadow-xl
                    transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                    ${isCollapsed ? 'md:w-[72px]' : 'w-64'}
                `}
            >
                <button
                    onClick={() => setIsCollapsed(prev => !prev)}
                    className="
                        hidden md:flex
                        absolute -right-3 top-6
                        items-center justify-center
                        h-6 w-6 rounded-full
                        bg-emerald-600 text-white shadow-md shadow-emerald-400/40
                        hover:bg-emerald-700 hover:scale-110
                        active:scale-95
                        transition-all duration-200
                        z-10
                    "
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <ChevronLeft
                        size={14}
                        className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}
                    />
                </button>

                <button
                    onClick={onClose}
                    className="
                        absolute top-3 right-3 z-10
                        md:hidden
                        flex items-center justify-center
                        h-8 w-8 rounded-lg
                        text-emerald-500 hover:bg-emerald-100
                        transition-all duration-200
                    "
                    aria-label="Close sidebar"
                >
                    <X size={16} />
                </button>

                <div className={`
                    flex items-center gap-3 mx-3 mt-4 mb-2 px-3 py-3 rounded-xl
                    bg-emerald-50 border border-emerald-100
                    transition-all duration-300
                    ${isCollapsed ? 'justify-center px-2' : ''}
                `}>
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-emerald-200 ring-2 ring-white shadow-sm">
                        <img
                            src={user?.avatar || '/avatar.jpg'}
                            alt={user?.name || 'User'}
                            className="h-full w-full object-cover"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-emerald-900 leading-tight">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-emerald-500 font-medium">
                                {user?.role?.name || 'User'}
                            </p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 mt-2 space-y-0.5 overflow-y-auto">
                    <div className={`space-y-0.5 ${!isCollapsed ? 'pl-1' : ''}`}>
                        {menus.map((item) => renderMenuItem(item))}
                    </div>
                </nav>

                {/* Logout */}
                <div className="px-3 pb-4 pt-2 border-t border-emerald-100">
                    <button
                        type="button"
                        onClick={logout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                            text-red-500 hover:bg-red-50 hover:text-red-600
                            transition-all duration-150 active:scale-[0.98]
                            ${isCollapsed ? 'justify-center' : ''}
                        `}
                        title={isCollapsed ? 'Logout' : undefined}
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
