import { useMemo } from 'react';
import PageContainer from '../../../components/layout/PageContainer';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import DataTable from '../../../components/DataTable/DataTable';
import Button from '../../../components/ui/Button';
import FormPayment from './FormPayment';
import { useModal } from '../../../hooks/UseModal';
import type { ColumnDef } from '@tanstack/react-table';
import { showConfirmDialog, showToast } from '../../../utils/alert';
import api from '../../../api/axios';
import { triggerDatatableRefetch } from '../../../components/DataTable/DatatableRegistry';

type PaymentRow = {
  id: number;
  trhouse_resident_id: number;
  resident_name: string | null;
  house_number: string | null;
  type: string;
  month: number;
  year: number;
  amount: number;
  status: 'Lunas' | 'Belum Bayar';
  paid_at: string | null;
};

const MasterIuran: React.FC = () => {
  const { show, close } = useModal();

  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => {
      const handleEdit = (row: PaymentRow) => {
        show(<FormPayment initialData={row} onClose={() => close()} />, { title: 'Edit Pembayaran', size: 'md' });
      };

      return [
        { accessorKey: 'index', header: 'NO' },
        { accessorKey: 'resident_name', header: 'Penghuni' },
        { accessorKey: 'house_number', header: 'Rumah' },
        { accessorKey: 'type', header: 'Tipe' },
        { accessorKey: 'month', header: 'Bulan' },
        { accessorKey: 'year', header: 'Tahun' },
        { accessorKey: 'amount', header: 'Nominal' },
        {
          accessorKey: 'status', header: 'Status', cell: ({ row }) => (
            <span className={row.original.status === 'Lunas' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
              {row.original.status}
            </span>
          )
        },
        {
          accessorKey: 'actions',
          header: 'Aksi',
          cell: ({ row }) => (
            <div className="flex space-x-2">
              <Button className="hover:cursor-pointer" size="sm" variant="secondary" onClick={() => handleEdit(row.original)}>
                Edit
              </Button>
              <Button className="hover:cursor-pointer" size="sm" variant="danger" onClick={() => handledelete(row.original.id)}>
                Hapus
              </Button>
            </div>
          ),
        },
      ];
    },
    [show, close],
  );

  function handledelete(paymentId: number) {
    showConfirmDialog("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus pembayaran ini?", "Ya, Hapus", "Batal")
      .then((result) => {
        if (result.isConfirmed) {
          api.delete(`/payments/${paymentId}`)
            .then(() => {
              showToast("success", "Berhasil", "Pembayaran berhasil dihapus.");
              triggerDatatableRefetch("table-payments");
            })
            .catch((error) => {
              console.error(error);
              showToast("error", "Gagal", "Terjadi kesalahan saat menghapus pembayaran.");
            });
        } else {
          showToast("error", "Dibatalkan", "Penghapusan pembayaran dibatalkan.");
        }
      });
  }

  const openAdd = () => {
    show(<FormPayment onClose={() => close()} />, { title: 'Tambah Pembayaran', size: 'md' });
  };


  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Master' }, { label: 'Iuran' }]} />

      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mengelola Pembayaran</h1>
        <div>
          <Button size="md" variant="primary" onClick={openAdd}>Tambah Pembayaran</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        apiUrl="payments/datatables"
        enableServerSide
        datatableKey="table-payments"
        searchPlaceholder="Cari pembayaran..."
      />
    </PageContainer>
  );
};

export default MasterIuran;
