import React, { useState, useEffect } from "react";
import { z } from "zod";
import { showToast } from "../../../utils/alert";
import api from "../../../api/axios";
import { useNavigate, useParams } from "react-router-dom";

type option = {
  value: string;
  label: string;
};

type ResidentPayload = {
  id?: number;
  fullname?: string;
  phone_number?: string;
  resident_status?: string;
  marital_status?: string;
  ktp_path?: string | null;
  photo_url?: string | null;
};

interface UseFromPenghuniProps {
  initialData?: ResidentPayload | null;
}

const ResidentValidationSchema = z.object({
  fullname: z
    .string()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(255, "Nama lengkap maksimal 255 karakter"),
  phone_number: z
    .string()
    .min(10, "Nomor HP minimal 10 digit")
    .max(15, "Nomor HP maksimal 15 digit")
    .regex(/^\d+$/, "Nomor HP hanya boleh berisi angka"),
  resident_status: z
    .enum(["Tetap", "Kontrak"])
    .refine(
      (val) => val !== null,
      "Status penghuni harus dipilih"
    ),
  marital_status: z
    .enum(["Belum Menikah", "Sudah Menikah"])
    .refine(
      (val) => val !== null,
      "Status pernikahan harus dipilih"
    ),
  photo: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Ukuran foto maksimal 5MB"
    )
    .refine(
      (file) => ["image/png", "image/jpeg", "image/jpg"].includes(file.type),
      "Format foto harus PNG, JPG, atau JPEG"
    )
    .optional(),
});

type ResidentValidationType = z.infer<typeof ResidentValidationSchema>;

type ValidationErrors = Partial<Record<keyof ResidentValidationType, string>>;

const useFormPenghuni = ({ initialData }: UseFromPenghuniProps) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const residentId = id ? Number(id) : (initialData?.id ?? null);
  const isEditMode = Boolean(residentId);

  const [photo, setPhoto] = useState<File | null>(null);
  const [fullname, setFullname] = useState(initialData?.fullname ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    initialData?.phone_number ?? "",
  );
  const [residentStatus, setResidentStatus] = useState<string | null>(
    initialData?.resident_status ?? null,
  );
  const [maritalStatus, setMaritalStatus] = useState<string | null>(
    initialData?.marital_status ?? null,
  );
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(
    initialData?.photo_url ?? null,
  );
  const [initialLoading, setInitialLoading] = useState(Boolean(residentId));
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const StatusPernikahanOptions = [
    { value: "Belum Menikah", label: "Belum Menikah" },
    { value: "Sudah Menikah", label: "Sudah Menikah" },
  ];

  const StatusPenghuniOptions = [
    { value: "Tetap", label: "Tetap" },
    { value: "Kontrak", label: "Kontrak" },
  ];

  useEffect(() => {
    if (!residentId || initialData) {
      return;
    }

    const fetchResident = async () => {
      setInitialLoading(true);

      try {
        const response = await api.get(`/residents/${residentId}`);
        const resident = (response.data?.data ?? response.data) as ResidentPayload;

        setFullname(resident.fullname ?? "");
        setPhoneNumber(resident.phone_number ?? "");
        setResidentStatus(resident.resident_status ?? null);
        setMaritalStatus(resident.marital_status ?? null);
        setExistingPhotoUrl(resident.photo_url ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    void fetchResident();
  }, [residentId, initialData]);

  const findOption = (opts: option[], value: string | null) => {
    return opts.find((opt) => opt.value === value) ?? null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setLoading(true);

    try {
      const validationData = {
        fullname,
        phone_number: phoneNumber,
        resident_status: residentStatus,
        marital_status: maritalStatus,
        photo: photo || undefined,
      };

      const validated = ResidentValidationSchema.parse(validationData);

      const formData = new FormData();
      formData.append("fullname", validated.fullname);
      formData.append("phone_number", validated.phone_number);
      if (validated.resident_status) formData.append("resident_status", validated.resident_status);
      if (validated.marital_status) formData.append("marital_status", validated.marital_status);
      if (validated.photo) formData.append("photo", validated.photo);

      if (isEditMode && residentId) {
        await api.post(`/residents/${residentId}?_method=PUT`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast('success', 'Berhasil', 'Data penghuni berhasil diperbarui.');
      } else {
        await api.post("/residents", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast('success', 'Berhasil', 'Data penghuni berhasil ditambahkan.');
      }
      navigate("/master/penghuni");
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: ValidationErrors = {};
        err.issues.forEach((error) => {
          const path = error.path[0] as string;
          errors[path as keyof ValidationErrors] = error.message;
        });
        setValidationErrors(errors);
        showToast('error', 'Validasi Gagal', 'Mohon periksa kembali data yang Anda input.');
      } else {
        console.error(err);
        showToast('error', 'Gagal', 'Terjadi kesalahan saat menyimpan data penghuni.');
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    residentId,
    isEditMode,
    photo,
    setPhoto,
    fullname,
    setFullname,
    phoneNumber,
    setPhoneNumber,
    residentStatus,
    setResidentStatus,
    maritalStatus,
    setMaritalStatus,
    existingPhotoUrl,
    setExistingPhotoUrl,
    initialLoading,
    loading,
    navigate,
    StatusPernikahanOptions,
    StatusPenghuniOptions,
    findOption,
    handleSubmit,
    validationErrors,
  };
};

export default useFormPenghuni;
