import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCcw, Users as UsersIcon } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Button from '../../../components/ui/Button';
import { useModal } from '../../../hooks/UseModal';
import api from '../../../api/axios';
import { showConfirmDialog, showToast } from '../../../utils/alert';

type RoleRow = {
    id: number;
    name: string;
    slug: string;
};

type UserRow = {
    id: number;
    name: string;
    email: string;
    role_id?: number | null;
    role?: RoleRow | null;
};

type UserPayload = {
    name: string;
    email: string;
    password?: string;
    role_id: number;
};

const UserFormModal: React.FC<{
    initialData?: UserRow | null;
    roles: RoleRow[];
    onSubmit: (payload: UserPayload) => Promise<void>;
    onClose: () => void;
}> = ({ initialData, roles, onSubmit, onClose }) => {
    const [name, setName] = useState(initialData?.name ?? '');
    const [email, setEmail] = useState(initialData?.email ?? '');
    const [password, setPassword] = useState('');
    const [roleId, setRoleId] = useState(String(initialData?.role_id ?? initialData?.role?.id ?? roles[0]?.id ?? ''));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setName(initialData?.name ?? '');
        setEmail(initialData?.email ?? '');
        setPassword('');
        setRoleId(String(initialData?.role_id ?? initialData?.role?.id ?? roles[0]?.id ?? ''));
    }, [initialData, roles]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        try {
            await onSubmit({
                name,
                email,
                password: password.trim() || undefined,
                role_id: Number(roleId),
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Nama</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500" placeholder="Nama user" />
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Email</span>
                    <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500" placeholder="user@example.com" />
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Password {initialData ? '(opsional)' : ''}</span>
                    <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500" placeholder={initialData ? 'Biarkan kosong jika tidak diubah' : 'Password'} />
                </label>
                <label className="space-y-2 text-sm font-medium text-emerald-900">
                    <span>Role</span>
                    <select value={roleId} onChange={(event) => setRoleId(event.target.value)} required className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 outline-none focus:border-emerald-500">
                        <option value="">Pilih role</option>
                        {roles.map((role) => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
        </form>
    );
};

const AdminUsers: React.FC = () => {
    const { show, close } = useModal();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersResponse, rolesResponse] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/roles'),
            ]);

            setUsers(usersResponse.data?.data ?? []);
            setRoles(rolesResponse.data?.data ?? []);
        } catch (error) {
            console.error(error);
            showToast('error', 'Gagal memuat data', 'Data user tidak dapat dimuat.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const openUserForm = (user?: UserRow) => {
        show(
            <UserFormModal
                initialData={user}
                roles={roles}
                onClose={() => close()}
                onSubmit={async (payload) => {
                    await (user ? api.put(`/admin/users/${user.id}`, payload) : api.post('/admin/users', payload));
                    showToast('success', 'Berhasil', user ? 'User diperbarui.' : 'User ditambahkan.');
                    close();
                    await loadData();
                }}
            />,
            { title: user ? 'Edit User' : 'Tambah User', size: 'md', closable: true },
        );
    };

    const handleDelete = async (user: UserRow) => {
        const confirmation = await showConfirmDialog('Konfirmasi Hapus', `Hapus user ${user.name}?`, 'Ya, Hapus', 'Batal');
        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            await api.delete(`/admin/users/${user.id}`);
            showToast('success', 'Berhasil', 'User berhasil dihapus.');
            await loadData();
        } catch (error) {
            console.error(error);
            showToast('error', 'Gagal', 'User tidak dapat dihapus.');
        }
    };

    return (
        <PageContainer>
            <Breadcrumb items={[{ label: 'Administrasi' }, { label: 'Users' }]} />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-950">User Management</h1>
                    <p className="text-sm text-emerald-600">Tambahkan user admin dan tentukan role yang mereka pakai.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button size="md" variant="secondary" Icon={RefreshCcw} onClick={() => void loadData()}>Refresh</Button>
                    <Button size="md" variant="primary" Icon={Plus} onClick={() => openUserForm()}>Tambah User</Button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-emerald-100 bg-white p-10 text-center text-emerald-600">Memuat data user...</div>
            ) : users.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-10 text-center text-emerald-700">
                    Belum ada user.
                </div>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm">
                    <table className="min-w-full divide-y divide-emerald-100">
                        <thead className="bg-emerald-50/70 text-left text-xs font-semibold uppercase tracking-wider text-emerald-500">
                            <tr>
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-50 text-sm">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-emerald-50/40">
                                    <td className="px-4 py-3 font-semibold text-emerald-950">{user.name}</td>
                                    <td className="px-4 py-3 text-emerald-700">{user.email}</td>
                                    <td className="px-4 py-3 text-emerald-700">{user.role?.name || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" variant="secondary" Icon={Pencil} onClick={() => openUserForm(user)}>Edit</Button>
                                            <Button size="sm" variant="danger" Icon={Trash2} onClick={() => void handleDelete(user)}>Hapus</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PageContainer>
    );
};

export default AdminUsers;