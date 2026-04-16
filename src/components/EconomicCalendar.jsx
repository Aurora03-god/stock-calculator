import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe } from 'lucide-react';

const ALL_COUNTRIES = [
  { code: 'us', label: '🇺🇸 US' },
  { code: 'kr', label: '🇰🇷 KR' },
  { code: 'eu', label: '🇪🇺 EU' },
  { code: 'jp', label: '🇯🇵 JP' },
  { code: 'cn', label: '🇨🇳 CN' },
  { code: 'gb', label: '🇬🇧 UK' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'ca', label: '🇨🇦 CA' },
  { code: 'au', label: '🇦🇺 AU' },
  { code: 'fr', label: '🇫🇷 FR' },
];

const DEFAULT_ACTIVE = ['us', 'kr', 'eu', 'jp', 'cn'];

export default function EconomicCalendar() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [activeCountries, setActiveCountries] = useState(DEFAULT_ACTIVE);

  const toggleCountry = (code) => {
    setActiveCountries(prev => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev; // at least 1 must remain
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  const selectAll = () => setActiveCountries(ALL_COUNTRIES.map(c => c.code));
  const selectNone = () => setActiveCountries(['us']); // keep at least US

  // Re-render TradingView widget whenever activeCountries changes
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
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: true,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: activeCountries.join(','),
    });
    wrapper.appendChild(script);
    containerRef.current.appendChild(wrapper);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [activeCountries]);

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text flex flex-col">
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
                  <Globe size={22} className="text-terminal-green" />
                  Economic <span className="text-terminal-green">Calendar</span>
                </h1>
                <p className="text-xs text-[#555] font-mono mt-0.5">FOMC, CPI, Employment & Global Events</p>
              </div>
            </div>

            {/* Country Filter Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {ALL_COUNTRIES.map(({ code, label }) => {
                const isActive = activeCountries.includes(code);
                return (
                  <button
                    key={code}
                    onClick={() => toggleCountry(code)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-terminal-green/15 border-terminal-green/40 text-terminal-green hover:bg-terminal-green/25'
                        : 'bg-[#111] border-[#2a2a2a] text-[#555] hover:text-[#888] hover:border-[#3a3a3a]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <div className="hidden md:flex items-center gap-1 ml-2 border-l border-[#2a2a2a] pl-2">
                <button
                  onClick={selectAll}
                  className="px-2 py-1 rounded text-[10px] font-mono text-[#666] hover:text-terminal-green hover:bg-[#1a1a1a] transition-all cursor-pointer"
                >
                  All
                </button>
                <button
                  onClick={selectNone}
                  className="px-2 py-1 rounded text-[10px] font-mono text-[#666] hover:text-red-400 hover:bg-[#1a1a1a] transition-all cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Widget */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-4 md:px-6 py-6">
        <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono text-[#555]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>High Impact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Medium Impact</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span>Low Impact</span>
          </div>
          <span className="ml-auto text-[#444]">
            Showing: {activeCountries.length} of {ALL_COUNTRIES.length} countries · Powered by TradingView
          </span>
        </div>
      </div>
    </div>
  );
}
