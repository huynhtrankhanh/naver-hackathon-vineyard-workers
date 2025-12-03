import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { transactionApi } from '../../services/api';
import { useLocalization } from '../../services/LocaleContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
    id: string;
    title: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
}

const SpendingTrends: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
    const { l10n } = useLocalization();

    useEffect(() => {
        const fetchTransactions = async () => {
            const data = await transactionApi.getAll();
            setTransactions(data);
        };
        fetchTransactions();
    }, []);

    const processData = () => {
        const aggregated: Record<string, Record<string, number>> = {};
        const categories = new Set<string>();

        transactions.forEach(t => {
            if (t.type !== 'expense') return; // Only track spending

            const date = new Date(t.date);
            let key = '';
            if (viewMode === 'day') {
                key = date.toLocaleDateString('vi-VN'); // DD/MM/YYYY
            } else {
                key = `${date.getMonth() + 1}/${date.getFullYear()}`; // MM/YYYY
            }

            if (!aggregated[key]) aggregated[key] = {};
            if (!aggregated[key][t.category]) aggregated[key][t.category] = 0;
            aggregated[key][t.category] += Number(t.amount);
            categories.add(t.category);
        });

        // Sort keys (dates)
        const labels = Object.keys(aggregated).sort((a, b) => {
             const partsA = a.split('/').map(Number);
             const partsB = b.split('/').map(Number);
             // handle both DD/MM/YYYY and MM/YYYY
             if (partsA.length === 3 && partsB.length === 3) {
                 return new Date(partsA[2], partsA[1]-1, partsA[0]).getTime() - new Date(partsB[2], partsB[1]-1, partsB[0]).getTime();
             } else {
                 return new Date(partsA[1], partsA[0]-1).getTime() - new Date(partsB[1], partsB[0]-1).getTime();
             }
        });

        const datasets = Array.from(categories).map((cat, index) => {
            // Generate random color or use a palette
            const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
            const color = colors[index % colors.length];

            return {
                label: cat,
                data: labels.map(label => aggregated[label][cat] || 0),
                backgroundColor: color,
            };
        });

        return {
            labels,
            datasets,
        };
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            title: {
                display: false,
            },
        },
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
                beginAtZero: true,
            },
        },
    };

    const data = processData();

    return (
        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 mt-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">{l10n.getString('spending-trends')}</h3>
                <div className="bg-slate-100 p-1 rounded-lg flex text-sm">
                    <button
                        className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'day' ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
                        onClick={() => setViewMode('day')}
                    >
                        {l10n.getString('daily')}
                    </button>
                    <button
                        className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'month' ? 'bg-white shadow-sm font-medium' : 'text-slate-500'}`}
                        onClick={() => setViewMode('month')}
                    >
                        {l10n.getString('monthly')}
                    </button>
                </div>
            </div>
            {transactions.length > 0 ? (
                <Bar options={options} data={data} />
            ) : (
                <div className="text-center py-8 text-slate-500">{l10n.getString('no-spending-data')}</div>
            )}
        </div>
    );
};

export default SpendingTrends;
