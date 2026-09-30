import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, todayISO } from '../utils/formatters';
import {
  Plus, Search, Filter, Trash2, Pencil, FileText, X, Download,
  CheckCircle, Clock, AlertTriangle, Eye,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Invoices = () => {
  const { invoices, customers, settings, addInvoice, updateInvoice, deleteInvoice } = useApp();
  const currency = settings.currency;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  const emptyForm = {
    invoiceNo: '',
    customerId: '',
    issueDate: todayISO(),
    dueDate: todayISO(),
    description: '',
    amount: '',
    taxRate: 0,
    status: 'pending',
    paidDate: '',
  };

  const [form, setForm] = useState(emptyForm);

  // Fatura numarası otomatik oluştur
  const generateInvoiceNo = () => {
    const count = invoices.length + 1;
    return `INV-${String(count).padStart(4, '0')}`;
  };

  // Fatura durumunu hesapla (vade geçmişse otomatik overdue)
  const getInvoiceStatus = (invoice) => {
    if (invoice.status === 'paid') return 'paid';
    const today = new Date();
    const due = new Date(invoice.dueDate);
    if (due < today) return 'overdue';
    return 'pending';
  };

  // Filtrelenmiş faturalar
  const filteredInvoices = useMemo(() => {
    return invoices
      .map(inv => ({ ...inv, computedStatus: getInvoiceStatus(inv) }))
      .filter(inv => {
        // Arama
        const customer = customers.find(c => c.id === inv.customerId);
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          !searchTerm ||
          inv.invoiceNo?.toLowerCase().includes(searchLower) ||
          customer?.name?.toLowerCase().includes(searchLower) ||
          inv.description?.toLowerCase().includes(searchLower);

        // Durum filtresi
        const matchesStatus = statusFilter === 'all' || inv.computedStatus === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
  }, [invoices, customers, searchTerm, statusFilter]);

  // Toplam hesaplamalar
  const totals = useMemo(() => {
    const subtotal = filteredInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    const tax = filteredInvoices.reduce((sum, inv) => 
      sum + (Number(inv.amount || 0) * Number(inv.taxRate || 0) / 100), 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [filteredInvoices]);

  // Modal aç
  const openAddModal = () => {
    setForm({ ...emptyForm, invoiceNo: generateInvoiceNo() });
    setEditingInvoice(null);
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setForm({
      invoiceNo: invoice.invoiceNo,
      customerId: invoice.customerId,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      description: invoice.description || '',
      amount: invoice.amount,
      taxRate: invoice.taxRate || 0,
      status: invoice.status,
      paidDate: invoice.paidDate || '',
    });
    setEditingInvoice(invoice);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    setForm(emptyForm);
  };

  // Kaydet
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerId) {
      alert('Please select a customer');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, form);
    } else {
      addInvoice(form);
    }
    closeModal();
  };

  // Sil
  const handleDelete = (invoice) => {
    setDeleteConfirm(invoice);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteInvoice(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  // Durumu güncelle
  const togglePaid = (invoice) => {
    if (invoice.status === 'paid') {
      updateInvoice(invoice.id, { status: 'pending', paidDate: '' });
    } else {
      updateInvoice(invoice.id, { status: 'paid', paidDate: todayISO() });
    }
  };

  // PDF export (tek fatura)
  const exportToPDF = (invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const doc = new jsPDF();
    const subtotal = Number(invoice.amount || 0);
    const tax = subtotal * Number(invoice.taxRate || 0) / 100;
    const total = subtotal + tax;

    // Başlık
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229);
    doc.text('INVOICE', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.businessName || 'My Business', 14, 30);

    // Fatura bilgileri
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Invoice No: ${invoice.invoiceNo}`, 140, 22);
    doc.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 140, 28);
    doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 140, 34);
    doc.text(`Status: ${getInvoiceStatus(invoice).toUpperCase()}`, 140, 40);

    // Müşteri bilgileri
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('BILL TO:', 14, 55);
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(customer?.name || 'Unknown Customer', 14, 62);
    if (customer?.email) doc.text(customer.email, 14, 68);
    if (customer?.phone) doc.text(customer.phone, 14, 74);

    // Tablo
    autoTable(doc, {
      startY: 90,
      head: [['Description', 'Amount']],
      body: [
        [invoice.description || 'Service', formatCurrency(subtotal, currency)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
    });

    // Toplamlar
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(formatCurrency(subtotal, currency), 180, finalY, { align: 'right' });

    if (Number(invoice.taxRate) > 0) {
      doc.text(`Tax (${invoice.taxRate}%):`, 140, finalY + 7);
      doc.text(formatCurrency(tax, currency), 180, finalY + 7, { align: 'right' });
    }

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text(`TOTAL:`, 140, finalY + 17);
    doc.text(formatCurrency(total, currency), 180, finalY + 17, { align: 'right' });

    doc.save(`${invoice.invoiceNo}.pdf`);
  };

  // Durum badge
  const StatusBadge = ({ status }) => {
    const configs = {
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, label: 'Paid' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, label: 'Pending' },
      overdue: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle, label: 'Overdue' },
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 fade-in">
      {/* Başlık ve Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Invoices</h1>
          <p className="text-slate-500 mt-1">Manage your client invoices</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Subtotal</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totals.subtotal, currency)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Tax</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(totals.tax, currency)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">{formatCurrency(totals.total, currency)}</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice no, customer, description..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Invoice #</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Issue Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Due Date</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Amount</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const customer = customers.find(c => c.id === inv.customerId);
                  const status = getInvoiceStatus(inv);
                  const total = Number(inv.amount) * (1 + Number(inv.taxRate || 0) / 100);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-semibold text-indigo-600">
                          {inv.invoiceNo}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{customer?.name || 'Unknown'}</p>
                        {inv.description && (
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">{inv.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatDate(inv.issueDate)}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold text-slate-800">{formatCurrency(total, currency)}</p>
                        {Number(inv.taxRate) > 0 && (
                          <p className="text-xs text-slate-500">
                            +{inv.taxRate}% tax
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => togglePaid(inv)}
                          className="hover:scale-105 transition-transform"
                          title="Click to toggle status"
                        >
                          <StatusBadge status={status} />
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => exportToPDF(inv)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(inv)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-16 h-16 mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium">No invoices yet</p>
            <p className="text-sm mt-1">Click "New Invoice" to create your first invoice</p>
          </div>
        )}
      </div>

      {/* Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
              </h2>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invoice No *</label>
                  <input
                    type="text"
                    value={form.invoiceNo}
                    onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Select a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ No customers yet. Add customers first from the Customers page.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows="2"
                  placeholder="e.g., Website design services"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {form.status === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paid Date</label>
                  <input
                    type="date"
                    value={form.paidDate}
                    onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
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
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Invoice?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you sure you want to delete invoice <strong>{deleteConfirm.invoiceNo}</strong>?
              This action cannot be undone.
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

      {/* Görüntüleme Modalı */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">{viewInvoice.invoiceNo}</h2>
              <button onClick={() => setViewInvoice(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-medium text-slate-800">
                  {customers.find(c => c.id === viewInvoice.customerId)?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Description:</span>
                <span className="font-medium text-slate-800">{viewInvoice.description || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issue Date:</span>
                <span className="font-medium text-slate-800">{formatDate(viewInvoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Due Date:</span>
                <span className="font-medium text-slate-800">{formatDate(viewInvoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-medium text-slate-800">{formatCurrency(viewInvoice.amount, currency)}</span>
              </div>
              {Number(viewInvoice.taxRate) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({viewInvoice.taxRate}%):</span>
                  <span className="font-medium text-slate-800">
                    {formatCurrency(Number(viewInvoice.amount) * Number(viewInvoice.taxRate) / 100, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-800">Total:</span>
                <span className="font-bold text-indigo-600 text-lg">
                  {formatCurrency(Number(viewInvoice.amount) * (1 + Number(viewInvoice.taxRate || 0) / 100), currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={getInvoiceStatus(viewInvoice)} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { exportToPDF(viewInvoice); setViewInvoice(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => setViewInvoice(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;