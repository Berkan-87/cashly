import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Plus, Search, Trash2, Pencil, Users, X, Mail, Phone, Building2, TrendingUp,
} from 'lucide-react';

const Customers = () => {
  const { customers, invoices, settings, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const currency = settings.currency;

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const emptyForm = {
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  };

  const [form, setForm] = useState(emptyForm);

  // Her müşterinin toplam kazancını hesapla
  const customersWithStats = useMemo(() => {
    return customers.map(c => {
      const customerInvoices = invoices.filter(i => i.customerId === c.id);
      const paidTotal = customerInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const pendingTotal = customerInvoices
        .filter(i => i.status !== 'paid')
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      
      return {
        ...c,
        invoiceCount: customerInvoices.length,
        paidTotal,
        pendingTotal,
        total: paidTotal + pendingTotal,
      };
    });
  }, [customers, invoices]);

  // Filtrelenmiş müşteriler
  const filteredCustomers = useMemo(() => {
    return customersWithStats
      .filter(c => {
        const searchLower = searchTerm.toLowerCase();
        return (
          !searchTerm ||
          c.name?.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.company?.toLowerCase().includes(searchLower) ||
          c.phone?.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => b.paidTotal - a.paidTotal);
  }, [customersWithStats, searchTerm]);

  // Toplam istatistikler
  const totals = useMemo(() => {
    const totalCustomers = customers.length;
    const totalPaid = customersWithStats.reduce((sum, c) => sum + c.paidTotal, 0);
    const totalPending = customersWithStats.reduce((sum, c) => sum + c.pendingTotal, 0);
    return { totalCustomers, totalPaid, totalPending };
  }, [customers, customersWithStats]);

  const openAddModal = () => {
    setForm(emptyForm);
    setEditingCustomer(null);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      notes: customer.notes || '',
    });
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Customer name is required');
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, form);
    } else {
      addCustomer(form);
    }
    closeModal();
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteCustomer(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Müşteri adının baş harfleri (avatar için)
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Renkli avatar arkaplanı
  const getAvatarColor = (name) => {
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-red-100 text-red-700',
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-cyan-100 text-cyan-700',
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // En çok kazandıran müşteri
  const topCustomer = filteredCustomers.length > 0 && filteredCustomers[0].paidTotal > 0
    ? filteredCustomers[0]
    : null;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 fade-in">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your client list</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          New Customer
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Users className="w-4 h-4" />
            Total Customers
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totals.totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <TrendingUp className="w-4 h-4" />
            Total Paid
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totals.totalPaid, currency)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            ⏳ Pending
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totals.totalPending, currency)}</p>
        </div>
      </div>

      {/* En Çok Kazandıran */}
      {topCustomer && (
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${getAvatarColor(topCustomer.name)}`}>
              {getInitials(topCustomer.name)}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">🏆 Top Customer</p>
              <p className="text-xl font-bold text-indigo-700 mt-1">{topCustomer.name}</p>
              <p className="text-sm text-indigo-600">{topCustomer.invoiceCount} invoices • {formatCurrency(topCustomer.paidTotal, currency)} paid</p>
            </div>
          </div>
        </div>
      )}

      {/* Arama */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Müşteri Listesi */}
      {filteredCustomers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getAvatarColor(customer.name)}`}>
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{customer.name}</p>
                    {customer.company && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {customer.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(customer)}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="font-bold text-emerald-600">{formatCurrency(customer.paidTotal, currency)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className="font-bold text-amber-600">{formatCurrency(customer.pendingTotal, currency)}</p>
                </div>
              </div>

              <div className="mt-3 text-xs text-slate-400 text-center">
                {customer.invoiceCount} {customer.invoiceCount === 1 ? 'invoice' : 'invoices'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Users className="w-16 h-16 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </p>
          <p className="text-sm mt-1">
            {searchTerm ? 'Try a different search term' : 'Click "New Customer" to add your first client'}
          </p>
        </div>
      )}

      {/* Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="e.g., Acme Corp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="e.g., +1 555 0100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
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
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {editingCustomer ? 'Update' : 'Create'}
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
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Customer?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              {deleteConfirm.invoiceCount > 0 && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ This customer has {deleteConfirm.invoiceCount} invoice(s). 
                  The invoices will remain but will lose their customer link.
                </span>
              )}
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

export default Customers;