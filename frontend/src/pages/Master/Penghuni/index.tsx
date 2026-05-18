import { useMemo } from "react";
import PageContainer from "../../../components/layout/PageContainer";
import DataTable from "../../../components/DataTable/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Button from "../../../components/ui/Button";
import Breadcrumb from "../../../components/ui/Breadcrumb";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showConfirmDialog, showToast } from "../../../utils/alert";
import { triggerDatatableRefetch } from "../../../components/DataTable/DatatableRegistry";
import api from "../../../api/axios";

type Resident = {
  id: number;
  fullname: string;
  email: string;
  phone: string;
  house_number: string;
  status: "aktif" | "nonaktif";
};

const MasterPenghuni = () => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<Resident>[]>(
    () => [
      {
        accessorKey: "index",
        header: "NO",
      },
      {
        accessorKey: "fullname",
        header: "Nama Penghuni",
      },
      {
        accessorKey: "resident_status",
        header: "Status Penghuni",
      },
      {
        accessorKey: "phone_number",
        header: "No. Telepon",
      },
      {
        accessorKey: "marital_status",
        header: "Status Perkawinan",
      },
      {
        accessorKey: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button size="sm" variant="secondary" onClick={() => handleEditPenghuni(row.original.id)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDeletePenghuni(row.original.id)}>
              Hapus
            </Button>
          </div>
        ),
      }
    ],
    [],
  );
  function handleEditPenghuni(id: number) {
    navigate(`/master/penghuni/edit/${id}`);
  }

  function handleAddPenghuni()
  {
    navigate("/master/penghuni/add");
  }

  function handleDeletePenghuni(id: number) {
    showConfirmDialog("Konfirmasi Hapus", "Apakah Anda yakin ingin menghapus penghuni ini?", "Ya, Hapus", "Batal")
      .then((result) => {
        if (result.isConfirmed) {
          api.delete(`/residents/${id}`)
            .then(() => {
              showToast("success", "Penghuni berhasil dihapus.", "");
              triggerDatatableRefetch("table-penghuni");
            })
            .catch(() => {
              showToast("error", "Gagal menghapus penghuni. Silakan coba lagi.", "");
            });
        } else {
          showToast("error", "Penghapusan dibatalkan.", "");
        }
      });
  }

  return (
    <>
      <PageContainer>
        <Breadcrumb items={[{ label: "Master" }, { label: "Penghuni" }]} />

        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Daftar Penghuni</h1>
          <div className="">
            <Button size="md" variant="primary" Icon={Plus} onClick={handleAddPenghuni}>
              Tambah
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          apiUrl="residents/datatables"
          enableServerSide={true}
          searchPlaceholder="Cari data dari backend..."
          datatableKey="table-penghuni"
        />
      </PageContainer>
    </>
  );
};

export default MasterPenghuni;
