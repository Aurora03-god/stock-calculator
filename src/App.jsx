import React, { useState } from 'react';
import { LayoutDashboard, Maximize2, Minimize2 } from 'lucide-react';

import MainCalculator from './components/MainCalculator';
import DripCalculator from './components/DripCalculator';
import PortfolioSimulator from './components/PortfolioSimulator';
import MonteCarloSimulator from './components/MonteCarloSimulator';
import LiveTickerTape from './components/LiveTickerTape';
import LiveNewsFeed from './components/LiveNewsFeed';
import SectorTreemap from './components/SectorTreemap';

const Widget = ({ title, children, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] transition-opacity animate-fade-in" 
          onClick={() => setIsExpanded(false)} 
        />
      )}
      
      {/* Widget */}
      <div 
        className={`bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all duration-300 ${
          isExpanded 
            ? 'fixed inset-4 md:inset-10 z-[100] animate-fade-in' 
            : `relative h-full ${className}`
        }`}
      >
        <div className="bg-[#111] border-b border-[#2a2a2a] py-3 px-5 flex items-center justify-between shrink-0">
          <h2 className="text-[#aaa] text-xs font-mono font-semibold uppercase tracking-widest">{title}</h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-[#666] hover:text-terminal-text transition-colors cursor-pointer bg-[#1a1a1a] hover:bg-[#333] border border-[#2a2a2a] p-1.5 rounded-md flex items-center gap-1"
            title={isExpanded ? "축소하기" : "전체화면 확대"}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
        <div className={`flex-1 p-4 md:p-6 ${isExpanded ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}>
           {children}
        </div>
      </div>
      
      {/* Placeholder to prevent layout shift */}
      {isExpanded && <div className="h-full min-h-[300px] bg-[#111]/20 border border-[#2a2a2a] border-dashed rounded-2xl" />}
    </>
  );
};

export default function App() {
  return (
    <div className="min-h-screen flex flex-col relative bg-terminal-bg">
      <LiveTickerTape />
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full flex flex-col flex-1">
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
        <div className="xl:col-span-4">
          <Widget title="Live Market News">
            <LiveNewsFeed />
          </Widget>
        </div>
        <div className="xl:col-span-4">
          <Widget title="DRIP Simulator">
            <DripCalculator />
          </Widget>
        </div>
        <div className="xl:col-span-4">
          <Widget title="Portfolio Builder">
            <PortfolioSimulator />
          </Widget>
        </div>
        <div className="xl:col-span-12">
          <Widget title="S&P 500 Sector Heatmap">
            <SectorTreemap />
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
    </div>
  );
}
