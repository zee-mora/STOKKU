import React from "react";
import PageContainer from "../../../components/layout/PageContainer";
import Button from "../../../components/ui/Button";
import DropzoneField from "../../../components/ui/DropzoneField.tsx";
import InputForm from "../../../components/ui/InputForm";
import SelectField from "../../../components/ui/SelectField";
import useFormPenghuni from "./UseForm";

type ResidentPayload = {
  id?: number;
  fullname?: string;
  phone_number?: string;
  resident_status?: string;
  marital_status?: string;
  ktp_path?: string | null;
  photo_url?: string | null;
};

interface FormPenghuniProps {
  initialData?: ResidentPayload | null;
}

const FormPenghuni: React.FC<FormPenghuniProps> = ({ initialData = null }) => {
  const {
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
    initialLoading,
    loading,
    navigate,
    StatusPernikahanOptions,
    StatusPenghuniOptions,
    findOption,
    handleSubmit,
    validationErrors,
  } = useFormPenghuni({ initialData });

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Penghuni' : 'Tambah Penghuni'}</h1>
        <p className="text-gray-500">
          {isEditMode
            ? 'Perbarui data penghuni yang sudah tersimpan di sistem.'
            : 'Lengkapi data penghuni baru untuk sistem pengelolaan rumah.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl bg-white">
        {/* Form Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <InputForm
              type="text"
              label="Nama Lengkap"
              required
              placeholder="Masukkan nama lengkap"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
            {validationErrors.fullname && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.fullname}</p>
            )}
          </div>

          <div>
            <InputForm
              type="text"
              label="No. HP"
              required
              placeholder="Masukkan nomor HP"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {validationErrors.phone_number && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.phone_number}</p>
            )}
          </div>

          <div>
            <SelectField
              label="Status Pernikahan"
              required
              options={StatusPernikahanOptions}
              value={findOption(StatusPernikahanOptions, maritalStatus)}
              onChange={(val) => setMaritalStatus(val?.value ?? null)}
            />
            {validationErrors.marital_status && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.marital_status}</p>
            )}
          </div>

          <div>
            <SelectField
              label="Status Penghuni"
              required
              options={StatusPenghuniOptions}
              value={findOption(StatusPenghuniOptions, residentStatus)}
              onChange={(val) => setResidentStatus(val?.value ?? null)}
            />
            {validationErrors.resident_status && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.resident_status}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <DropzoneField
              label="Upload Foto KTP"
              height="12rem"
              required
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              value={photo}
              previewUrl={existingPhotoUrl}
              onFileChange={setPhoto}
              helperText="Format gambar yang didukung: PNG, JPG, JPEG. Ukuran maksimal: 5MB."
            />
            {validationErrors.photo && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.photo}</p>
            )}
          </div>
        </div>

        {initialLoading ? (
          <div className="px-1 pt-2 text-sm text-gray-500">Memuat data penghuni...</div>
        ) : null}

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui Data' : 'Simpan Data'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default FormPenghuni;
