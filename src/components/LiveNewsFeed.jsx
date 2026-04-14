import React, { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';

export default function LiveNewsFeed() {
  const [finnhubKey] = useState(() => localStorage.getItem('finnhub_key') || import.meta.env.VITE_FINNHUB_API_KEY || '');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!finnhubKey) {
      setLoading(false);
      return;
    }
    
    const fetchNews = async () => {
      try {
        const res = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${finnhubKey}`);
        if (!res.ok) return;
        const data = await res.json();
        setNews(data.slice(0, 15)); // Top 15 news
      } catch(e) {
        console.error("Live feed news error", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
    const interval = setInterval(fetchNews, 60000); // 1 min update
    return () => clearInterval(interval);
  }, [finnhubKey]);

  if (!finnhubKey) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[#555] text-sm">
        API 키가 없어 뉴스를 불러올 수 없습니다.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="loading-shimmer w-full h-[150px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="h-[386px] overflow-y-auto pr-2 flex flex-col gap-3">
      {news.map((item, i) => {
        const date = new Date(item.datetime * 1000);
        return (
          <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" 
             className="block bg-[#0a0a0a] border border-[#2a2a2a] p-4 rounded-xl hover:border-terminal-amber/50 hover:bg-[#111] transition-all group animate-fade-in"
             style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex justify-between items-start gap-4 mb-2">
              <h3 className="text-sm font-bold text-terminal-text group-hover:text-terminal-amber transition-colors line-clamp-2">
                {item.headline}
              </h3>
              <ExternalLink size={14} className="text-[#555] group-hover:text-terminal-amber shrink-0 mt-0.5" />
            </div>
            {item.summary && (
              <p className="text-xs text-[#888] line-clamp-2 mb-3 leading-relaxed">
                {item.summary}
              </p>
            )}
            <div className="flex items-center gap-4 text-[10px] text-[#555] font-mono">
              <span className="flex items-center gap-1"><Newspaper size={12}/> {item.source}</span>
              <span className="flex items-center gap-1"><Clock size={12}/> {date.toLocaleTimeString()}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}
