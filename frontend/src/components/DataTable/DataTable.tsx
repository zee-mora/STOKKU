import { useCallback, useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, ColumnFiltersState, SortingState } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Search, Loader } from 'lucide-react';
import api from '../../api/axios';
import { datatableRefetchRegistry } from './DatatableRegistry';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data?: T[];
  apiUrl?: string;
  title?: string;
  searchPlaceholder?: string;
  enableServerSide?: boolean;
  datatableKey?: string;
}

export default function DataTable<T>({
  columns,
  data: initialData = [],
  apiUrl,
  title,
  searchPlaceholder = 'Cari...',
  enableServerSide = false,
  datatableKey,
}: DataTableProps<T>) {
  "use no memo";

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalRecords, setTotalRecords] = useState(0);
  const [filteredRecords, setFilteredRecords] = useState(0);

  const fetchServerSideData = useCallback(async () => {
    if (!enableServerSide || !apiUrl) {
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        draw: String(pagination.pageIndex + 1),
        start: String(pagination.pageIndex * pagination.pageSize),
        length: String(pagination.pageSize),
        'search[value]': globalFilter,
      });

      sorting.forEach((sort, index) => {
        const columnIndex = columns.findIndex((column) => {
          const accessorKey = (column as { accessorKey?: string }).accessorKey;
          return typeof accessorKey === 'string' && accessorKey === sort.id;
        });

        if (columnIndex >= 0) {
          params.append(`order[${index}][column]`, String(columnIndex));
          params.append(`order[${index}][dir]`, sort.desc ? 'desc' : 'asc');
        }
      });

      const response = await api.get(`${apiUrl}?${params.toString()}`);
      setData(response.data.data || []);
      setTotalRecords(response.data.recordsTotal || 0);
      setFilteredRecords(response.data.recordsFiltered || 0);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, columns, enableServerSide, globalFilter, pagination.pageIndex, pagination.pageSize, sorting]);

  useEffect(() => {
    void fetchServerSideData();
  }, [fetchServerSideData]);

  useEffect(() => {
    if (!datatableKey || !enableServerSide || !apiUrl) {
      return;
    }

    const triggerRefetch = () => {
      void fetchServerSideData();
    };

    datatableRefetchRegistry.set(datatableKey, triggerRefetch);

    return () => {
      if (datatableRefetchRegistry.get(datatableKey) === triggerRefetch) {
        datatableRefetchRegistry.delete(datatableKey);
      }
    };
  }, [apiUrl, datatableKey, enableServerSide, fetchServerSideData]);
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: !enableServerSide ? getPaginationRowModel() : undefined,
    getSortedRowModel: !enableServerSide ? getSortedRowModel() : undefined,
    getFilteredRowModel: !enableServerSide ? getFilteredRowModel() : undefined,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (value) => {
      setGlobalFilter(value);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    rowCount: enableServerSide ? filteredRecords || totalRecords : undefined,
    manualPagination: enableServerSide,
    manualSorting: enableServerSide,
    manualFiltering: enableServerSide,
  });

  const pageCount = enableServerSide
    ? Math.ceil((filteredRecords || totalRecords) / pagination.pageSize)
    : table.getPageCount();

  return (
    <div className="w-full">
      {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}

      <div className="mb-4 flex items-center gap-2">
        <Search size={18} className="text-gray-400" />
        <input
          placeholder={searchPlaceholder}
          value={globalFilter ?? ''}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            if (enableServerSide) {
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }
          }}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 md:w-64"
        />
        {loading && <Loader size={18} className="animate-spin text-blue-500" />}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer px-6 py-3 text-left font-semibold text-gray-700 hover:bg-gray-200"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronUp size={16} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 text-gray-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  {loading ? 'Loading...' : 'Tidak ada data'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {enableServerSide ? (
            <>
              Menampilkan {data.length > 0 ? pagination.pageIndex * pagination.pageSize + 1 : 0} -{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredRecords || totalRecords)} dari{' '}
              {(filteredRecords || totalRecords)} data
            </>
          ) : (
            <>
              Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {enableServerSide && (
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                setPagination({ pageIndex: 0, pageSize: Number(e.target.value) });
              }}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            >
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
            </select>
          )}
          <button
            onClick={() =>
              enableServerSide
                ? setPagination((current) => ({ ...current, pageIndex: Math.max(0, current.pageIndex - 1) }))
                : table.previousPage()
            }
            disabled={enableServerSide ? pagination.pageIndex === 0 : !table.getCanPreviousPage()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Sebelumnya
          </button>
          <button
            onClick={() =>
              enableServerSide
                ? setPagination((current) => ({
                    ...current,
                    pageIndex: current.pageIndex < pageCount - 1 ? current.pageIndex + 1 : current.pageIndex,
                  }))
                : table.nextPage()
            }
            disabled={enableServerSide ? pagination.pageIndex >= pageCount - 1 : !table.getCanNextPage()}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
