import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, X, DollarSign, Calendar, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

const CORS_PROXY = 'https://corsproxy.io/?';

const PRESET_SYMBOLS = [
  { symbol: 'SCHD', name: 'Schwab US Dividend', type: 'ETF' },
  { symbol: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium', type: 'ETF' },
  { symbol: 'JEPI', name: 'JPMorgan Equity Premium Income', type: 'ETF' },
  { symbol: 'VYM', name: 'Vanguard High Dividend Yield', type: 'ETF' },
  { symbol: 'HDV', name: 'iShares Core High Dividend', type: 'ETF' },
  { symbol: 'QYLD', name: 'Global X NASDAQ 100 Covered Call', type: 'ETF' },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'Stock' },
  { symbol: 'KO', name: 'Coca-Cola Co.', type: 'Stock' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Stock' },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SYMBOL_COLORS = [
  '#00d4aa', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a29bfe',
  '#fd79a8', '#00b894', '#e17055', '#6c5ce7', '#fdcb6e',
  '#55efc4', '#fab1a0', '#74b9ff', '#dfe6e9', '#ffeaa7',
];

async function fetchDividendData(symbol) {
  const now = Math.floor(Date.now() / 1000);
  const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60;
  const url = `${CORS_PROXY}${encodeURIComponent(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${twoYearsAgo}&period2=${now}&interval=1mo&events=div`
  )}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const meta = result.meta || {};
  const dividends = result.events?.dividends || {};
  const divArray = Object.values(dividends).map(d => ({
    date: new Date(d.date * 1000),
    amount: d.amount,
    symbol,
  }));
  
  divArray.sort((a, b) => a.date - b.date);

  const totalAnnual = divArray
    .filter(d => d.date >= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    .reduce((s, d) => s + d.amount, 0);

  const currentPrice = meta.regularMarketPrice || meta.previousClose || 0;
  const dividendYield = currentPrice > 0 ? (totalAnnual / currentPrice) * 100 : 0;
  const frequency = divArray.length > 0 
    ? Math.round(24 / Math.max(divArray.length, 1))
    : 0;

  return {
    symbol,
    name: meta.shortName || meta.longName || symbol,
    type: meta.quoteType === 'ETF' ? 'ETF' : 'Stock',
    currentPrice,
    currency: meta.currency || 'USD',
    dividends: divArray,
    totalAnnual,
    dividendYield,
    frequency: divArray.length >= 10 ? 'Monthly' : divArray.length >= 4 ? 'Quarterly' : divArray.length >= 2 ? 'Semi-Annual' : 'Annual',
  };
}

function CalendarGrid({ year, month, allDividends, symbolColors, onDateClick, selectedDate }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const getDivsForDay = (day) => {
    if (!day) return [];
    return allDividends.filter(d => {
      const dd = d.date;
      return dd.getFullYear() === year && dd.getMonth() === month && dd.getDate() === day;
    });
  };

  const isSelected = (day) => {
    if (!selectedDate || !day) return false;
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
  };

  const isToday = (day) => {
    if (!day) return false;
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div className="grid grid-cols-7 gap-px bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
      {DAY_NAMES.map(d => (
        <div key={d} className="bg-[#111] text-center text-[10px] font-mono text-[#666] py-2 uppercase tracking-wider">
          {d}
        </div>
      ))}
      {cells.map((day, i) => {
        const divs = getDivsForDay(day);
        const hasDiv = divs.length > 0;
        return (
          <div
            key={i}
            onClick={() => day && hasDiv && onDateClick(new Date(year, month, day))}
            className={`
              relative min-h-[70px] md:min-h-[85px] p-1.5 transition-all duration-200
              ${day ? 'bg-[#0d0d0d]' : 'bg-[#080808]'}
              ${hasDiv ? 'cursor-pointer hover:bg-[#1a1a1a] hover:ring-1 hover:ring-terminal-green/30' : ''}
              ${isSelected(day) ? 'ring-2 ring-terminal-green/60 bg-[#0a1f0a]' : ''}
              ${isToday(day) ? 'bg-[#111]' : ''}
            `}
          >
            {day && (
              <>
                <span className={`text-xs font-mono ${isToday(day) ? 'text-terminal-green font-bold' : 'text-[#555]'}`}>
                  {day}
                </span>
                {hasDiv && (
                  <div className="mt-1 space-y-0.5">
                    {divs.map((d, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] font-mono truncate"
                        style={{ 
                          backgroundColor: `${symbolColors[d.symbol]}15`,
                          borderLeft: `2px solid ${symbolColors[d.symbol]}`,
                        }}
                      >
                        <span style={{ color: symbolColors[d.symbol] }} className="font-bold">{d.symbol}</span>
                        <span className="text-[#888] hidden md:inline">${d.amount.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DividendCalendar() {
  const navigate = useNavigate();
  const [trackedSymbols, setTrackedSymbols] = useState([]);
  const [symbolData, setSymbolData] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const symbolColors = {};
  trackedSymbols.forEach((s, i) => {
    symbolColors[s] = SYMBOL_COLORS[i % SYMBOL_COLORS.length];
  });

  const addSymbol = useCallback(async (symbol) => {
    const sym = symbol.trim().toUpperCase();
    if (!sym || trackedSymbols.includes(sym)) return;
    
    setTrackedSymbols(prev => [...prev, sym]);
    setLoading(prev => ({ ...prev, [sym]: true }));
    setErrors(prev => { const n = { ...prev }; delete n[sym]; return n; });

    try {
      const data = await fetchDividendData(sym);
      setSymbolData(prev => ({ ...prev, [sym]: data }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [sym]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [sym]: false }));
    }
  }, [trackedSymbols]);

  const removeSymbol = useCallback((sym) => {
    setTrackedSymbols(prev => prev.filter(s => s !== sym));
    setSymbolData(prev => { const n = { ...prev }; delete n[sym]; return n; });
    setErrors(prev => { const n = { ...prev }; delete n[sym]; return n; });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      addSymbol(searchInput);
      setSearchInput('');
    }
  };

  const allDividends = Object.values(symbolData).flatMap(d => d.dividends || []);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedDayDivs = selectedDate
    ? allDividends.filter(d => 
        d.date.getFullYear() === selectedDate.getFullYear() &&
        d.date.getMonth() === selectedDate.getMonth() &&
        d.date.getDate() === selectedDate.getDate()
      )
    : [];

  const totalTrackedYield = Object.values(symbolData).reduce((s, d) => s + (d.dividendYield || 0), 0);
  const avgYield = trackedSymbols.length > 0 ? totalTrackedYield / trackedSymbols.length : 0;

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono text-[#888] hover:text-terminal-green hover:bg-[#1a1a1a] border border-[#2a2a2a] transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
                Dashboard
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <DollarSign size={22} className="text-terminal-green" />
                  Dividend <span className="text-terminal-green">Calendar</span>
                </h1>
                <p className="text-xs text-[#555] font-mono mt-0.5">Track dividend schedules for Stocks & ETFs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Search & Quick Add */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter ticker (e.g. SCHD, AAPL, JEPQ)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl text-sm font-mono text-terminal-text placeholder:text-[#444] focus:outline-none focus:border-terminal-green/50 focus:ring-1 focus:ring-terminal-green/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-terminal-green/10 hover:bg-terminal-green/20 border border-terminal-green/30 text-terminal-green rounded-xl text-sm font-mono font-semibold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={16} /> Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[#555] font-mono self-center mr-1">Quick Add:</span>
            {PRESET_SYMBOLS.filter(p => !trackedSymbols.includes(p.symbol)).slice(0, 8).map(p => (
              <button
                key={p.symbol}
                onClick={() => addSymbol(p.symbol)}
                className="px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg text-xs font-mono text-[#888] hover:text-terminal-text transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className={`text-[10px] px-1 rounded ${p.type === 'ETF' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                  {p.type}
                </span>
                {p.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Tracked Symbols Summary */}
        {trackedSymbols.length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {trackedSymbols.map(sym => {
              const data = symbolData[sym];
              const isLoading = loading[sym];
              const error = errors[sym];
              const color = symbolColors[sym];

              return (
                <div
                  key={sym}
                  className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4 relative group transition-all hover:border-[#3a3a3a]"
                  style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
                >
                  <button
                    onClick={() => removeSymbol(sym)}
                    className="absolute top-2 right-2 p-1 text-[#444] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>

                  {isLoading ? (
                    <div className="flex items-center gap-2 text-[#555] text-sm font-mono">
                      <Loader2 size={16} className="animate-spin" />
                      Loading {sym}...
                    </div>
                  ) : error ? (
                    <div className="flex items-center gap-2 text-red-400/80 text-xs font-mono">
                      <AlertCircle size={14} />
                      {sym}: {error}
                    </div>
                  ) : data ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-sm font-mono" style={{ color }}>{data.symbol}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${data.type === 'ETF' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {data.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#666] font-mono truncate mb-3">{data.name}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-[#555]">Yield</span>
                          <p className="text-terminal-green font-bold">{data.dividendYield.toFixed(2)}%</p>
                        </div>
                        <div>
                          <span className="text-[#555]">Annual</span>
                          <p className="text-terminal-text font-bold">${data.totalAnnual.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[#555]">Price</span>
                          <p className="text-terminal-text">${data.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-[#555]">Freq</span>
                          <p className="text-[#aaa]">{data.frequency}</p>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              );
            })}

            {/* Average Yield Card */}
            {Object.keys(symbolData).length >= 2 && (
              <div className="bg-gradient-to-br from-terminal-green/5 to-terminal-green/10 border border-terminal-green/20 rounded-xl p-4 flex flex-col justify-center items-center">
                <TrendingUp size={20} className="text-terminal-green mb-2" />
                <span className="text-[10px] text-[#666] font-mono uppercase tracking-wider">Avg Yield</span>
                <span className="text-2xl font-bold text-terminal-green font-mono">{avgYield.toFixed(2)}%</span>
                <span className="text-[10px] text-[#555] font-mono">{trackedSymbols.length} symbols tracked</span>
              </div>
            )}
          </div>
        )}

        {/* Calendar Section */}
        {trackedSymbols.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm font-mono text-[#888] hover:text-terminal-text transition-all cursor-pointer">
                  ← Prev
                </button>
                <h2 className="text-lg font-bold font-mono">
                  {MONTH_NAMES[month]} {year}
                  <span className="text-[#555] text-sm ml-2">({MONTH_NAMES_KR[month]})</span>
                </h2>
                <button onClick={nextMonth} className="px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm font-mono text-[#888] hover:text-terminal-text transition-all cursor-pointer">
                  Next →
                </button>
              </div>

              <CalendarGrid
                year={year}
                month={month}
                allDividends={allDividends}
                symbolColors={symbolColors}
                onDateClick={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>

            {/* Side Panel */}
            <div className="xl:col-span-1 space-y-4">
              {/* Selected Date Details */}
              {selectedDate && selectedDayDivs.length > 0 && (
                <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                  <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-terminal-green" />
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <div className="space-y-3">
                    {selectedDayDivs.map((d, i) => (
                      <div key={i} className="p-3 bg-[#111] rounded-lg border border-[#1a1a1a]" style={{ borderLeftColor: symbolColors[d.symbol], borderLeftWidth: '3px' }}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm font-mono" style={{ color: symbolColors[d.symbol] }}>{d.symbol}</span>
                          <span className="text-terminal-green font-bold font-mono text-sm">${d.amount.toFixed(4)}</span>
                        </div>
                        <span className="text-[10px] text-[#555] font-mono">Ex-Dividend Date</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Dividends */}
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3">📋 Recent Dividends</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {allDividends
                    .sort((a, b) => b.date - a.date)
                    .slice(0, 20)
                    .map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#111] transition-colors text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: symbolColors[d.symbol] }} />
                          <span style={{ color: symbolColors[d.symbol] }} className="font-bold">{d.symbol}</span>
                        </div>
                        <span className="text-[#666]">{d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                        <span className="text-terminal-green font-semibold">${d.amount.toFixed(3)}</span>
                      </div>
                    ))}
                  {allDividends.length === 0 && (
                    <p className="text-[#444] text-xs font-mono text-center py-4">No dividend data yet</p>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-4">
                <h3 className="text-xs font-mono text-[#666] uppercase tracking-wider mb-3">🎨 Legend</h3>
                <div className="space-y-2">
                  {trackedSymbols.map(sym => (
                    <div key={sym} className="flex items-center gap-2 text-xs font-mono">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: symbolColors[sym] }} />
                      <span className="text-[#aaa]">{sym}</span>
                      {symbolData[sym] && (
                        <span className={`text-[10px] px-1 rounded ml-auto ${symbolData[sym].type === 'ETF' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {symbolData[sym].type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-terminal-green/5 border border-terminal-green/20 flex items-center justify-center mb-6">
              <DollarSign size={32} className="text-terminal-green/50" />
            </div>
            <h3 className="text-lg font-bold font-mono mb-2">No Symbols Tracked</h3>
            <p className="text-sm text-[#555] font-mono max-w-md mb-6">
              Add stocks or ETFs above to track their dividend schedules. <br />
              Supports both individual stocks (AAPL, KO) and ETFs (SCHD, JEPQ, JEPI).
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['SCHD', 'JEPQ', 'AAPL', 'KO'].map(s => (
                <button
                  key={s}
                  onClick={() => addSymbol(s)}
                  className="px-4 py-2 bg-terminal-green/10 border border-terminal-green/20 text-terminal-green rounded-lg text-sm font-mono hover:bg-terminal-green/20 transition-all cursor-pointer"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
