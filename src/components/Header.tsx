import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Globe, 
  Menu, 
  X, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Download
} from 'lucide-react';
import { DBService } from '../lib/firebase';
import { Category } from '../types';

interface HeaderProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  lang: 'ko' | 'en';
  setLang: (lang: 'ko' | 'en') => void;
  setSelectedCategory: (catId: string) => void;
  setSelectedProductId: (id: string | null) => void;
  onSearchSubmit: (query: string) => void;
  openChat: () => void;
}

export default function Header({
  currentView,
  setCurrentView,
  lang,
  setLang,
  setSelectedCategory,
  setSelectedProductId,
  onSearchSubmit,
  openChat
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularSearches, setPopularSearches] = useState<{ query: string; count: number }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    DBService.getCategories().then(setCategories);
    DBService.getPopularSearches().then(setPopularSearches);
  }, [currentView]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      DBService.recordSearch(searchQuery);
      onSearchSubmit(searchQuery);
      setShowSearchDropdown(false);
      setMobileMenuOpen(false);
    }
  };

  const handleKeywordClick = (kw: string) => {
    setSearchQuery(kw);
    DBService.recordSearch(kw);
    onSearchSubmit(kw);
    setShowSearchDropdown(false);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', ko: 'HOME', en: 'HOME' },
    { id: 'company', ko: '회사소개', en: 'ABOUT US' },
    { id: 'products', ko: '제품소개', en: 'PRODUCTS' },
    { id: 'tech', ko: '기술자료', en: 'TECHNICAL' },
    { id: 'projects', ko: '시공사례', en: 'PROJECTS' },
    { id: 'news', ko: '홍보센터', en: 'NEWS' },
    { id: 'customer', ko: '고객센터', en: 'CONTACT US' },
  ];

  const handleNavItemClick = (itemId: string) => {
    if (itemId === 'products') {
      setSelectedCategory('all');
      setSelectedProductId(null);
    }
    setCurrentView(itemId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-gray-200" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => handleNavItemClick('home')} id="logo-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 90" className="h-10 sm:h-11 w-auto" aria-label="동우산업(주) Logo">
              {/* Left Side: DW Icon Square */}
              <rect x="5" y="5" width="80" height="80" fill="#1c7cb4" rx="4" />
              
              {/* White stripes inside the square */}
              <rect x="31" y="5" width="2" height="35" fill="white" />
              <rect x="36" y="5" width="2" height="35" fill="white" />
              <rect x="41" y="5" width="2" height="35" fill="white" />
              <rect x="46" y="5" width="2" height="35" fill="white" />
              <rect x="51" y="5" width="2" height="35" fill="white" />
              <rect x="56" y="5" width="2" height="35" fill="white" />
              <rect x="61" y="5" width="2" height="35" fill="white" />

              {/* Bold DW Text */}
              <text x="45" y="74" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="30" fill="#ffffff" letterSpacing="-1" textAnchor="middle">DW</text>
              
              {/* Right Side: Korean Text */}
              <text x="100" y="46" fontFamily="system-ui, -apple-system, 'Malgun Gothic', sans-serif" fontWeight="900" fontSize="42" fill="#0f172a" letterSpacing="-1.5">동우산업(주)</text>
              
              {/* Right Side: English Text */}
              <text x="102" y="74" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="21" fill="#475569" letterSpacing="-0.5">Dongwoo Industry Co., LTD.</text>
            </svg>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-3.5 xl:space-x-6 flex-shrink-0" id="desktop-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`transition-colors duration-200 py-2 border-b-2 ${
                  lang === 'ko' 
                    ? 'text-[15.5px] xl:text-[17px] font-bold tracking-tight' 
                    : 'text-sm font-semibold tracking-wide'
                } ${
                  currentView === item.id 
                    ? 'border-orange-brand text-orange-brand font-bold' 
                    : 'border-transparent text-slate-600 hover:text-navy hover:border-border-light'
                }`}
                id={`nav-item-${item.id}`}
              >
                {lang === 'ko' ? item.ko : item.en}
              </button>
            ))}
          </nav>

          {/* Search, Lang & Actions */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-5 flex-shrink-0" id="header-actions">
            
            {/* Lang Translation Toggle Button (Small Oval/Pill shape) */}
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="flex items-center justify-center space-x-1.5 px-3 py-1 bg-slate-50 hover:bg-orange-brand/10 hover:border-orange-brand/40 text-slate-700 hover:text-orange-brand border border-slate-200 rounded-full transition-all duration-200 cursor-pointer font-bold text-xs h-8 shrink-0 select-none shadow-xs group"
              title={lang === 'ko' ? 'Switch to English' : '한국어로 전환'}
            >
              <Globe className="h-3.5 w-3.5 text-slate-400 group-hover:text-orange-brand transition-colors" />
              <span className="font-mono tracking-wider">{lang === 'ko' ? 'EN' : '한'}</span>
            </button>

            {/* Search Bar */}
            <div className="relative" ref={dropdownRef}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={lang === 'ko' ? '제품명, 규격, 재질 검색...' : 'Search products, specs...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-32 xl:w-52 px-4 py-2 pl-10 text-sm bg-gray-50 border border-border-light rounded-full focus:outline-none focus:ring-2 focus:ring-orange-brand focus:bg-white transition-all duration-200"
                  id="search-input"
                />
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </form>

              {showSearchDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {lang === 'ko' ? '인기 검색어' : 'Popular Searches'}
                  </h4>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {popularSearches.length > 0 ? (
                      popularSearches.slice(0, 6).map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleKeywordClick(item.query)}
                          className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 hover:bg-orange-brand/10 hover:text-orange-brand rounded-md transition-colors"
                        >
                          {item.query}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">볼라드, 우레탄, 표지판, 분리대</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {lang === 'ko' ? '추천 카테고리' : 'Recommended'}
                  </h4>
                  <div className="space-y-1">
                    {categories.slice(0, 4).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setCurrentView('products');
                          setShowSearchDropdown(false);
                        }}
                        className="w-full text-left text-xs text-slate-700 hover:text-orange-brand py-1 flex items-center justify-between"
                      >
                        <span>{lang === 'ko' ? cat.name : cat.nameEn}</span>
                        <ArrowRight className="h-3 w-3 text-gray-300" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>


          </div>

          {/* Mobile menu and controls button */}
          <div className="flex lg:hidden items-center space-x-3" id="mobile-controls">

            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className="p-1.5 text-slate-500 border border-border-light rounded"
            >
              <Globe className="h-4 w-4" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 px-4 pt-4 pb-6 space-y-4 animate-in slide-in-from-top-5 duration-200" id="mobile-drawer">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder={lang === 'ko' ? '제품 검색...' : 'Search products...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 text-sm bg-gray-50 border border-border-light rounded-lg focus:outline-none"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </form>

          <div className="flex gap-2">
            <button
              onClick={openChat}
              className="w-full flex items-center justify-center space-x-2 bg-orange-brand/10 text-orange-brand border border-orange-brand/20 rounded-lg py-2.5 text-sm font-semibold"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI 기술비서 채팅</span>
            </button>
          </div>

          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === item.id 
                    ? 'bg-orange-brand/10 text-orange-brand' 
                    : 'text-slate-700 hover:bg-gray-50'
                }`}
              >
                {lang === 'ko' ? item.ko : item.en}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
