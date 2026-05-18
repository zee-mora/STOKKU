import React, { useMemo, useState } from 'react';
import InputForm from '../../../components/ui/InputForm';
import SelectField from '../../../components/ui/SelectField';
import Button from '../../../components/ui/Button';
import { triggerDatatableRefetch } from '../../../components/DataTable/DatatableRegistry';
import useFormPayment from './useForm';

type Option = { value: string; label: string };

type FormPaymentData = {
  id?: number;
  trhouse_resident_id: number | null;
  resident_name?: string | null;
  house_number?: string | null;
  type: string | null;
  month: number;
  year: number;
  period?: number;
  amount: number | null;
  status: 'Lunas' | 'Belum Bayar';
};

interface FormPaymentProps {
  initialData?: FormPaymentData | null;
  onClose?: () => void;
}

const periodOptions: Option[] = [
  { value: '1', label: '1 bulan' },
  { value: '12', label: '12 bulan' },
];

const FormPayment: React.FC<FormPaymentProps> = ({ initialData, onClose }) => {
  const {
    formData,
    occupancies,
    typeOptions,
    statusOptions,
    handleChange,
    handleSubmit: hookHandleSubmit,
    loading,
    isEditMode,
    validationErrors,
  } = useFormPayment({ initialData });

  const [periods, setPeriods] = useState<Option | null>(() => {
    return periodOptions.find((p) => p.value === String(formData.period ?? 1)) ?? periodOptions[0];
  });

  const chosenType = formData.type;
  const isAnnualEnabled = chosenType === 'Kebersihan';
  const effectivePeriods = isAnnualEnabled ? (periods?.value === '12' ? 12 : 1) : 1;
  const effectiveStatus = effectivePeriods > 1 ? 'Lunas' : formData.status;
  const totalAmount = (formData.amount ?? 0) * effectivePeriods;

  const occupancyOption = occupancies.find((opt) => Number(opt.value) === formData.trhouse_resident_id) || null;

  const fallbackOccupancyOption = formData.trhouse_resident_id
    ? {
      value: String(formData.trhouse_resident_id),
      label: `${initialData?.resident_name} - ${initialData?.house_number}`
    }
    : null;

  const selectedOccupancyOption = occupancyOption ?? fallbackOccupancyOption;

  const typeOption = useMemo(() => {
    return typeOptions.find((opt) => opt.value === formData.type) || null;
  }, [formData.type, typeOptions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await hookHandleSubmit(e);

    if (!success) return;

    triggerDatatableRefetch('table-payments');
    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SelectField
        label="Pilih Rumah / Penghuni Aktif"
        required
        options={occupancies}
        value={selectedOccupancyOption}
        onChange={(val) => handleChange('trhouse_resident_id', val ? Number(val.value) : null)}
        placeholder="Cari rumah dan penghuni"
      />
      {validationErrors.trhouse_resident_id && (
        <p className="mt-1 text-sm text-red-500">{validationErrors.trhouse_resident_id}</p>
      )}

      <SelectField
        label="Tipe Iuran"
        options={typeOptions}
        value={typeOption}
        required
        onChange={(v) => {
          handleChange('type', v?.value || null);
          if (v?.value === 'Satpam') {
            const nextPeriod = periodOptions.find((p) => p.value === '1') ?? periodOptions[0];
            setPeriods(nextPeriod);
            handleChange('amount', 15000);
            handleChange('period', Number(nextPeriod.value));
          } else if (v?.value === 'Kebersihan') {
            const nextPeriod = periodOptions.find((p) => p.value === '1') ?? periodOptions[0];
            setPeriods(nextPeriod);
            handleChange('amount', 100000);
            handleChange('period', Number(nextPeriod.value));
          } else {
            setPeriods(null);
            handleChange('period', 1);
          }
        }}
        isClearable={false}
      />
      {validationErrors.type && (
        <p className="mt-1 text-sm text-red-500">{validationErrors.type}</p>
      )}

      <InputForm
        label="Nominal"
        disabled={true}
        type="number"
        value={formData.amount ? String(formData.amount) : ''}
        onChange={(e) => handleChange('amount', e.target.value ? Number(e.target.value) : null)}
      />
      {validationErrors.amount && (
        <p className="mt-1 text-sm text-red-500">{validationErrors.amount}</p>
      )}

      <SelectField
        label="Periode Pembayaran"
        options={periodOptions}
        value={periods}
        required
        onChange={(v) => {
          const nextPeriod = v ?? periodOptions[0];
          setPeriods(nextPeriod);
          handleChange('period', Number(nextPeriod.value));
        }}
        isClearable={false}
        isDisabled={!isAnnualEnabled}
        helperText={
          chosenType === 'Satpam'
            ? 'Iuran satpam dibayar bulanan.'
            : 'Pilih 12 bulan untuk pembayaran kebersihan 1 tahun.'
        }
      />
      {validationErrors.period && (
        <p className="mt-1 text-sm text-red-500">{validationErrors.period}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InputForm
          label="Bulan (1-12)"
          type="number"
          value={String(formData.month)}
          onChange={(e) => handleChange('month', Number(e.target.value))}
          required
        />
        {validationErrors.month && (
          <p className="mt-1 text-sm text-red-500 col-span-2">{validationErrors.month}</p>
        )}
        <InputForm
          label="Tahun"
          required
          type="number"
          value={String(formData.year)}
          onChange={(e) => handleChange('year', Number(e.target.value))}
        />
        {validationErrors.year && (
          <p className="mt-1 text-sm text-red-500 col-span-2">{validationErrors.year}</p>
        )}
      </div>

      <SelectField
        label="Status"
        required
        options={statusOptions}
        value={statusOptions.find((opt) => opt.value === effectiveStatus) || null}
        onChange={(v) => handleChange('status', (v?.value ?? 'Belum Bayar') as 'Lunas' | 'Belum Bayar')}
        isClearable={false}
        isDisabled={effectivePeriods > 1}
        helperText={effectivePeriods > 1 ? 'Pembayaran 1 tahun harus lunas.' : undefined}
      />
      {validationErrors.status && (
        <p className="mt-1 text-sm text-red-500">{validationErrors.status}</p>
      )}

      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Total tagihan yang dicatat: <span className="font-semibold">Rp{totalAmount.toLocaleString('id-ID')}</span>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => onClose?.()} disabled={loading}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
        </Button>
      </div>
    </form>
  );
};

export default FormPayment;
