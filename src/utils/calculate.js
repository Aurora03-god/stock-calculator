import { fmtDate, toUnix } from './format';

export async function fetchStockData(ticker, startDate, endDate) {
  const p1 = toUnix(startDate);
  const p2 = toUnix(endDate);
  if (p2 <= p1) throw new Error('종료일이 시작일보다 나중이어야 합니다.');

  // Always use 1d interval to show daily data as requested
  const interval = '1d';

  const url = `https://corsproxy.io/?${encodeURIComponent(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.trim().toUpperCase()}?period1=${p1}&period2=${p2}&interval=${interval}`
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data returned for this ticker/period.');

  const timestamps = result.timestamp;
  const closes = result.indicators?.quote?.[0]?.close;
  if (!timestamps || !closes || timestamps.length === 0) throw new Error('Insufficient data.');
  return { timestamps, closes };
}

export function calculateReturns(timestamps, closes, amount) {
  const initialPrice = closes[0];
  const shares = amount / initialPrice;
  let bestDay = { pct: -Infinity, date: '' };
  let worstDay = { pct: Infinity, date: '' };
  const points = [];

  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null) continue;
    const value = shares * closes[i];
    const returnPct = ((closes[i] - initialPrice) / initialPrice) * 100;
    const date = fmtDate(timestamps[i]);
    if (i > 0 && closes[i - 1] != null) {
      const dayPct = ((closes[i] - closes[i - 1]) / closes[i - 1]) * 100;
      if (dayPct > bestDay.pct) bestDay = { pct: dayPct, date };
      if (dayPct < worstDay.pct) worstDay = { pct: dayPct, date };
    }
    points.push({ date, price: closes[i], value, returnPct, invested: amount });
  }

  const last = points[points.length - 1];
  const mdd = calculateMDD(points);
  const { volatility, sharpeRatio } = calculateRiskMetrics(points);

  const summary = {
    ticker: '', invested: amount, finalValue: last.value,
    totalPL: last.value - amount, returnPct: last.returnPct,
    bestDay, worstDay, tradingDays: points.length,
    startDate: '', endDate: '', mdd, volatility, sharpeRatio,
  };
  return { points, summary };
}

function calculateMDD(points) {
  let peak = -Infinity, maxDrawdown = 0, mddDate = '';
  for (const p of points) {
    if (p.value > peak) peak = p.value;
    const dd = ((p.value - peak) / peak) * 100;
    if (dd < maxDrawdown) { maxDrawdown = dd; mddDate = p.date; }
  }
  return { pct: maxDrawdown, date: mddDate };
}

function calculateRiskMetrics(points) {
  if (points.length < 2) return { volatility: 0, sharpeRatio: 0 };
  const dailyReturns = [];
  for (let i = 1; i < points.length; i++) {
    if (points[i - 1].value > 0)
      dailyReturns.push((points[i].value - points[i - 1].value) / points[i - 1].value);
  }
  if (!dailyReturns.length) return { volatility: 0, sharpeRatio: 0 };
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (dailyReturns.length - 1);
  const dailyVol = Math.sqrt(variance);
  const annualizedVol = dailyVol * Math.sqrt(252) * 100;
  const annualizedReturn = mean * 252;
  const sharpeRatio = dailyVol > 0 ? (annualizedReturn - 0.04) / (dailyVol * Math.sqrt(252)) : 0;
  return { volatility: annualizedVol, sharpeRatio };
}

export function calculateDCA(timestamps, closes, monthlyAmount) {
  if (!timestamps.length || !closes.length) return { points: [], summary: null };
  let totalShares = 0, totalInvested = 0, lastMonth = -1;
  const points = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null) continue;
    const d = new Date(timestamps[i] * 1000);
    const month = d.getFullYear() * 12 + d.getMonth();
    if (month !== lastMonth) {
      totalShares += monthlyAmount / closes[i];
      totalInvested += monthlyAmount;
      lastMonth = month;
    }
    const value = totalShares * closes[i];
    const returnPct = totalInvested > 0 ? ((value - totalInvested) / totalInvested) * 100 : 0;
    points.push({ date: fmtDate(timestamps[i]), price: closes[i], value, returnPct, invested: totalInvested });
  }
  const last = points[points.length - 1];
  const summary = last ? {
    totalInvested, finalValue: last.value, totalPL: last.value - totalInvested,
    returnPct: last.returnPct, avgCost: totalShares > 0 ? totalInvested / totalShares : 0, totalShares,
  } : null;
  return { points, summary };
}

export function getBenchmarkTicker(ticker) {
  const u = ticker.toUpperCase();
  if (u.endsWith('.KS') || u.endsWith('.KQ')) return '^KS11';
  return '^GSPC';
}

export function calculateNormalizedReturns(timestamps, closes) {
  if (!closes.length || closes[0] == null) return [];
  const initial = closes[0];
  return timestamps.map((ts, i) => ({
    date: fmtDate(ts),
    returnPct: closes[i] != null ? ((closes[i] - initial) / initial) * 100 : null,
  }));
}

export async function fetchCompanyNews(ticker, startDate, endDate, apiKey) {
  if (!apiKey) return [];
  let symbol = ticker.trim().toUpperCase();
  // Remove Yahoo finance suffixes like .KS for Finnhub compatibility
  if (symbol.includes('.')) symbol = symbol.split('.')[0];
  
  try {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${startDate}&to=${endDate}&token=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.warn("Finnhub API Error:", e);
    return [];
  }
}
