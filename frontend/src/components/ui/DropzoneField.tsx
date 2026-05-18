import React, { useEffect, useMemo } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { ImagePlus, Upload, X } from "lucide-react";

interface DropzoneFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  previewUrl?: string | null;
  accept?: Accept;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  onFileChange?: (file: File | null) => void;
  value?: File | null;
  height?: string;
}

const defaultAccept: Accept = {
  "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const resolvePreviewUrl = (url: string | null) => {
  if (!url) {
    return null;
  }

  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  if (!baseUrl) {
    return normalizedPath;
  }

  return `${baseUrl}${normalizedPath}`;
};

/**
 * Komponen DropzoneField untuk mengunggah foto dengan fitur preview dan validasi.
 *
 * @param label - Label untuk field upload. Default adalah "Upload Foto".
 * @param required - Menandakan apakah field ini wajib diisi. Default adalah false.
 * @param helperText - Teks bantuan yang ditampilkan di bawah field. Default adalah "PNG, JPG, JPEG, WEBP. Maksimal 5 MB."
 * @param error - Pesan error yang ditampilkan jika ada kesalahan validasi.
 * @param previewUrl - URL untuk menampilkan preview gambar yang sudah ada (misalnya saat edit).
 * @param accept - Tipe file yang diterima. Default adalah gambar dengan ekstensi PNG, JPG, JPEG, WEBP, GIF.
 * @param maxFiles - Jumlah maksimal file yang dapat diunggah. Default adalah 1.
 * @param maxSize - Ukuran maksimal file dalam byte. Default adalah 5 MB.
 * @param disabled - Menandakan apakah field ini dalam keadaan non-aktif. Default adalah false.
 * @param onFileChange - Callback yang dipanggil saat file berubah, menerima file yang dipilih atau null jika tidak ada.
 * @param value - File yang saat ini dipilih. Default adalah null.
 * @param height - CSS height value for the dropzone area (e.g., "200px", "10rem"). Default is "1rem". 
 * @returns 
 */
const DropzoneField: React.FC<DropzoneFieldProps> = ({
  label = "Upload Foto",
  required = false,
  helperText = "PNG, JPG, JPEG, WEBP. Maksimal 5 MB.",
  error,
  previewUrl: externalPreviewUrl = null,
  accept = defaultAccept,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  onFileChange,
  value = null,
  height = "10rem",
}) => {
  const selectedFile = value;

  const filePreviewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const previewUrl = filePreviewUrl ?? resolvePreviewUrl(externalPreviewUrl);

  const onDrop = (acceptedFiles: File[]) => {
    onFileChange?.(acceptedFiles[0] ?? null);
  };

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
    multiple: maxFiles > 1,
  });

  const rejectionMessage = useMemo(() => {
    const firstRejection = fileRejections[0];
    if (!firstRejection) {
      return null;
    }

    return firstRejection.errors[0]?.message ?? "File tidak valid.";
  }, [fileRejections]);

  const feedbackMessage = error ?? rejectionMessage ?? helperText;

  return (
    <div className="space-y-2">
      <label className={`text-sm font-semibold ${error ? "text-red-600" : "text-gray-700"}`}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        {...getRootProps()}
        className={`flex justify-center align-middle group cursor-pointer rounded-2xl border border-dashed bg-white h-[${height}] p-5 transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
            : error
              ? "border-red-300 hover:border-red-400 hover:bg-red-50/40"
              : isDragActive
                ? "border-emerald-500 bg-emerald-50/60 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
                : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/40"
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex justify-center flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            {previewUrl ? <img src={previewUrl} alt="Preview foto" className="h-full w-full rounded-2xl object-cover" /> : <ImagePlus className="h-7 w-7" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
              <span className="inline-flex items-center gap-2 text-emerald-700">
                <Upload className="h-4 w-4" />
                {isDragActive ? "Lepaskan foto di sini" : "Klik atau seret foto ke area ini"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {selectedFile ? selectedFile.name : "Unggah foto profil atau foto identitas penghuni."}
            </p>
          </div>

          {selectedFile && !disabled && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onFileChange?.(null);
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              aria-label="Hapus foto"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {feedbackMessage ? <p className={`text-xs ${error ? "font-medium text-red-500" : "text-gray-500"}`}>{feedbackMessage}</p> : null}
    </div>
  );
};

export default DropzoneField;