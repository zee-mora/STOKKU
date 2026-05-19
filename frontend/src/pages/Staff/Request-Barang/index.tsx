import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, Eye, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../../components/layout/PageContainer";
import DataTable from "../../../components/DataTable/DataTable";
import { type ColumnDef } from "@tanstack/react-table";
import api from "../../../api/axios";
import RequestForm from "./RequestForm";
import Button from "../../../components/ui/Button";
import Breadcrumb from "../../../components/ui/Breadcrumb";

interface RequestHistory {
  id: string | number;
  itemName: string;
  quantity: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
}

interface ApiRequestItem {
  id: number;
  item: { name: string };
  jumlah: number;
  status: string;
  created_at: string;
}

const RequestBarang: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [requests, setRequests] = useState<RequestHistory[]>([]);

  const fetchRequestHistory = useCallback(async () => {
    try {
      const response = await api.get("/request-items/my-requests");
      if (response.data.success) {
        const mappedRequests = response.data.data.map(
          (item: ApiRequestItem) => ({
            id: item.id,
            itemName: item.item?.name || "N/A",
            quantity: item.jumlah,
            status: item.status.toUpperCase(),
            requestedAt: new Date(item.created_at).toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          }),
        );
        setRequests(mappedRequests);
      }
    } catch (error) {
      console.error("Error fetching request history:", error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      void fetchRequestHistory();
    }
  }, [activeTab, fetchRequestHistory]);

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      PENDING: "bg-amber-100 text-amber-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };

    const icons = {
      PENDING: <Clock size={16} />,
      APPROVED: <CheckCircle2 size={16} />,
      REJECTED: <XCircle size={16} />,
    };

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${badgeClasses[status as keyof typeof badgeClasses] || "bg-gray-100 text-gray-800"}`}
      >
        {icons[status as keyof typeof icons]}
        <span>{status}</span>
      </div>
    );
  };

  const columns: ColumnDef<RequestHistory>[] = [
    {
      accessorKey: "itemName",
      header: "Nama Barang",
      cell: (info) => (
        <div className="font-medium text-gray-900">
          {info.getValue() as string}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Jumlah",
      cell: (info) => (
        <div className="text-center">
          <span className="inline-flex items-center justify-center min-w-8 h-8 bg-blue-100 text-blue-700 rounded-lg font-semibold text-sm">
            {info.getValue() as number}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: (info) => getStatusBadge(info.getValue() as string),
    },
    {
      accessorKey: "requestedAt",
      header: "Tanggal Request",
      cell: (info) => (
        <div className="text-sm text-gray-600">{info.getValue() as string}</div>
      ),
    },
    {
      accessorKey: "id",
      header: "Aksi",
      cell: (info) => (
        <div>
          <Button
            Icon={Eye}
            size="sm"
            variant="warning"
            onClick={() => {
              navigate(`/staff/request/${info.getValue() as number}`);
            }}
          >
            Detail
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: 'Staff' }, { label: 'Request Barang' }]} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Request Barang</h1>
        <p className="mt-2 text-gray-600">
          Kelola request barang dan pantau status approval Anda
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("form")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "form"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Form Request
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "history"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Riwayat Request
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === "form" && (
          <RequestForm
            onSuccess={() => {
              setActiveTab("history");
              void fetchRequestHistory();
            }}
          />
        )}

        {activeTab === "history" && (
          <div>
            {requests.length > 0 ? (
              <DataTable
                columns={columns}
                data={requests}
                title="Riwayat Request Barang"
                searchPlaceholder="Cari barang..."
              />
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Clock size={48} className="mx-auto mb-3" />
                </div>
                <p className="text-gray-600">Belum ada request barang</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default RequestBarang;
