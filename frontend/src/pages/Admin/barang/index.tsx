import React, { useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/DataTable/DataTable';
import InputForm from '../../../components/ui/InputForm';
import { useModal } from '../../../hooks/UseModal';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../api/axios';
import { showConfirmDialog, showToast } from '../../../utils/alert';
import { datatableRefetchRegistry } from '../../../components/DataTable/DatatableRegistry';

type BarangRow = {
    id: number;
    name: string;
    description?: string | null;
    stock: number;
};

type BarangPayload = {
    name: string;
    description?: string | null;
    stock: number;
};

const BarangFormModal: React.FC<{
    initialData?: BarangRow | null;
    onSubmit: (payload: BarangPayload) => Promise<void>;
    onClose: () => void;
}> = ({ initialData, onSubmit, onClose }) => {
    const [name, setName] = useState(initialData?.name ?? '');
    const [description, setDescription] = useState(initialData?.description ?? '');
    const [stock, setStock] = useState(String(initialData?.stock ?? '0'));
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSaving(true);

        try {
            await onSubmit({
                name,
                description: description.trim() ? description.trim() : null,
                stock: Number(stock),
            });
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            showToast('error', 'Gagal', err.response?.data?.message || 'Terjadi kesalahan saat menyimpan barang.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit}>
            <InputForm
                label="Nama Barang"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama barang"
                required
            />

            <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Deskripsi</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan deskripsi barang"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
            </div>

            <InputForm
                label="Stok"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Masukkan jumlah stok"
                required
                min="0"
            />

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
            </div>
        </form>
    );
};

const AdminBarang: React.FC = () => {
    const { show, close } = useModal();
    const { user } = useAuth();

    const hasPermission = (slug: string) => user?.permissions?.includes(slug) ?? false;
    const canCreate = hasPermission('barang.create');
    const canUpdate = hasPermission('barang.update');
    const canDelete = hasPermission('barang.delete');

    const openBarangForm = (item?: BarangRow) => {
        show(
            <BarangFormModal
                initialData={item}
                onClose={() => close()}
                onSubmit={async (payload) => {
                    await (item ? api.put(`/admin/barang/${item.id}`, payload) : api.post('/admin/barang', payload));
                    showToast('success', 'Berhasil', item ? 'Barang diperbarui.' : 'Barang ditambahkan.');
                    close();
                    datatableRefetchRegistry.get('barang')?.();
                }}
            />,
            { title: item ? 'Edit Barang' : 'Tambah Barang', size: 'md', closable: true },
        );
    };

    const handleDelete = async (item: BarangRow) => {
        const confirmation = await showConfirmDialog('Konfirmasi Hapus', `Hapus barang ${item.name}?`, 'Ya, Hapus', 'Batal');
        if (!confirmation.isConfirmed) {
            return;
        }

        try {
            await api.delete(`/admin/barang/${item.id}`);
            showToast('success', 'Berhasil', 'Barang berhasil dihapus.');
            datatableRefetchRegistry.get('barang')?.();
        } catch (error) {
            console.error(error);
            showToast('error', 'Gagal', 'Barang tidak dapat dihapus.');
        }
    };


    return (
        <PageContainer>
            <Breadcrumb items={[{ label: 'Admin' }, { label: 'Barang' }]} />

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-950">Manajemen Barang</h1>
                    <p className="text-sm text-emerald-600">Kelola data barang dan stok inventori.</p>
                </div>
                <div className="flex gap-2">
                    <Button Icon={RefreshCw} size="md" variant="secondary" onClick={() => datatableRefetchRegistry.get('barang')?.()}>
                        Refresh
                    </Button>
                    {canCreate ? (
                        <Button size="md" variant="primary" Icon={Plus} onClick={() => openBarangForm()}>Tambah Barang</Button>
                    ) : (
                        <Button size="md" variant="primary" Icon={Plus} disabled title="Anda tidak punya permission untuk tambah barang">Tambah Barang</Button>
                    )}
                </div>
            </div>

            <DataTable<BarangRow>
                columns={[
                    {
                        accessorKey: 'index',
                        header: 'No',
                    },
                    {
                        accessorKey: 'name',
                        header: 'Nama Barang',
                    },
                    {
                        accessorKey: 'description',
                        header: 'Deskripsi',
                        cell: ({ row }) => row.original.description || '-',
                    },
                    {
                        accessorKey: 'stock',
                        header: 'Stok',
                        cell: ({ row }) => (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                                {row.original.stock}
                            </span>
                        ),
                    },
                    {
                        id: 'actions',
                        header: 'Aksi',
                        cell: ({ row }) => (
                            <div className="flex flex-wrap gap-2">
                                {canUpdate ? (
                                    <Button size="sm" variant="secondary" Icon={Pencil} onClick={() => openBarangForm(row.original)}>Edit</Button>
                                ) : (
                                    <Button size="sm" variant="secondary" Icon={Pencil} disabled title="Anda tidak punya permission untuk edit barang">Edit</Button>
                                )}
                                {canDelete ? (
                                    <Button size="sm" variant="danger" Icon={Trash2} onClick={() => void handleDelete(row.original)}>Hapus</Button>
                                ) : (
                                    <Button size="sm" variant="danger" Icon={Trash2} disabled title="Anda tidak punya permission untuk hapus barang">Hapus</Button>
                                )}
                            </div>
                        ),
                    },
                ]}
                apiUrl="/admin/barang/datatables"
                enableServerSide
                datatableKey="barang"
                searchPlaceholder="Cari barang..."
                title="Daftar Barang"
            />
        </PageContainer>
    );
};

export default AdminBarang;
