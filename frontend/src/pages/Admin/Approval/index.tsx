import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import DataTable from '../../../components/DataTable/DataTable';
import type { ColumnDef } from '@tanstack/react-table';
import Button from '../../../components/ui/Button';
import api from '../../../api/axios';
import { showCustomDialog, showPrompt, showToast } from '../../../utils/alert';
import Breadcrumb from '../../../components/ui/Breadcrumb';

interface ApiRequestData {
  id: number;
  item: { name: string; stock: number };
  user: { name: string; email: string };
  jumlah: number;
  status: string;
  created_at: string;
}

interface RequestItem {
  id: number;
  userName: string;
  userEmail: string;
  itemName: string;
  currentStock: number;
  requestedQty: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const Approval: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tabCounts, setTabCounts] = useState<{ PENDING: number; APPROVED: number; REJECTED: number }>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/approval?status=${activeTab}`);
      if (response.data.success) {
        const mappedRequests = response.data.data.map((item: ApiRequestData) => ({
          id: item.id,
          userName: item.user?.name || 'N/A',
          userEmail: item.user?.email || 'N/A',
          itemName: item.item?.name || 'N/A',
          currentStock: item.item?.stock || 0,
          requestedQty: item.jumlah,
          status: item.status.toUpperCase(),
          createdAt: new Date(item.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setMessage({ type: 'error', text: 'Gagal mengambil data permintaan' });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    const request = requests.find(r => r.id === id);
    if (!request) return;

    // validasi stok sebelum menyetujui
    if (action === 'approve' && request.currentStock < request.requestedQty) {
      setMessage({
        type: 'error',
        text: `Gagal! Stok ${request.itemName} tidak mencukupi (tersedia: ${request.currentStock}, diminta: ${request.requestedQty})`,
      });
      return;
    }

    if (action === 'approve'){
        const actionText = 'MENYETUJUI';
        const actionColor = '#22c55e';
        const htmlContent = `Anda akan <span style="color: ${actionColor}; font-weight: bold; font-size: 18px;">${actionText}</span> permintaan ini.`;
    
        const result = await showCustomDialog(htmlContent, 'Iya', 'Batal');
        if (!result.isConfirmed) {
          return;
        }
    }

    let rejectionReason = '';
    if (action === 'reject') {
      const reasonResult = await showPrompt('Alasan Penolakan', 'Masukkan alasan penolakan:', 'Contoh: Stok tidak cukup');
      if (!reasonResult.isConfirmed || !reasonResult.value) {
        return;
      }
      rejectionReason = reasonResult.value;
    }

    try {
      setProcessingId(id);
      const response = await api.post(`/admin/approval/${id}/action`, {
        action: action === 'approve' ? 'APPROVED' : 'REJECTED',
        reason: rejectionReason,
      });

      if (response.data.success) {
        showToast(response.data.status, 'Request Status', response.data.message);

        setRequests(prevRequests =>
          prevRequests.map(req =>
            req.id === id
              ? {
                  ...req,
                  status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                  currentStock:
                    action === 'approve'
                      ? req.currentStock - req.requestedQty
                      : req.currentStock,
                }
              : req
          )
        );

        setTimeout(() => {
          fetchRequests();
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setMessage({ type: 'error', text: 'Gagal memproses request' });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => req.status === activeTab);

  // formating untuk count tab
  const formatCount = (count: number): string => {
    return count >= 100 ? '99+' : count.toString();
  };

  const fetchAllCounts = useCallback(async () => {
    try {
      const statuses: Array<'PENDING' | 'APPROVED' | 'REJECTED'> = ['PENDING', 'APPROVED', 'REJECTED'];
      const counts: { PENDING: number; APPROVED: number; REJECTED: number } = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
      };

      for (const status of statuses) {
        try {
          const response = await api.get(`/admin/approval?status=${status}&per_page=1&page=1`);
          if (response.data.success && response.data.total) {
            counts[status] = response.data.total;
          }
        } catch (error) {
          console.error(`Error fetching ${status} count:`, error);
        }
      }

      setTabCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
    }
  }, []);

  useEffect(() => {
    void fetchAllCounts();
  }, [fetchAllCounts]);

  const columns: ColumnDef<RequestItem>[] = [
    {
      accessorKey: 'userName',
      header: 'Pemohon',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.getValue() as string}</div>
          <div className="text-xs text-gray-500">{info.row.original.userEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: 'itemName',
      header: 'Barang & Stok',
      cell: (info) => (
        <div>
          <div className="font-medium text-gray-900">{info.getValue() as string}</div>
          <div className="text-xs mt-1">
            Sisa Stok:{' '}
            <span
              className={`font-semibold ${
                info.row.original.currentStock < info.row.original.requestedQty &&
                activeTab === 'PENDING'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }`}
            >
              {info.row.original.currentStock} pcs
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'requestedQty',
      header: 'Jumlah Diminta',
      cell: (info) => (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center justify-center min-w-8 h-8 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
            {info.getValue() as number}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal Pengajuan',
      cell: (info) => <div className="text-sm text-gray-600">{info.getValue() as string}</div>,
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: (info) =>
        activeTab === 'PENDING' ? (
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="success"
              disabled={processingId !== null}
              onClick={() => handleAction(info.row.original.id, 'approve')}
            >
              {processingId === info.row.original.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Setujui'
              )}
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={processingId !== null}
              onClick={() => handleAction(info.row.original.id, 'reject')}
            >
              {processingId === info.row.original.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Tolak'
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center text-gray-400 text-sm">-</div>
        ),
    },
  ];

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Admin' }, { label: 'Approval' }]} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Persetujuan</h1>
        <p className="mt-2 text-gray-600">Proses dan pantau permintaan barang dari staff kantor</p>
      </div>

      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border mb-6 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'PENDING' && <Clock size={18} />}
            {tab === 'APPROVED' && <CheckCircle2 size={18} />}
            {tab === 'REJECTED' && <XCircle size={18} />}
            <span className="capitalize">{tab.toLowerCase()}</span>
            <span className="inline-flex items-center justify-center min-w-6 h-6 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                {formatCount(tabCounts[tab])}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">Tidak ada permintaan dengan status {activeTab.toLowerCase()}</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredRequests} />
        )}
      </div>
    </PageContainer>
  );
};

export default Approval;