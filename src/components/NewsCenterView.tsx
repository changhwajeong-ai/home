import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Eye, 
  Search, 
  FileText, 
  ChevronRight, 
  X, 
  Video, 
  Globe, 
  Award,
  BookOpen,
  ExternalLink
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { NewsItem } from '../types';

interface NewsCenterViewProps {
  lang: 'ko' | 'en';
}

export default function NewsCenterView({ lang }: NewsCenterViewProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'notice' | 'news' | 'exhibition' | 'press' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [bannerBg, setBannerBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');

  // Pagination states
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    DBService.getNews().then(setNews);
    DBService.getBanners().then(b => {
      if (b && b.news) {
        setBannerBg(b.news);
      }
    });
  }, []);

  useEffect(() => {
    let result = [...news];

    if (activeFilter !== 'all') {
      result = result.filter(n => n.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.titleEn.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) || 
        n.contentEn.toLowerCase().includes(q)
      );
    }

    setFilteredNews(result);
  }, [news, activeFilter, searchQuery]);

  const handleArticleClick = async (article: NewsItem) => {
    setSelectedArticle(article);
    setActiveImageIdx(0);
    
    // Simulate updating view count
    const updated = { ...article, views: article.views + 1 };
    await DBService.saveNews(updated);
    
    // Update local state smoothly
    setNews(prev => prev.map(n => n.id === article.id ? updated : n));
  };

  const filtersList = [
    { label: lang === 'ko' ? '전체 소식' : 'All Feeds', value: 'all' },
    { label: lang === 'ko' ? '공지사항' : 'Notices', value: 'notice' },
    { label: lang === 'ko' ? '언론 보도' : 'Press Releases', value: 'press' },
    { label: lang === 'ko' ? '전시회/소식' : 'Exhibitions', value: 'exhibition' }
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8" id="news-center-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="relative rounded-3xl py-10 px-8 sm:py-14 sm:px-12 mb-8 overflow-hidden shadow border border-gray-200">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center brightness-[1.1] bg-white" style={{ backgroundImage: `url('${getEmbedImageUrl(bannerBg)}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-orange-500 text-xs font-black uppercase tracking-widest drop-shadow-sm">DONGWOO PR CENTER</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {lang === 'ko' ? '동우산업(주) 공식 홍보센터' : 'Dongwoo Industry Co., Ltd. Official PR Center'}
            </h1>
            <p className="text-sm text-slate-100 font-bold leading-relaxed drop-shadow-sm">
              {lang === 'ko' 
                ? '신기술 특허 발표, 우수 조달 지정, 대한민국 안전대전 전시회 참가 등의 주요 동우 소식을 전합니다.'
                : 'Stay tuned with patent releases, governmental support awards, and official traffic safety expo summaries.'}
            </p>
          </div>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm mb-8">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-2 md:pb-0">
            {filtersList.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value as any)}
                className={`px-4 py-2 text-xs font-extrabold rounded-lg whitespace-nowrap transition-colors ${
                  activeFilter === f.value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <input 
              type="text"
              placeholder={lang === 'ko' ? '홍보 제목/본문 검색...' : 'Search articles...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* News Grid Frame */}
        {(() => {
          const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
          const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
          const indexOfLastItem = activePage * itemsPerPage;
          const indexOfFirstItem = indexOfLastItem - itemsPerPage;
          const currentNews = filteredNews.slice(indexOfFirstItem, indexOfLastItem);

          const startPage = Math.floor((activePage - 1) / 10) * 10 + 1;
          const endPage = Math.min(totalPages, startPage + 9);
          const pages = [];
          for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
          }

          return (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentNews.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleArticleClick(item)}
                    className="bg-white border border-gray-200 hover:border-orange-500 rounded-2xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="h-48 bg-slate-100 overflow-hidden relative border-b border-gray-100">
                        <img 
                          src={getEmbedImageUrl(item.images?.[0]) || 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=600&q=80'} 
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[9px] font-bold uppercase px-2.5 py-1 rounded">
                          {item.type}
                        </span>
                        {item.type === 'video' && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="bg-orange-500 text-white p-2 rounded-full shadow-md">
                              <Video className="h-4 w-4 text-white animate-pulse" />
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-2">
                        <h3 className="font-extrabold text-slate-950 text-sm leading-snug group-hover:text-orange-500 transition-colors line-clamp-2 h-10">
                          {lang === 'ko' ? item.title : item.titleEn}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {lang === 'ko' ? item.content : item.contentEn}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-150 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{item.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{item.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredNews.length === 0 && (
                <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-slate-400 text-xs">
                  검색 조건 또는 카테고리에 부합하는 홍보 자료가 존재하지 않습니다.
                </div>
              )}

              {/* Pagination UI Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                  <span className="text-xs font-bold text-slate-500 font-mono">
                    Page {activePage} of {totalPages}
                  </span>
                  
                  <div className="flex items-center flex-wrap gap-1">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={activePage === 1}
                      className={`px-2.5 py-1.5 text-xs font-black rounded-lg border transition-all ${
                        activePage === 1
                          ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-gray-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={lang === 'ko' ? '첫 페이지' : 'First page'}
                    >
                      &lt;&lt;
                    </button>

                    <button
                      onClick={() => setCurrentPage(Math.max(1, activePage - 10))}
                      disabled={activePage <= 1}
                      className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg border transition-all ${
                        activePage <= 1
                          ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-gray-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={lang === 'ko' ? '10페이지 뒤로' : 'Back 10 pages'}
                    >
                      -10
                    </button>

                    <button
                      onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
                      disabled={activePage === 1}
                      className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg border transition-all ${
                        activePage === 1
                          ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-gray-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={lang === 'ko' ? '이전 페이지' : 'Previous page'}
                    >
                      &lt;
                    </button>

                    {pages.map((p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`min-w-8 h-8 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                          activePage === p
                            ? 'bg-orange-500 text-white shadow-xs font-black'
                            : 'bg-white text-slate-700 border border-gray-200 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
                      disabled={activePage === totalPages}
                      className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg border transition-all ${
                        activePage === totalPages
                          ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-gray-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={lang === 'ko' ? '다음 페이지' : 'Next page'}
                    >
                      &gt;
                    </button>

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, activePage + 10))}
                      disabled={activePage >= totalPages}
                      className={`px-2.5 py-1.5 text-xs font-extrabold rounded-lg border transition-all ${
                        activePage >= totalPages
                          ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-gray-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={lang === 'ko' ? '10페이지 앞으로' : 'Forward 10 pages'}
                    >
                      +10
                    </button>

                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={activePage === totalPages}
                      className={`px-2.5 py-1.5 text-xs font-black rounded-lg border transition-all ${
                        activePage === totalPages
                          ? 'bg-gray-50 text-gray-300 border-gray-150 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-gray-200 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={lang === 'ko' ? '마지막 페이지' : 'Last page'}
                    >
                      &gt;&gt;
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Article Reader Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="news-article-modal">
            <div className="bg-white w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col md:flex-row h-[85vh] max-h-[850px] animate-in zoom-in-95 duration-200 relative">
              
              <button 
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full z-10 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left Column: Image display (2/3 height) & smaller thumb list below, no border-r */}
              <div className="md:w-1/2 bg-slate-100 flex flex-col justify-start p-6 h-full relative">
                <div className="h-[60%] flex items-center justify-center rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm relative">
                  <img 
                    src={getEmbedImageUrl(selectedArticle.images?.[activeImageIdx || 0]) || 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=600&q=80'} 
                    alt={selectedArticle.title} 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded">
                    {selectedArticle.type}
                  </span>
                </div>
                
                {selectedArticle.images && selectedArticle.images.length > 1 && (
                  <div className="mt-5 flex-1 flex flex-col justify-start">
                    <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider text-center md:text-left">
                      {lang === 'ko' ? '기사 첨부 사진 목록' : 'Attached Photos List'}
                    </p>
                    <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-none justify-center md:justify-start">
                      {selectedArticle.images.map((img, idx) => (
                        <button 
                          key={idx}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            activeImageIdx === idx 
                              ? 'border-orange-500 scale-105 shadow-md' 
                              : 'border-transparent opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img src={getEmbedImageUrl(img)} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Title, info and description */}
              <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto h-full">
                <div className="space-y-6">
                  <div className="space-y-2 border-b border-gray-100 pb-5">
                    <div className="flex items-center text-xs text-slate-400 font-mono space-x-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>{selectedArticle.date}</span>
                      <span>|</span>
                      <span>{selectedArticle.views} views</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-950 leading-snug">
                      {lang === 'ko' ? selectedArticle.title : selectedArticle.titleEn}
                    </h2>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {lang === 'ko' ? selectedArticle.content : selectedArticle.contentEn}
                  </div>

                  {selectedArticle.type === 'video' && selectedArticle.videoUrl && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center space-x-1">
                        <Video className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                        <span>관련 동영상 바로가기</span>
                      </p>
                      <a 
                        href={selectedArticle.videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 font-black hover:underline flex items-center space-x-0.5"
                      >
                        <span>시뮬레이션 주행 및 복원력 동영상 링크 열기</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-5 flex justify-end">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-5 py-2 bg-slate-950 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    확인 및 닫기
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
