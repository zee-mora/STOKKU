import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../../api/axios';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/ui/Button';
import InputForm from '../../../components/ui/InputForm';
import { showToast } from '../../../utils/alert';

interface RequestDetail {
  id: number;
  itemName: string;
  itemDescription?: string;
  stock: number;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  reason?: string;
}

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const backtorequest = () => {
      navigate(`/staff/request-barang/`);
    }

  const fetchRequestDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await api.get(`/request-items/${id}`);
      if (response.data.success) {
        const data = response.data.data;
        setRequest({
          id: data.id,
          itemName: data.item?.name || 'N/A',
          itemDescription: data.item?.description || '',
          stock: data.item?.stock || 0,
          quantity: data.jumlah,
          status: data.status.toUpperCase(),
          requestedAt: new Date(data.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          reason: data.reason || '',
        });
      }
    } catch (error) {
      console.error('Error fetching request detail:', error);
      showToast('error', 'Gagal', 'Tidak dapat memuat detail request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchRequestDetail();
  }, [fetchRequestDetail]);

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        icon: <Clock size={18} />,
      },
      APPROVED: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        icon: <CheckCircle2 size={18} />,
      },
      REJECTED: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: <XCircle size={18} />,
      },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${badge.bg} ${badge.border} ${badge.text} font-semibold`}>
        {badge.icon}
        <span className="capitalize">{status.toLowerCase()}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <Clock className="text-gray-400" size={32} />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Detail request tidak ditemukan</p>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Kembali
          </Button>
        </div>
      </PageContainer>
    );
  }

  const isStockInsufficient = request.stock < request.quantity;

  return (
    <PageContainer>
      <div className="mb-8">
        <button
          onClick={backtorequest}
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Detail Request Barang</h1>
        <p className="text-gray-600 mt-2">Lihat informasi lengkap dari request Anda</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <form className="space-y-6">
          {/* Status Section */}
          <div className="pb-6 border-b border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block mb-3">Status Request</label>
            {getStatusBadge(request.status)}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Informasi Barang</h2>

            <InputForm
              label="Nama Barang"
              value={request.itemName}
              readOnly
              disabled
            />

            {request.itemDescription && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Deskripsi Barang</label>
                <textarea
                  value={request.itemDescription}
                  readOnly
                  disabled
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <InputForm
                label="Stok Tersedia"
                value={request.stock.toString()}
                readOnly
                disabled
              />

              <InputForm
                label="Jumlah Diminta"
                value={request.quantity.toString()}
                readOnly
                disabled
              />
            </div>

            {isStockInsufficient && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ Stok tidak cukup untuk memenuhi request ini
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Detail Permintaan</h2>

            <InputForm
              label="Tanggal Request"
              value={request.requestedAt}
              readOnly
              disabled
            />

            <InputForm
              label="ID Request"
              value={`#${request.id}`}
              readOnly
              disabled
            />
          </div>

          {request.status === 'REJECTED' && request.reason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3 pt-6 border-t-2">
              <h3 className="font-bold text-red-900">Alasan Penolakan</h3>
              <p className="text-red-700 text-sm leading-relaxed">{request.reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={backtorequest}
            >
              Tutup
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default RequestDetailPage;