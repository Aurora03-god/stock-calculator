import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LineChart, Search, TrendingUp, Star, Clock } from 'lucide-react';

const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', label: 'Apple', category: 'stock' },
  { symbol: 'MSFT', label: 'Microsoft', category: 'stock' },
  { symbol: 'NVDA', label: 'NVIDIA', category: 'stock' },
  { symbol: 'GOOGL', label: 'Google', category: 'stock' },
  { symbol: 'TSLA', label: 'Tesla', category: 'stock' },
  { symbol: 'AMZN', label: 'Amazon', category: 'stock' },
  { symbol: 'META', label: 'Meta', category: 'stock' },
];

const POPULAR_CRYPTO = [
  { symbol: 'BINANCE:BTCUSDT', label: 'Bitcoin', display: 'BTC', category: 'crypto' },
  { symbol: 'BINANCE:ETHUSDT', label: 'Ethereum', display: 'ETH', category: 'crypto' },
  { symbol: 'BINANCE:SOLUSDT', label: 'Solana', display: 'SOL', category: 'crypto' },
  { symbol: 'BINANCE:XRPUSDT', label: 'Ripple', display: 'XRP', category: 'crypto' },
  { symbol: 'BINANCE:DOGEUSDT', label: 'Dogecoin', display: 'DOGE', category: 'crypto' },
];

const POPULAR_INDICES = [
  { symbol: 'SP:SPX', label: 'S&P 500', display: 'SPX', category: 'index' },
  { symbol: 'NASDAQ:NDX', label: 'NASDAQ 100', display: 'NDX', category: 'index' },
  { symbol: 'KRX:KOSPI', label: 'KOSPI', display: 'KOSPI', category: 'index' },
  { symbol: 'TVC:DXY', label: 'US Dollar', display: 'DXY', category: 'index' },
  { symbol: 'TVC:GOLD', label: 'Gold', display: 'GOLD', category: 'index' },
];

const INTERVALS = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1H' },
  { value: '240', label: '4H' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
  { value: 'M', label: '1M' },
];

const RECENT_STORAGE_KEY = 'liveChart_recentSymbols';

function getRecentSymbols() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecentSymbol(symbol, label) {
  const recent = getRecentSymbols().filter(r => r.symbol !== symbol);
  recent.unshift({ symbol, label, time: Date.now() });
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent.slice(0, 10)));
}

export default function LiveChart() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [currentLabel, setCurrentLabel] = useState('Apple');
  const [interval, setInterval] = useState('D');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState('stocks');
  const [recentSymbols, setRecentSymbols] = useState(getRecentSymbols());

  const handleSymbolChange = (symbol, label) => {
    setCurrentSymbol(symbol);
    setCurrentLabel(label || symbol);
    setSearchInput('');
    saveRecentSymbol(symbol, label || symbol);
    setRecentSymbols(getRecentSymbols());
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    const sym = searchInput.trim().toUpperCase();
    handleSymbolChange(sym, sym);
  };

  // Render TradingView Advanced Chart widget
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';
    wrapper.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: currentSymbol,
      interval: interval,
      timezone: 'Asia/Seoul',
      theme: 'dark',
      style: '1',
      locale: 'kr',
      backgroundColor: 'rgba(10, 10, 10, 1)',
      gridColor: 'rgba(42, 42, 42, 0.3)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: true,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      studies: ['STD;RSI', 'STD;MACD'],
    });
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [currentSymbol, interval]);

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: Back + Title */}
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
                  <LineChart size={22} className="text-emerald-400" />
                  Live <span className="text-emerald-400">Chart</span>
                </h1>
                <p className="text-xs text-[#555] font-mono mt-0.5">
                  Real-time Charts · Stocks, Crypto & Indices
                </p>
              </div>
            </div>

            {/* Right: Search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="종목 / 코인 검색 (예: AAPL, BINANCE:BTCUSDT)"
                  className="pl-9 pr-4 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-lg text-sm font-mono text-terminal-text placeholder-[#444] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 w-[300px] md:w-[400px] transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 rounded-lg text-sm font-mono font-semibold hover:bg-emerald-500/25 transition-all cursor-pointer"
              >
                검색
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sub-header: Current symbol + Interval */}
      <div className="bg-[#0a0a0a]/80 border-b border-[#1a1a1a]">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          {/* Current Symbol */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-sm font-mono font-bold text-emerald-400">{currentSymbol}</span>
            </div>
            <span className="text-xs text-[#555] font-mono">{currentLabel}</span>
          </div>

          {/* Interval buttons */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#444] font-mono mr-2 hidden md:inline">INTERVAL</span>
            {INTERVALS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setInterval(value)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                  interval === value
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888] hover:border-[#3a3a3a]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-4 flex gap-4">
        {/* Sidebar: Quick Symbols */}
        <div className="hidden lg:flex flex-col w-[220px] shrink-0 gap-3">
          {/* Tab toggles */}
          <div className="flex rounded-lg overflow-hidden border border-[#2a2a2a]">
            {[
              { key: 'stocks', label: '주식' },
              { key: 'crypto', label: '코인' },
              { key: 'indices', label: '지수' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                  activeTab === key
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[#0d0d0d] text-[#555] hover:text-[#888]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Symbol list */}
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden flex-1">
            <div className="px-3 py-2 border-b border-[#2a2a2a]">
              <span className="text-[10px] font-mono text-[#444] uppercase tracking-wider flex items-center gap-1.5">
                <Star size={10} /> 인기 종목
              </span>
            </div>
            <div className="p-1.5 space-y-0.5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {(activeTab === 'stocks' ? POPULAR_SYMBOLS : activeTab === 'crypto' ? POPULAR_CRYPTO : POPULAR_INDICES).map(
                ({ symbol, label, display }) => (
                  <button
                    key={symbol}
                    onClick={() => handleSymbolChange(symbol, label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer group ${
                      currentSymbol === symbol
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'hover:bg-[#1a1a1a] border border-transparent'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-mono font-bold ${currentSymbol === symbol ? 'text-emerald-400' : 'text-[#ccc] group-hover:text-terminal-text'}`}>
                        {display || symbol}
                      </div>
                      <div className="text-[10px] text-[#555]">{label}</div>
                    </div>
                    <TrendingUp size={12} className={`${currentSymbol === symbol ? 'text-emerald-400' : 'text-[#333] group-hover:text-[#555]'}`} />
                  </button>
                )
              )}
            </div>
          </div>

          {/* Recent */}
          {recentSymbols.length > 0 && (
            <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-[#2a2a2a]">
                <span className="text-[10px] font-mono text-[#444] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={10} /> 최근 검색
                </span>
              </div>
              <div className="p-1.5 space-y-0.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                {recentSymbols.map(({ symbol, label }) => (
                  <button
                    key={symbol}
                    onClick={() => handleSymbolChange(symbol, label)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all cursor-pointer group ${
                      currentSymbol === symbol
                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                        : 'hover:bg-[#1a1a1a] border border-transparent'
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold ${currentSymbol === symbol ? 'text-emerald-400' : 'text-[#888] group-hover:text-[#ccc]'}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Mobile quick symbols */}
          <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
            {[...POPULAR_SYMBOLS.slice(0, 4), ...POPULAR_CRYPTO.slice(0, 3)].map(({ symbol, label, display }) => (
              <button
                key={symbol}
                onClick={() => handleSymbolChange(symbol, label)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                  currentSymbol === symbol
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888]'
                }`}
              >
                {display || symbol}
              </button>
            ))}
          </div>

          {/* TradingView Chart */}
          <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden flex-1" style={{ minHeight: 'calc(100vh - 260px)' }}>
            <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Footer info */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#444]">
            <span>📊 TradingView Advanced Chart Widget</span>
            <span>·</span>
            <span>차트 내에서도 종목 검색 가능</span>
            <span>·</span>
            <span>RSI, MACD 기본 활성화</span>
            <span className="ml-auto">Powered by TradingView</span>
          </div>
        </div>
      </div>
    </div>
  );
}
