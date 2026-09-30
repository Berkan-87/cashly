import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, CURRENCIES, getCurrencyInfo } from '../utils/formatters';
import { downloadBackup, uploadBackup } from '../utils/storage';
import {
  Settings as SettingsIcon, DollarSign, Target, Building2,
  Download, Upload, RefreshCw, AlertTriangle, CheckCircle,
} from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings, data, resetData, replaceData } = useApp();

  const [localSettings, setLocalSettings] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  const fileInputRef = useRef(null);

  // İlk 4 popüler para birimi (varsayılan gösterim)
  const featuredCurrencies = CURRENCIES.slice(0, 4);
  // Tümü
  const allCurrencies = CURRENCIES;

  const handleSave = () => {
    updateSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings);

  const handleDownloadBackup = () => {
    downloadBackup(data);
  };

  const handleUploadBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadedData = await uploadBackup(file);
      if (!uploadedData.settings && !uploadedData.customers && !uploadedData.invoices) {
        throw new Error('Invalid backup file');
      }
      replaceData(uploadedData);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      setUploadError('Failed to load backup: ' + error.message);
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    resetData();
    setLocalSettings({
      currency: 'USD',
      monthlyBudget: 5000,
      language: 'en',
      businessName: 'My Business',
    });
    setShowResetConfirm(false);
  };

  const stats = {
    customers: data.customers.length,
    invoices: data.invoices.length,
    transactions: data.transactions.length,
  };

  const currentCurrency = getCurrencyInfo(localSettings.currency);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 fade-in max-w-4xl">
      {/* Başlık */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Customize your Cashly experience</p>
      </div>

      {/* Kaydet başarı mesajı */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-700 font-medium">Settings saved successfully!</p>
        </div>
      )}

      {/* Genel Ayarlar */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">General</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* İşletme Adı */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Business Name
            </label>
            <input
              type="text"
              value={localSettings.businessName || ''}
              onChange={(e) => setLocalSettings({ ...localSettings, businessName: e.target.value })}
              placeholder="e.g., My Business"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              This name will appear on your PDF invoices.
            </p>
          </div>

          {/* Para Birimi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                Currency
              </label>
              <button
                type="button"
                onClick={() => setShowAllCurrencies(!showAllCurrencies)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {showAllCurrencies ? 'Show Less' : `Show All (${allCurrencies.length})`}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {(showAllCurrencies ? allCurrencies : featuredCurrencies).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, currency: c.code })}
                  className={`py-3 px-3 rounded-lg border-2 transition-all ${
                    localSettings.currency === c.code
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-600/10'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-bold">{c.symbol}</span>
                    <span className="text-xs font-medium">{c.code}</span>
                    {/* <span className="text-xs">{c.flag}</span> */}
                  </div>
                </button>
              ))}
            </div>

            {/* Aktif Para Birimi Detay */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Active Currency</p>
                  <p className="text-base font-bold text-indigo-800 mt-0.5">
                    {currentCurrency.flag} {currentCurrency.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-indigo-600 font-medium">Example</p>
                  <p className="text-lg font-bold text-indigo-800 mt-0.5">
                    {formatCurrency(1234.56, localSettings.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bütçe Ayarları */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-slate-800">Budget</h2>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monthly Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                value={localSettings.monthlyBudget || 0}
                onChange={(e) => setLocalSettings({ ...localSettings, monthlyBudget: Number(e.target.value) })}
                min="0"
                step="100"
                className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              This is used to track how much you've spent this month and display warnings on the Dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Kaydet Butonu */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-white rounded-xl border border-indigo-200 p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 fade-in mx-2">
          <p className="text-sm text-slate-600 font-medium">
            You have unsaved changes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setLocalSettings(settings)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Veri Yönetimi */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Data Management</h2>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{stats.customers}</p>
              <p className="text-xs text-slate-500 mt-1">Customers</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{stats.invoices}</p>
              <p className="text-xs text-slate-500 mt-1">Invoices</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-800">{stats.transactions}</p>
              <p className="text-xs text-slate-500 mt-1">Transactions</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-800">Download Backup</p>
              <p className="text-xs text-slate-500 mt-0.5">Save all your data as a JSON file</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-slate-800">Restore Backup</p>
              <p className="text-xs text-slate-500 mt-0.5">Upload a previously saved JSON backup</p>
              {uploadError && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {uploadError}
                </p>
              )}
              {uploadSuccess && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Backup restored successfully!
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleUploadBackup}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>

          <div className="border-t border-red-100 pt-5 mt-5">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Reset All Data
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Delete everything and start fresh. This cannot be undone!
                </p>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Onayı */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">
              Reset All Data?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will <strong className="text-red-600">permanently delete</strong> all your:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 mb-6 bg-red-50 rounded-lg p-4">
              <li>• {stats.customers} customers</li>
              <li>• {stats.invoices} invoices</li>
              <li>• {stats.transactions} transactions</li>
            </ul>
            <p className="text-sm text-slate-500 text-center mb-6">
              Are you absolutely sure? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-6 text-sm text-slate-400">
        <p>Cashly v1.0</p>
        <p className="mt-1">Data is stored locally in your browser</p>
      </div>
    </div>
  );
};

export default Settings;
