import Swal from "sweetalert2";
import type { SweetAlertIcon } from "sweetalert2";

export const showAlert = (icon: SweetAlertIcon, title: string, text: string) => {
    Swal.fire({
        icon,
        title,
        text,
        confirmButtonColor: '#059669',
    });
};

export const showToast = (icon: SweetAlertIcon, title: string, text: string) => {
    const colors = {
        success: { border: 'border-green-500', icon: '#22c55e' },
        error: { border: 'border-red-500', icon: '#ef4444' },
        warning: { border: 'border-amber-500', icon: '#f59e0b' },
        info: { border: 'border-blue-500', icon: '#3b82f6' },
        question: { border: 'border-slate-500', icon: '#64748b' },
    };

    const activeColor = colors[icon as keyof typeof colors] || colors.success;

    Swal.fire({
        icon,
        title,
        text,
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        width: '400px',
        timerProgressBar: true,
        color: '#064e3b',
        background: '#ffffff',
        iconColor: activeColor.icon,
        customClass: {
            popup: `rounded-2xl border-l-4 shadow-2xl ${activeColor.border}`,
            title: 'font-bold text-emerald-900',
            htmlContainer: 'text-emerald-700/80 text-sm'
        },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
    });
}

export const showConfirmDialog = (title: string, text: string, confirmButtonText: string, cancelButtonText: string) => {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#ef4444',
        confirmButtonText,
        cancelButtonText,
    });
};

export const showPrompt = (title: string, inputLabel: string, inputPlaceholder: string) => {
    return Swal.fire({
        title,
        input: 'text',
        inputLabel,
        inputPlaceholder,
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#ef4444',
    });
};

export const showCustomDialog = (htmlContent: string, confirmButtonText: string, cancelButtonText: string) => {
    return Swal.fire({
        html: htmlContent,
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#ef4444',
        confirmButtonText,
        cancelButtonText,
    });
};

export const showLoading = (title: string) => {
    Swal.fire({
        title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};