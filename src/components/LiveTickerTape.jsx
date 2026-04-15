import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Radio } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LIVE TICKER TAPE — Crypto + Global stocks marquee
   ═══════════════════════════════════════════════════ */

const TICKER_LIST = [
  // ── Crypto ──
  { symbol: 'BTC-USD',   label: 'BTC',       type: 'crypto' },
  { symbol: 'ETH-USD',   label: 'ETH',       type: 'crypto' },
  { symbol: 'SOL-USD',   label: 'SOL',       type: 'crypto' },
  { symbol: 'XRP-USD',   label: 'XRP',       type: 'crypto' },
  { symbol: 'DOGE-USD',  label: 'DOGE',      type: 'crypto' },
  // ── US Major ──
  { symbol: 'AAPL',      label: 'AAPL',      type: 'stock' },
  { symbol: 'MSFT',      label: 'MSFT',      type: 'stock' },
  { symbol: 'NVDA',      label: 'NVDA',      type: 'stock' },
  { symbol: 'GOOGL',     label: 'GOOGL',     type: 'stock' },
  { symbol: 'AMZN',      label: 'AMZN',      type: 'stock' },
  { symbol: 'TSLA',      label: 'TSLA',      type: 'stock' },
  { symbol: 'META',      label: 'META',      type: 'stock' },
  // ── US Indices ──
  { symbol: '^GSPC',     label: 'S&P 500',   type: 'index' },
  { symbol: '^DJI',      label: 'DOW',       type: 'index' },
  { symbol: '^IXIC',     label: 'NASDAQ',    type: 'index' },
  // ── International ──
  { symbol: '^KS11',     label: 'KOSPI',     type: 'index' },
  { symbol: '^N225',     label: 'Nikkei',    type: 'index' },
  { symbol: '^HSI',      label: 'Hang Seng', type: 'index' },
  { symbol: '^FTSE',     label: 'FTSE 100',  type: 'index' },
  { symbol: '^GDAXI',    label: 'DAX',       type: 'index' },
  // ── Commodities ──
  { symbol: 'GC=F',      label: 'Gold',      type: 'commodity' },
  { symbol: 'CL=F',      label: 'Crude Oil', type: 'commodity' },
];

/* ─── Fetch a single quote from Yahoo Finance ─── */
async function fetchQuote(symbol) {
  try {
    const url = `https://corsproxy.io/?${encodeURIComponent(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2d&interval=1d`
    )}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const closes = result.indicators?.quote?.[0]?.close;
    if (!closes) return null;

    const validCloses = closes.filter(c => c != null);
    const currentPrice = meta?.regularMarketPrice ?? validCloses[validCloses.length - 1];
    const previousClose = meta?.chartPreviousClose ?? (validCloses.length >= 2 ? validCloses[validCloses.length - 2] : currentPrice);
    const change = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

    return { price: currentPrice, change, previousClose };
  } catch {
    return null;
  }
}

/* ─── Format price ─── */
function formatPrice(price, type) {
  if (price == null) return '---';
  if (type === 'crypto' && price >= 100) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (type === 'crypto') {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  if (type === 'index') {
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (type === 'commodity') {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ─── Type badge color ─── */
function getTypeBadge(type) {
  switch (type) {
    case 'crypto':    return { bg: 'rgba(255,183,0,0.15)', text: '#ffb700', dot: '#ffb700' };
    case 'index':     return { bg: 'rgba(30,144,255,0.15)', text: '#1e90ff', dot: '#1e90ff' };
    case 'commodity': return { bg: 'rgba(0,229,255,0.15)', text: '#00e5ff', dot: '#00e5ff' };
    default:          return { bg: 'rgba(255,255,255,0.05)', text: '#888', dot: '#666' };
  }
}

/* ═════════ Main Component ═════════ */
export default function LiveTickerTape() {
  const [quotes, setQuotes] = useState({});
  const [loaded, setLoaded] = useState(false);

  /* ─── Fetch all quotes ─── */
  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      const results = {};
      // Fetch in parallel chunks of 6
      const chunks = [];
      for (let i = 0; i < TICKER_LIST.length; i += 6) {
        chunks.push(TICKER_LIST.slice(i, i + 6));
      }
      for (const chunk of chunks) {
        const promises = chunk.map(async ({ symbol }) => {
          const data = await fetchQuote(symbol);
          if (data && !cancelled) {
            results[symbol] = data;
          }
        });
        await Promise.all(promises);
      }
      if (!cancelled) {
        setQuotes(results);
        setLoaded(true);
      }
    };

    fetchAll();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAll, 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  /* ─── Build ticker items ─── */
  const tickerItems = useMemo(() => {
    return TICKER_LIST.map(({ symbol, label, type }) => {
      const q = quotes[symbol];
      const badge = getTypeBadge(type);
      const price = q ? formatPrice(q.price, type) : '---';
      const change = q ? q.change : null;
      const isUp = change != null ? change >= 0 : null;

      return (
        <div key={symbol} className="ticker-item">
          {/* Dot */}
          <span className="ticker-dot" style={{ backgroundColor: badge.dot }} />
          {/* Symbol */}
          <span className="ticker-label">{label}</span>
          {/* Price */}
          <span className={`ticker-price ${
            isUp === null ? 'neutral' : isUp ? 'up' : 'down'
          }`}>
            {price}
          </span>
          {/* Change */}
          {change != null && (
            <span className={`ticker-change ${isUp ? 'up' : 'down'}`}>
              {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
            </span>
          )}
          {/* Separator */}
          <span className="ticker-separator">│</span>
        </div>
      );
    });
  }, [quotes]);

  // Triple the items for seamless loop
  const displayItems = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="ticker-tape-container">
      {/* LIVE badge */}
      <div className="ticker-live-badge">
        <Radio size={14} className="text-terminal-red animate-pulse" />
        <span>LIVE</span>
      </div>

      {/* Scrolling area */}
      <div className="ticker-scroll-area">
        {!loaded ? (
          <div className="ticker-loading">
            <span className="loading-shimmer" style={{ width: '100%', height: '100%', display: 'block', borderRadius: 4 }} />
          </div>
        ) : (
          <div className="ticker-track">
            {displayItems}
          </div>
        )}
      </div>

      {/* Edge fade overlays */}
      <div className="ticker-fade-left" />
      <div className="ticker-fade-right" />
    </div>
  );
}
