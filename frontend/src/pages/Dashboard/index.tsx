import React, { useEffect, useEffectEvent, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Home, Users, Zap } from "lucide-react";
import PageContainer from "../../components/layout/PageContainer";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { showToast } from "../../utils/alert";
import GenerateChargesModal from "./GenerateChargesModal";

type DashboardStats = {
  statistics: {
    total_houses: number;
    occupied_houses: number;
    empty_houses: number;
    total_residents: number;
    active_residents: number;
  };
  current_month: {
    expected_income: number;
    paid_income: number;
    unpaid_income: number;
    outstanding_total: number;
  };
  yearly: {
    total_income: number;
    total_expenses: number;
    balance: number;
  };
  recent_payments: Array<{ id: string; resident_name: string; house_number: string; type: string; amount: number; status: string; paid_at: string }>;
  recent_expenses: Array<{ id: string; category_name: string; description: string; amount: number; expense_date: string }>;
};

type MonthlyData = {
  month: number;
  income: number;
  expense: number;
  balance: number;
};

type IncomeExpenseData = {
  income_by_type: Record<string, number>;
  expense_by_category: Record<string, number>;
};

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [incomeExpense, setIncomeExpense] = useState<IncomeExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, monthlyRes, incomeExpenseRes] = await Promise.all([
        api.get("/dashboard/statistics"),
        api.get("/dashboard/monthly-overview", { params: { year } }),
        api.get("/dashboard/income-expense", { params: { year } }),
      ]);

      setStats(statsRes.data?.data);
      setMonthlyData(monthlyRes.data?.data || []);
      setIncomeExpense(incomeExpenseRes.data?.data);
    } catch (error) {
      console.error(error);
      showToast("error", "Gagal", "Tidak dapat memuat data dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [year]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data dashboard...</div>
        </div>
      </PageContainer>
    );
  }

  if (!stats) {
    return <PageContainer><div className="text-gray-500">Tidak ada data tersedia.</div></PageContainer>;
  }

  const currencyFormatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  const incomeData = Object.entries(incomeExpense?.income_by_type || {}).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const expenseData = Object.entries(incomeExpense?.expense_by_category || {}).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  const chartData = monthlyData.map((d) => ({
    ...d,
    monthLabel: monthLabels[d.month - 1],
  }));

  return (
    <PageContainer>
      <div className="space-y-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Pengelolaan RT</h1>
              <p className="text-gray-500 mt-1">Pantau keuangan dan penghuni perumahan Anda</p>
            </div>
            <div className="flex gap-3">
              <Button 
                size="md" 
                variant="primary" 
                Icon={Zap}
                onClick={() => setShowGenerateModal(true)}
              >
                Buat Tagihan Bulanan
              </Button>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border px-4 py-2 bg-white"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Rumah</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.statistics.total_houses}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Rumah Dihuni</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.statistics.occupied_houses}</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <Home className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Rumah Kosong</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.statistics.empty_houses}</p>
              </div>
              <div className="rounded-lg bg-orange-100 p-3">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Penghuni</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.statistics.total_residents}</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Penghuni Aktif</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.statistics.active_residents}</p>
              </div>
              <div className="rounded-lg bg-indigo-100 p-3">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg shadow-2xl bg-gradient-to-br from-green-50 to-white p-6 ">
            <p className="text-sm text-gray-600 font-medium">Pemasukan Bulan Ini (Lunas)</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {currencyFormatter.format(stats.current_month.paid_income)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Dari {stats.current_month.expected_income > 0 ? Math.round((stats.current_month.paid_income / stats.current_month.expected_income) * 100) : 0}% target
            </p>
          </div>

          <div className="rounded-lg shadow-2xl bg-gradient-to-br from-orange-50 to-white p-6 ">
            <p className="text-sm text-gray-600 font-medium">Tunggakan Pembayaran</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {currencyFormatter.format(stats.current_month.outstanding_total)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Dari penghuni yang belum bayar
            </p>
          </div>

          <div className={`rounded-lg shadow-2xl p-6  ${stats.yearly.balance >= 0 ? "bg-gradient-to-br from-emerald-50 to-white" : "bg-gradient-to-br from-red-50 to-white"}`}>
            <p className="text-sm text-gray-600 font-medium">Saldo Tahun Ini</p>
            <p className={`text-3xl font-bold mt-2 ${stats.yearly.balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {currencyFormatter.format(stats.yearly.balance)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Pemasukan: {currencyFormatter.format(stats.yearly.total_income)} | Pengeluaran: {currencyFormatter.format(stats.yearly.total_expenses)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Bulanan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <Tooltip formatter={(value) => currencyFormatter.format(value as number)} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Pemasukan" />
                <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tren Saldo Bulanan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <Tooltip formatter={(value) => currencyFormatter.format(value as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  name="Saldo"
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {incomeData.length > 0 && (
            <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pemasukan Berdasarkan Tipe</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${currencyFormatter.format(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incomeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => currencyFormatter.format(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expense by Category */}
          {expenseData.length > 0 && (
            <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran Berdasarkan Kategori</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${currencyFormatter.format(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => currencyFormatter.format(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Payments */}
          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pembayaran Terbaru</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recent_payments.length > 0 ? (
                stats.recent_payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{payment.resident_name}</p>
                      <p className="text-sm text-gray-500">
                        {payment.house_number} • {payment.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {currencyFormatter.format(payment.amount)}
                      </p>
                      <p className={`text-xs font-medium ${payment.status === "Lunas" ? "text-green-600" : "text-orange-600"}`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Tidak ada pembayaran</p>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="rounded-lg border-white bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran Terbaru</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recent_expenses.length > 0 ? (
                stats.recent_expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.category_name} • {new Date(expense.expense_date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {currencyFormatter.format(expense.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Tidak ada pengeluaran</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {showGenerateModal && (
        <GenerateChargesModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={loadDashboardData}
        />
      )}    </PageContainer>
  );
};

export default Dashboard;

