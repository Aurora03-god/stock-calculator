import React, { useMemo } from 'react';

export default function ReturnsHeatmap({ chartData }) {
  const heatmapData = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    
    // 1. Find the close price for each month
    const monthly = {};
    chartData.forEach(d => {
      const parts = d.date.split('-');
      if (parts.length < 2) return;
      const [y, m] = parts;
      const key = `${y}-${m}`;
      // Since chartData is ordered by date, this continually updates to the last available price of the month
      monthly[key] = { year: +y, month: +m, price: d.price };
    });

    const keys = Object.keys(monthly).sort(); // chronological sort
    const yearlyStats = {};
    
    // 2. Calculate monthly returns comparing to previous month
    for (let i = 0; i < keys.length; i++) {
      const current = monthly[keys[i]];
      // Base the return off the previous month's end price, or the very first chart price if it's the first month
      let startPrice = i > 0 ? monthly[keys[i - 1]].price : chartData[0].price;
      const returnPct = ((current.price - startPrice) / startPrice) * 100;
      
      if (!yearlyStats[current.year]) {
        yearlyStats[current.year] = { 
          months: {}, 
          yearlyReturn: null, 
          firstPrice: startPrice, // Dec of previous year, or first available price
          lastPrice: current.price 
        };
      }
      yearlyStats[current.year].months[current.month] = returnPct;
      yearlyStats[current.year].lastPrice = current.price;
    }

    // 3. Calculate full year (or YTD) returns
    Object.keys(yearlyStats).forEach(year => {
      const st = yearlyStats[year];
      st.yearlyReturn = ((st.lastPrice - st.firstPrice) / st.firstPrice) * 100;
    });

    return yearlyStats;
  }, [chartData]);

  if (!heatmapData) return null;
  
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yearKeys = Object.keys(heatmapData).sort((a,b) => b - a); // Sort descending (latest year first)

  // ─── Bloomberg / Finviz style deep color scale ───
  const getColor = (pct) => {
    if (pct == null) return 'transparent'; // Empty cell
    if (pct > 20) return '#00ff6a';
    if (pct > 10) return '#00d26a';
    if (pct > 5) return '#00a854';
    if (pct > 2) return '#008040';
    if (pct > 0) return '#004a25';
    if (pct === 0) return '#2a2a2a';
    if (pct > -2) return '#4a0000';
    if (pct > -5) return '#8c0000';
    if (pct > -10) return '#cc1111';
    if (pct > -20) return '#ff3b3b';
    return '#ff5e5e';
  };

  const getTextColor = (pct) => {
    if (pct == null) return '#555';
    if (pct > 10 || pct < -20) return '#000'; // Dark text for bright backgrounds
    if (pct === 0) return '#888';
    return '#fff'; // Light text for darker/mid backgrounds
  };

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-5 mb-6 animate-fade-in shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🗓️ Monthly Returns Heatmap</h2>
        <span className="text-xs text-[#555] font-mono">Total return over each period.</span>
      </div>
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse" style={{ minWidth: '750px' }}>
          <thead>
            <tr>
              <th className="text-xs text-[#666] font-mono pb-3 px-2 text-left w-16 uppercase tracking-wider">Year</th>
              {months.map(m => (
                <th key={m} className="text-xs text-[#666] font-mono pb-3 px-1 text-center font-normal uppercase tracking-wider">{m}</th>
              ))}
              <th className="text-[11px] text-terminal-amber font-mono pb-3 px-2 text-right font-bold w-20 uppercase tracking-wider">Total / YTD</th>
            </tr>
          </thead>
          <tbody>
            {yearKeys.map((year) => {
              const yrData = heatmapData[year];
              const total = yrData.yearlyReturn;
              
              return (
                <tr key={year} className="border-t border-[#1a1a1a] hover:bg-[#151515] transition-colors group">
                  <td className="text-[13px] text-[#888] font-mono py-2.5 px-2 font-bold group-hover:text-white transition-colors">{year}</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                    const val = yrData.months[month];
                    return (
                      <td key={month} className="py-1 px-1">
                        <div
                          className="flex items-center justify-center rounded-md text-[11px] font-mono font-bold w-full h-8 cursor-pointer transition-transform duration-200 hover:scale-[1.12] hover:z-10 hover:shadow-xl relative"
                          style={{ 
                            backgroundColor: getColor(val),
                            color: getTextColor(val),
                            border: val == null ? '1px dashed #222' : '1px solid rgba(0,0,0,0.1)'
                          }}
                          title={val != null ? `${year}-${String(month).padStart(2,'0')}: ${val >= 0?'+':''}${val.toFixed(2)}%` : ''}
                        >
                          {val != null ? `${val >= 0?'+':''}${val.toFixed(1)}%` : ''}
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-2 text-right">
                    <span 
                      className={`text-xs font-mono font-bold inline-block px-2.5 py-1.5 rounded-md ${
                        total > 0 
                          ? 'bg-terminal-green/10 text-terminal-green border border-terminal-green/20' 
                          : total < 0 
                            ? 'bg-terminal-red/10 text-terminal-red border border-terminal-red/20'
                            : 'bg-[#222] text-[#888]'
                      }`}
                      title={`${year} Total Return: ${total >= 0?'+':''}${total.toFixed(2)}%`}
                    >
                      {total > 0 ? '+' : ''}{total.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
