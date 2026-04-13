import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Line, ComposedChart
} from 'recharts';
import { Search, BarChart3, Loader2, AlertTriangle, Repeat, LineChart } from 'lucide-react';

import { fmt, fmtPct, defaultStart, defaultEnd } from '../utils/format';
import { fetchStockData } from '../utils/calculate';

const PRESETS = [
  { label: '1Y', months: 12 }, { label: '3Y', months: 36 },
  { label: '5Y', months: 60 }, { label: 'MAX', months: 120 },
];

const CustomTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs text-[#888] font-mono mb-1">{d.date}</p>
      <p className="text-xs text-[#888]">Price: <span className="text-terminal-cyan font-mono font-semibold">{fmt(d.price, currency)}</span></p>
      <p className="text-xs text-[#888]">No DRIP: <span className="font-mono font-semibold text-[#ccc]">{fmt(d.noDripValue, currency)}</span></p>
      <p className="text-xs text-[#888] border-t border-[#2a2a2a] mt-1 pt-1">
        With DRIP: <span className="font-mono font-semibold text-terminal-blue">{fmt(d.dripValue, currency)}</span>
      </p>
      <p className="text-xs text-[#888]">Shares: <span className="font-mono text-terminal-amber">{d.shares.toFixed(2)}</span></p>
    </div>
  );
};

export default function DripCalculator() {
  const [ticker, setTicker] = useState('SCHD');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 5);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(defaultEnd());
  const [amount, setAmount] = useState(10000);
  const [yieldPct, setYieldPct] = useState(3.5); // Expected Annual Dividend Yield
  const [currency, setCurrency] = useState('USD');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);

  const calculate = useCallback(async () => {
    setError(''); setChartData(null); setSummary(null);
    if (!ticker.trim()) { setError('종목 코드를 입력하세요.'); return; }
    setLoading(true);

    try {
      const { timestamps, closes } = await fetchStockData(ticker, startDate, endDate);
      const points = [];
      const initialPrice = closes[0];
      const initialShares = amount / initialPrice;
      
      let currentShares = initialShares;
      const dailyYieldRate = (yieldPct / 100) / 252; // roughly 252 trading days

      for (let i = 0; i < timestamps.length; i++) {
        if (closes[i] == null) continue;
        
        // Compound shares daily. In reality dividends are quarterly, but daily compounding is a smooth approximation.
        if (i > 0) currentShares *= (1 + dailyYieldRate);
        
        const noDripValue = initialShares * closes[i];
        const dripValue = currentShares * closes[i];
        
        // Format date
        const d = new Date(timestamps[i] * 1000);
        const dateStr = d.toISOString().split('T')[0];
        
        points.push({
          date: dateStr,
          price: closes[i],
          noDripValue,
          dripValue,
          shares: currentShares,
        });
      }

      setChartData(points);
      const last = points[points.length - 1];
      setSummary({
        ticker: ticker.toUpperCase(),
        initialShares,
        finalShares: last.shares,
        noDripValue: last.noDripValue,
        dripValue: last.dripValue,
        dripReturn: ((last.dripValue - amount) / amount) * 100,
        noDripReturn: ((last.noDripValue - amount) / amount) * 100,
      });

    } catch (e) {
      setError(`데이터를 가져올 수 없습니다: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [ticker, startDate, endDate, amount, yieldPct]);

  useEffect(() => { calculate(); }, []);

  return (
    <div className="animate-fade-in">
      <div className="bg-[#111] border border-terminal-blue/30 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-terminal-blue mb-4 flex items-center gap-2">
          <LineChart size={16} /> Dividend Reinvestment Plan (DRIP) Simulator
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1 block">Ticker</label>
            <input type="text" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm focus:border-terminal-blue" />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1 block">Yield (%)</label>
            <input type="number" step="0.1" value={yieldPct} onChange={e => setYieldPct(Number(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm text-terminal-amber focus:border-terminal-blue" />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1 block">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm focus:border-terminal-blue" />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1 block">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm focus:border-terminal-blue" />
          </div>
          <div className="lg:col-span-1">
            <label className="text-xs text-[#666] uppercase tracking-wider mb-1 block">Initial Inv.</label>
            <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm focus:border-terminal-blue" />
          </div>
          <div className="lg:col-span-1">
            <button onClick={calculate} disabled={loading}
              className="w-full bg-terminal-blue/10 border border-terminal-blue/30 text-terminal-blue rounded-lg py-2.5 text-sm font-semibold hover:bg-terminal-blue/20 cursor-pointer disabled:opacity-50">
              {loading ? '...' : 'Simulate'}
            </button>
          </div>
        </div>
        <p className="text-[#555] text-xs mt-3">Simulates the power of compounding by automatically reinvesting a fixed annual dividend yield. Uses smooth daily compounding approximation.</p>
      </div>

      {error && <div className="text-terminal-red text-sm mb-4">{error}</div>}

      {summary && chartData && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#111] p-4 rounded-xl border border-[#1e1e1e]">
              <span className="text-xs text-[#666]">Value w/ DRIP</span>
              <p className="text-xl font-bold font-mono text-terminal-blue">{fmt(summary.dripValue, currency)}</p>
              <p className="text-xs text-terminal-green mt-1">{fmtPct(summary.dripReturn)} return</p>
            </div>
            <div className="bg-[#111] p-4 rounded-xl border border-[#1e1e1e]">
              <span className="text-xs text-[#666]">Value w/o DRIP</span>
              <p className="text-xl font-bold font-mono text-[#ccc]">{fmt(summary.noDripValue, currency)}</p>
              <p className="text-xs text-[#888] mt-1">{fmtPct(summary.noDripReturn)} return</p>
            </div>
            <div className="bg-[#111] p-4 rounded-xl border border-[#1e1e1e]">
              <span className="text-xs text-[#666]">Extra Wealth Generated</span>
              <p className="text-xl font-bold font-mono text-terminal-green">+{fmt(summary.dripValue - summary.noDripValue, currency)}</p>
            </div>
            <div className="bg-[#111] p-4 rounded-xl border border-[#1e1e1e]">
              <span className="text-xs text-[#666]">Shares Accumulated</span>
              <p className="text-xl font-bold font-mono text-terminal-amber">{summary.finalShares.toFixed(2)}</p>
              <p className="text-xs text-[#888] mt-1">started w/ {summary.initialShares.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5" style={{ height: 400 }}>
            <h3 className="text-lg font-bold mb-4">{summary.ticker} <span className="text-[#555] font-normal text-sm">DRIP vs No DRIP</span></h3>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} minTickGap={50} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} 
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Area type="monotone" dataKey="dripValue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.1} strokeWidth={2} name="With DRIP" />
                <Line type="monotone" dataKey="noDripValue" stroke="#666" strokeWidth={2} dot={false} strokeDasharray="5 5" name="No DRIP" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
