import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadData, saveData, defaultData } from '../utils/storage';
import { generateId } from '../utils/formatters';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider = ({ children }) => {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const initial = loadData();
    setData(initial);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveData(data);
  }, [data, loaded]);

  const updateSettings = (newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  // Müşteriler
  const addCustomer = (customer) => {
    const newCustomer = {
      id: generateId(),
      ...customer,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    return newCustomer;
  };

  const updateCustomer = (id, updates) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c),
    }));
  };

  const deleteCustomer = (id) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
    }));
  };

  // Faturalar
  const addInvoice = (invoice) => {
    const newInvoice = {
      id: generateId(),
      ...invoice,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, invoices: [...prev.invoices, newInvoice] }));
    return newInvoice;
  };

  const updateInvoice = (id, updates) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(i => i.id === id ? { ...i, ...updates } : i),
    }));
  };

  const deleteInvoice = (id) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(i => i.id !== id),
    }));
  };

  // İşlemler
  const addTransaction = (transaction) => {
    const newTransaction = {
      id: generateId(),
      ...transaction,
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
    return newTransaction;
  };

  const updateTransaction = (id, updates) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  };

  const deleteTransaction = (id) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  };

  const resetData = () => setData(defaultData);
  const replaceData = (newData) => setData({ ...defaultData, ...newData });

  const value = {
    data,
    settings: data.settings,
    customers: data.customers,
    invoices: data.invoices,
    transactions: data.transactions,
    updateSettings,
    addCustomer, updateCustomer, deleteCustomer,
    addInvoice, updateInvoice, deleteInvoice,
    addTransaction, updateTransaction, deleteTransaction,
    resetData, replaceData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};