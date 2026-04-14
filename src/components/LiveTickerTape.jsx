import React, { useEffect, useState, useRef } from 'react';
import { Radio } from 'lucide-react';

export default function LiveTickerTape() {
  const [finnhubKey] = useState(() => localStorage.getItem('finnhub_key') || import.meta.env.VITE_FINNHUB_API_KEY || '');
  const [quotes, setQuotes] = useState({});
  const wsRef = useRef(null);

  // Fallback default symbols for live crypto & stocks
  const watchSymbols = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'AAPL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'GOOGL'];

  // 1. WebSocket for real-time prices
  useEffect(() => {
    if (!finnhubKey) return;
    
    const ws = new WebSocket(`wss://ws.finnhub.io?token=${finnhubKey}`);
    wsRef.current = ws;

    ws.onopen = () => {
      watchSymbols.forEach(symbol => {
        ws.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
      });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'trade') {
        const latestUpdates = {};
        data.data.forEach(trade => {
          latestUpdates[trade.s] = {
            price: trade.p,
            time: trade.t,
          };
        });
        setQuotes(prev => {
          const next = { ...prev };
          for (const [sym, update] of Object.entries(latestUpdates)) {
             const old = next[sym];
             let color = 'text-terminal-text';
             if (old) {
                if (update.price > old.price) color = 'text-terminal-green';
                else if (update.price < old.price) color = 'text-terminal-red';
                else color = old.color;
             }
             next[sym] = { ...update, color };
          }
          return next;
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [finnhubKey]);

  if (!finnhubKey) return null;

  // Render items (Prices only)
  const items = [];
  watchSymbols.forEach(sym => {
    const q = quotes[sym];
    const displaySym = sym.replace('BINANCE:', '').replace('USDT', '');
    if (q) {
      items.push(
        <span key={`p-${sym}`} className="mr-12 flex items-center gap-3">
          <span className="font-bold text-[#888]">{displaySym}</span>
          <span className={`font-mono transition-colors duration-300 ${q.color}`}>${q.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </span>
      );
    } else {
      items.push(
        <span key={`p-${sym}`} className="mr-12 flex items-center gap-3">
          <span className="font-bold text-[#888]">{displaySym}</span>
          <span className="font-mono text-[#444]">---</span>
        </span>
      );
    }
  });

  // Duplicate items for seamless infinite marquee jump
  const displayItems = [...items, ...items];

  // We wrap the ticker inside a standalone bar
  return (
    <div className="bg-[#0a0a0a] border-b border-[#2a2a2a] w-full overflow-hidden flex items-center h-14 isolate z-50">
      <div className="bg-[#111] border-r border-[#2a2a2a] px-6 h-full flex items-center gap-3 shrink-0 z-10 shadow-[5px_0_10px_rgba(0,0,0,0.5)]">
        <Radio size={18} className="text-terminal-red animate-pulse" />
        <span className="text-xs font-bold tracking-widest text-[#aaa] uppercase">Live</span>
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="animate-ticker flex w-max items-center h-full text-base tracking-wide">
          {displayItems}
        </div>
      </div>
    </div>
  );
}
