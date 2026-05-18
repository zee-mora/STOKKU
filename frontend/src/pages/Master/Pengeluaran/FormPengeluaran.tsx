import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../../../components/ui/Button';
import InputForm from '../../../components/ui/InputForm';
import SelectField from '../../../components/ui/SelectField';
import { showToast } from '../../../utils/alert';
import api from '../../../api/axios';

type ExpenseData = {
  id?: number;
  category_id?: number;
  description?: string;
  amount?: number;
  expense_date?: string;
};

type CategoryOption = {
  id: number;
  name: string;
};

type Option = {
  value: string;
  label: string;
};

interface FormPengeluaranProps {
  initialData?: ExpenseData | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FormPengeluaran: React.FC<FormPengeluaranProps> = ({
  initialData = null,
  onClose,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(initialData?.category_id?.toString() ?? null);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? '');
  const [expenseDate, setExpenseDate] = useState(initialData?.expense_date ?? '');
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const isEditMode = Boolean(initialData?.id);
  const currentDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await api.get('/expenses/categories');
      setCategories(response.data?.data ?? []);
    } catch (error) {
      console.error(error);
      showToast('error', 'Gagal', 'Tidak dapat memuat kategori pengeluaran.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const categoryOptions: Option[] = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  const findOption = (options: Option[], value: string | null): Option | null => {
    return options.find((opt) => opt.value === value) ?? null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        category_id: Number(categoryId),
        description: description.trim(),
        amount: Number(amount),
        expense_date: expenseDate,
      };

      if (isEditMode && initialData?.id) {
        await api.put(`/expenses/${initialData.id}`, payload);
        showToast('success', 'Berhasil', 'Pengeluaran berhasil diperbarui.');
      } else {
        await api.post('/expenses', payload);
        showToast('success', 'Berhasil', 'Pengeluaran berhasil ditambahkan.');
      }

      onSuccess();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.data?.message || 'Tidak dapat menyimpan data pengeluaran.';
      showToast('error', 'Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {isEditMode ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SelectField
            label="Kategori"
            required
            options={categoryOptions}
            value={findOption(categoryOptions, categoryId)}
            onChange={(option) => setCategoryId(option?.value ?? null)}
            isLoading={categoriesLoading}
          />

          <InputForm
            type="date"
            label="Tanggal Pengeluaran"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            max={currentDate}
          />

          <InputForm
            type="text"
            label="Keterangan"
            required
            placeholder="Contoh: Perbaikan jalan Blok A"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <InputForm
            type="number"
            label="Nominal (Rp)"
            required
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="1000"
          />

          <div className="flex gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormPengeluaran;
