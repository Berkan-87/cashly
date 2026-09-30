import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getMonthShort } from '../utils/formatters';
import {
  TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const Dashboard = () => {
  const { invoices, transactions, customers, settings } = useApp();
  const currency = settings.currency;

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const netProfit = totalIncome - totalExpense;

    const paidInvoices = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const pendingInvoices = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const overdueInvoices = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    return { totalIncome, totalExpense, netProfit, paidInvoices, pendingInvoices, overdueInvoices };
  }, [transactions, invoices]);

  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthShort(i),
      income: 0,
      expense: 0,
      net: 0,
    }));

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear) {
        const m = date.getMonth();
        if (t.type === 'income') {
          data[m].income += Number(t.amount || 0);
        } else {
          data[m].expense += Number(t.amount || 0);
        }
        data[m].net = data[m].income - data[m].expense;
      }
    });

    return data;
  }, [transactions]);

  const invoiceChartData = useMemo(() => {
    return [
      { name: 'Paid', value: stats.paidInvoices, color: '#10B981' },
      { name: 'Pending', value: stats.pendingInvoices, color: '#F59E0B' },
      { name: 'Overdue', value: stats.overdueInvoices, color: '#EF4444' },
    ].filter(d => d.value > 0);
  }, [stats]);

  const topCustomer = useMemo(() => {
    if (customers.length === 0 || invoices.length === 0) return null;
    
    const customerTotals = customers.map(c => {
      const total = invoices
        .filter(i => i.customerId === c.id && i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      return { ...c, total };
    });

    return customerTotals.sort((a, b) => b.total - a.total)[0];
  }, [customers, invoices]);

  const monthlyForecast = useMemo(() => {
    const now = new Date();
    const thisMonth = monthlyData[now.getMonth()];
    return thisMonth ? thisMonth.net : 0;
  }, [monthlyData]);

  const budgetStatus = useMemo(() => {
    const now = new Date();
    const thisMonthExpense = transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const budget = settings.monthlyBudget || 0;
    const remaining = budget - thisMonthExpense;
    const percent = budget > 0 ? (thisMonthExpense / budget) * 100 : 0;

    return { expense: thisMonthExpense, budget, remaining, percent };
  }, [transactions, settings]);

  const kpiCards = [
    {
      title: 'Total Income',
      value: formatCurrency(stats.totalIncome, currency),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpense, currency),
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.netProfit, currency),
      icon: DollarSign,
      color: stats.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600',
      bg: stats.netProfit >= 0 ? 'bg-indigo-50' : 'bg-red-50',
    },
    {
      title: 'Paid Invoices',
      value: formatCurrency(stats.paidInvoices, currency),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Pending Invoices',
      value: formatCurrency(stats.pendingInvoices, currency),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Overdue Invoices',
      value: formatCurrency(stats.overdueInvoices, currency),
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your financial status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{kpi.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
                <div className={`${kpi.bg} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Monthly Income / Expenses</h2>
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Invoice Status</h2>
          {invoiceChartData.length > 0 ? (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={invoiceChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    label={(entry) => entry.name}
                  >
                    {invoiceChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-slate-400">
              <p>No invoices yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide">
            🏆 Top Customer
          </h3>
          {topCustomer ? (
            <>
              <p className="text-2xl font-bold text-indigo-700 mt-3">{topCustomer.name}</p>
              <p className="text-lg text-indigo-600 font-semibold mt-1">
                {formatCurrency(topCustomer.total, currency)}
              </p>
            </>
          ) : (
            <p className="text-indigo-500 mt-3">No data yet</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
          <h3 className="text-sm font-semibold text-emerald-900 uppercase tracking-wide">
            💡 This Month Net
          </h3>
          <p className={`text-3xl font-bold mt-3 ${monthlyForecast >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatCurrency(monthlyForecast, currency)}
          </p>
          <p className="text-sm text-emerald-700 mt-1">
            {monthlyForecast >= 0 ? 'In profit' : 'In loss'}
          </p>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-6 border ${
          budgetStatus.percent > 100
            ? 'from-red-50 to-red-100 border-red-200'
            : budgetStatus.percent > 80
            ? 'from-amber-50 to-amber-100 border-amber-200'
            : 'from-slate-50 to-slate-100 border-slate-200'
        }`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            ⚠️ Budget Status
          </h3>
          <p className="text-2xl font-bold text-slate-800 mt-3">
            {formatCurrency(budgetStatus.remaining, currency)}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {budgetStatus.percent.toFixed(0)}% of {formatCurrency(budgetStatus.budget, currency)} used
          </p>
          <div className="w-full h-2 bg-white rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetStatus.percent > 100
                  ? 'bg-red-500'
                  : budgetStatus.percent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetStatus.percent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
        </div>
        {transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {[...transactions]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5)
              .map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      t.type === 'income' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {t.type === 'income'
                        ? <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                        : <ArrowDownRight className="w-5 h-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{t.description || t.category}</p>
                      <p className="text-xs text-slate-500">{formatDate(t.date)} • {t.category}</p>
                    </div>
                  </div>
                  <p className={`font-bold ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <p className="text-4xl mb-2">📭</p>
            <p>No transactions yet</p>
            <p className="text-sm mt-1">Add some from the Cash Flow page</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;