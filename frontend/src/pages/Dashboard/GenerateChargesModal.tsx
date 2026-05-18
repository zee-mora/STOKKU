import React, { useState } from 'react';
import { X, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';
import { showToast } from '../../utils/alert';
import api from '../../api/axios';

interface GenerateChargesModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateChargesModal: React.FC<GenerateChargesModalProps> = ({ onClose, onSuccess }) => {
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const [force, setForce] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/dashboard/generate-charges', {
        month: Number(month),
        year: Number(year),
        force,
      });

      const data = response.data?.data;
      showToast(
        'success',
        'Berhasil',
        `${data?.count || 0} tagihan bulanan berhasil dibuat untuk ${data?.residents_count || 0} penghuni tetap.`
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.message;

      if (statusCode === 409) {
        showToast(
          'warning',
          'Konfirmasi',
          `${errorMessage}. Cek kotak "Buat Ulang" jika ingin membuat ulang.`
        );
      } else {
        showToast('error', 'Gagal', errorMessage || 'Tidak dapat membuat tagihan bulanan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const monthOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: String(currentYear - i),
    label: String(currentYear - i),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold">Buat Tagihan Bulanan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Otomatis membuat tagihan Satpam (100k) + Kebersihan (15k) untuk semua penghuni tetap yang aktif.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bulan <span className="text-red-500">*</span>
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tahun <span className="text-red-500">*</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-orange-200 bg-orange-50">
            <input
              type="checkbox"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Buat Ulang Jika Ada</p>
              <p className="text-xs text-gray-600">Hapus tagihan lama dan buat baru untuk bulan yang sama</p>
            </div>
          </label>

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Membuat...' : 'Buat Tagihan'}
            </Button>
          </div>
        </form>

        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">💡 Tips:</p>
          <p>Jalankan ini di awal bulan untuk membuat tagihan otomatis semua penghuni tetap. Penghuni kontrak perlu ditambah manual.</p>
        </div>
      </div>
    </div>
  );
};

export default GenerateChargesModal;
