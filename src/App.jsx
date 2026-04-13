import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import MainCalculator from './components/MainCalculator';
import DripCalculator from './components/DripCalculator';
import PortfolioSimulator from './components/PortfolioSimulator';
import MonteCarloSimulator from './components/MonteCarloSimulator';

const Widget = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl flex flex-col overflow-hidden shadow-2xl h-full ${className}`}>
      <div className="bg-[#111] border-b border-[#2a2a2a] py-3 px-5 flex items-center justify-between">
        <h2 className="text-[#aaa] text-xs font-mono font-semibold uppercase tracking-widest">{title}</h2>
      </div>
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
         {children}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="min-h-screen p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col">
      {/* ── HEADER ── */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Stock <span className="text-terminal-green">Terminal</span> Pro
            </h1>
          </div>
          <p className="text-sm text-[#555] ml-5">전문가용 투자 분석 및 백테스트 대시보드</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold text-terminal-green bg-terminal-green/10 border border-terminal-green/30">
          <LayoutDashboard size={14} /> Widget Dashboard Active
        </div>
      </header>

      {/* ── MAIN CONTENT (CSS GRID WIDGET BOARD) ── */}
      <main className="flex-1 animate-fade-in relative grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-12">
          <Widget title="Main Calculator & Macro Overlays">
            <MainCalculator />
          </Widget>
        </div>
        <div className="xl:col-span-6">
          <Widget title="DRIP Simulator">
            <DripCalculator />
          </Widget>
        </div>
        <div className="xl:col-span-6">
          <Widget title="Portfolio Builder">
            <PortfolioSimulator />
          </Widget>
        </div>
        <div className="xl:col-span-12">
          <Widget title="Future Forecast (Monte Carlo)">
            <MonteCarloSimulator />
          </Widget>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-12 text-center text-xs text-[#333] py-4 border-t border-[#111]">
        Data provided by Yahoo Finance · For informational purposes only · Not financial advice
      </footer>
    </div>
  );
}
