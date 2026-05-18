import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2, Plus, PencilLine } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Breadcrumb from '../../../components/ui/Breadcrumb';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/DataTable/DataTable';
import { showToast, showConfirmDialog } from '../../../utils/alert';
import { triggerDatatableRefetch } from '../../../components/DataTable/DatatableRegistry';
import api from '../../../api/axios';
import FormPengeluaran from './FormPengeluaran';

type Expense = {
  id: number;
  category_name: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
};

const MasterPengeluaran = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: 'index',
        header: 'NO',
      },
      {
        accessorKey: 'expense_date',
        header: 'Tanggal',
        cell: ({ row }) => {
          const date = new Date(row.original.expense_date);
          return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        },
      },
      {
        accessorKey: 'category_name',
        header: 'Kategori',
      },
      {
        accessorKey: 'description',
        header: 'Keterangan',
      },
      {
        accessorKey: 'amount',
        header: 'Nominal',
        cell: ({ row }) => {
          const formatter = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          });
          return formatter.format(row.original.amount);
        },
      },
      {
        accessorKey: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              Icon={PencilLine}
              onClick={() => {
                setSelectedExpense(row.original);
                setShowForm(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              Icon={Trash2}
              onClick={() => handleDeleteExpense(row.original.id)}
            >
              Hapus
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setShowForm(true);
  };

  const handleDeleteExpense = (id: number) => {
    showConfirmDialog(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus pengeluaran ini?',
      'Ya, Hapus',
      'Batal',
    ).then((result) => {
      if (result.isConfirmed) {
        api
          .delete(`/expenses/${id}`)
          .then(() => {
            showToast('success', 'Pengeluaran berhasil dihapus.', '');
            triggerDatatableRefetch('table-pengeluaran');
          })
          .catch(() => {
            showToast('error', 'Gagal menghapus pengeluaran. Silakan coba lagi.', '');
          });
      }
    });
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedExpense(null);
  };

  const handleFormSuccess = () => {
    triggerDatatableRefetch('table-pengeluaran');
    handleFormClose();
  };

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Master' }, { label: 'Pengeluaran' }]} />

      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Daftar Pengeluaran</h1>
        <Button size="md" variant="primary" Icon={Plus} onClick={handleAddExpense}>
          Tambah Pengeluaran
        </Button>
      </div>

      <DataTable
        columns={columns}
        apiUrl="expenses/datatables"
        enableServerSide={true}
        searchPlaceholder="Cari pengeluaran..."
        datatableKey="table-pengeluaran"
      />

      {showForm && (
        <FormPengeluaran
          initialData={selectedExpense}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </PageContainer>
  );
};

export default MasterPengeluaran;
