import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import InputForm from "../../../components/ui/InputForm";
import SelectField, { type Option } from "../../../components/ui/SelectField";
import Button from "../../../components/ui/Button";
import api from "../../../api/axios";

interface RequestItem {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
}

interface Item {
  id: string;
  name: string;
  stock: number;
}

interface ApiItem {
  id: number;
  name: string;
  stock: number;
}

interface RequestFormProps {
  onSuccess?: () => void;
}

const RequestForm: React.FC<RequestFormProps> = ({ onSuccess }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Option | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [requestedItems, setRequestedItems] = useState<RequestItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setItemsLoading(true);
        const response = await api.get("/request-items/items");
        if (response.data.success) {
          const mappedItems = response.data.data.map((item: ApiItem) => ({
            id: item.id.toString(),
            name: item.name,
            stock: item.stock,
          }));
          setItems(mappedItems);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setMessage({ type: "error", text: "Gagal mengambil data barang" });
      } finally {
        setItemsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Convert items to select options
  const itemOptions: Option[] = items.map((item) => ({
    value: item.id,
    label: `${item.name} (Stok: ${item.stock})`,
  }));

  // Handle add item
  const handleAddItem = useCallback(() => {
    const quantityNum = parseInt(quantity);

    if (!selectedItem) {
      setMessage({ type: "warning", text: "Pilih barang terlebih dahulu" });
      return;
    }

    if (!quantity || quantityNum <= 0) {
      setMessage({ type: "warning", text: "Masukkan jumlah yang valid (> 0)" });
      return;
    }

    const selectedItemData = items.find((item) => item.id === selectedItem.value);
    if (!selectedItemData) {
      setMessage({ type: "error", text: "Barang tidak ditemukan" });
      return;
    }

    if (quantityNum > selectedItemData.stock) {
      setMessage({
        type: "warning",
        text: `Jumlah melebihi stok tersedia (${selectedItemData.stock})`,
      });
      return;
    }

    // Check if item already in list
    const existingIndex = requestedItems.findIndex(
      (item) => item.itemId === selectedItem.value
    );

    if (existingIndex >= 0) {
      setMessage({
        type: "warning",
        text: "Barang sudah ada dalam daftar request",
      });
      return;
    }

    const newItem: RequestItem = {
      id: `temp-${Date.now()}`,
      itemId: selectedItem.value,
      itemName: selectedItemData.name,
      quantity: quantityNum,
    };

    setRequestedItems([...requestedItems, newItem]);
    setSelectedItem(null);
    setQuantity("");
    setMessage({ type: "success", text: "Barang berhasil ditambahkan" });
  }, [selectedItem, quantity, requestedItems, items]);

  // Handle remove item
  const handleRemoveItem = useCallback((id: string) => {
    setRequestedItems((prev) => prev.filter((item) => item.id !== id));
    setMessage({ type: "success", text: "Barang berhasil dihapus" });
  }, []);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requestedItems.length === 0) {
      setMessage({ type: "warning", text: "Tambahkan minimal 1 barang sebelum submit" });
      return;
    }

    try {
      setSubmitting(true);
      const payload = requestedItems.map((item) => ({
        item_id: parseInt(item.itemId),
        jumlah: item.quantity,
      }));

      const response = await api.post("/request-items/bulk", { items: payload });

      if (response.data.success) {
        setMessage({ type: "success", text: "Request barang berhasil dikirim!" });
        setRequestedItems([]);
        setSelectedItem(null);
        setQuantity("");

        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      setMessage({
        type: "error",
        text: "Gagal mengirim request barang. Silakan coba lagi.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Table columns
  const columns: ColumnDef<RequestItem>[] = [
    {
      accessorKey: "itemName",
      header: "Nama Barang",
      cell: (info) => (
        <div className="font-medium text-gray-900">{info.getValue() as string}</div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Jumlah",
      cell: (info) => (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center justify-center min-w-8 min-h-8 bg-emerald-100 text-emerald-700 rounded-lg font-semibold">
            {info.getValue() as number}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Aksi",
      cell: (info) => (
        <div className="flex justify-center">
          <button
            onClick={() => handleRemoveItem(info.row.original.id)}
            className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus barang"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: requestedItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (itemsLoading) {
    return (
              <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-gray-600">Memuat data barang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Message */}
      {message && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : message.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Form Input */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Barang</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SelectField
            label="Nama Barang"
            options={itemOptions}
            value={selectedItem}
            onChange={setSelectedItem}
            placeholder="Cari dan pilih barang..."
            isClearable
            required
          />

          <InputForm
            label="Jumlah"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Masukkan jumlah"
            min="1"
            required
          />

          <div className="flex items-end">
            <Button
              onClick={handleAddItem}
              Icon={Plus}
              className="w-full"
              disabled={submitting || !selectedItem || !quantity}
            >
              Tambah Barang
            </Button>
          </div>
        </div>
      </div>

      {/* Requested Items Table */}
      {requestedItems.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Barang yang Direqust ({requestedItems.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-200">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total Barang: <span className="font-semibold text-gray-900">{requestedItems.length}</span> item
            </div>
            <div className="text-sm text-gray-600">
              Total Kuantitas:{" "}
              <span className="font-semibold text-gray-900">
                {requestedItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setRequestedItems([]);
            setSelectedItem(null);
            setQuantity("");
            setMessage(null);
          }}
          disabled={submitting || requestedItems.length === 0}
        >
          Batal
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={submitting || requestedItems.length === 0}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Mengirim...
            </>
          ) : (
            "Kirim Request"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RequestForm;
