import React, { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ComposedChart
} from 'recharts';
import { Combine, Loader2, AlertTriangle, Plus, Trash2, PieChart } from 'lucide-react';

import { fmt, fmtPct, defaultStart, defaultEnd } from '../utils/format';
import { fetchStockData } from '../utils/calculate';

const CustomTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs text-[#888] font-mono mb-2">{d.date}</p>
      <p className="text-xs text-terminal-text font-bold mb-1">
        Portfolio: <span className="text-terminal-amber">{fmt(d.value, currency)}</span>
      </p>
      <p className="text-xs text-[#888]">
        Return: <span className={d.returnPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}>{fmtPct(d.returnPct)}</span>
      </p>
      <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
        {Object.keys(d.assets).map(t => (
          <p key={t} className="text-[10px] text-[#666] font-mono flex justify-between gap-4">
            <span>{t}</span>
            <span>{fmt(d.assets[t], currency)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

export default function PortfolioSimulator() {
  const [assets, setAssets] = useState([
    { ticker: 'AAPL', weight: 60 },
    { ticker: 'TSLA', weight: 40 }
  ]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setFullYear(d.getFullYear() - 3); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(defaultEnd());
  const [amount, setAmount] = useState(10000);
  const [currency, setCurrency] = useState('USD');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);

  const updateAsset = (i, field, val) => {
    const newA = [...assets];
    newA[i][field] = val;
    setAssets(newA);
  };
  const addAsset = () => {
    if (assets.length >= 5) return;
    setAssets([...assets, { ticker: '', weight: 0 }]);
  };
  const removeAsset = (i) => {
    setAssets(assets.filter((_, idx) => idx !== i));
  };

  const calculate = useCallback(async () => {
    setError(''); setChartData(null); setSummary(null);
    const totalWeight = assets.reduce((s, a) => s + Number(a.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.1) {
      setError('총 비중은 100%여야 합니다.'); return;
    }
    const cleanAssets = assets.filter(a => a.ticker.trim() && a.weight > 0);
    if (cleanAssets.length === 0) { setError('유효한 종목을 입력하세요.'); return; }

    setLoading(true);
    try {
      // 1. Fetch all
      const rawMap = {};
      for (const a of cleanAssets) {
        const { timestamps, closes } = await fetchStockData(a.ticker, startDate, endDate);
        const dates = {};
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] != null) {
            const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            dates[dateStr] = closes[i];
          }
        }
        rawMap[a.ticker.toUpperCase()] = dates;
      }

      // 2. Find intersection of dates
      const allTickers = Object.keys(rawMap);
      let commonDates = Object.keys(rawMap[allTickers[0]]);
      for (let i = 1; i < allTickers.length; i++) {
        const dSet = new Set(Object.keys(rawMap[allTickers[i]]));
        commonDates = commonDates.filter(d => dSet.has(d));
      }
      commonDates.sort();

      if (commonDates.length === 0) {
        throw new Error('선택한 기간 동안 모든 종목의 데이터가 겹치는 날짜가 없습니다.');
      }

      // 3. Initial Shares (Buy & Hold)
      const firstDate = commonDates[0];
      const initialShares = {};
      for (const t of allTickers) {
        const w = cleanAssets.find(a => a.ticker.toUpperCase() === t).weight / 100;
        const initialPrice = rawMap[t][firstDate];
        initialShares[t] = (amount * w) / initialPrice;
      }

      // 4. Calculate points
      const points = [];
      for (const d of commonDates) {
        let totalVal = 0;
        const assetVals = {};
        for (const t of allTickers) {
          const v = initialShares[t] * rawMap[t][d];
          assetVals[t] = v;
          totalVal += v;
        }
        points.push({
          date: d,
          value: totalVal,
          returnPct: ((totalVal - amount) / amount) * 100,
          assets: assetVals
        });
      }

      setChartData(points);
      const last = points[points.length - 1];
      
      // Calculate current actual weights due to drift
      const finalWgts = {};
      for (const t of allTickers) {
        finalWgts[t] = (last.assets[t] / last.value) * 100;
      }

      setSummary({
        totalReturn: last.returnPct,
        finalValue: last.value,
        finalWgts
      });

    } catch (e) {
      setError(`오류 발생: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [assets, startDate, endDate, amount]);

  return (
    <div className="animate-fade-in">
      <div className="bg-[#111] border border-terminal-amber/30 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-terminal-amber mb-4 flex items-center gap-2">
          <Combine size={16} /> Multi-Asset Portfolio Simulator
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#0a0a0a] rounded-xl border border-[#1e1e1e] p-4">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs text-[#666] uppercase">Assets (Max 5)</span>
              <span className={`text-xs font-mono font-bold ${
                assets.reduce((s, a) => s + Number(a.weight || 0), 0) === 100 ? 'text-terminal-green' : 'text-terminal-red'
              }`}>
                Total: {assets.reduce((s, a) => s + Number(a.weight || 0), 0)}%
              </span>
            </div>
            
            <div className="space-y-2">
              {assets.map((a, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="Ticker" value={a.ticker} onChange={e => updateAsset(i, 'ticker', e.target.value.toUpperCase())}
                    className="w-1/2 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 font-mono text-sm focus:border-terminal-amber" />
                  <div className="relative w-1/2">
                    <input type="number" placeholder="Weight" value={a.weight} onChange={e => updateAsset(i, 'weight', e.target.value)}
                      className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 font-mono text-sm text-terminal-amber focus:border-terminal-amber" />
                    <span className="absolute right-3 top-2 text-[#555] text-sm">%</span>
                  </div>
                  <button onClick={() => removeAsset(i)} disabled={assets.length <= 1} className="p-2 text-[#555] hover:text-terminal-red disabled:opacity-20 cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            {assets.length < 5 && (
              <button onClick={addAsset} className="mt-3 flex items-center gap-1 text-xs text-[#666] hover:text-terminal-amber transition-colors cursor-pointer">
                <Plus size={14} /> Add Asset
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#666] uppercase mb-1 block">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 font-mono text-sm focus:border-terminal-amber" />
            </div>
            <div>
              <label className="text-xs text-[#666] uppercase mb-1 block">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 font-mono text-sm focus:border-terminal-amber" />
            </div>
            <div>
              <label className="text-xs text-[#666] uppercase mb-1 block">Initial Amount</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 font-mono text-sm focus:border-terminal-amber" />
            </div>
            <button onClick={calculate} disabled={loading}
              className="w-full bg-terminal-amber/10 border border-terminal-amber/30 text-terminal-amber rounded-lg py-2.5 mt-2 text-sm font-semibold hover:bg-terminal-amber/20 cursor-pointer disabled:opacity-50">
              {loading ? 'Building...' : 'Build Portfolio'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="text-terminal-red text-sm mb-4">{error}</div>}

      {summary && chartData && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#111] border border-[#1e1e1e] p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-[#888] mb-1">Final Value</h3>
              <p className={`text-2xl font-mono font-bold ${summary.totalReturn >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {fmt(summary.finalValue, currency)}
              </p>
              <p className={`text-sm ${summary.totalReturn >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {fmtPct(summary.totalReturn)} Return
              </p>
            </div>
            
            <div className="bg-[#111] border border-[#1e1e1e] p-5 rounded-2xl">
              <h3 className="text-sm font-bold text-[#888] mb-4 flex items-center gap-2"><PieChart size={14}/> Final Drift Weights</h3>
              <div className="space-y-3">
                {Object.keys(summary.finalWgts).map(t => (
                  <div key={t}>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="font-bold text-[#bbb]">{t}</span>
                      <span className="text-terminal-amber">{summary.finalWgts[t].toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-terminal-amber" style={{ width: `${summary.finalWgts[t]}%`}}></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#555] mt-4">Due to differing asset growth (Buy & Hold), original weights drift over time.</p>
            </div>
          </div>

          <div className="lg:col-span-3 bg-[#111] border border-[#1e1e1e] rounded-2xl p-5" style={{ minHeight: 400 }}>
            <h3 className="text-lg font-bold mb-4">Portfolio Growth</h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d26a" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00d26a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b3b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ff3b3b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} minTickGap={50} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} 
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <ReferenceLine y={amount} stroke="#444" strokeDasharray="5 5" label={{ value: 'Inv', fill: '#666', fontSize: 10 }} />
                <Area type="monotone" dataKey="value" stroke={summary.totalReturn >= 0 ? '#00d26a' : '#ff3b3b'} strokeWidth={2}
                  fill={summary.totalReturn >= 0 ? 'url(#gradPos)' : 'url(#gradNeg)'} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
