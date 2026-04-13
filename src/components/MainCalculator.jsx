import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Line, ComposedChart
} from 'recharts';
import {
  Search, Download, TrendingUp, TrendingDown, Calendar, DollarSign,
  BarChart3, Activity, Loader2, AlertTriangle, Shield, Gauge,
  Link2, Check, Repeat
} from 'lucide-react';

import { fmt, fmtPct, defaultStart, defaultEnd } from '../utils/format';
import {
  fetchStockData, calculateReturns, calculateDCA,
  getBenchmarkTicker, calculateNormalizedReturns
} from '../utils/calculate';
import { downloadPDF } from '../utils/pdfExport';
import BenchmarkChart, { BenchmarkSelector, BENCHMARK_PRESETS } from './BenchmarkChart';
import ReturnsHeatmap from './ReturnsHeatmap';
import DataTable from './DataTable';

/* ───────── URL Params ───────── */
const getParam = (key, fallback) => {
  const p = new URLSearchParams(window.location.search);
  return p.get(key) || fallback;
};

/* ───────── Custom Tooltip ───────── */
const CustomTooltip = ({ active, payload, currency, investMode }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs text-[#888] font-mono mb-1">{d.date}</p>
      <p className="text-xs text-[#888]">
        Price: <span className="text-terminal-cyan font-mono font-semibold">{fmt(d.price, currency)}</span>
      </p>
      <p className="text-xs text-[#888]">
        Portfolio: <span className={`font-mono font-semibold ${d.value >= d.invested ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmt(d.value, currency)}</span>
      </p>
      <p className="text-xs text-[#888]">
        Return: <span className={`font-mono font-semibold ${d.returnPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmtPct(d.returnPct)}</span>
      </p>
      {investMode === 'dca' && d.dcaValue != null && (
        <p className="text-xs text-[#888] mt-1 border-t border-[#2a2a2a] pt-1">
          DCA: <span className={`font-mono font-semibold ${d.dcaValue >= d.dcaInvested ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmt(d.dcaValue, currency)}</span>
        </p>
      )}
    </div>
  );
};

/* ───────── Summary Card ───────── */
const SummaryCard = ({ icon: Icon, label, value, sub, color = 'text-terminal-text', delay = 0 }) => (
  <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#333] transition-all duration-300 animate-fade-in"
    style={{ animationDelay: `${delay}ms` }}>
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-[#555]" />
      <span className="text-xs text-[#666] uppercase tracking-wider">{label}</span>
    </div>
    <p className={`font-mono text-xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-[#555] font-mono mt-1">{sub}</p>}
  </div>
);

/* ───────── Period Presets ───────── */
const PRESETS = [
  { label: '1M', months: 1 }, { label: '3M', months: 3 }, { label: '6M', months: 6 },
  { label: 'YTD', months: 0 }, { label: '1Y', months: 12 }, { label: '3Y', months: 36 },
  { label: '5Y', months: 60 }, { label: 'MAX', months: 120 },
];

const PeriodPresets = ({ setStartDate, setEndDate, activePreset, setActivePreset }) => (
  <div className="flex flex-wrap gap-1.5 mt-3">
    {PRESETS.map(p => {
      const active = activePreset === p.label;
      return (
        <button key={p.label} onClick={() => {
          const now = new Date();
          let start;
          if (p.label === 'YTD') {
            start = new Date(now.getFullYear(), 0, 1);
          } else {
            start = new Date(now);
            start.setMonth(start.getMonth() - p.months);
          }
          setStartDate(start.toISOString().split('T')[0]);
          setEndDate(now.toISOString().split('T')[0]);
          setActivePreset(p.label);
        }}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 cursor-pointer border ${
            active
              ? 'bg-terminal-green/20 border-terminal-green/50 text-terminal-green'
              : 'bg-[#0a0a0a] border-[#2a2a2a] text-[#666] hover:text-[#aaa] hover:border-[#444]'
          }`}
        >
          {p.label}
        </button>
      );
    })}
  </div>
);

/* ═══════════════════════════════ APP ═══════════════════════════════ */
export default function MainCalculator() {
  const [ticker, setTicker] = useState(() => getParam('ticker', 'AAPL'));
  const [startDate, setStartDate] = useState(() => getParam('start', defaultStart()));
  const [endDate, setEndDate] = useState(() => getParam('end', defaultEnd()));
  const [amount, setAmount] = useState(() => Number(getParam('amount', '10000')));
  const [currency, setCurrency] = useState(() => getParam('currency', 'USD'));
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);

  /* New state */
  const [investMode, setInvestMode] = useState('lump');
  const [monthlyAmount, setMonthlyAmount] = useState(1000);
  const [dcaData, setDcaData] = useState(null);
  const [dcaSummary, setDcaSummary] = useState(null);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState([]);
  const [benchmarkDatasets, setBenchmarkDatasets] = useState([]);
  const [rawStockData, setRawStockData] = useState(null);
  const [activePreset, setActivePreset] = useState('1Y');

  /* ─── Fetch Benchmarks ─── */
  const fetchBenchmarks = useCallback(async (bmsToFetch, stockT, stockC, sDate, eDate) => {
    if (!bmsToFetch.length) {
      setBenchmarkDatasets([]);
      return;
    }
    const stockNorm = calculateNormalizedReturns(stockT, stockC);
    const bmsData = [];
    for (const bm of bmsToFetch) {
      try {
        const bmRaw = await fetchStockData(bm, sDate, eDate);
        const bmNorm = calculateNormalizedReturns(bmRaw.timestamps, bmRaw.closes);
        const preset = BENCHMARK_PRESETS.find(p => p.value === bm);
        bmsData.push({
          ticker: bm,
          label: preset ? preset.label : bm,
          data: bmNorm,
          stockData: stockNorm,
        });
      } catch (e) {
        console.error(`Failed to fetch benchmark ${bm}`, e);
      }
    }
    setBenchmarkDatasets(bmsData);
  }, []);

  const handleToggleBenchmark = useCallback(async (bm) => {
    let newBms = [];
    if (selectedBenchmarks.includes(bm)) {
      newBms = selectedBenchmarks.filter(b => b !== bm);
    } else {
      if (selectedBenchmarks.length >= 5) {
        alert("Maximum 5 benchmarks allowed");
        return;
      }
      newBms = [...selectedBenchmarks, bm];
    }
    setSelectedBenchmarks(newBms);
    if (rawStockData && !loading) {
      await fetchBenchmarks(newBms, rawStockData.timestamps, rawStockData.closes, startDate, endDate);
    }
  }, [selectedBenchmarks, rawStockData, startDate, endDate, loading, fetchBenchmarks]);
  const [copied, setCopied] = useState(false);

  const chartRef = useRef(null);

  /* ─── Main Calculate ─── */
  const calculate = useCallback(async () => {
    setError('');
    setChartData(null);
    setSummary(null);
    setDcaData(null);
    setDcaSummary(null);
    setBenchmarkDatasets([]);
    if (!ticker.trim()) { setError('종목 코드를 입력하세요.'); return; }
    setLoading(true);

    try {
      const { timestamps, closes } = await fetchStockData(ticker, startDate, endDate);
      setRawStockData({ timestamps, closes });
      const { points, summary: sum } = calculateReturns(timestamps, closes, amount);
      sum.ticker = ticker.trim().toUpperCase();
      sum.startDate = startDate;
      sum.endDate = endDate;
      setChartData(points);
      setSummary(sum);

      // DCA
      const dca = calculateDCA(timestamps, closes, monthlyAmount);
      setDcaData(dca.points);
      setDcaSummary(dca.summary);

      // Benchmark
      let currentBms = selectedBenchmarks;
      if (currentBms.length === 0) {
        currentBms = [getBenchmarkTicker(ticker.trim().toUpperCase())];
        setSelectedBenchmarks(currentBms);
      }
      await fetchBenchmarks(currentBms, timestamps, closes, startDate, endDate);
    } catch (e) {
      setError(`데이터를 가져올 수 없습니다: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [ticker, startDate, endDate, amount, monthlyAmount]);

  useEffect(() => { calculate(); }, []); // eslint-disable-line

  /* ─── PDF ─── */
  const handlePDF = useCallback(async () => {
    if (!summary || !chartRef.current) return;
    setPdfLoading(true);
    setError('');
    try { await downloadPDF(summary, currency, chartRef); }
    catch (e) { setError('PDF 생성에 실패했습니다.'); console.error(e); }
    finally { setPdfLoading(false); }
  }, [summary, currency]);

  /* ─── Share URL ─── */
  const shareURL = useCallback(() => {
    const params = new URLSearchParams({ ticker: ticker.trim().toUpperCase(), start: startDate, end: endDate, amount, currency });
    const url = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [ticker, startDate, endDate, amount, currency]);

  /* ─── Merge chart data with DCA ─── */
  const mergedChartData = React.useMemo(() => {
    if (!chartData) return null;
    if (investMode !== 'dca' || !dcaData) return chartData;
    const dcaMap = new Map(dcaData.map(d => [d.date, d]));
    return chartData.map(d => ({
      ...d,
      dcaValue: dcaMap.get(d.date)?.value ?? null,
      dcaInvested: dcaMap.get(d.date)?.invested ?? null,
    }));
  }, [chartData, dcaData, investMode]);

  const positive = summary ? summary.returnPct >= 0 : true;

  return (
    <div className="animate-fade-in">

      {/* ── INPUT PANEL ── */}
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Ticker */}
          <div>
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1.5 block">Ticker Symbol</label>
            <div className="relative">
              <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input id="ticker-input" type="text" value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg pl-3 pr-9 py-2.5 font-mono text-sm text-terminal-text focus:outline-none focus:border-terminal-green transition-colors" />
            </div>
          </div>
          {/* Start */}
          <div>
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1.5 block">Start Date</label>
            <input id="start-date" type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(''); }}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm text-terminal-text focus:outline-none focus:border-terminal-green transition-colors" />
          </div>
          {/* End */}
          <div>
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1.5 block">End Date</label>
            <input id="end-date" type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(''); }}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm text-terminal-text focus:outline-none focus:border-terminal-green transition-colors" />
          </div>
          {/* Amount */}
          <div>
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1.5 block">
              {investMode === 'dca' ? 'Monthly Amount' : 'Investment'}
            </label>
            <div className="flex gap-0">
              <input id="investment-amount" type="number"
                value={investMode === 'dca' ? monthlyAmount : amount}
                onChange={e => investMode === 'dca' ? setMonthlyAmount(Number(e.target.value)) : setAmount(Number(e.target.value))}
                className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#2a2a2a] rounded-l-lg px-3 py-2.5 font-mono text-sm text-terminal-text focus:outline-none focus:border-terminal-green transition-colors" />
              <button id="currency-toggle" onClick={() => setCurrency(c => c === 'USD' ? 'KRW' : 'USD')}
                className="px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] border-l-0 rounded-r-lg text-xs font-mono font-bold text-terminal-amber hover:bg-[#222] transition-colors cursor-pointer">
                {currency}
              </button>
            </div>
          </div>
          {/* Calculate */}
          <div>
            <button id="calculate-btn" onClick={calculate} disabled={loading}
              className="w-full bg-terminal-green/10 border border-terminal-green/30 text-terminal-green rounded-lg py-2.5 text-sm font-semibold hover:bg-terminal-green/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              {loading ? 'Loading...' : 'Calculate'}
            </button>
          </div>
        </div>

        {/* Period Presets */}
        <PeriodPresets setStartDate={setStartDate} setEndDate={setEndDate} activePreset={activePreset} setActivePreset={setActivePreset} />

        {/* Invest Mode Toggle */}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-xs text-[#666] uppercase tracking-wider">Mode:</span>
          <div className="flex bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <button onClick={() => setInvestMode('lump')}
              className={`px-4 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer ${investMode === 'lump' ? 'bg-terminal-blue/20 text-terminal-blue' : 'text-[#666] hover:text-[#aaa]'}`}>
              Lump Sum
            </button>
            <button onClick={() => setInvestMode('dca')}
              className={`px-4 py-1.5 text-xs font-mono font-semibold transition-all cursor-pointer border-l border-[#2a2a2a] ${investMode === 'dca' ? 'bg-terminal-amber/20 text-terminal-amber' : 'text-[#666] hover:text-[#aaa]'}`}>
              <Repeat size={12} className="inline mr-1" />DCA
            </button>
          </div>
          {investMode === 'dca' && (
            <span className="text-xs text-[#555] font-mono animate-fade-in">Monthly {fmt(monthlyAmount, currency)}</span>
          )}
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="bg-terminal-red/10 border border-terminal-red/30 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} className="text-terminal-red flex-shrink-0" />
          <span className="text-sm text-terminal-red">{error}</span>
        </div>
      )}

      {/* ── RESULTS ── */}
      {mergedChartData && summary && (
        <div className="animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <SummaryCard icon={DollarSign} label={currency === 'KRW' ? '최종 가치' : 'Final Value'}
              value={`${fmt(summary.finalValue, currency)} ${currency}`} sub={`from ${fmt(summary.invested, currency)} ${currency}`}
              color={positive ? 'text-terminal-green' : 'text-terminal-red'} delay={0} />
            <SummaryCard icon={positive ? TrendingUp : TrendingDown} label={currency === 'KRW' ? '총 손익' : 'Total P&L'}
              value={`${fmt(summary.totalPL, currency)} ${currency}`} color={positive ? 'text-terminal-green' : 'text-terminal-red'} delay={50} />
            <SummaryCard icon={Activity} label={currency === 'KRW' ? '수익률' : 'Return Rate'}
              value={fmtPct(summary.returnPct)} color={positive ? 'text-terminal-green' : 'text-terminal-red'} delay={100} />
            <SummaryCard icon={Calendar} label={currency === 'KRW' ? '거래일 수' : 'Trading Days'}
              value={`${summary.tradingDays}`} sub={`${summary.startDate} → ${summary.endDate}`} delay={150} />
            <SummaryCard icon={TrendingUp} label={currency === 'KRW' ? '최고 수익일' : 'Best Day'}
              value={fmtPct(summary.bestDay.pct)} sub={summary.bestDay.date} color="text-terminal-green" delay={200} />
            <SummaryCard icon={TrendingDown} label={currency === 'KRW' ? '최악의 날' : 'Worst Day'}
              value={fmtPct(summary.worstDay.pct)} sub={summary.worstDay.date} color="text-terminal-red" delay={250} />
            <SummaryCard icon={Shield} label="Max Drawdown"
              value={fmtPct(summary.mdd?.pct)} sub={summary.mdd?.date} color="text-terminal-red" delay={300} />
            <SummaryCard icon={Gauge} label="Sharpe Ratio"
              value={summary.sharpeRatio?.toFixed(2) || '—'}
              sub={summary.sharpeRatio >= 1 ? 'Good' : summary.sharpeRatio >= 0 ? 'Moderate' : 'Poor'}
              color={summary.sharpeRatio >= 1 ? 'text-terminal-green' : summary.sharpeRatio >= 0 ? 'text-terminal-amber' : 'text-terminal-red'} delay={350} />
          </div>

          {/* DCA Summary (if active) */}
          {investMode === 'dca' && dcaSummary && (
            <div className="bg-[#111] border border-terminal-amber/30 rounded-2xl p-5 mb-6 animate-fade-in">
              <h3 className="text-sm font-bold text-terminal-amber mb-3 flex items-center gap-2">
                <Repeat size={16} /> DCA Results (Monthly {fmt(monthlyAmount, currency)})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-[#666] text-xs block">Total Invested</span>
                  <span className="font-mono font-bold text-terminal-text">{fmt(dcaSummary.totalInvested, currency)}</span>
                </div>
                <div>
                  <span className="text-[#666] text-xs block">Final Value</span>
                  <span className={`font-mono font-bold ${dcaSummary.returnPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmt(dcaSummary.finalValue, currency)}</span>
                </div>
                <div>
                  <span className="text-[#666] text-xs block">DCA Return</span>
                  <span className={`font-mono font-bold ${dcaSummary.returnPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmtPct(dcaSummary.returnPct)}</span>
                </div>
                <div>
                  <span className="text-[#666] text-xs block">Avg Cost/Share</span>
                  <span className="font-mono font-bold text-terminal-cyan">{fmt(dcaSummary.avgCost, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Chart + Donation */}
          <div className="flex gap-4 mb-6">
            <div className="hidden md:flex flex-col items-center gap-3 pt-14">
              <a href="https://nowpayments.io/donation?api_key=b4c4c52c-26bb-4923-8ae6-31e420434fd1" target="_blank" rel="noreferrer noopener">
                <img src="https://nowpayments.io/images/embeds/donation-button-black.svg" alt="Crypto donation" className="h-[60px] rounded-lg hover:opacity-80 transition-opacity" />
              </a>
            </div>
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 flex-1 min-w-0" ref={chartRef}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{summary.ticker} <span className="text-[#555] text-sm font-normal">Portfolio Value</span></h2>
                <div className={`font-mono text-sm font-bold px-3 py-1 rounded-full ${positive ? 'bg-terminal-green/10 text-terminal-green' : 'bg-terminal-red/10 text-terminal-red'}`}>
                  {fmtPct(summary.returnPct)}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={mergedChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d26a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00d26a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff3b3b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ff3b3b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                    tickLine={false} axisLine={{ stroke: '#1e1e1e' }} minTickGap={60} />
                  <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => {
                      const a = Math.abs(v);
                      const s = currency === 'KRW' ? '₩' : '$';
                      if (a >= 1e9) return `${s}${(v/1e9).toFixed(1)}B`;
                      if (a >= 1e6) return `${s}${(v/1e6).toFixed(1)}M`;
                      if (a >= 1e3) return `${s}${(v/1e3).toFixed(1)}K`;
                      if (a >= 1) return `${s}${v.toFixed(0)}`;
                      if (a >= 0.01) return `${s}${v.toFixed(2)}`;
                      return `${s}${v.toFixed(4)}`;
                    }} />
                  <Tooltip content={<CustomTooltip currency={currency} investMode={investMode} />} />
                  <ReferenceLine y={amount} stroke="#333" strokeDasharray="6 4" label={{ value: 'Invested', fill: '#555', fontSize: 10 }} />
                  <Area type="monotone" dataKey="value"
                    stroke={positive ? '#00d26a' : '#ff3b3b'} strokeWidth={2}
                    fill={positive ? 'url(#gradGreen)' : 'url(#gradRed)'}
                    dot={false} activeDot={{ r: 4, fill: positive ? '#00d26a' : '#ff3b3b', strokeWidth: 0 }} />
                  {investMode === 'dca' && (
                    <Line type="monotone" dataKey="dcaValue" stroke="#ffb700" strokeWidth={2}
                      strokeDasharray="6 3" dot={false} name="DCA" />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mobile donation */}
          <div className="flex md:hidden justify-center mb-4">
            <a href="https://nowpayments.io/donation?api_key=b4c4c52c-26bb-4923-8ae6-31e420434fd1" target="_blank" rel="noreferrer noopener">
              <img src="https://nowpayments.io/images/embeds/donation-button-black.svg" alt="Crypto donation" className="h-[60px] rounded-lg hover:opacity-80 transition-opacity" />
            </a>
          </div>

          {/* Benchmark Selector & Chart */}
          <div className="mt-8 mb-6">
            <BenchmarkSelector
              selectedBenchmarks={selectedBenchmarks}
              onToggle={handleToggleBenchmark}
              onAddCustom={handleToggleBenchmark}
              ticker={summary.ticker}
            />
            <BenchmarkChart benchmarks={benchmarkDatasets} ticker={summary.ticker} />
          </div>

          {/* Returns Heatmap */}
          <ReturnsHeatmap chartData={chartData} />

          {/* Data Table */}
          <DataTable chartData={chartData} currency={currency} />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button onClick={shareURL}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl px-6 py-3 text-sm font-semibold hover:bg-[#1a1a1a] hover:border-[#444] transition-all duration-200 flex items-center gap-2 cursor-pointer">
              {copied ? <Check size={16} className="text-terminal-green" /> : <Link2 size={16} />}
              {copied ? 'Copied!' : 'Share Link'}
            </button>
            <button id="download-pdf-btn" onClick={handlePDF} disabled={pdfLoading}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl px-6 py-3 text-sm font-semibold hover:bg-[#1a1a1a] hover:border-[#444] transition-all duration-200 flex items-center gap-2 cursor-pointer disabled:opacity-50">
              {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {pdfLoading ? 'PDF 생성 중...' : 'Download Report (PDF)'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!chartData && !loading && !error && (
        <div className="text-center py-24 animate-fade-in">
          <BarChart3 size={48} className="mx-auto text-[#222] mb-4" />
          <p className="text-[#444] text-sm">종목 코드와 기간을 입력하고 <span className="text-terminal-green font-semibold">Calculate</span>을 눌러주세요</p>
          <p className="text-[#333] text-xs mt-1">Enter a ticker symbol and date range, then press Calculate</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="loading-shimmer rounded-xl h-28" />)}
          </div>
          <div className="loading-shimmer rounded-2xl h-[400px]" />
        </div>
      )}


    </div>
  );
}
