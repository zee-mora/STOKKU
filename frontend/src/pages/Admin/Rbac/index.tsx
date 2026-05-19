import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Shield, KeyRound, MenuSquare, RefreshCcw } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Button from '../../../components/ui/Button';
import { useModal } from '../../../hooks/UseModal';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../api/axios';
import { showConfirmDialog, showToast } from '../../../utils/alert';

type PermissionRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    menus?: { id: number; label: string }[];
};

type RoleRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    permissions_count?: number;
    permissions?: PermissionRow[];
};

type MenuRow = {
    id: number;
    parent_id: number | null;
    label: string;
    route?: string | null;
    icon?: string | null;
    permission_slug?: string | null;
    sort_order?: number;
    is_active?: boolean;
    parent?: { id: number; label: string } | null;
    permissions?: PermissionRow[];
};

type RolePayload = {
    name: string;
    slug?: string;
    description?: string;
    permission_ids: number[];
};

type PermissionPayload = {
    name: string;
    slug?: string;
    description?: string;
};

type MenuPayload = {
    parent_id: number | null;
    label: string;
    route?: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
};

const iconChoices = [
    'LayoutDashboard',
    'FolderTree',
    'Shield',
    'Home',
    'Users',
    'Receipt',
    'TrendingDown',
    'FileBarChart2',
    'KeyRound',
    'MenuSquare',
    'Circle',
];

const SectionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }> = ({ title, description, icon, action, children }) => (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-emerald-100 px-5 py-4">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    {icon}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-emerald-950">{title}</h2>
                    <p className="text-sm text-emerald-600">{description}</p>
                </div>
            </div>
            {action}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const emptyState = (label: string) => (
    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm text-emerald-700">
        {label}
    </div>
);

const RoleFormModal: React.FC<{
    initialData?: RoleRow | null;
    permissions: PermissionRow[];
    onSubmit: (payload: RolePayload) => Promise<void>;
    onClose: () => void;
}> = ({ initialData, permissions, onSubmit, onClose }) => {
    const [name, setName] = useState(initialData?.name ?? '');
    const [slug, setSlug] = useState(initialData?.slug ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [permissionIds, setPermissionIds] = useState<number[]>(initialData?.permissions?.map((item) => item.id) ?? []);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(initialData?.name ?? '');
        setSlug(initialData?.slug ?? '');
        setDescription(initialData?.description ?? '');
        setPermissionIds(initialData?.permissions?.map((item) => item.id) ?? []);
    }, [initialData]);

    const togglePermission = (permissionId: number) => {
        setPermissionIds((current) => current.includes(permissionId)
            ? current.filter((id) => id !== permissionId)
            : [...current, permissionId]);
    };

    const groupedPermissions = useMemo(() => {
        const groups: Record<string, PermissionRow[]> = {};
        
        permissions.forEach((perm) => {
            const parts = perm.slug.split('.');
            const menuName = parts[0] || 'Other';
            if (!groups[menuName]) {
                groups[menuName] = [];
            }
            groups[menuName].push(perm);
        });

        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [permissions]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        try {
            await onSubmit({
                name,
                slug: slug.trim() || undefined,
                description: description.trim() || undefined,
                permission_ids: permissionIds,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Nama Role</span>
                    <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none ring-0 focus:border-emerald-500"
                        placeholder="Contoh: Operator"
                        required
                    />
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Slug</span>
                    <input
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                        className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none ring-0 focus:border-emerald-500"
                        placeholder="operator"
                    />
                </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-emerald-900">
                <span>Deskripsi</span>
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none ring-0 focus:border-emerald-500"
                    placeholder="Hak akses untuk tim operasional"
                />
            </label>

            <div>
                <div className="mb-2 text-sm font-medium text-emerald-900">Permissions</div>
                <div className="max-h-96 overflow-auto rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                    <div className="space-y-4">
                        {groupedPermissions.map(([menuName, perms]) => (
                            <div key={menuName} className="rounded-xl border border-emerald-100 bg-white p-3">
                                <div className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-700">
                                    {menuName === 'rbac' ? 'RBAC' : menuName === 'users' ? 'Users' : menuName}
                                </div>
                                <div className="space-y-2">
                                    {perms.sort((a, b) => {
                                        const order = ['view', 'create', 'update', 'delete'];
                                        const aAction = a.slug.split('.')[1] || '';
                                        const bAction = b.slug.split('.')[1] || '';
                                        return order.indexOf(aAction) - order.indexOf(bAction);
                                    }).map((permission) => (
                                        <label key={permission.id} className="flex items-start gap-3 rounded-lg border border-emerald-50 bg-emerald-50/50 px-3 py-2 text-sm hover:bg-emerald-100/50 cursor-pointer transition">
                                            <input
                                                type="checkbox"
                                                checked={permissionIds.includes(permission.id)}
                                                onChange={() => togglePermission(permission.id)}
                                                className="mt-0.5 accent-emerald-600"
                                            />
                                            <span className="flex-1">
                                                <span className="block font-medium text-emerald-950">{permission.name}</span>
                                                <span className="block text-xs text-emerald-500">{permission.slug}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
        </form>
    );
};

const PermissionFormModal: React.FC<{
    initialData?: PermissionRow | null;
    onSubmit: (payload: PermissionPayload) => Promise<void>;
    onClose: () => void;
}> = ({ initialData, onSubmit, onClose }) => {
    const [name, setName] = useState(initialData?.name ?? '');
    const [slug, setSlug] = useState(initialData?.slug ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(initialData?.name ?? '');
        setSlug(initialData?.slug ?? '');
        setDescription(initialData?.description ?? '');
    }, [initialData]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        try {
            await onSubmit({
                name,
                slug: slug.trim() || undefined,
                description: description.trim() || undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium text-emerald-900">
                <span>Nama Permission</span>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none ring-0 focus:border-emerald-500"
                    placeholder="View reports"
                    required
                />
            </label>
            <label className="block space-y-2 text-sm font-medium text-emerald-900">
                <span>Slug</span>
                <input
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                    className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none ring-0 focus:border-emerald-500"
                    placeholder="reports.view"
                />
            </label>
            <label className="block space-y-2 text-sm font-medium text-emerald-900">
                <span>Deskripsi</span>
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none ring-0 focus:border-emerald-500"
                    placeholder="Hak akses untuk laporan keuangan"
                />
            </label>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
        </form>
    );
};

const MenuFormModal: React.FC<{
    initialData?: MenuRow | null;
    menus: MenuRow[];
    permissions: PermissionRow[];
    onSubmit: (payload: MenuPayload) => Promise<void>;
    onClose: () => void;
}> = ({ initialData, menus, onSubmit, onClose }) => {
    const [parentId, setParentId] = useState<string>(initialData?.parent_id ? String(initialData.parent_id) : '');
    const [label, setLabel] = useState(initialData?.label ?? '');
    const [route, setRoute] = useState(initialData?.route ?? '');
    const [icon, setIcon] = useState(initialData?.icon ?? '');
    const [sortOrder, setSortOrder] = useState(String(initialData?.sort_order ?? 0));
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setParentId(initialData?.parent_id ? String(initialData.parent_id) : '');
        setLabel(initialData?.label ?? '');
        setRoute(initialData?.route ?? '');
        setIcon(initialData?.icon ?? '');
        setSortOrder(String(initialData?.sort_order ?? 0));
        setIsActive(initialData?.is_active ?? true);
    }, [initialData]);

    const parentOptions = useMemo(() => {
        return menus.filter((menu) => menu.id !== initialData?.id);
    }, [menus, initialData?.id]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        try {
            await onSubmit({
                parent_id: parentId ? Number(parentId) : null,
                label,
                route: route.trim() || undefined,
                icon: icon.trim() || undefined,
                sort_order: Number(sortOrder) || 0,
                is_active: isActive,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Parent Menu</span>
                    <select value={parentId} onChange={(event) => setParentId(event.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500">
                        <option value="">Root</option>
                        {parentOptions.map((menu) => (
                            <option key={menu.id} value={menu.id}>{menu.label}</option>
                        ))}
                    </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Label</span>
                    <input value={label} onChange={(event) => setLabel(event.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500" placeholder="RBAC" required />
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Route</span>
                    <input value={route} onChange={(event) => setRoute(event.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500" placeholder="/admin/rbac" />
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Icon</span>
                    <select value={icon} onChange={(event) => setIcon(event.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500">
                        <option value="">Pilih icon</option>
                        {iconChoices.map((choice) => (
                            <option key={choice} value={choice}>{choice}</option>
                        ))}
                    </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Urutan</span>
                    <input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500" />
                </label>
            </div>

            <label className="flex items-center gap-3 text-sm font-medium text-emerald-900">
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="accent-emerald-600" />
                Menu aktif
            </label>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                <p className="text-xs text-emerald-600">CRUD permission (view, create, update, delete) akan otomatis dibuat untuk menu ini.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
        </form>
    );
};

const AdminRbac: React.FC = () => {
    const { show, close } = useModal();
    const { user } = useAuth();
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [permissions, setPermissions] = useState<PermissionRow[]>([]);
    const [menus, setMenus] = useState<MenuRow[]>([]);
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'menus'>('roles');
    const [loading, setLoading] = useState(true);

    // Permission helpers
    const hasPermission = (slug: string) => user?.permissions?.includes(slug) ?? false;
    const canCreateRole = hasPermission('rbac.create');
    const canUpdateRole = hasPermission('rbac.update');
    const canDeleteRole = hasPermission('rbac.delete');
    const canCreatePermission = hasPermission('rbac.create');
    const canUpdatePermission = hasPermission('rbac.update');
    const canDeletePermission = hasPermission('rbac.delete');
    const canCreateMenu = hasPermission('rbac.create');
    const canUpdateMenu = hasPermission('rbac.update');
    const canDeleteMenu = hasPermission('rbac.delete');

    const loadData = async () => {
        setLoading(true);
        try {
            const [rolesResponse, permissionsResponse, menusResponse] = await Promise.all([
                api.get('/admin/roles'),
                api.get('/admin/permissions'),
                api.get('/admin/menus'),
            ]);

            setRoles(rolesResponse.data?.data ?? []);
            setPermissions(permissionsResponse.data?.data ?? []);
            setMenus(menusResponse.data?.data ?? []);
        } catch (error) {
            console.error(error);
            showToast('error', 'Gagal memuat data', 'Data RBAC tidak dapat dimuat.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const openRoleForm = (role?: RoleRow) => {
        show(
            <RoleFormModal
                initialData={role}
                permissions={permissions}
                onClose={() => close()}
                onSubmit={async (payload) => {
                    await (role ? api.put(`/admin/roles/${role.id}`, payload) : api.post('/admin/roles', payload));
                    showToast('success', 'Berhasil', role ? 'Role diperbarui.' : 'Role ditambahkan.');
                    close();
                    await loadData();
                }}
            />,
            { title: role ? 'Edit Role' : 'Tambah Role', size: 'lg', closable: true },
        );
    };

    const openPermissionForm = (permission?: PermissionRow) => {
        show(
            <PermissionFormModal
                initialData={permission}
                onClose={() => close()}
                onSubmit={async (payload) => {
                    await (permission ? api.put(`/admin/permissions/${permission.id}`, payload) : api.post('/admin/permissions', payload));
                    showToast('success', 'Berhasil', permission ? 'Permission diperbarui.' : 'Permission ditambahkan.');
                    close();
                    await loadData();
                }}
            />,
            { title: permission ? 'Edit Permission' : 'Tambah Permission', size: 'md', closable: true },
        );
    };

    const openMenuForm = (menu?: MenuRow) => {
        show(
            <MenuFormModal
                initialData={menu}
                menus={menus}
                permissions={permissions}
                onClose={() => close()}
                onSubmit={async (payload) => {
                    await (menu ? api.put(`/admin/menus/${menu.id}`, payload) : api.post('/admin/menus', payload));
                    showToast('success', 'Berhasil', menu ? 'Menu diperbarui.' : 'Menu ditambahkan.');
                    close();
                    await loadData();
                }}
            />,
            { title: menu ? 'Edit Menu' : 'Tambah Menu', size: 'lg', closable: true },
        );
    };

    const handleDelete = async (kind: 'role' | 'permission' | 'menu', id: number, label: string) => {
        const confirmation = await showConfirmDialog('Konfirmasi Hapus', `Hapus ${label}?`, 'Ya, Hapus', 'Batal');
        if (!confirmation.isConfirmed) {
            return;
        }

        const endpointMap = {
            role: `/admin/roles/${id}`,
            permission: `/admin/permissions/${id}`,
            menu: `/admin/menus/${id}`,
        };

        try {
            await api.delete(endpointMap[kind]);
            showToast('success', 'Berhasil', `${label} berhasil dihapus.`);
            await loadData();
        } catch (error) {
            console.error(error);
            showToast('error', 'Gagal', `Tidak dapat menghapus ${label.toLowerCase()}.`);
        }
    };

    return (
        <PageContainer>
            <Breadcrumb items={[{ label: 'Administrasi' }, { label: 'RBAC' }]} />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-950">RBAC Management</h1>
                    <p className="text-sm text-emerald-600">Kelola role, permission, dan menu dari satu tempat.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button size="md" variant="secondary" Icon={RefreshCcw} onClick={() => void loadData()}>
                        Refresh
                    </Button>
                    {activeTab === 'roles' && (
                        canCreateRole ? (
                            <Button size="md" variant="primary" Icon={Plus} onClick={() => openRoleForm()}>Tambah Role</Button>
                        ) : (
                            <Button size="md" variant="primary" Icon={Plus} disabled title="Anda tidak punya permission untuk tambah role">Tambah Role</Button>
                        )
                    )}
                    {activeTab === 'permissions' && (
                        canCreatePermission ? (
                            <Button size="md" variant="primary" Icon={Plus} onClick={() => openPermissionForm()}>Tambah Permission</Button>
                        ) : (
                            <Button size="md" variant="primary" Icon={Plus} disabled title="Anda tidak punya permission untuk tambah permission">Tambah Permission</Button>
                        )
                    )}
                    {activeTab === 'menus' && (
                        canCreateMenu ? (
                            <Button size="md" variant="primary" Icon={Plus} onClick={() => openMenuForm()}>Tambah Menu</Button>
                        ) : (
                            <Button size="md" variant="primary" Icon={Plus} disabled title="Anda tidak punya permission untuk tambah menu">Tambah Menu</Button>
                        )
                    )}
                </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-2">
                {[
                    { key: 'roles', label: 'Roles', icon: Shield },
                    { key: 'permissions', label: 'Permissions', icon: KeyRound },
                    { key: 'menus', label: 'Menus', icon: MenuSquare },
                ].map((tab) => {
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as typeof activeTab)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20' : 'text-emerald-700 hover:bg-white'}`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="rounded-2xl border border-emerald-100 bg-white p-10 text-center text-emerald-600">Memuat data RBAC...</div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'roles' && (
                        <SectionCard
                            title="Roles"
                            description="Atur role dan permission yang melekat padanya."
                            icon={<Shield size={18} />}
                        >
                            {roles.length === 0 ? emptyState('Belum ada role.') : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-emerald-100">
                                        <thead className="bg-emerald-50/70 text-left text-xs font-semibold uppercase tracking-wider text-emerald-500">
                                            <tr>
                                                <th className="px-4 py-3">Nama</th>
                                                <th className="px-4 py-3">Slug</th>
                                                <th className="px-4 py-3">Permission</th>
                                                <th className="px-4 py-3">Deskripsi</th>
                                                <th className="px-4 py-3">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50 text-sm">
                                            {roles.map((role) => (
                                                <tr key={role.id} className="hover:bg-emerald-50/40">
                                                    <td className="px-4 py-3 font-semibold text-emerald-950">{role.name}</td>
                                                    <td className="px-4 py-3 text-emerald-600">{role.slug}</td>
                                                    <td className="px-4 py-3 text-emerald-700">{role.permissions?.length ?? role.permissions_count ?? 0}</td>
                                                    <td className="px-4 py-3 text-emerald-700">{role.description || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {canUpdateRole ? (
                                                                <Button size="sm" variant="secondary" Icon={Pencil} onClick={() => openRoleForm(role)}>Edit</Button>
                                                            ) : (
                                                                <Button size="sm" variant="secondary" Icon={Pencil} disabled title="Anda tidak punya permission untuk edit role">Edit</Button>
                                                            )}
                                                            {canDeleteRole ? (
                                                                <Button size="sm" variant="danger" Icon={Trash2} onClick={() => void handleDelete('role', role.id, role.name)}>Hapus</Button>
                                                            ) : (
                                                                <Button size="sm" variant="danger" Icon={Trash2} disabled title="Anda tidak punya permission untuk hapus role">Hapus</Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {activeTab === 'permissions' && (
                        <SectionCard
                            title="Permissions"
                            description="Permission dipakai oleh role dan filter menu dinamis."
                            icon={<KeyRound size={18} />}
                        >
                            {permissions.length === 0 ? emptyState('Belum ada permission.') : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-emerald-100">
                                        <thead className="bg-emerald-50/70 text-left text-xs font-semibold uppercase tracking-wider text-emerald-500">
                                            <tr>
                                                <th className="px-4 py-3">Nama</th>
                                                <th className="px-4 py-3">Slug</th>
                                                <th className="px-4 py-3">Menu</th>
                                                <th className="px-4 py-3">Deskripsi</th>
                                                <th className="px-4 py-3">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50 text-sm">
                                            {permissions.map((permission) => (
                                                <tr key={permission.id} className="hover:bg-emerald-50/40">
                                                    <td className="px-4 py-3 font-semibold text-emerald-950">{permission.name}</td>
                                                    <td className="px-4 py-3 text-emerald-600">{permission.slug}</td>
                                                    <td className="px-4 py-3 text-emerald-700">{(permission.menus && permission.menus.length > 0) ? permission.menus.map(m => m.label).join(', ') : '-'}</td>
                                                    <td className="px-4 py-3 text-emerald-700">{permission.description || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {canUpdatePermission ? (
                                                                <Button size="sm" variant="secondary" Icon={Pencil} onClick={() => openPermissionForm(permission)}>Edit</Button>
                                                            ) : (
                                                                <Button size="sm" variant="secondary" Icon={Pencil} disabled title="Anda tidak punya permission untuk edit permission">Edit</Button>
                                                            )}
                                                            {canDeletePermission ? (
                                                                <Button size="sm" variant="danger" Icon={Trash2} onClick={() => void handleDelete('permission', permission.id, permission.name)}>Hapus</Button>
                                                            ) : (
                                                                <Button size="sm" variant="danger" Icon={Trash2} disabled title="Anda tidak punya permission untuk hapus permission">Hapus</Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {activeTab === 'menus' && (
                        <SectionCard
                            title="Menus"
                            description="Kelola struktur navigasi yang akan tampil di sidebar."
                            icon={<MenuSquare size={18} />}
                        >
                            {menus.length === 0 ? emptyState('Belum ada menu.') : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-emerald-100">
                                        <thead className="bg-emerald-50/70 text-left text-xs font-semibold uppercase tracking-wider text-emerald-500">
                                            <tr>
                                                <th className="px-4 py-3">Label</th>
                                                <th className="px-4 py-3">Parent</th>
                                                <th className="px-4 py-3">Route</th>
                                                <th className="px-4 py-3">Permission</th>
                                                <th className="px-4 py-3">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-50 text-sm">
                                            {menus.map((menu) => (
                                                <tr key={menu.id} className="hover:bg-emerald-50/40">
                                                    <td className="px-4 py-3 font-semibold text-emerald-950">{menu.label}</td>
                                                    <td className="px-4 py-3 text-emerald-600">{menu.parent?.label || '-'}</td>
                                                    <td className="px-4 py-3 text-emerald-700">{menu.route || '-'}</td>
                                                    <td className="px-4 py-3 text-emerald-700">{menu.permission_slug || '-'}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {canUpdateMenu ? (
                                                                <Button size="sm" variant="secondary" Icon={Pencil} onClick={() => openMenuForm(menu)}>Edit</Button>
                                                            ) : (
                                                                <Button size="sm" variant="secondary" Icon={Pencil} disabled title="Anda tidak punya permission untuk edit menu">Edit</Button>
                                                            )}
                                                            {canDeleteMenu ? (
                                                                <Button size="sm" variant="danger" Icon={Trash2} onClick={() => void handleDelete('menu', menu.id, menu.label)}>Hapus</Button>
                                                            ) : (
                                                                <Button size="sm" variant="danger" Icon={Trash2} disabled title="Anda tidak punya permission untuk hapus menu">Hapus</Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SectionCard>
                    )}
                </div>
            )}
        </PageContainer>
    );
};

export default AdminRbac;