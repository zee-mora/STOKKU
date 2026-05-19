import React, { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, XCircle, Package2, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import PageContainer from '../../../components/layout/PageContainer';
import Button from '../../../components/ui/Button';
import api from '../../../api/axios';
import StatCard from '../../../components/ui/StatCard';

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  totalItems: number;
  totalStock: number;
}

interface RecentRequest {
  id: number;
  itemName: string;
  userName: string;
  jumlah: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

const DashboardAdmin: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalItems: 0,
    totalStock: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const statsRes = await api.get('/admin/approval-stats/statistics');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const recentRes = await api.get('/admin/approval?status=PENDING&per_page=5&page=1');
      if (recentRes.data.success) {
        const mapped = recentRes.data.data.map((item: any) => ({
          id: item.id,
          itemName: item.item?.name || 'N/A',
          userName: item.user?.name || 'N/A',
          jumlah: item.jumlah,
          status: item.status,
          created_at: item.created_at,
        }));
        setRecentRequests(mapped);
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
        return 'bg-amber-100 text-amber-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-2">Selamat datang! Pantau statistik sistem secara real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard 
          Icon=""
          title="Menunggu Persetujuan" 
          value={stats.pending} 
          color="text-amber-400"
          bgColor="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard 
          Icon=""
          title="Telah Disetujui" 
          value={stats.approved} 
          color="text-green-400"
          bgColor="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard 
          Icon=""
          title="Ditolak" 
          value={stats.rejected} 
          color="text-red-400"
          bgColor="bg-gradient-to-br from-red-500 to-pink-600"
        />
        <StatCard 
          Icon=""
          title="Total Barang" 
          value={stats.totalItems} 
          color="text-blue-400"
          bgColor="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard 
          Icon=""
          title="Total Stok" 
          value={stats.totalStock} 
          color="text-purple-400"
          bgColor="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
      </div>

      {/* Recent Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Permintaan Terbaru</h2>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-full">
                <AlertCircle className="text-white" size={24} />
              </div>
            </div>

            {recentRequests.length > 0 ? (
              <div className="space-y-4">
                {recentRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-transparent rounded-xl border border-gray-200/50 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all duration-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-gray-900">{req.itemName}</p>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                          {req.jumlah}x
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Pemohon: {req.userName}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)}
                      <span>{req.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
                <p className="font-medium">Semua permintaan sudah diproses!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Akses Cepat</h3>
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full text-center flex items-center justify-center gap-2"
                onClick={() => window.location.href = '/admin/approval'}
              >
                <CheckCircle2 size={18} />
                Lihat Persetujuan
              </Button>
              <Button 
                variant="primary" 
                className="w-full text-center flex items-center justify-center gap-2"
                onClick={() => window.location.href = '/admin/barang'}
              >
                <Package2 size={18} />
                Kelola Barang
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardAdmin;