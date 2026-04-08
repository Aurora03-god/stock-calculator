import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { fmt, fmtPct } from './format';

function forceRgbColors(el) {
  const computed = getComputedStyle(el);
  ['color','background-color','border-color','border-top-color','border-bottom-color','border-left-color','border-right-color','outline-color','fill','stroke'].forEach(prop => {
    const val = computed.getPropertyValue(prop);
    if (val && (val.includes('oklab') || val.includes('oklch') || val.includes('color-mix'))) {
      const c = document.createElement('canvas'); c.width = c.height = 1;
      const ctx = c.getContext('2d'); ctx.fillStyle = val; ctx.fillRect(0,0,1,1);
      const [r,g,b,a] = ctx.getImageData(0,0,1,1).data;
      el.style.setProperty(prop, a<255?`rgba(${r},${g},${b},${(a/255).toFixed(3)})`:`rgb(${r},${g},${b})`, 'important');
    }
  });
  Array.from(el.children).forEach(child => forceRgbColors(child));
}

function buildReportNode(summary, currency, chartDataUrl, lang) {
  const s = summary;
  const positive = s.returnPct >= 0;
  const isKo = lang === 'ko';
  const labels = isKo
    ? ['초기 투자금','최종 가치','총 손익','수익률','최고 수익일','최악의 날','거래일 수','최대 낙폭 (MDD)','샤프 비율']
    : ['Initial Investment','Final Value','Total P&L','Return Rate','Best Day','Worst Day','Trading Days','Max Drawdown (MDD)','Sharpe Ratio'];
  const values = [
    fmt(s.invested,currency), fmt(s.finalValue,currency), fmt(s.totalPL,currency), fmtPct(s.returnPct),
    `${s.bestDay.date} (${fmtPct(s.bestDay.pct)})`, `${s.worstDay.date} (${fmtPct(s.worstDay.pct)})`,
    `${s.tradingDays}${isKo?'일':' days'}`, `${fmtPct(s.mdd?.pct)} (${s.mdd?.date||''})`, s.sharpeRatio?.toFixed(2)||'—',
  ];
  const colorForIdx = (i) => {
    if (i===2||i===3) return positive?'#00d26a':'#ff3b3b';
    if (i===7) return '#ff3b3b';
    if (i===8) return s.sharpeRatio>=1?'#00d26a':s.sharpeRatio>=0?'#ffb700':'#ff3b3b';
    return '#e0e0e0';
  };
  const analysisText = isKo
    ? `${s.ticker} 종목에 ${fmt(s.invested,currency)}을(를) 투자한 결과, 총 ${s.tradingDays}거래일 동안 최종 포트폴리오 가치는 ${fmt(s.finalValue,currency)}이 되었습니다. 총 수익률은 ${fmtPct(s.returnPct)}이며, 최대 낙폭(MDD)은 ${fmtPct(s.mdd?.pct)}이고 샤프 비율은 ${s.sharpeRatio?.toFixed(2)}입니다. ${s.returnPct>=0?'전반적으로 긍정적인 투자 성과를 보였습니다.':'전반적으로 부정적인 투자 성과를 보였습니다.'}`
    : `An investment of ${fmt(s.invested,currency)} in ${s.ticker} over ${s.tradingDays} trading days resulted in a final portfolio value of ${fmt(s.finalValue,currency)}. Total return was ${fmtPct(s.returnPct)}, MDD was ${fmtPct(s.mdd?.pct)}, and Sharpe ratio was ${s.sharpeRatio?.toFixed(2)}. ${s.returnPct>=0?'Overall positive performance.':'Overall negative performance.'}`;
  const rows = labels.map((l,i)=>`<tr style="border-bottom:1px solid #1a1a1a"><td style="padding:10px 12px;font-size:13px;color:#888;width:45%">${l}</td><td style="padding:10px 12px;font-size:15px;font-family:'JetBrains Mono',monospace;font-weight:600;color:${colorForIdx(i)};text-align:right">${values[i]}</td></tr>`).join('');
  const chartHtml = chartDataUrl?`<div style="margin-bottom:28px;border-radius:12px;overflow:hidden;border:1px solid #1e1e1e"><img src="${chartDataUrl}" style="width:100%;display:block"/></div>`:'';
  const html = `<h1 style="font-size:28px;font-weight:700;margin:0 0 4px 0;color:#e0e0e0">${isKo?'주식 투자 수익률 보고서':'Stock Investment Return Report'}</h1><p style="font-size:14px;color:#666;margin:0 0 30px 0">${s.ticker} &nbsp;|&nbsp; ${s.startDate} → ${s.endDate}</p>${chartHtml}<h2 style="font-size:16px;font-weight:600;margin:0 0 16px 0;color:#aaa">${isKo?'📊 투자 요약':'📊 Investment Summary'}</h2><table style="width:100%;border-collapse:collapse;margin-bottom:28px"><tbody>${rows}</tbody></table><h2 style="font-size:16px;font-weight:600;margin:0 0 12px 0;color:#aaa">${isKo?'📝 분석 요약':'📝 Analysis Summary'}</h2><p style="font-size:13px;color:#888;line-height:1.8;margin:0">${analysisText}</p><div style="margin-top:40px;border-top:1px solid #1a1a1a;padding-top:16px"><p style="font-size:10px;color:#444;text-align:center;margin:0">Data provided by Yahoo Finance · ${isKo?'정보 제공 목적으로만 사용됩니다 · 투자 조언이 아닙니다':'For informational purposes only · Not financial advice'}</p></div>`;
  const node = document.createElement('div');
  node.innerHTML = html;
  Object.assign(node.style, { width:'794px',minHeight:'1123px',backgroundColor:'#0a0a0a',color:'#e0e0e0',fontFamily:"'Inter','Malgun Gothic','맑은 고딕',sans-serif",padding:'40px',boxSizing:'border-box',position:'fixed',top:'0',left:'0',zIndex:'99999',overflow:'hidden' });
  return node;
}

export async function downloadPDF(summary, currency, chartRef) {
  const chartClone = chartRef.current.cloneNode(true);
  Object.assign(chartClone.style, { position:'fixed',top:'0',left:'0',zIndex:'99998',width:chartRef.current.offsetWidth+'px',height:chartRef.current.offsetHeight+'px' });
  document.body.appendChild(chartClone);
  forceRgbColors(chartClone);
  const chartCanvas = await html2canvas(chartClone, { backgroundColor:'#111111',scale:2,useCORS:true,logging:false });
  document.body.removeChild(chartClone);
  const chartDataUrl = chartCanvas.toDataURL('image/png');

  const capturePage = async (lang) => {
    const node = buildReportNode(summary, currency, chartDataUrl, lang);
    document.body.appendChild(node);
    const img = node.querySelector('img');
    if (img) await new Promise(r => { if(img.complete)r(); else{img.onload=r;img.onerror=r;} });
    await new Promise(r => setTimeout(r, 200));
    const canvas = await html2canvas(node, { backgroundColor:'#0a0a0a',scale:2,useCORS:true,logging:false,width:794,windowWidth:794 });
    document.body.removeChild(node);
    return canvas.toDataURL('image/png');
  };

  const pdf = new jsPDF('p','mm','a4');
  const W=210, H=297;
  const imgKo = await capturePage('ko');
  const elKo = new Image(); elKo.src = imgKo;
  await new Promise(r=>{elKo.onload=r;});
  pdf.addImage(imgKo,'PNG',0,0,W,Math.min(W*(elKo.height/elKo.width),H));
  pdf.addPage();
  const imgEn = await capturePage('en');
  const elEn = new Image(); elEn.src = imgEn;
  await new Promise(r=>{elEn.onload=r;});
  pdf.addImage(imgEn,'PNG',0,0,W,Math.min(W*(elEn.height/elEn.width),H));
  pdf.save(`${summary.ticker}_investment_report.pdf`);
}
