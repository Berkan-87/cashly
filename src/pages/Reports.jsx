import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getMonthShort, getMonthLong } from '../utils/formatters';
import {
  BarChart3, Download, TrendingUp, TrendingDown, DollarSign,
  Calendar, PieChart as PieChartIcon, FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { transactions, invoices, customers, settings } = useApp();
  const currency = settings.currency;

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Mevcut yıllar
  const availableYears = useMemo(() => {
    const years = new Set();
    transactions.forEach(t => years.add(new Date(t.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  // Yıllık özet
  const yearlyStats = useMemo(() => {
    const yearTransactions = transactions.filter(
      t => new Date(t.date).getFullYear() === selectedYear
    );

    const income = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expense = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const net = income - expense;
    const margin = income > 0 ? (net / income) * 100 : 0;

    const yearInvoices = invoices.filter(
      i => new Date(i.issueDate).getFullYear() === selectedYear
    );

    return {
      income,
      expense,
      net,
      margin,
      transactionCount: yearTransactions.length,
      invoiceCount: yearInvoices.length,
    };
  }, [transactions, invoices, selectedYear]);

  // Aylık veri
  const monthlyData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      month: getMonthShort(i),
      income: 0,
      expense: 0,
      net: 0,
    }));

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === selectedYear) {
        const m = d.getMonth();
        if (t.type === 'income') {
          data[m].income += Number(t.amount || 0);
        } else {
          data[m].expense += Number(t.amount || 0);
        }
        data[m].net = data[m].income - data[m].expense;
      }
    });

    return data;
  }, [transactions, selectedYear]);

  // Kategori bazlı giderler
  const categoryData = useMemo(() => {
    const categories = {};
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getFullYear() === selectedYear)
      .forEach(t => {
        const cat = t.category || 'Other';
        categories[cat] = (categories[cat] || 0) + Number(t.amount || 0);
      });

    const colors = [
      '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#64748B',
    ];

    return Object.entries(categories)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedYear]);

  // Kategori bazlı gelirler
  const incomeCategoryData = useMemo(() => {
    const categories = {};
    transactions
      .filter(t => t.type === 'income' && new Date(t.date).getFullYear() === selectedYear)
      .forEach(t => {
        const cat = t.category || 'Other';
        categories[cat] = (categories[cat] || 0) + Number(t.amount || 0);
      });

    const colors = ['#10B981', '#6366F1', '#F59E0B', '#06B6D4', '#8B5CF6'];

    return Object.entries(categories)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedYear]);

  // Aylık en iyi/en kötü
  const bestMonth = useMemo(() => {
    return [...monthlyData].sort((a, b) => b.net - a.net)[0];
  }, [monthlyData]);

  const worstMonth = useMemo(() => {
    return [...monthlyData].sort((a, b) => a.net - b.net)[0];
  }, [monthlyData]);

  // Excel export - Çok sayfalı
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sayfa 1: Yıllık Özet
    const summaryData = [
      ['Cashly - Financial Report'],
      [`Year: ${selectedYear}`],
      [`Business: ${settings.businessName || 'My Business'}`],
      [`Currency: ${currency}`],
      [],
      ['Metric', 'Value'],
      ['Total Income', yearlyStats.income],
      ['Total Expenses', yearlyStats.expense],
      ['Net Profit', yearlyStats.net],
      ['Profit Margin', `${yearlyStats.margin.toFixed(1)}%`],
      ['Total Transactions', yearlyStats.transactionCount],
      ['Total Invoices', yearlyStats.invoiceCount],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Sayfa 2: Aylık Veriler
    const monthlyRows = [
      ['Month', 'Income', 'Expenses', 'Net'],
      ...monthlyData.map(m => [m.month, m.income, m.expense, m.net]),
      ['TOTAL', yearlyStats.income, yearlyStats.expense, yearlyStats.net],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(monthlyRows);
    ws2['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Monthly');

    // Sayfa 3: Kategori Bazlı Giderler
    const categoryRows = [
      ['Expense Category', 'Amount'],
      ...categoryData.map(c => [c.name, c.value]),
      ['TOTAL', yearlyStats.expense],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(categoryRows);
    ws3['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Expenses');

    // Sayfa 4: Kategori Bazlı Gelirler
    const incomeRows = [
      ['Income Category', 'Amount'],
      ...incomeCategoryData.map(c => [c.name, c.value]),
      ['TOTAL', yearlyStats.income],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(incomeRows);
    ws4['!cols'] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Income');

    // Sayfa 5: Müşteri Bazlı
    const customerRows = [
      ['Customer', 'Invoices', 'Paid', 'Pending', 'Total'],
    ];
    customers.forEach(c => {
      const cInvoices = invoices.filter(i => i.customerId === c.id);
      const paid = cInvoices.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const pending = cInvoices.filter(i => i.status !== 'paid')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      customerRows.push([c.name, cInvoices.length, paid, pending, paid + pending]);
    });
    const ws5 = XLSX.utils.aoa_to_sheet(customerRows);
    ws5['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Customers');

    // Dosyayı indir
    XLSX.writeFile(wb, `Cashly-Report-${selectedYear}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 fade-in">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-500 mt-1">Annual financial summary and analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-lg shadow-emerald-600/30"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Yıllık Özet Kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(yearlyStats.income, currency)}
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(yearlyStats.expense, currency)}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Net Profit</p>
              <p className={`text-2xl font-bold mt-1 ${
                yearlyStats.net >= 0 ? 'text-indigo-600' : 'text-red-600'
              }`}>
                {formatCurrency(yearlyStats.net, currency)}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${
              yearlyStats.net >= 0 ? 'bg-indigo-50' : 'bg-red-50'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                yearlyStats.net >= 0 ? 'text-indigo-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Profit Margin</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                {yearlyStats.margin.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Aylık Trend */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          Monthly Trend — {selectedYear}
        </h2>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
              <Tooltip
                formatter={(value) => formatCurrency(value, currency)}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10B981"
                strokeWidth={2}
                name="Income"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke="#EF4444"
                strokeWidth={2}
                name="Expenses"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#6366F1"
                strokeWidth={2}
                name="Net"
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aylık Gelir/Gider Bar Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Monthly Income vs Expenses</h2>
        <div style={{ width: '100%', height: 320 }}>
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

      {/* Kategori bazlı gelir/gider */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Giderler */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-red-500" />
            Expense Breakdown
          </h2>
          {categoryData.length > 0 ? (
            <>
              <div className="w-full h-56 sm:h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {categoryData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {categoryData.map((cat, idx) => {
                  const percent = yearlyStats.expense > 0 
                    ? (cat.value / yearlyStats.expense) * 100 
                    : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{percent.toFixed(1)}%</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(cat.value, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-400">
              <p>No expense data for {selectedYear}</p>
            </div>
          )}
        </div>

        {/* Gelirler */}
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-emerald-500" />
            Income Breakdown
          </h2>
          {incomeCategoryData.length > 0 ? (
            <>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={incomeCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {incomeCategoryData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {incomeCategoryData.map((cat, idx) => {
                  const percent = yearlyStats.income > 0 
                    ? (cat.value / yearlyStats.income) * 100 
                    : 0;
                  return (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-slate-700">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{percent.toFixed(1)}%</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(cat.value, currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-400">
              <p>No income data for {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* En İyi/En Kötü Ay */}
      {yearlyStats.transactionCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-900 text-sm font-semibold uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              Best Month
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-2">
              {getMonthLong(monthlyData.findIndex(m => m.month === bestMonth?.month))} 
              {bestMonth && bestMonth.net > 0 ? ' 🎉' : ''}
            </p>
            <p className="text-lg font-semibold text-emerald-600 mt-1">
              {formatCurrency(bestMonth?.net || 0, currency)} net
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-2 text-red-900 text-sm font-semibold uppercase tracking-wide">
              <Calendar className="w-4 h-4" />
              Worst Month
            </div>
            <p className="text-2xl font-bold text-red-700 mt-2">
              {getMonthLong(monthlyData.findIndex(m => m.month === worstMonth?.month))}
            </p>
            <p className="text-lg font-semibold text-red-600 mt-1">
              {formatCurrency(worstMonth?.net || 0, currency)} net
            </p>
          </div>
        </div>
      )}

      {/* Boş Veri Uyarısı */}
      {yearlyStats.transactionCount === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <BarChart3 className="w-16 h-16 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">No data for {selectedYear}</p>
          <p className="text-sm mt-1">
            Add transactions from the Cash Flow page to see reports
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;