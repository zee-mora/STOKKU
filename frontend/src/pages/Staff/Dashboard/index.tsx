import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, Plus, TrendingUp, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/ui/Button';
import api from '../../../api/axios';
import StatCard from '../../../components/ui/StatCard';
import Breadcrumb from '../../../components/ui/Breadcrumb';

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface RequestData {
  id: number;
  itemName: string;
  jumlah: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const DashboardStaff: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/request-items/my-requests');
      if (response.data.success) {
        const requests = response.data.data.map((item: any) => ({
          id: item.id,
          itemName: item.item?.name || 'N/A',
          jumlah: item.jumlah,
          status: item.status,
          createdAt: new Date(item.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        }));

        const pending = requests.filter((r: RequestData) => r.status === 'PENDING').length;
        const approved = requests.filter((r: RequestData) => r.status === 'APPROVED').length;
        const rejected = requests.filter((r: RequestData) => r.status === 'REJECTED').length;

        setStats({
          pending,
          approved,
          rejected,
          total: requests.length,
        });
        setRecentRequests(requests.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' };
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' };
      case 'REJECTED':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock size={16} />;
      case 'APPROVED':
        return <CheckCircle2 size={16} />;
      case 'REJECTED':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Staff' }, { label: 'Dashboard' }]} />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Dashboard Staff</h1>
          <p className="text-gray-600 mt-2">Pantau status permintaan barang Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          Icon=""
          title="Menunggu Persetujuan" 
          value={stats.pending}
          percentage={stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}
          color="text-amber-400"
          bgColor="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          Icon=""
          title="Telah Disetujui" 
          value={stats.approved}
          percentage={stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}
          color="text-green-400"
          bgColor="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard 
          Icon=""
          title="Ditolak" 
          value={stats.rejected}
          percentage={stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}
          color="text-red-400"
          bgColor="bg-gradient-to-br from-red-500 to-pink-600"
        />
        <StatCard 
          Icon=""
          title="Total Request" 
          value={stats.total}
          color="text-blue-400"
          bgColor="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Permintaan Terbaru</h2>
                <p className="text-gray-600 text-sm mt-1">Riwayat permintaan barang Anda</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-full">
                <AlertCircle className="text-white" size={24} />
              </div>
            </div>

            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((req) => {
                  const statusColor = getStatusColor(req.status);
                  return (
                    <div 
                      key={req.id} 
                      className={`flex items-center justify-between p-5 rounded-xl border-2 ${statusColor.border} ${statusColor.bg}/20 hover:shadow-md transition-all duration-200 cursor-pointer group`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-bold text-gray-900 text-lg">{req.itemName}</p>
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full">
                            {req.jumlah} pcs
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Tanggal: {req.createdAt}</p>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${statusColor.text} ${statusColor.bg}`}>
                        {getStatusIcon(req.status)}
                        <span>{req.status}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <Button 
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => window.location.href = '/staff/request-barang'}
                  >
                    Lihat Semua Permintaan
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="font-medium text-gray-600 mb-4">Belum ada permintaan</p>
                <Button 
                  variant="primary"
                  onClick={() => window.location.href = '/staff/request-barang'}
                >
                  Buat Permintaan Pertama
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Summary */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/50 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-gray-700">Menunggu Persetujuan</span>
                <span className="font-bold text-amber-600">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Telah Disetujui</span>
                <span className="font-bold text-green-600">{stats.approved}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-gray-700">Ditolak</span>
                <span className="font-bold text-red-600">{stats.rejected}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            variant="primary"
            className="w-full flex items-center justify-center gap-2 py-4 text-lg font-bold"
            onClick={() => window.location.href = '/staff/request-barang'}
          >
            <Plus size={20} />
            Request Barang Baru
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardStaff;