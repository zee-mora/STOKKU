import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 px-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <Lock size={48} className="text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold text-emerald-950">Akses Ditolak</h1>
        <p className="mb-2 text-lg text-emerald-700">401 Unauthorized</p>
        
        <p className="mb-8 max-w-md text-gray-600">
          Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="primary"
            size="md"
            Icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            Kembali
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/')}
          >
            Ke Beranda
          </Button>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Kode error: 401</p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
