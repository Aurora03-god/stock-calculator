import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, Loader2, ZoomIn, ZoomOut, Clock } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   S&P 500 SECTOR TREEMAP — Real-time sector performance heatmap
   ═══════════════════════════════════════════════════════════════ */

/* ─── S&P 500 Universe: Top stocks per GICS sector ─── */
const SP500_SECTORS = {
  'Technology': {
    tickers: ['AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL'],
    color: '#6366f1',
  },
  'Healthcare': {
    tickers: ['UNH', 'LLY', 'JNJ', 'ABBV', 'MRK'],
    color: '#06b6d4',
  },
  'Financials': {
    tickers: ['BRK-B', 'JPM', 'V', 'MA', 'BAC'],
    color: '#f59e0b',
  },
  'Consumer Discretionary': {
    tickers: ['AMZN', 'TSLA', 'HD', 'MCD', 'BKNG'],
    color: '#ec4899',
  },
  'Communication': {
    tickers: ['META', 'GOOGL', 'GOOG', 'NFLX', 'TMUS'],
    color: '#8b5cf6',
  },
  'Industrials': {
    tickers: ['GE', 'CAT', 'RTX', 'HON'],
    color: '#64748b',
  },
  'Consumer Staples': {
    tickers: ['WMT', 'PG', 'COST', 'KO', 'PEP'],
    color: '#22c55e',
  },
  'Energy': {
    tickers: ['XOM', 'CVX', 'COP', 'SLB'],
    color: '#ef4444',
  },
  'Utilities': {
    tickers: ['NEE', 'SO', 'DUK', 'CEG'],
    color: '#a3e635',
  },
  'Real Estate': {
    tickers: ['PLD', 'AMT', 'EQIX', 'PSA'],
    color: '#14b8a6',
  },
  'Materials': {
    tickers: ['LIN', 'SHW', 'APD', 'FCX'],
    color: '#d97706',
  },
};

/* ─── Approximate market caps (billions USD) for box sizing ─── */
const MARKET_CAPS = {
  AAPL: 3400, MSFT: 3100, NVDA: 2800, AVGO: 800, ORCL: 380, CRM: 300, AMD: 250, ADBE: 240, ACN: 220, INTC: 110,
  UNH: 520, LLY: 750, JNJ: 390, ABBV: 310, MRK: 300, TMO: 210, ABT: 200, DHR: 180, PFE: 160, AMGN: 150,
  'BRK-B': 900, JPM: 600, V: 560, MA: 420, BAC: 320, WFC: 200, GS: 160, MS: 155, SPGI: 150, BLK: 140,
  AMZN: 2000, TSLA: 800, HD: 380, MCD: 210, NKE: 130, LOW: 150, SBUX: 110, TJX: 120, BKNG: 155, CMG: 75,
  META: 1400, GOOGL: 2100, GOOG: 2100, NFLX: 300, DIS: 200, CMCSA: 170, TMUS: 250, VZ: 170, T: 140, CHTR: 55,
  GE: 200, CAT: 180, UNP: 150, RTX: 155, HON: 140, BA: 130, DE: 120, LMT: 125, UPS: 100, ADP: 110,
  PG: 390, KO: 270, PEP: 230, COST: 370, WMT: 520, PM: 200, MO: 85, CL: 80, MDLZ: 90, KHC: 45,
  XOM: 500, CVX: 300, COP: 140, SLB: 75, EOG: 70, MPC: 60, PSX: 55, VLO: 50, PXD: 55, OXY: 50,
  NEE: 160, SO: 90, DUK: 85, CEG: 70, SRE: 55, AEP: 50, D: 48, EXC: 42, XEL: 38, ED: 35,
  PLD: 120, AMT: 95, EQIX: 80, PSA: 55, SPG: 55, O: 50, CCI: 42, WELL: 50, DLR: 45, AVB: 30,
  LIN: 220, APD: 70, SHW: 85, FCX: 65, NEM: 55, ECL: 55, DOW: 40, NUE: 40, VMC: 35, MLM: 35,
};

/* ─── Color mapping based on % change ─── */
function getPerformanceColor(pct) {
  if (pct == null || isNaN(pct)) return '#333333';
  if (pct <= -5) return '#b91c1c';
  if (pct <= -3) return '#dc2626';
  if (pct <= -1) return '#ef4444';
  if (pct < -0.25) return '#7f1d1d';
  if (pct <= 0.25) return '#374151';
  if (pct < 1) return '#14532d';
  if (pct <= 3) return '#22c55e';
  if (pct <= 5) return '#16a34a';
  return '#15803d';
}

/* text color removed — using solid black for all cells */

/* ─── Fetch batch quote data from Yahoo Finance ─── */
async function fetchBatchQuotes(tickers) {
  const results = {};
  // Batch into chunks of 10 for reliability
  const chunks = [];
  for (let i = 0; i < tickers.length; i += 10) {
    chunks.push(tickers.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (ticker) => {
      try {
        const url = `https://corsproxy.io/?${encodeURIComponent(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`
        )}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const closes = result.indicators?.quote?.[0]?.close;
        const timestamps = result.timestamp;

        if (!closes || !timestamps || closes.length < 2) return null;

        // Find valid close values
        const validCloses = closes.filter(c => c != null);
        if (validCloses.length < 2) return null;

        const currentPrice = meta?.regularMarketPrice || validCloses[validCloses.length - 1];
        const previousClose = meta?.chartPreviousClose || validCloses[validCloses.length - 2];

        // Calculate various period changes
        const dayChange = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

        // Weekly: use 5-day ago close vs now
        const weekAgoClose = validCloses.length >= 5 ? validCloses[0] : validCloses[0];
        const weekChange = weekAgoClose > 0 ? ((currentPrice - weekAgoClose) / weekAgoClose) * 100 : 0;

        results[ticker] = {
          ticker,
          price: currentPrice,
          dayChange,
          weekChange,
          previousClose,
        };
      } catch (e) {
        // silently skip failed tickers
      }
    });
    await Promise.all(promises);
  }
  return results;
}

/* ─── Fetch longer-range changes (1M, YTD) ─── */
async function fetchRangeQuotes(tickers, range) {
  const results = {};
  const chunks = [];
  for (let i = 0; i < tickers.length; i += 10) {
    chunks.push(tickers.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (ticker) => {
      try {
        const url = `https://corsproxy.io/?${encodeURIComponent(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=1d`
        )}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const json = await res.json();
        const result = json?.chart?.result?.[0];
        if (!result) return;

        const closes = result.indicators?.quote?.[0]?.close;
        const meta = result.meta;
        if (!closes || closes.length < 2) return;

        const validCloses = closes.filter(c => c != null);
        if (validCloses.length < 2) return;

        const startPrice = validCloses[0];
        const currentPrice = meta?.regularMarketPrice || validCloses[validCloses.length - 1];
        const change = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;

        results[ticker] = { change };
      } catch (e) {
        // skip
      }
    });
    await Promise.all(promises);
  }
  return results;
}

/* ─── Custom Treemap Cell ─── */
const SHADOW_FILTER_ID = 'treemap-text-shadow';
const ShadowFilter = () => (
  <defs>
    <filter id={SHADOW_FILTER_ID} x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.9" />
    </filter>
  </defs>
);

const CustomTreemapContent = ({ x, y, width, height, name, changePct, ticker, depth, zoomedSector, onCellClick, index }) => {
  if (width < 2 || height < 2) return null;

  const bgColor = depth === 1
    ? 'transparent'
    : getPerformanceColor(changePct);

  const showTicker = width > 30 && height > 18;
  const showPct = width > 38 && height > 32;
  
  // Bigger fonts with higher minimums
  const fontSize = Math.min(Math.max(width / 5, 12), 22);
  const pctFontSize = Math.min(Math.max(width / 6.5, 10), 16);

  // Sector-level grouping
  if (depth === 1) {
    return (
      <g>
        {index === 0 && <ShadowFilter />}
        <rect x={x} y={y} width={width} height={height}
          fill="transparent" stroke="#222" strokeWidth={2.5} />
        {width > 50 && height > 20 && (
          <text x={x + 8} y={y + 16} fill="#888" fontSize={11}
            fontFamily="'JetBrains Mono', monospace" fontWeight="700"
            style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {name}
          </text>
        )}
      </g>
    );
  }

  return (
    <g onClick={() => onCellClick && onCellClick(ticker, name)}
       style={{ cursor: 'pointer' }}>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2}
        fill={bgColor} rx={4} ry={4}
        stroke="#0a0a0a" strokeWidth={1.5} />
      {showTicker && (
        <text x={x + width / 2} y={y + height / 2 - (showPct ? pctFontSize * 0.5 : 0)}
          textAnchor="middle" dominantBaseline="middle"
          fill="#000000" fontSize={fontSize}
          fontFamily="'JetBrains Mono', monospace" fontWeight="800">
          {ticker}
        </text>
      )}
      {showPct && changePct != null && (
        <text x={x + width / 2} y={y + height / 2 + fontSize * 0.6}
          textAnchor="middle" dominantBaseline="middle"
          fill="#000000" fontSize={pctFontSize}
          fontFamily="'JetBrains Mono', monospace" fontWeight="700">
          {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
        </text>
      )}
    </g>
  );
};

/* ─── Custom Tooltip ─── */
const TreemapTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data || !data.ticker) return null;

  const pct = data.changePct;
  const isUp = pct >= 0;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl"
         style={{ pointerEvents: 'none', zIndex: 1000 }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono font-bold text-terminal-text">{data.ticker}</span>
        <span className="text-[10px] text-[#555]">{data.sectorName}</span>
      </div>
      {data.price != null && (
        <p className="text-xs text-[#888]">
          Price: <span className="font-mono font-semibold text-terminal-cyan">${data.price?.toFixed(2)}</span>
        </p>
      )}
      <p className="text-xs text-[#888]">
        Change: <span className={`font-mono font-semibold ${isUp ? 'text-terminal-green' : 'text-terminal-red'}`}>
          {isUp ? '+' : ''}{pct?.toFixed(2)}%
        </span>
      </p>
      {data.marketCap != null && (
        <p className="text-xs text-[#888]">
          Market Cap: <span className="font-mono font-semibold text-[#aaa]">
            ${data.marketCap >= 1000 ? (data.marketCap / 1000).toFixed(1) + 'T' : data.marketCap.toFixed(0) + 'B'}
          </span>
        </p>
      )}
    </div>
  );
};

/* ─── Period Options ─── */
const PERIODS = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1mo' },
  { label: 'YTD', value: 'ytd' },
];

/* ═════════ Main Component ═════════ */
export default function SectorTreemap() {
  const [quotes, setQuotes] = useState({});
  const [rangeData, setRangeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('1d');
  const [zoomedSector, setZoomedSector] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const refreshTimerRef = useRef(null);

  // All tickers flat
  const allTickers = useMemo(() => {
    return Object.values(SP500_SECTORS).flatMap(s => s.tickers);
  }, []);

  /* ─── Fetch Data ─── */
  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const data = await fetchBatchQuotes(allTickers);
      setQuotes(data);
      setLastUpdated(new Date());

      // If a non-1d/1w period is active, fetch range data
      if (activePeriod === '1mo' || activePeriod === 'ytd') {
        const range = activePeriod === 'ytd' ? 'ytd' : '1mo';
        const rd = await fetchRangeQuotes(allTickers, range);
        setRangeData(rd);
      }
    } catch (e) {
      setError('데이터 로딩 실패. 잠시 후 다시 시도됩니다.');
      console.error('Treemap fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [allTickers, activePeriod]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    refreshTimerRef.current = setInterval(() => fetchData(false), 5 * 60 * 1000);
    return () => clearInterval(refreshTimerRef.current);
  }, [fetchData]);

  /* ─── Period change handler ─── */
  const handlePeriodChange = useCallback(async (period) => {
    setActivePeriod(period);
    if (period === '1mo' || period === 'ytd') {
      setLoading(true);
      try {
        const range = period === 'ytd' ? 'ytd' : '1mo';
        const rd = await fetchRangeQuotes(allTickers, range);
        setRangeData(rd);
      } catch (e) {
        console.error('Range fetch error:', e);
      } finally {
        setLoading(false);
      }
    }
  }, [allTickers]);

  /* ─── Get change % based on active period ─── */
  const getChangePct = useCallback((ticker) => {
    const q = quotes[ticker];
    if (!q) return null;

    switch (activePeriod) {
      case '1d':
        return q.dayChange;
      case '1w':
        return q.weekChange;
      case '1mo':
      case 'ytd':
        return rangeData[ticker]?.change ?? q.dayChange;
      default:
        return q.dayChange;
    }
  }, [quotes, activePeriod, rangeData]);

  /* ─── Build treemap data ─── */
  const treemapData = useMemo(() => {
    const sectors = zoomedSector
      ? { [zoomedSector]: SP500_SECTORS[zoomedSector] }
      : SP500_SECTORS;

    const children = Object.entries(sectors).map(([sectorName, { tickers, color }]) => {
      const sectorChildren = tickers
        .map(ticker => {
          const changePct = getChangePct(ticker);
          const marketCap = MARKET_CAPS[ticker] || 50;
          return {
            name: ticker,
            ticker,
            sectorName,
            size: marketCap,
            marketCap,
            changePct: changePct ?? 0,
            price: quotes[ticker]?.price,
            color: getPerformanceColor(changePct),
          };
        })
        .sort((a, b) => b.size - a.size);

      return {
        name: sectorName,
        children: sectorChildren,
      };
    });

    return children;
  }, [quotes, rangeData, activePeriod, zoomedSector, getChangePct]);

  /* ─── Sector summary stats ─── */
  const sectorSummary = useMemo(() => {
    return Object.entries(SP500_SECTORS).map(([name, { tickers }]) => {
      const changes = tickers
        .map(t => getChangePct(t))
        .filter(c => c != null);
      const avg = changes.length > 0
        ? changes.reduce((a, b) => a + b, 0) / changes.length
        : 0;
      return { name, avg, count: changes.length };
    }).sort((a, b) => b.avg - a.avg);
  }, [getChangePct]);

  /* ─── Cell click handler ─── */
  const handleCellClick = useCallback((ticker) => {
    // Could link to main calculator in the future
  }, []);

  const hasData = Object.keys(quotes).length > 0;

  return (
    <div className="animate-fade-in">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Period Toggle */}
          <div className="flex bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer border-r border-[#2a2a2a] last:border-r-0 ${
                  activePeriod === p.value
                    ? 'bg-terminal-green/20 text-terminal-green'
                    : 'text-[#666] hover:text-[#aaa] hover:bg-[#111]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          {zoomedSector ? (
            <button onClick={() => setZoomedSector(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-terminal-blue/10 border border-terminal-blue/30 text-terminal-blue rounded-lg cursor-pointer hover:bg-terminal-blue/20 transition-all">
              <ZoomOut size={12} />
              All Sectors
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {/* Last updated */}
          {lastUpdated && (
            <span className="text-[10px] text-[#444] font-mono flex items-center gap-1">
              <Clock size={10} />
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          {/* Refresh */}
          <button onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#666] bg-[#111] border border-[#2a2a2a] rounded-lg cursor-pointer hover:text-[#aaa] hover:border-[#444] transition-all disabled:opacity-40">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-terminal-red/10 border border-terminal-red/30 rounded-xl p-3 mb-4 text-xs text-terminal-red">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && !hasData && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin text-terminal-green" />
          <p className="text-sm text-[#555] font-mono">Loading S&P 500 sector data...</p>
          <p className="text-xs text-[#444] font-mono">50 stocks • 11 sectors</p>
        </div>
      )}

      {/* Treemap */}
      {hasData && (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-[#0a0a0a]/60 z-10 flex items-center justify-center rounded-xl">
              <Loader2 size={24} className="animate-spin text-terminal-green" />
            </div>
          )}
          <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-2 mb-4">
            <ResponsiveContainer width="100%" height={520}>
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#0a0a0a"
                content={<CustomTreemapContent
                  zoomedSector={zoomedSector}
                  onCellClick={handleCellClick}
                />}
                isAnimationActive={false}
              >
                <Tooltip content={<TreemapTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Sector Summary Bar */}
      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-1.5">
          {sectorSummary.map(({ name, avg }) => {
            const isUp = avg >= 0;
            const isActive = zoomedSector === name;
            return (
              <button key={name}
                onClick={() => setZoomedSector(isActive ? null : name)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-center transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-terminal-blue/15 border-terminal-blue/40'
                    : 'bg-[#111] border-[#1e1e1e] hover:border-[#333] hover:bg-[#1a1a1a]'
                }`}>
                <span className="text-[9px] text-[#666] font-mono leading-tight truncate w-full">
                  {name.length > 12 ? name.slice(0, 10) + '…' : name}
                </span>
                <span className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                  isUp ? 'text-terminal-green' : 'text-terminal-red'
                }`}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{avg.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Color Legend */}
      {hasData && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <span className="text-[10px] text-[#555] font-mono mr-1">-5%</span>
          {[
            '#b91c1c', '#dc2626', '#ef4444', '#7f1d1d', '#374151',
            '#14532d', '#22c55e', '#16a34a', '#15803d'
          ].map((color, i) => (
            <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: color }} />
          ))}
          <span className="text-[10px] text-[#555] font-mono ml-1">+5%</span>
        </div>
      )}
    </div>
  );
}
