export const formatCurrency = (amount, currency = 'USD') => {
  const localeMap = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    TRY: 'tr-TR',
    JPY: 'ja-JP',
    CAD: 'en-CA',
    AUD: 'en-AU',
    CHF: 'de-CH',
    CNY: 'zh-CN',
    INR: 'en-IN',
  };

  const locale = localeMap[currency] || 'en-US';

  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

export const formatDateLong = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getMonthShort = (monthIndex) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex] || '';
};

export const getMonthLong = (monthIndex) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex] || '';
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const formatPercent = (value) => {
  if (!value && value !== 0) return '0.0%';
  return `${value.toFixed(1)}%`;
};

export const todayISO = () => new Date().toISOString().split('T')[0];

// ✅ Para birimi seçenekleri (Settings ve Dashboard'da kullanılacak)
export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', label: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', label: 'British Pound', flag: '🇬🇧' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', flag: '🇮🇳' },
];

export const getCurrencyInfo = (code) => {
  return CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
};