import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import { fmt, fmtPct } from '../utils/format';

const PAGE_SIZE = 50;

export default function DataTable({ chartData, currency }) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const enriched = useMemo(() => {
    if (!chartData) return [];
    return chartData.map((d, i) => ({
      ...d,
      dailyPct: i > 0 && chartData[i - 1].price > 0
        ? ((d.price - chartData[i - 1].price) / chartData[i - 1].price) * 100 : 0,
    }));
  }, [chartData]);

  const totalPages = Math.ceil(enriched.length / PAGE_SIZE);
  const pageData = enriched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const header = 'Date,Price,Portfolio Value,Daily Change %,Cumulative Return %\n';
    const rows = enriched.map(d =>
      `${d.date},${d.price.toFixed(4)},${d.value.toFixed(2)},${d.dailyPct.toFixed(4)},${d.returnPct.toFixed(4)}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'stock_data.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (!chartData || chartData.length === 0) return null;

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl mb-6 animate-fade-in overflow-hidden">
      <button onClick={() => { setOpen(!open); setPage(0); }}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors cursor-pointer">
        <h2 className="text-lg font-bold flex items-center gap-2">
          📋 Daily Data <span className="text-[#555] text-sm font-normal">({enriched.length} rows)</span>
        </h2>
        {open ? <ChevronUp size={20} className="text-[#555]" /> : <ChevronDown size={20} className="text-[#555]" />}
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="flex justify-end mb-3">
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs font-semibold hover:bg-[#222] transition-colors cursor-pointer">
              <Download size={14} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left text-xs text-[#666] font-mono py-2 px-3">Date</th>
                  <th className="text-right text-xs text-[#666] font-mono py-2 px-3">Price</th>
                  <th className="text-right text-xs text-[#666] font-mono py-2 px-3">Portfolio</th>
                  <th className="text-right text-xs text-[#666] font-mono py-2 px-3">Daily</th>
                  <th className="text-right text-xs text-[#666] font-mono py-2 px-3">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((d, i) => (
                  <tr key={i} className="data-table-row border-b border-[#151515]">
                    <td className="text-left font-mono py-2 px-3 text-[#aaa]">{d.date}</td>
                    <td className="text-right font-mono py-2 px-3 text-terminal-cyan">{fmt(d.price, currency)}</td>
                    <td className="text-right font-mono py-2 px-3 text-[#ccc]">{fmt(d.value, currency)}</td>
                    <td className={`text-right font-mono py-2 px-3 ${d.dailyPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmtPct(d.dailyPct)}</td>
                    <td className={`text-right font-mono py-2 px-3 ${d.returnPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>{fmtPct(d.returnPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs font-mono hover:bg-[#222] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors">← Prev</button>
              <span className="text-xs text-[#555] font-mono">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs font-mono hover:bg-[#222] disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
