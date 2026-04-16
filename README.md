<div align="center">

# 📈 Stock Return Calculator

**주식 투자 수익률 계산기 & 금융 대시보드**

A Bloomberg terminal-inspired stock investment dashboard with dividend tracking, economic calendar, and PDF report generation.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**[🔗 Live Demo](https://stock-calculator.vercel.app)** · **[📄 배포 가이드](./docs/DEPLOY.md)**

<br />

<img src="./assets/preview.png" alt="Stock Return Calculator Preview" width="800" />

</div>

---

## ✨ Features

### 🗂️ Dashboard
- **CSS Grid Widget Dashboard** — A stable, hardware-accelerated dashboard layout displaying the Main Calculator, DRIP Simulator, Portfolio Builder, Sector Heatmap, and Future Forecast seamlessly on one screen.
- **Interactive Widget Maximize Mode** — Full-screen pop-out capability for all dashboard widgets to allow detailed, focused data analysis.
- **URL-Based Routing** — React Router integration with clean URLs (`/`, `/dividend`, `/economic`). Supports browser back/forward navigation and direct URL access.

### 📡 Live Data
- **Live Market Ticker Tape** — Infinite-scrolling marquee displaying real-time prices for **22 assets**: BTC, ETH, SOL, XRP, DOGE (crypto), AAPL, MSFT, NVDA, GOOGL, AMZN, TSLA, META (stocks), S&P 500, DOW, NASDAQ, KOSPI, Nikkei, Hang Seng, FTSE, DAX (global indices), Gold, Crude Oil (commodities). Powered by Yahoo Finance — **no API key required**.
- **Live Market News Feed** — A dedicated scrollable widget fetching and displaying the latest market-moving news headlines via Finnhub API.
- **Event-Driven Chart Markers** — Smart overlay of major news events directly onto the stock charts for high-volatility trading days.

### 💰 Dividend Calendar *(NEW)*
- **Multi-Symbol Tracking** — Add and track dividend schedules for multiple stocks and ETFs simultaneously (e.g. `SCHD`, `JEPQ`, `JEPI`, `AAPL`, `KO`).
- **Interactive Monthly Calendar** — Color-coded calendar grid showing ex-dividend dates with per-symbol markers and hover details.
- **ETF & Stock Support** — Full support for dividend-paying ETFs (e.g. SCHD, JEPQ, JEPI, VYM, HDV, QYLD) and individual stocks.
- **Summary Cards** — Real-time display of dividend yield, annual payout, current price, and payment frequency for each tracked symbol.
- **Quick Add Presets** — One-click buttons to add popular dividend stocks and ETFs.
- **Recent Dividends Panel** — Side panel showing the 20 most recent dividend events across all tracked symbols.

### 🌍 Economic Calendar *(NEW)*
- **TradingView Widget Integration** — Professional-grade economic calendar powered by TradingView's free embedded widget.
- **Interactive Country Filters** — Toggle buttons for 10 countries/regions (🇺🇸 US, 🇰🇷 KR, 🇪🇺 EU, 🇯🇵 JP, 🇨🇳 CN, 🇬🇧 UK, 🇩🇪 DE, 🇨🇦 CA, 🇦🇺 AU, 🇫🇷 FR) with real-time widget refresh.
- **Impact-Level Filtering** — View Low, Medium, and High impact events (FOMC, CPI, Employment Reports, etc.).
- **All/Reset Controls** — Quickly select all countries or reset to defaults.

### 📊 Analysis Tools
- **S&P 500 Sector Heatmap (Treemap)** — Market-cap-weighted treemap of **50 top companies** across 11 GICS sectors. Color-coded by performance with 1D/1W/1M/YTD toggle.
- **Monte Carlo Future Forecast** — Projections of future portfolio values based on historical volatility and drift using Monte Carlo simulations.
- **Multi-Asset Portfolio Builder** — Backtest a custom basket of up to 5 assets with specified weights tracking actual asset drift over time.
- **DRIP Simulator** — Visualize dividend compounding by automatically reinvesting custom dividend yields.
- **Benchmark Comparison** — Compare stock performance against major indices (S&P 500, NASDAQ, Dow Jones, KOSPI) or custom tickers.
- **Macro-Economic Overlays** — Compare stock performance against key macro indicators (10-Yr Treasury `^TNX`, VIX `^VIX`, US Dollar Index `DX-Y.NYB`).

### 🔧 Core Features
- **Stock Ticker Search** — Supports global tickers (e.g. `AAPL`, `TSLA`, `005930.KS`)
- **Date Range & Presets** — Pick custom start/end dates or use quick presets (1M, YTD, 1Y, MAX, etc.)
- **Investment Mode Toggle** — Switch between **Lump Sum** and **DCA** (Dollar Cost Averaging) strategies
- **Monthly Returns Heatmap** — Professional Bloomberg-style monthly/yearly returns heatmap matrix
- **Historical Data Table** — Detailed daily data table with **CSV Export**
- **Currency Toggle & Crypto** — Switch between `USD` and `KRW`, with full cryptocurrency decimal support
- **Interactive Dual-Axis Chart** — Recharts-powered area/line charts with DCA lines, hover tooltips, and secondary Y-axis
- **Advanced Summary Cards** — Final value, Total P&L, Best/Worst day, Max Drawdown, and Sharpe Ratio
- **Shareable Links** — Share your portfolio configuration via custom URL parameters
- **PDF Report Export** — Bilingual PDF (Korean 🇰🇷 + English 🇺🇸) with chart & analysis
- **Bloomberg Terminal Theme** — Dark mode, monospace fonts, terminal aesthetics
- **Responsive Layout** — Works seamlessly across desktop and mobile devices
- **Secure API Management** — Safe `.env` configuration for Finnhub API keys

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| [React 19](https://react.dev/) | UI Framework |
| [React Router 7](https://reactrouter.com/) | Client-Side Routing |
| [Vite 8](https://vitejs.dev/) | Build Tool |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [Recharts](https://recharts.org/) | Chart Visualization |
| [TradingView Widget](https://www.tradingview.com/widget/) | Economic Calendar |
| [jsPDF](https://github.com/parallax/jsPDF) | PDF Generation |
| [html2canvas](https://html2canvas.hertzen.com/) | HTML to Image Capture |
| [Lucide React](https://lucide.dev/) | Icons |

## 📡 Data Source

| Source | Used For |
|---|---|
| **Yahoo Finance** (unofficial API) | Stock prices, historical data, dividend events (`events=div`) |
| **Finnhub API** | Real-time WebSocket prices, company news |
| **TradingView** (free widget) | Economic calendar (FOMC, CPI, Employment, etc.) |
| **CORS Proxy** ([corsproxy.io](https://corsproxy.io/)) | Browser CORS bypass |

> No backend required — runs entirely in the browser.

## 🗺️ Routes

| Path | Page | Description |
|---|---|---|
| `/` | Dashboard | Main widget dashboard with all tools |
| `/dividend` | Dividend Calendar | Track dividend schedules for stocks & ETFs |
| `/economic` | Economic Calendar | Global economic events with country filters |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/stock-calculator.git
cd stock-calculator

# Install dependencies
npm install

# Setup Environment Variables
# Create a .env file and add your Finnhub API key
echo "VITE_FINNHUB_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

| Route | URL |
|---|---|
| Dashboard | `http://localhost:5173/` |
| Dividend Calendar | `http://localhost:5173/dividend` |
| Economic Calendar | `http://localhost:5173/economic` |

### Quick Start (Windows)

Double-click `run.bat` to automatically install dependencies and launch the app.

### 🌐 Deploy to Vercel

가장 쉬운 배포 방법입니다. 아래 버튼을 클릭하면 바로 배포됩니다:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/stock-calculator)

또는 수동으로:

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 배포
vercel --prod
```

> 📖 자세한 배포 가이드는 [DEPLOY.md](./docs/DEPLOY.md)를 참고하세요.

## 📄 PDF Report

The PDF report includes **two pages**:

| Page | Language | Contents |
|---|---|---|
| 1 | 🇰🇷 한국어 | 차트 이미지, 투자 요약 테이블, 분석 요약문 |
| 2 | 🇺🇸 English | Chart image, Investment summary table, Analysis paragraph |

## 📸 Screenshots

<details>
<summary>Click to expand</summary>

### Main Dashboard
<img src="./assets/preview.png" alt="Dashboard" width="700" />

### Summary Cards
- Final portfolio value with profit/loss
- Return rate with color coding
- Best & worst trading day
- Total trading days count

### Interactive Tooltip
Hover over the chart to see:
- Date
- Stock price
- Portfolio value
- Cumulative return %

</details>

## 📁 Project Structure

```
stock-calculator/
├── .env                # Environment Variables (ignored by Git)
├── .gitignore          # Git ignore rules
├── index.html          # Entry HTML
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite configuration
├── run.bat             # Windows quick launcher
├── assets/
│   └── preview.png     # Preview screenshot
├── docs/
│   └── DEPLOY.md       # Deployment guide
└── src/
    ├── main.jsx        # React entry point (BrowserRouter wrapper)
    ├── index.css       # Global styles, Tailwind config & ticker marquee CSS
    ├── App.jsx         # React Router routes & widget dashboard layout
    ├── utils/
    │   ├── calculate.js    # Core financial calculations & Yahoo Finance API
    │   ├── format.js       # Number, date, currency formatting
    │   └── pdfExport.js    # PDF report generation
    └── components/
        ├── LiveTickerTape.jsx      # Infinite-scroll marquee (22 global assets)
        ├── LiveNewsFeed.jsx        # Live Market News Widget
        ├── SectorTreemap.jsx       # S&P 500 Sector Heatmap (50 companies)
        ├── DividendCalendar.jsx    # 💰 Dividend Calendar (Stocks & ETFs)
        ├── EconomicCalendar.jsx    # 🌍 Economic Calendar (TradingView)
        ├── MainCalculator.jsx      # Main chart, inputs & event markers
        ├── BenchmarkChart.jsx      # Multi-benchmark comparison charts
        ├── ReturnsHeatmap.jsx      # Monthly returns heatmap matrix
        ├── DataTable.jsx           # Historical data table + CSV export
        ├── DripCalculator.jsx      # DRIP (Dividend Reinvestment) simulator
        ├── PortfolioSimulator.jsx  # Multi-asset portfolio builder
        └── MonteCarloSimulator.jsx # Monte Carlo future forecast
```

## ⚠️ Disclaimer

> This tool is for **informational purposes only** and does **not** constitute financial advice.  
> Data is sourced from Yahoo Finance's unofficial API and may be subject to rate limits or availability issues.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💝 Support

If you find this project useful, consider supporting via crypto donation:

<a href="https://nowpayments.io/donation?api_key=b4c4c52c-26bb-4923-8ae6-31e420434fd1" target="_blank">
  <img src="https://nowpayments.io/images/embeds/donation-button-black.svg" alt="Crypto donation button by NOWPayments" height="40">
</a>

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ using React + Vite + Tailwind CSS</sub>
</div>
