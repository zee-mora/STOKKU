import React, { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Breadcrumb from '../../components/ui/Breadcrumb';
import api from '../../api/axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const monthLabels = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const FinanceReports: React.FC = () => {
  const [data, setData] = useState<{month:number,income:number,expense:number}[]>([]);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get('/reports/finance/summary', { params: { year } });
        setData(res.data?.data ?? []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [year]);

  const incomeData = data.map(d => d.income);
  const expenseData = data.map(d => d.expense);

  const barDataset = {
    labels: monthLabels,
    datasets: [
      { label: 'Pemasukan', data: incomeData, backgroundColor: 'rgba(16,185,129,0.6)' },
      { label: 'Pengeluaran', data: expenseData, backgroundColor: 'rgba(249,115,22,0.6)' },
    ],
  };

  const lineDataset = {
    labels: monthLabels,
    datasets: [
      { label: 'Saldo (Pemasukan - Pengeluaran)', data: incomeData.map((v,i)=> v - (expenseData[i] ?? 0)), borderColor: 'rgba(59,130,246,0.8)', backgroundColor: 'rgba(59,130,246,0.3)' }
    ]
  };

  return (
    <PageContainer>
      <Breadcrumb items={[{label:'Reports'}, {label:'Keuangan'}]} />

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan Keuangan - {year}</h1>
        <div>
          <select value={year} onChange={(e)=>setYear(Number(e.target.value))} className="rounded-lg border px-3 py-2">
            {Array.from({length:5}).map((_,i)=>{const y=new Date().getFullYear()-i; return <option key={y} value={y}>{y}</option>})}
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Pemasukan vs Pengeluaran</h2>
          <Bar data={barDataset} />
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-2">Saldo Bulanan</h2>
          <Line data={lineDataset} />
        </div>
      </div>
    </PageContainer>
  );
};

export default FinanceReports;
