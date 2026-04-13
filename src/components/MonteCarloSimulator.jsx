import React, { useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import { Activity, Loader2, AlertTriangle, Info } from 'lucide-react';

import { fmt, fmtPct } from '../utils/format';
import { fetchStockData } from '../utils/calculate';

// Standard Normal Variate using Box-Muller Transform
function randNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const CustomTooltip = ({ active, payload, currency }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  // payload can contain best, median, worst
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs text-[#888] font-mono mb-2">Day ~{d.day} ({Math.round(d.day/252)} yrs)</p>
      <p className="text-xs text-terminal-green font-bold flex justify-between gap-4">
        <span>Top 10% (Best)</span> <span>{fmt(d.best, currency)}</span>
      </p>
      <p className="text-xs text-terminal-blue font-bold flex justify-between gap-4 my-1">
        <span>Median (50%)</span> <span>{fmt(d.median, currency)}</span>
      </p>
      <p className="text-xs text-terminal-red font-bold flex justify-between gap-4">
        <span>Bottom 10% (Worst)</span> <span>{fmt(d.worst, currency)}</span>
      </p>
    </div>
  );
};

export default function MonteCarloSimulator() {
  const [ticker, setTicker] = useState('SPY');
  const [historyYears, setHistoryYears] = useState(5);
  const [forecastYears, setForecastYears] = useState(5);
  const [amount, setAmount] = useState(10000);
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
      // 1. Fetch History
      const now = new Date();
      const endStr = now.toISOString().split('T')[0];
      const start = new Date();
      start.setFullYear(now.getFullYear() - historyYears);
      const startStr = start.toISOString().split('T')[0];

      const { closes } = await fetchStockData(ticker.trim(), startStr, endStr);
      if (closes.length < 50) throw new Error('과거 데이터가 분석하기에 너무 부족합니다 (최소 50일 필요).');

      // 2. Calculate daily returns to find drift and volatility
      const dailyReturns = [];
      for (let i = 1; i < closes.length; i++) {
        if (closes[i-1] > 0 && closes[i] > 0) {
          dailyReturns.push(Math.log(closes[i] / closes[i-1])); // log returns
        }
      }

      const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / (dailyReturns.length - 1);
      const stdDev = Math.sqrt(variance);

      // Annualized metrics (for display)
      const annReturn = (Math.exp(meanReturn * 252) - 1) * 100;
      const annVol = stdDev * Math.sqrt(252) * 100;

      // 3. Monte Carlo Simulation (Geometric Brownian Motion)
      const numSimulations = 500;
      const tradingDays = forecastYears * 252;
      
      // Store paths: paths[scenario][day] = price
      const paths = Array(numSimulations).fill(0).map(() => Array(tradingDays + 1).fill(0));
      
      for (let i = 0; i < numSimulations; i++) {
        paths[i][0] = amount; // Start all paths at initial input amount
        for (let d = 1; d <= tradingDays; d++) {
          // Geometric Brownian Motion step
          // S(t) = S(t-1) * exp( (mu - sigma^2 / 2) + sigma * Z )
          const drift = meanReturn - (variance / 2);
          const shock = stdDev * randNormal();
          paths[i][d] = paths[i][d-1] * Math.exp(drift + shock);
        }
      }

      // 4. Aggregate Percentiles per Day
      const aggregated = [];
      for (let d = 0; d <= tradingDays; d += Math.max(1, Math.floor(tradingDays / 100))) { 
        // sample ~100 points for chart performance
        const dayPrices = paths.map(p => p[d]).sort((a, b) => a - b);
        aggregated.push({
          day: d,
          worst: dayPrices[Math.floor(numSimulations * 0.10)],  // 10th percentile
          median: dayPrices[Math.floor(numSimulations * 0.50)], // 50th percentile
          best: dayPrices[Math.floor(numSimulations * 0.90)],   // 90th percentile
        });
      }

      // Exact final day stats
      const finalPrices = paths.map(p => p[tradingDays]).sort((a, b) => a - b);
      const finalBest = finalPrices[Math.floor(numSimulations * 0.90)];
      const finalMedian = finalPrices[Math.floor(numSimulations * 0.50)];
      const finalWorst = finalPrices[Math.floor(numSimulations * 0.10)];

      setChartData(aggregated);
      setSummary({
        ticker: ticker.toUpperCase(),
        annReturn, annVol,
        finalBest, finalMedian, finalWorst,
        initialAmount: amount
      });

    } catch (e) {
      setError(`오류: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [ticker, historyYears, forecastYears, amount]);

  return (
    <div className="animate-fade-in">
      <div className="bg-[#111] border border-terminal-red/30 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-bold text-terminal-red mb-4 flex items-center gap-2">
          <Activity size={16} /> Monte Carlo Future Forecasting
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs text-[#666] uppercase mb-1 block">Ticker</label>
            <input type="text" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm focus:border-terminal-red" />
          </div>
          <div>
            <label className="text-xs text-[#666] uppercase mb-1 block">Analyze Past (Yrs)</label>
            <select value={historyYears} onChange={e => setHistoryYears(Number(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm text-[#eee] focus:border-terminal-red">
              <option value={1}>Last 1 Year</option>
              <option value={3}>Last 3 Years</option>
              <option value={5}>Last 5 Years</option>
              <option value={10}>Last 10 Years</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#666] uppercase mb-1 block">Forecast To (Yrs)</label>
            <select value={forecastYears} onChange={e => setForecastYears(Number(e.target.value))}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2.5 font-mono text-sm text-[#eee] focus:border-terminal-red">
              <option value={1}>+1 Year</option>
              <option value={3}>+3 Years</option>
              <option value={5}>+5 Years</option>
              <option value={10}>+10 Years</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#666] uppercase mb-1 block">Initial Amount</label>
            <div className="flex">
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
                className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#2a2a2a] rounded-l-lg px-3 py-2.5 font-mono text-sm focus:border-terminal-red" />
              <button onClick={() => setCurrency(c => c === 'USD' ? 'KRW' : 'USD')}
                className="px-3 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] border-l-0 rounded-r-lg text-xs font-bold text-terminal-red hover:bg-[#222]">
                {currency}
              </button>
            </div>
          </div>
          <div>
            <button onClick={calculate} disabled={loading}
              className="w-full bg-terminal-red/10 border border-terminal-red/30 text-terminal-red rounded-lg py-2.5 text-sm font-semibold hover:bg-terminal-red/20 disabled:opacity-50">
              {loading ? 'Simulating...' : 'Run 500 Paths'}
            </button>
          </div>
        </div>
        <p className="text-[#555] text-xs mt-3 flex items-center gap-1">
          <Info size={12}/> Extracts historical drift and volatility, computing 500 random timelines using Geometric Brownian Motion.
        </p>
      </div>

      {error && <div className="text-terminal-red text-sm mb-4">{error}</div>}

      {summary && chartData && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            
            <div className="bg-[#111] p-4 rounded-xl border border-[#1e1e1e]">
              <span className="text-xs text-[#666] block mb-1">Historical Metrics</span>
              <div className="flex justify-between font-mono text-sm mb-1">
                <span className="text-[#888]">Ann. Return (Drift)</span>
                <span className={summary.annReturn >= 0 ? "text-terminal-green" : "text-terminal-red"}>
                  {fmtPct(summary.annReturn)}
                </span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-[#888]">Ann. Volatility</span>
                <span className="text-terminal-amber">{summary.annVol.toFixed(2)}%</span>
              </div>
            </div>

            <div className="bg-[#111] p-5 rounded-2xl border border-terminal-green/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-terminal-green/5 rounded-bl-full"></div>
              <span className="text-[10px] uppercase font-bold text-terminal-green tracking-wider bg-terminal-green/10 px-2 py-0.5 rounded-sm">Top 10% (Best Case)</span>
              <p className="text-2xl font-mono font-bold text-[#eee] mt-2 mb-1">{fmt(summary.finalBest, currency)}</p>
              <p className="text-xs text-terminal-green font-mono">
                {summary.finalBest >= summary.initialAmount ? '+' : ''}
                {fmtPct(((summary.finalBest - summary.initialAmount)/summary.initialAmount)*100)} Return
              </p>
            </div>
            
            <div className="bg-[#111] p-5 rounded-2xl border border-terminal-blue/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-terminal-blue/5 rounded-bl-full"></div>
              <span className="text-[10px] uppercase font-bold text-terminal-blue tracking-wider bg-terminal-blue/10 px-2 py-0.5 rounded-sm">50% (Median)</span>
              <p className="text-2xl font-mono font-bold text-[#eee] mt-2 mb-1">{fmt(summary.finalMedian, currency)}</p>
              <p className="text-xs text-terminal-blue font-mono">
                {summary.finalMedian >= summary.initialAmount ? '+' : ''}
                {fmtPct(((summary.finalMedian - summary.initialAmount)/summary.initialAmount)*100)} Return
              </p>
            </div>

            <div className="bg-[#111] p-5 rounded-2xl border border-terminal-red/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-terminal-red/5 rounded-bl-full"></div>
              <span className="text-[10px] uppercase font-bold text-terminal-red tracking-wider bg-terminal-red/10 px-2 py-0.5 rounded-sm">Bottom 10% (Worst Case)</span>
              <p className="text-2xl font-mono font-bold text-[#eee] mt-2 mb-1">{fmt(summary.finalWorst, currency)}</p>
              <p className="text-xs text-terminal-red font-mono">
                {summary.finalWorst >= summary.initialAmount ? '+' : ''}
                {fmtPct(((summary.finalWorst - summary.initialAmount)/summary.initialAmount)*100)} Return
              </p>
            </div>

          </div>

          <div className="lg:col-span-3 bg-[#111] border border-[#1e1e1e] rounded-2xl p-5" style={{ minHeight: 400 }}>
            <h3 className="text-lg font-bold mb-4">{summary.ticker} <span className="text-[#555] font-normal text-sm">Monte Carlo Probability Cone (500 Paths)</span></h3>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData}>
                <defs>
                   <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d26a" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#00d26a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWorst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b3b" stopOpacity={0} />
                    <stop offset="100%" stopColor="#ff3b3b" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 10 }} tickLine={false} 
                  tickFormatter={v => `Day ${v}`} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} 
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <ReferenceLine y={summary.initialAmount} stroke="#444" strokeDasharray="5 5" label={{ value: 'Today', fill: '#666', fontSize: 10 }} />
                
                <Area type="monotone" dataKey="best" stroke="#00d26a" strokeWidth={1} fill="url(#colorBest)" />
                <Area type="monotone" dataKey="worst" stroke="#ff3b3b" strokeWidth={1} fill="url(#colorWorst)" />
                <Area type="monotone" dataKey="median" stroke="#2563eb" strokeWidth={2} fill="transparent" />
                
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          {/* Methodology Explanation Box */}
          <div className="lg:col-span-4 bg-[#111] border border-[#1e1e1e] rounded-2xl p-6 mt-2 mb-8">
            <h3 className="text-sm font-bold text-[#aaa] mb-3 flex items-center gap-2">
              <Activity size={16} /> Methodology
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#777] leading-relaxed">
              <div>
                <p className="font-bold text-[#999] mb-1">1. Historical Analysis</p>
                We extract the daily <strong>Drift (Mean Return)</strong> and <strong>Volatility (Standard Deviation)</strong> from the selected historical period. These two metrics serve as the primary drivers for our future projections.
              </div>
              <div>
                <p className="font-bold text-[#999] mb-1">2. Geometric Brownian Motion</p>
                Using standard financial engineering, we employ the <strong>Geometric Brownian Motion (GBM)</strong> model along with the <strong>Box-Muller</strong> transform to generate random price steps, simulating 500 parallel future trajectories.
              </div>
              <div>
                <p className="font-bold text-[#999] mb-1">3. Probability Cone Projection</p>
                To avoid a messy chart, we aggregate the 500 simulated lines. For every future day, we sort the prices and extract only the <strong>Top 10%, Median (50%), and Bottom 10%</strong> to draw a clean, statistically robust probability cone.
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
