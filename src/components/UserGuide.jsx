import React from 'react';
import { ArrowLeft, BookOpen, Calculator, PieChart, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const translations = {
  ko: {
    title: "Stock Terminal Pro 이용 가이드",
    back: "대시보드로 돌아가기",
    overview: "개요",
    overviewText: "Stock Terminal Pro는 과거 주식 데이터 사이의 백테스트를 수행하고 배당수익, 포트폴리오 조합, 몬테카를로 분석 등 전문적인 투자 시뮬레이션을 도와주는 대시보드입니다.",
    features: "주요 기능 안내",
    f1_title: "1. Main Calculator (메인 계산기)",
    f1_desc: "가장 기본적인 주식 및 암호화폐 백테스트 도구입니다. 종목의 티커(예: AAPL, TSLA, BTC-USD)를 입력하고 초기 자본금과 투자 기간을 설정하면 과거 수익률과 시장 지수(S&P 500 등)를 오버레이 차트로 한눈에 비교해 볼 수 있습니다.",
    f2_title: "2. DRIP Simulator (배당 재투자)",
    f2_desc: "배당금을 현금으로 받지 않고 다시 해당 주식을 매수하는 '배당 재투자(DRIP)' 전략을 시뮬레이션 합니다. 오랜 기간 투자할수록 복리 효과가 어떻게 눈덩이처럼 커지는지 시각적으로 확인할 수 있습니다.",
    f3_title: "3. Portfolio Builder (포트폴리오 조합)",
    f3_desc: "서로 다른 자산(예: 주식 60% + 채권 40%)을 비율대로 섞었을 때의 과거 성과를 파악합니다. 자산 간 상관관계, 최대 낙폭(MDD), 샤프 지수 등을 고려하여 본인만의 황금 포트폴리오를 만들어 보세요.",
    f4_title: "4. Future Forecast (몬테카를로)",
    f4_desc: "과거 데이터의 변동성을 바탕으로 미래 자산의 성장 경로를 무작위로 수천 번 시뮬레이션(몬테카를로 방식)하여 최악, 평균, 최상의 시나리오를 예측합니다.",
    f5_title: "5. Live Data (실시간 편의기능)",
    f5_desc: "대시보드 상단 메뉴와 주변 위젯을 통해 실시간 뉴스, S&P 500 섹터 맵, 배당금 캘린더, 글로벌 경제 지표 달력 등을 확인할 수 있습니다. 각 위젯 우측 상단의 '확대' 버튼을 누르면 크게 볼 수 있습니다."
  },
  en: {
    title: "Stock Terminal Pro User Guide",
    back: "Back to Dashboard",
    overview: "Overview",
    overviewText: "Stock Terminal Pro is an advanced dashboard that provides professional investment simulations, backtesting historical stock data, dividend analysis, portfolio building, and Monte Carlo forecasting.",
    features: "Key Features Guide",
    f1_title: "1. Main Calculator",
    f1_desc: "The primary tool for stock and crypto backtesting. Enter a ticker (e.g., AAPL, TSLA, BTC-USD), set initial capital and investment period, and compare historical returns against market benchmarks like the S&P 500 via overlay charts.",
    f2_title: "2. DRIP Simulator",
    f2_desc: "Simulates the Dividend Reinvestment Plan (DRIP). It visually demonstrates how snowballing compound interest affects your total return when dividends are automatically reinvested into the same asset over a long period.",
    f3_title: "3. Portfolio Builder",
    f3_desc: "Evaluate the historical performance of holding multiple assets based on customizable weightings (e.g., 60% Stocks + 40% Bonds). Create your golden portfolio by analyzing asset correlation, Max Drawdown (MDD), and Sharpe Ratios.",
    f4_title: "4. Future Forecast (Monte Carlo)",
    f4_desc: "Based on historical volatility, this tool runs thousands of randomized simulations (Monte Carlo method) to predict the future growth trajectory of your assets, providing worst-case, average, and best-case scenarios.",
    f5_title: "5. Live Data & Widgets",
    f5_desc: "Utilize the top menu and widgets to track real-time news, S&P 500 sector heatmaps, dividend calendars, and global economic indicators. Click the 'Maximize' button on the top-right of any widget to view it in full screen."
  },
  ja: {
    title: "Stock Terminal Pro 利用ガイド",
    back: "ダッシュボードに戻る",
    overview: "概要",
    overviewText: "Stock Terminal Proは、過去の株式データのバックテストを実行し、配当利回り、ポートフォリオ構築、モンテカルロ分析などの専門的な投資シミュレーションをサポートする高度なダッシュボードです。",
    features: "主な機能のご案内",
    f1_title: "1. メイン計算機 (Main Calculator)",
    f1_desc: "最も基本的な株式および暗号資産のバックテストツールです。ティッカー (例: AAPL、TSLA、BTC-USD) を入力し、初期資本と投資期間を設定すると、過去の収益率と市場収益率 (S&P 500など) をチャートで比較できます。",
    f2_title: "2. DRIP シミュレーター (配当再投資)",
    f2_desc: "配当金を現金で受け取らずに、再びその銘柄を購入する「配当再投資 (DRIP)」戦略をシミュレーションします。長期投資による複利効果が時間とともにどのように拡大するかを視覚的に確認できます。",
    f3_title: "3. ポートフォリオビルダー",
    f3_desc: "複数の資産 (例: 株式 60% + 債券 40%) を任意の比率で組み合わせた場合の過去のパフォーマンスを評価します。相関関係、最大下落率 (MDD)、シャープレシオを分析し、最適なポートフォリオを作成します。",
    f4_title: "4. 将来予測 (モンテカルロ分析)",
    f4_desc: "過去のデータのボラティリティに基づき、未来の資産成長経路をランダムに数千回シミュレーションし（モンテカルロ法）、最悪、平均、最良のシナリオを予測します。",
    f5_title: "5. ライブデータウィジェット",
    f5_desc: "ダッシュボード上部のメニューやウィジェットを使用して、リアルタイムニュース、S&P 500セクターマップ、配当カレンダー、世界経済指標カレンダーなどを確認できます。各ウィジェットの「最大化」ボタンをクリックすると全画面表示になります。"
  }
};

const UserGuide = () => {
  const { language: lang, setLanguage: setLang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto py-8">
        
        {/* Header & Navigation */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#2a2a2a] pb-6 gap-6">
          <div>
            <Link to="/" className="inline-flex items-center text-sm font-mono text-[#888] hover:text-white transition-colors mb-4">
              <ArrowLeft size={16} className="mr-2" />
              {t.back}
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BookOpen className="text-emerald-500" />
              {t.title}
            </h1>
          </div>
          
          {/* Language Switcher */}
          <div className="flex bg-[#111] border border-[#333] rounded-lg p-1">
            <button 
              onClick={() => setLang('ko')} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'ko' ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white'}`}
            >
              한국어
            </button>
            <button 
              onClick={() => setLang('en')} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'en' ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLang('ja')} 
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${lang === 'ja' ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white'}`}
            >
              日本語
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="space-y-12 animate-fade-in">
          
          {/* Overview */}
          <section className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-xl font-bold text-white">{t.overview}</h2>
            </div>
            <p className="text-[#aaa] leading-relaxed">
              {t.overviewText}
            </p>
          </section>

          {/* Features Grid */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 border-l-4 border-emerald-500 pl-4">
              {t.features}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><Calculator size={20} /></div>
                  <h3 className="text-lg font-semibold text-white">{t.f1_title}</h3>
                </div>
                <p className="text-[#888] text-sm leading-relaxed">{t.f1_desc}</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 hover:border-yellow-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><RefreshCw size={20} /></div>
                  <h3 className="text-lg font-semibold text-white">{t.f2_title}</h3>
                </div>
                <p className="text-[#888] text-sm leading-relaxed">{t.f2_desc}</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><PieChart size={20} /></div>
                  <h3 className="text-lg font-semibold text-white">{t.f3_title}</h3>
                </div>
                <p className="text-[#888] text-sm leading-relaxed">{t.f3_desc}</p>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 hover:border-orange-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><TrendingUp size={20} /></div>
                  <h3 className="text-lg font-semibold text-white">{t.f4_title}</h3>
                </div>
                <p className="text-[#888] text-sm leading-relaxed">{t.f4_desc}</p>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-6 hover:border-blue-500/50 transition-colors md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><BarChart2 size={20} /></div>
                  <h3 className="text-lg font-semibold text-white">{t.f5_title}</h3>
                </div>
                <p className="text-[#888] text-sm leading-relaxed">{t.f5_desc}</p>
              </div>

            </div>
          </section>

        </div>
        
        <footer className="mt-16 text-center text-xs text-[#555] border-t border-[#2a2a2a] pt-6">
          © {new Date().getFullYear()} Stock Terminal Pro. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default UserGuide;
