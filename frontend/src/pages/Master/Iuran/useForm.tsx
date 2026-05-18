import React, { useState, useEffect } from "react";
import { showToast } from "../../../utils/alert";
import api from "../../../api/axios";
import { useParams } from "react-router-dom";
import { z } from "zod";

type Option = { value: string; label: string };

const typeOptions: Option[] = [
    { value: 'Satpam', label: 'Satpam' },
    { value: 'Kebersihan', label: 'Kebersihan' },
];

const periodOptions: Option[] = [
    { value: '1', label: '1 bulan' },
    { value: '12', label: '12 bulan' },
];

const statusOptions: Option[] = [
    { value: 'Lunas', label: 'Lunas' },
    { value: 'Belum Bayar', label: 'Belum Bayar' },
];

type OccupancyOption = {
    id: number;
    label: string;
    house_number?: string | null;
    resident_name?: string | null;
};

type FormPaymentData = {
    id?: number;
    trhouse_resident_id: number | null;
    type: string | null;
    month: number;
    year: number;
    period?: number;
    amount: number | null;
    status: 'Lunas' | 'Belum Bayar';
};

interface UseFormPaymentProps {
    initialData?: FormPaymentData | null;
}

const PaymentValidationSchema = z.object({
    trhouse_resident_id: z.coerce.number().refine(val => val > 0, {
        message: "Penghuni harus dipilih",
    }),

    type: z.string().nullable().refine(val => val !== null, {
        message: "Tipe pembayaran harus dipilih",
    }),

    month: z.coerce.number()
        .min(1, { message: "Bulan harus antara 1 dan 12" })
        .max(12, { message: "Bulan harus antara 1 dan 12" }),

    year: z.coerce.number()
        .min(2000, { message: "Tahun minimal 2000" }),

    period: z.coerce.number()
        .min(1, { message: "Periode minimal 1 bulan" }),

    amount: z.coerce.number()
        .min(0, { message: "Nominal harus >= 0" }),

    status: z.enum(['Lunas', 'Belum Bayar']),
});

type PaymentValidationType = z.infer<typeof PaymentValidationSchema>;

type ValidationErrors = Partial<Record<keyof PaymentValidationType, string>>;


const useFormPayment = ({ initialData }: UseFormPaymentProps) => {
    const { id } = useParams();
    const paymentId = id ? Number(id) : null;
    const activePaymentId = paymentId ?? initialData?.id ?? null;
    const isEditMode = Boolean(activePaymentId);
    const [occupancies, setOccupancies] = useState<Option[]>([]);
    const [formData, setFormData] = useState<FormPaymentData>({
        id: initialData?.id,
        trhouse_resident_id: initialData?.trhouse_resident_id ?? null,
        type: initialData?.type ?? null,
        month: initialData?.month ?? new Date().getMonth() + 1,
        year: initialData?.year ?? new Date().getFullYear(),
        period: initialData?.period ?? 1,
        amount: initialData?.amount ?? null,
        status: initialData?.status ?? 'Lunas',
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        const fetchOccupancies = async () => {
            setInitialLoading(true);
            try {
                const res = await api.get('/payments/options');
                const data = (res.data?.data ?? []) as OccupancyOption[];
                setOccupancies(
                    data.map((item) => ({
                        value: String(item.id),
                        label: `${item.resident_name} - ${item.house_number}`,
                    })),
                );
            } catch (e) {
                console.error(e);
            } finally {
                setInitialLoading(false);
            }
        };

        void fetchOccupancies();
    }, []);

    const handleChange = (field: keyof FormPaymentData, value: string | number | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});
        setLoading(true);

        try {
            const validatedData = {
                ...formData,
            };

            PaymentValidationSchema.parse(validatedData);

            if (isEditMode && activePaymentId) {
                await api.put(`/payments/${activePaymentId}`, formData);
            } else {
                await api.post('/payments', formData);
            }

            showToast('success', 'Berhasil menyimpan data payment', '');
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errors: ValidationErrors = {};
                err.issues.forEach((error) => {
                    const path = error.path[0] as keyof ValidationErrors;
                    errors[path] = error.message;
                });
                setValidationErrors(errors);
                return false;
            }

            showToast('error', 'Gagal', 'Terjadi kesalahan');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        occupancies,
        typeOptions,
        periodOptions,
        statusOptions,
        validationErrors,
        handleChange,
        handleSubmit,
        loading,
        initialLoading,
        isEditMode,
    };
};

export default useFormPayment;