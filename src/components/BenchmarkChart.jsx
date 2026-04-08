import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Color palette for benchmark lines ─── */
const BM_COLORS = [
  '#ffb700', '#ff6b6b', '#51cf66', '#339af0', '#cc5de8',
  '#20c997', '#ffa94d', '#ff8787', '#74c0fc', '#b197fc',
];

/* ─── Preset benchmarks ─── */
const BENCHMARK_PRESETS = [
  { label: 'S&P 500', value: '^GSPC', category: 'Index' },
  { label: 'NASDAQ', value: '^IXIC', category: 'Index' },
  { label: 'Dow Jones', value: '^DJI', category: 'Index' },
  { label: 'KOSPI', value: '^KS11', category: 'Index' },
  { label: 'KOSDAQ', value: '^KQ11', category: 'Index' },
  { label: 'Nikkei 225', value: '^N225', category: 'Index' },
  { label: 'FTSE 100', value: '^FTSE', category: 'Index' },
  { label: 'DAX', value: '^GDAXI', category: 'Index' },
  { label: 'Russell 2000', value: '^RUT', category: 'Index' },
  { label: 'VIX', value: '^VIX', category: 'Index' },
  { label: 'Gold (GLD)', value: 'GLD', category: 'ETF' },
  { label: 'Bitcoin (BTC)', value: 'BTC-USD', category: 'Crypto' },
  { label: 'Ethereum (ETH)', value: 'ETH-USD', category: 'Crypto' },
  { label: 'US Bond (TLT)', value: 'TLT', category: 'ETF' },
  { label: 'US Dollar (DX)', value: 'DX-Y.NYB', category: 'Currency' },
  { label: 'Crude Oil (USO)', value: 'USO', category: 'ETF' },
  { label: 'QQQ (NASDAQ ETF)', value: 'QQQ', category: 'ETF' },
  { label: 'ARKK (Ark Innovation)', value: 'ARKK', category: 'ETF' },
];

/* ─── Tooltip ─── */
const BmTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs text-[#888] font-mono mb-1">{d.date}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs text-[#888]">
          <span style={{ color: p.color }}>●</span>{' '}
          {p.name}: <span className={`font-mono font-semibold ${p.value >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {p.value != null ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%` : '—'}
          </span>
        </p>
      ))}
    </div>
  );
};

/* ─── Benchmark Selector Component ─── */
function BenchmarkSelector({ selectedBenchmarks, onToggle, onAddCustom, ticker }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const grouped = useMemo(() => {
    const groups = {};
    BENCHMARK_PRESETS.forEach(b => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, []);

  const handleAddCustom = () => {
    const val = customInput.trim().toUpperCase();
    if (val && val !== ticker.toUpperCase()) {
      onAddCustom(val);
      setCustomInput('');
    }
  };

  return (
    <div className="mb-4">
      {/* Selected pills */}
      <div className="flex items-center flex-wrap gap-2 mb-2">
        <span className="text-xs text-[#666] uppercase tracking-wider mr-1">Benchmarks:</span>
        {selectedBenchmarks.length === 0 && (
          <span className="text-xs text-[#444] font-mono italic">None selected</span>
        )}
        {selectedBenchmarks.map((bm, i) => {
          const preset = BENCHMARK_PRESETS.find(p => p.value === bm);
          const label = preset ? preset.label : bm;
          return (
            <button
              key={bm}
              onClick={() => onToggle(bm)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold transition-all duration-200 cursor-pointer border border-[#2a2a2a] hover:border-[#555]"
              style={{
                backgroundColor: `${BM_COLORS[i % BM_COLORS.length]}15`,
                borderColor: `${BM_COLORS[i % BM_COLORS.length]}40`,
                color: BM_COLORS[i % BM_COLORS.length],
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BM_COLORS[i % BM_COLORS.length] }} />
              {label}
              <X size={10} />
            </button>
          );
        })}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#0a0a0a] border border-[#2a2a2a] text-[#666] hover:text-[#aaa] hover:border-[#444] transition-all duration-200 cursor-pointer"
        >
          <Plus size={10} />
          Add
          {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>

      {/* Expanded picker */}
      {isExpanded && (
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4 animate-fade-in">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-3 last:mb-0">
              <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5 font-semibold">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map(b => {
                  const isActive = selectedBenchmarks.includes(b.value);
                  const isSelf = b.value.toUpperCase() === ticker.toUpperCase();
                  return (
                    <button
                      key={b.value}
                      onClick={() => !isSelf && onToggle(b.value)}
                      disabled={isSelf}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer border ${
                        isSelf
                          ? 'opacity-30 cursor-not-allowed border-[#1a1a1a] text-[#444]'
                          : isActive
                          ? 'bg-terminal-green/15 border-terminal-green/40 text-terminal-green'
                          : 'bg-[#111] border-[#2a2a2a] text-[#777] hover:text-[#bbb] hover:border-[#444]'
                      }`}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom ticker input */}
          <div className="mt-3 pt-3 border-t border-[#1e1e1e]">
            <p className="text-[10px] text-[#555] uppercase tracking-widest mb-1.5 font-semibold">Custom Ticker</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                placeholder="e.g. TSLA, MSFT..."
                className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 font-mono text-xs text-terminal-text focus:outline-none focus:border-terminal-green transition-colors"
              />
              <button
                onClick={handleAddCustom}
                className="px-3 py-1.5 bg-terminal-green/10 border border-terminal-green/30 text-terminal-green rounded-lg text-xs font-semibold hover:bg-terminal-green/20 transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main BenchmarkChart Component ─── */
export default function BenchmarkChart({ benchmarks, ticker }) {
  // benchmarks: Array<{ ticker, label, data: Array<{date, returnPct}> }>
  if (!benchmarks || benchmarks.length === 0) {
    return (
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            📊 Benchmark Comparison
            <span className="text-[#555] text-sm font-normal ml-2">Select benchmarks to compare</span>
          </h2>
        </div>
        <div className="text-center py-10 text-[#444] text-sm font-mono">
          No benchmarks selected. Click "Add" to choose indices, ETFs, or custom tickers to compare.
        </div>
      </div>
    );
  }

  // Merge all benchmark data into one combined chart dataset
  const mergedData = useMemo(() => {
    const dateMap = new Map();
    benchmarks.forEach((bm, bmIndex) => {
      if (!bm.data) return;
      bm.data.forEach(d => {
        if (!dateMap.has(d.date)) {
          dateMap.set(d.date, { date: d.date });
        }
        dateMap.get(d.date)[`bm_${bmIndex}`] = d.returnPct;
      });
    });
    // Add stock return (if present)
    if (benchmarks[0]?.stockData) {
      benchmarks[0].stockData.forEach(d => {
        if (dateMap.has(d.date)) {
          dateMap.get(d.date).stockReturn = d.returnPct;
        }
      });
    }
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [benchmarks]);

  const bmLabels = benchmarks.map(bm => bm.label);

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">
          📊 Benchmark Comparison
          <span className="text-[#555] text-sm font-normal ml-2">{ticker} vs {bmLabels.join(', ')}</span>
        </h2>
      </div>
      <ResponsiveContainer width="100%" height={450}>
        <LineChart data={mergedData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={true} />
          <XAxis dataKey="date" tick={{ fill: '#555', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={{ stroke: '#1e1e1e' }} minTickGap={30} />
          <YAxis tick={{ fill: '#555', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} tickCount={8} tickFormatter={v => `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`} />
          <Tooltip content={<BmTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }} />
          {/* Stock line */}
          <Line type="monotone" dataKey="stockReturn" name={ticker} stroke="#00e5ff" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#00e5ff', strokeWidth: 0 }} />
          {/* Benchmark lines */}
          {benchmarks.map((bm, i) => (
            <Line
              key={bm.ticker}
              type="monotone"
              dataKey={`bm_${i}`}
              name={bm.label}
              stroke={BM_COLORS[i % BM_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: BM_COLORS[i % BM_COLORS.length], strokeWidth: 0 }}
              strokeDasharray="5 3"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { BenchmarkSelector, BENCHMARK_PRESETS, BM_COLORS };
