import React, { useState } from 'react';
import { LineChart, Combine, BarChart3 } from 'lucide-react';
import MainCalculator from './components/MainCalculator';
import DripCalculator from './components/DripCalculator';
import PortfolioSimulator from './components/PortfolioSimulator';
import MonteCarloSimulator from './components/MonteCarloSimulator';

export default function App() {
  const [activeView, setActiveView] = useState('main');

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col">
      {/* ── HEADER ── */}
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Stock Return <span className="text-terminal-green">Calculator</span>
          </h1>
        </div>
        <p className="text-sm text-[#555] ml-5">주식 투자 수익률 계산기 · Bloomberg-style Terminal</p>
      </header>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveView('main')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'main'
              ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/50'
              : 'bg-[#111] text-[#888] border border-[#222] hover:bg-[#1a1a1a] hover:text-[#bbb]'
          }`}
        >
          <BarChart3 size={16} />
          Main Calculator
        </button>

        <button
          onClick={() => setActiveView('drip')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'drip'
              ? 'bg-terminal-blue/20 text-terminal-blue border border-terminal-blue/50'
              : 'bg-[#111] text-[#888] border border-[#222] hover:bg-[#1a1a1a] hover:text-[#bbb]'
          }`}
        >
          <LineChart size={16} />
          DRIP Simulator
        </button>

        <button
          onClick={() => setActiveView('portfolio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'portfolio'
              ? 'bg-terminal-amber/20 text-terminal-amber border border-terminal-amber/50'
              : 'bg-[#111] text-[#888] border border-[#222] hover:bg-[#1a1a1a] hover:text-[#bbb]'
          }`}
        >
          <Combine size={16} />
          Portfolio Builder
        </button>

        <button
          onClick={() => setActiveView('montecarlo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeView === 'montecarlo'
              ? 'bg-terminal-red/20 text-terminal-red border border-terminal-red/50'
              : 'bg-[#111] text-[#888] border border-[#222] hover:bg-[#1a1a1a] hover:text-[#bbb]'
          }`}
        >
          <LineChart size={16} />
          Future Forecast
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1">
        {activeView === 'main' && <MainCalculator />}
        {activeView === 'drip' && <DripCalculator />}
        {activeView === 'portfolio' && <PortfolioSimulator />}
        {activeView === 'montecarlo' && <MonteCarloSimulator />}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-12 text-center text-xs text-[#333] py-4 border-t border-[#111]">
        Data provided by Yahoo Finance · For informational purposes only · Not financial advice
      </footer>
    </div>
  );
}
