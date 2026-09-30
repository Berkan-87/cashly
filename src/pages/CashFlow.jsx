import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayISO, getMonthLong } from '../utils/formatters';
import {
  Plus, Search, Filter, Trash2, Pencil, Wallet, X,
  ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign,
} from 'lucide-react';

const CashFlow = () => {
  const { transactions, settings, addTransaction, updateTransaction, deleteTransaction } = useApp();
  const currency = settings.currency;

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const incomeCategories = [
    'Client Payment',
    'Consulting',
    'Retainer',
    'Product Sale',
    'Other Income',
  ];

  const expenseCategories = [
    'Software',
    'Office',
    'Marketing',
    'Equipment',
    'Travel',
    'Utilities',
    'Taxes',
    'Rent',
    'Salary',
    'Other Expense',
  ];

  const paymentMethods = [
    'Bank Transfer',
    'Credit Card',
    'Cash',
    'PayPal',
    'Stripe',
    'Other',
  ];

  const emptyForm = {
    type: 'income',
    category: 'Client Payment',
    description: '',
    amount: '',
    date: todayISO(),
    paymentMethod: 'Bank Transfer',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);

  // Filtrelenmiş işlemler
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          t.description?.toLowerCase().includes(searchLower) ||
          t.category?.toLowerCase().includes(searchLower) ||
          t.notes?.toLowerCase().includes(searchLower);

        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

        let matchesMonth = true;
        if (monthFilter !== 'all') {
          const d = new Date(t.date);
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          matchesMonth = monthKey === monthFilter;
        }

        return matchesSearch && matchesType && matchesCategory && matchesMonth;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, searchTerm, typeFilter, categoryFilter, monthFilter]);

  // Toplam hesaplamalar
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // Mevcut ay seçenekleri
  const monthOptions = useMemo(() => {
    const months = new Set();
    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    });
    return Array.from(months)
      .sort()
      .reverse()
      .map(key => {
        const [year, month] = key.split('-');
        return {
          value: key,
          label: `${getMonthLong(parseInt(month) - 1)} ${year}`,
        };
      });
  }, [transactions]);

  // Kategori seçenekleri (mevcut işlemlerden)
  const categoryOptions = useMemo(() => {
    const cats = new Set();
    transactions.forEach(t => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Modal açma
  const openAddModal = () => {
    setForm(emptyForm);
    setEditingTransaction(null);
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    setForm({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description || '',
      amount: transaction.amount,
      date: transaction.date,
      paymentMethod: transaction.paymentMethod || 'Bank Transfer',
      notes: transaction.notes || '',
    });
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTransaction(null);
    setForm(emptyForm);
  };

  // Kategori değişince, uygun ilk kategoriyi seç
  const handleTypeChange = (newType) => {
    const cats = newType === 'income' ? incomeCategories : expenseCategories;
    setForm({
      ...form,
      type: newType,
      category: cats[0],
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!form.category) {
      alert('Please select a category');
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, form);
    } else {
      addTransaction(form);
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteTransaction(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setMonthFilter('all');
  };

  const hasActiveFilters =
    searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || monthFilter !== 'all';

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 fade-in">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Cash Flow</h1>
          <p className="text-slate-500 mt-1">Track your income and expenses</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          New Transaction
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(totals.income, currency)}
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
                {formatCurrency(totals.expense, currency)}
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
              <p className="text-sm text-slate-500 font-medium">Net Balance</p>
              <p className={`text-2xl font-bold mt-1 ${
                totals.net >= 0 ? 'text-indigo-600' : 'text-red-600'
              }`}>
                {formatCurrency(totals.net, currency)}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${
              totals.net >= 0 ? 'bg-indigo-50' : 'bg-red-50'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                totals.net >= 0 ? 'text-indigo-600' : 'text-red-600'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            >
              <option value="all">All Months</option>
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Description</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Method</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        t.type === 'income'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {t.type === 'income' ? (
                          <><ArrowUpRight className="w-3 h-3" /> Income</>
                        ) : (
                          <><ArrowDownRight className="w-3 h-3" /> Expense</>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-700">{t.category}</td>
                    <td className="py-3 px-4 text-sm text-slate-700 max-w-[200px] truncate">
                      {t.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">{t.paymentMethod || '-'}</td>
                    <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(t)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Wallet className="w-16 h-16 mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium">
              {hasActiveFilters ? 'No transactions found' : 'No transactions yet'}
            </p>
            <p className="text-sm mt-1">
              {hasActiveFilters
                ? 'Try different filters'
                : 'Click "New Transaction" to add your first income or expense'}
            </p>
          </div>
        )}
      </div>

      {/* Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('income')}
                    className={`py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      form.type === 'income'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('expense')}
                    className={`py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      form.type === 'expense'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Expense
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {(form.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g., Payment from Acme Corp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {paymentMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white rounded-lg transition-colors font-medium ${
                    form.type === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onayı */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Transaction?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete this {deleteConfirm.type}?
              <br />
              <strong className="text-slate-800">
                {formatCurrency(deleteConfirm.amount, currency)} - {deleteConfirm.category}
              </strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;