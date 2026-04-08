export const fmt = (v, currency) => {
  if (v == null || isNaN(v)) return '—';
  if (currency === 'KRW') {
    if (Math.abs(v) < 0.01) return '₩' + v.toFixed(6);
    if (Math.abs(v) < 1) return '₩' + v.toFixed(4);
    if (Math.abs(v) < 100) return '₩' + v.toFixed(2);
    return '₩' + Math.round(v).toLocaleString('ko-KR');
  }
  if (Math.abs(v) < 0.01) return '$' + v.toFixed(6);
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtPct = (v) => {
  if (v == null || isNaN(v)) return '—';
  const sign = v >= 0 ? '+' : '';
  return sign + v.toFixed(2) + '%';
};

export const fmtDate = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-CA');
};

export const toUnix = (dateStr) => Math.floor(new Date(dateStr).getTime() / 1000);

export const defaultStart = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split('T')[0];
};

export const defaultEnd = () => new Date().toISOString().split('T')[0];
