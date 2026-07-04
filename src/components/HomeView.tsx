import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  Building2, 
  Award, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Clock,
  ChevronLeft,
  Calendar,
  Eye,
  FileDown
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { Category, Product, Project, NewsItem, DownloadItem } from '../types';

interface HomeViewProps {
  setCurrentView: (view: string) => void;
  lang: 'ko' | 'en';
  setSelectedCategory: (catId: string) => void;
  setSelectedProductId: (id: string | null) => void;
}

export default function HomeView({
  setCurrentView,
  lang,
  setSelectedCategory,
  setSelectedProductId
}: HomeViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeCertIndex, setActiveCertIndex] = useState(0);
  const [certsList, setCertsList] = useState<any[]>([
    { name: 'ISO 9001 품질경영인증서', desc: '국제 표준 품질보증 시스템 획득', num: '제 2024-Q-9012호', image: '' },
    { name: '스틸 볼라드 디자인특허', desc: '고정식 안전 지지볼라드 외관 권리', num: '등록 제 30-1204951호', image: '' },
    { name: '우레탄 분리대 특허증', desc: '고탄성 자가복원 충격흡수 메커니즘', num: '등록 제 10-2940212호', image: '' },
    { name: 'KS 표준 도로표지판 인증', desc: '한국산업규격 품질 보증 획득', num: 'KS F 8002 인증 완료', image: '' },
    { name: '환경표지 공인 인증서', desc: '재활용 원자재 친환경 제조 공정', num: '환경부 고시 제 4192호', image: '' }
  ]);
  const [heroBg, setHeroBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');
  const [categoriesBg, setCategoriesBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');

  // Quick inquiry form state
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    title: '',
    content: '',
    type: 'estimate' as 'qna' | 'request' | 'catalog' | 'estimate'
  });
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    DBService.getCategories().then(setCategories);
    DBService.getProducts().then(prods => {
      // Filter visible and featured/popular/new
      setFeaturedProducts(prods.filter(p => p.isVisible && (p.isFeatured || p.isNew || p.isPopular)).slice(0, 4));
    });
    DBService.getProjects().then(projs => {
      const sorted = [...projs].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setProjects(sorted.slice(0, 3));
    });
    DBService.getNews().then(newsItems => setNews(newsItems.slice(0, 3)));
    DBService.getCertifications().then(list => {
      if (list && list.length > 0) {
        setCertsList(list.map(c => ({
          name: c.title,
          desc: c.desc,
          num: c.auth,
          image: c.image || ''
        })));
      }
    });
    DBService.getBanners().then(b => {
      if (b) {
        if (b.home) setHeroBg(b.home);
        if (b.categories) setCategoriesBg(b.categories);
      }
    });
  }, []);

  // Map icon helper based on icon string
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Signpost':
        return <span className="text-xl">🪧</span>;
      case 'AlertTriangle':
        return <span className="text-xl">⚠️</span>;
      case 'Spline':
        return <span className="text-xl">🚧</span>;
      case 'ShieldAlert':
        return <span className="text-xl">🛡️</span>;
      case 'Grid3X3':
        return <span className="text-xl">⛓️</span>;
      case 'Sun':
        return <span className="text-xl">⛱️</span>;
      default:
        return <span className="text-xl">📦</span>;
    }
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    setSelectedProductId(null);
    setCurrentView('products');
  };

  const handleProductClick = (prodId: string) => {
    setSelectedProductId(prodId);
    setCurrentView('products');
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone || !inquiryForm.content) {
      alert(lang === 'ko' ? '이름, 연락처, 내용을 필수 입력해 주세요.' : 'Please fill in Name, Phone, and Content.');
      return;
    }

    const newInquiry = {
      id: 'inq-' + Date.now(),
      name: inquiryForm.name,
      email: inquiryForm.email,
      phone: inquiryForm.phone,
      title: inquiryForm.title || `${inquiryForm.name}님의 빠른 견적/문의`,
      content: inquiryForm.content,
      type: inquiryForm.type,
      date: new Date().toISOString().split('T')[0],
      status: 'pending' as const
    };

    try {
      await DBService.saveInquiry(newInquiry);
      
      // Send notification alert email to dongwoo116@hanmail.net
      try {
        await fetch('/api/notify-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newInquiry),
        });
      } catch (mailErr) {
        console.warn('Failed to send email alert via API:', mailErr);
      }

      setInquirySuccess(true);
      setInquiryForm({
        name: '',
        phone: '',
        email: '',
        title: '',
        content: '',
        type: 'estimate'
      });
      setTimeout(() => setInquirySuccess(false), 5000);
    } catch (e) {
      alert(lang === 'ko' ? '오류가 발생했습니다. 다시 시도해 주세요.' : 'An error occurred. Please try again.');
    }
  };



  return (
    <div className="w-full flex flex-col" id="home-view">
      
      {/* Custom styles for slow-motion dynamic background */}
      <style>{`
        @keyframes slow-pan-zoom {
          0% { transform: scale(1.05) translate(0px, 0px); }
          50% { transform: scale(1.15) translate(-15px, -8px); }
          100% { transform: scale(1.05) translate(0px, 0px); }
        }
        .dynamic-hero-bg {
          animation: slow-pan-zoom 15s ease-in-out infinite;
        }
      `}</style>

      {/* SECTION ①: HERO */}
      <section className="relative bg-slate-950 text-white py-24 sm:py-32 overflow-hidden border-b border-orange-brand/20" id="section-hero">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100 brightness-[1.1] dynamic-hero-bg transition-[background-image] duration-1000 bg-white" 
            style={{ backgroundImage: `url('${getEmbedImageUrl(heroBg)}')` }}
          ></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/30 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-2xl space-y-6">
            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-orange-brand text-white tracking-widest uppercase">
              Creating Safe Roads
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-white">
              {lang === 'ko' ? (
                <>
                  도로안전시설물 전문기업<br />
                  동우산업주식회사에 오신 것을 환영합니다.
                </>
              ) : (
                <>
                  Road Safety Facility Specialist<br />
                  Welcome to Dongwoo Industry Co., Ltd.
                </>
              )}
            </h1>
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-lg">
              {lang === 'ko' 
                ? '동우산업주식회사는 안전한 내일을 그립니다. 축적된 기술과 부단한 연구개발을 통해 안정된 품질과 우수한 기능의 제품공급으로 한 차원 높은 안전 가치를 제공합니다.'
                : 'Dongwoo Industry paints a safer tomorrow. Through accumulated technology and continuous R&D, we produce high-level safety values with stable quality and excellent functional products.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => handleCategoryClick('all')}
                className="px-6 py-3 bg-orange-brand hover:bg-orange-brand-hover text-white rounded font-bold text-sm shadow-lg shadow-orange-brand/25 flex items-center space-x-1.5 transition-all"
              >
                <span>{lang === 'ko' ? '제품 전체보기' : 'View Products'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setCurrentView('company')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 rounded font-bold text-sm transition-all"
              >
                {lang === 'ko' ? '회사소개' : 'About Us'}
              </button>
              <button 
                onClick={() => setCurrentView('tech')}
                className="px-6 py-3 bg-white hover:bg-gray-100 text-navy rounded font-bold text-sm flex items-center space-x-1 transition-all"
              >
                <FileDown className="h-4 w-4 text-orange-brand" />
                <span>{lang === 'ko' ? '카탈로그 다운로드' : 'Download Catalog'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION ②: COMPANY (STATS) */}
      <section className="bg-white py-16 border-b border-border-light" id="section-company-stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xs font-bold text-orange-brand tracking-wider uppercase">DOONGWOO AT A GLANCE</h2>
              <h3 className="text-3xl font-extrabold text-navy tracking-tight">
                {lang === 'ko' ? '숫자로 입증하는\n신뢰와 안전 기술' : 'Proven Safety and\nEngineering in Figures'}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {lang === 'ko' 
                  ? '30여 년 동안 한길만을 걸어오며 대한민국 전역의 도로 인프라를 지탱해 오고 있습니다. 최고의 관급 표준 규격을 준수합니다.' 
                  : 'Walking a single path for over 30 years, reinforcing road infrastructures across Korea. Complies with premium governmental standards.'}
              </p>
              <button onClick={() => setCurrentView('company')} className="inline-flex items-center text-xs font-bold text-orange-brand hover:text-orange-brand-hover space-x-1">
                <span>{lang === 'ko' ? '기업 정보 자세히 보기' : 'Read Full History'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-0 border border-border-light divide-x divide-border-light bg-white rounded shadow-sm overflow-hidden">
              {[
                { count: '30+', label: 'Years Experience', labelKo: '30+ 년 업력', desc: '안전 시설물 한 길' },
                { count: '120+', label: 'Certified Products', labelKo: '120+ 우수조달제품', desc: '폭넓은 설계 지원' },
                { count: '2,000+', label: 'Total Projects', labelKo: '2,000+ 시공 실적', desc: '전국 인프라 구축' },
                { count: '25+', label: 'Patents & Tech', labelKo: '25+ 기술 특허보유', desc: '독창적 기술 경쟁력' },
              ].map((stat, i) => (
                <div key={i} className="p-6 text-center flex flex-col justify-center items-center">
                  <p className="text-4xl font-extrabold text-navy tracking-tight mb-2">{stat.count}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{lang === 'ko' ? stat.labelKo : stat.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{stat.desc}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* SECTION ③: PRODUCT CATEGORY */}
      <section className="bg-slate-50 py-16 border-b border-border-light" id="section-categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Banner with custom background image configured from Title Background Management */}
          <div className="relative rounded-3xl py-6 px-8 sm:py-8 sm:px-12 mb-10 overflow-hidden shadow-md border border-gray-200 animate-fadeIn" id="categories-banner">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center bg-white" 
              style={{ backgroundImage: `url('${getEmbedImageUrl(categoriesBg)}')` }}
            ></div>
            <div className="absolute inset-0 bg-black/45"></div>
            <div className="relative z-10 max-w-2xl space-y-3">
              <span className="text-orange-400 text-xs font-black uppercase tracking-widest">PRODUCT SYSTEM</span>
              <h3 className="text-3xl font-black text-white leading-tight drop-shadow-md">
                {lang === 'ko' ? '도로안전시설물 전 제품군' : 'Road Safety Product Systems'}
              </h3>
              <p className="text-xs text-slate-100 font-semibold leading-relaxed drop-shadow-sm">
                {lang === 'ko' 
                  ? '용도별 맞춤 자재 규격, 상세 도면과 성능 성적서 등 완벽한 안전 기준을 만족하는 고품질 도로안전 시설물 전 라인업입니다.'
                  : 'Dongwoo Industry supplies premium road safety product lines complying fully with official installation guidelines.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.filter(c => c.isActive).map((cat) => {
              const categoryImages: Record<string, string> = {
                'road-sign': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&h=250&q=80',
                'traffic-sign': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&h=250&q=80',
                'lane-divider': 'https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?auto=format&fit=crop&w=400&h=250&q=80',
                'bollard': 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=400&h=250&q=80',
                'fence': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=250&q=80',
                'awning': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&h=250&q=80',
                'others': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=250&q=80'
              };
              const imgUrl = cat.image || categoryImages[cat.id] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80';

              return (
                <div 
                  key={cat.id} 
                  onClick={() => handleCategoryClick(cat.id)}
                  className="product-card bg-white border border-border-light rounded-2xl shadow-sm hover:shadow-xl hover:border-orange-brand transition-all duration-300 cursor-pointer text-center group relative overflow-hidden flex flex-col"
                >
                  {/* Category Image Area */}
                  <div className="h-36 bg-slate-100 overflow-hidden relative">
                    <img 
                      src={getEmbedImageUrl(imgUrl)} 
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                  </div>

                  {/* Text area */}
                  <div className="p-4 flex-grow flex flex-col justify-center items-center">
                    <h4 className="font-extrabold text-navy group-hover:text-orange-brand transition-colors text-sm">
                      {lang === 'ko' ? cat.name : cat.nameEn}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-mono">
                      {cat.id.replace('-', ' ')}
                    </p>
                  </div>

                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ChevronRight className="h-4 w-4 text-orange-brand" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION ④: FEATURED PRODUCTS */}
      <section className="bg-white py-16 border-b border-border-light" id="section-featured">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-orange-brand tracking-wider uppercase">SELECTIONS</h2>
              <h3 className="text-3xl font-extrabold text-navy">
                {lang === 'ko' ? '신규 및 대표 제품 정보' : 'Featured & Latest Selections'}
              </h3>
            </div>
            <button 
              onClick={() => handleCategoryClick('all')}
              className="mt-4 sm:mt-0 px-4 py-2 text-xs font-bold text-orange-brand hover:text-orange-brand-hover flex items-center space-x-1 border border-orange-brand/25 hover:bg-orange-brand/10 rounded transition-colors"
            >
              <span>{lang === 'ko' ? '제품 목록 전체보기' : 'View Entire Catalog'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((prod) => (
              <div 
                key={prod.id} 
                className="bg-white border border-border-light rounded-lg overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img 
                      src={getEmbedImageUrl(prod.images[0]) || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'} 
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {prod.isNew && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-green-600 text-white rounded-sm">NEW</span>
                      )}
                      {prod.isPopular && (
                        <span className="px-2 py-0.5 text-[9px] font-bold bg-orange-brand text-white rounded-sm">BEST</span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{prod.categoryId}</p>
                    <h4 className="font-bold text-navy group-hover:text-orange-brand transition-colors line-clamp-1">
                      {lang === 'ko' ? prod.name : prod.nameEn}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 h-8 leading-relaxed">
                      {lang === 'ko' ? prod.description : prod.descriptionEn}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {prod.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-slate-50 border border-slate-150 px-2 py-0.5 rounded text-slate-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button 
                    onClick={() => handleProductClick(prod.id)}
                    className="w-full py-2 bg-slate-50 hover:bg-orange-brand group-hover:bg-orange-brand text-slate-700 hover:text-white text-xs font-bold rounded transition-colors border border-border-light hover:border-transparent flex items-center justify-center space-x-1"
                  >
                    <span>{lang === 'ko' ? '상세 스펙 보기' : 'View Details'}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION ⑤: RECENT PROJECT INSTALLATION */}
      <section className="bg-navy text-white py-16 border-b border-white/10" id="section-projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10">
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-orange-brand tracking-wider uppercase">PORTFOLIO</h2>
              <h3 className="text-3xl font-extrabold text-white">
                {lang === 'ko' ? '최근 시공 사례 현장' : 'Recent Project Installations'}
              </h3>
            </div>
            <button 
              onClick={() => setCurrentView('projects')}
              className="mt-4 sm:mt-0 text-xs font-bold text-orange-brand hover:text-orange-brand-hover flex items-center space-x-1"
            >
              <span>{lang === 'ko' ? '전체 시공 사례 보기' : 'Explore All Projects'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => setCurrentView('projects')}
                className="bg-slate-900 border border-slate-800 rounded overflow-hidden hover:border-orange-brand/50 cursor-pointer group transition-all"
              >
                <div className="relative h-56 bg-slate-950 overflow-hidden">
                  <img 
                    src={getEmbedImageUrl(proj.images && proj.images.length > 0 ? proj.images[0] : '') || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'} 
                    alt={proj.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-orange-brand text-white text-[10px] font-bold px-2.5 py-1 rounded">
                    {lang === 'ko' ? proj.location : proj.locationEn}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center text-slate-400 text-[10px] space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{proj.date}</span>
                  </div>
                  <h4 className="font-bold text-white group-hover:text-orange-brand transition-colors line-clamp-1">
                    {lang === 'ko' ? proj.title : proj.titleEn}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {lang === 'ko' ? proj.description : proj.descriptionEn}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 border-t border-slate-800 pt-3 mt-3">
                    <span className="font-bold text-orange-brand">사용시설물:</span>
                    <span className="line-clamp-1">{(proj.products || []).join(', ')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION ⑥: CERTIFICATIONS (SLIDER-LIKE SHIFT) */}
      <section className="bg-white py-16 border-b border-border-light" id="section-certs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs font-bold text-orange-brand tracking-wider uppercase mb-2">CREDIBILITY</h2>
            <h3 className="text-3xl font-extrabold text-navy">
              {lang === 'ko' ? '특허 및 제품인증서' : 'Patents & Technical Certifications'}
            </h3>
          </div>

          {certsList.length > 0 && certsList[activeCertIndex] ? (
            <div className="relative max-w-3xl mx-auto bg-slate-50 border border-border-light p-8 rounded-lg flex flex-col sm:flex-row items-center gap-8 shadow-sm">
              
              {/* Left Side: Interactive Clickable Certificate Thumbnail card */}
              {certsList[activeCertIndex].image ? (
                <a 
                  href={getEmbedImageUrl(certsList[activeCertIndex].image)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="h-44 w-32 bg-navy hover:bg-slate-900 transition-all flex-shrink-0 rounded border-4 border-slate-800 shadow-md flex items-center justify-center p-2 text-center text-white relative group cursor-pointer"
                  title={lang === 'ko' ? '클릭하시면 인증서 원본 파일을 확인하실 수 있습니다.' : 'Click to view original certificate file.'}
                >
                  <div className="absolute inset-2 border border-orange-brand/50 rounded pointer-events-none opacity-50"></div>
                  <div className="space-y-2">
                    <Award className="h-10 w-10 text-orange-brand mx-auto group-hover:scale-110 transition-transform duration-200" />
                    <p className="text-[10px] font-extrabold tracking-wider leading-none">DOONGWOO PATENT</p>
                    <div className="h-0.5 bg-orange-brand w-12 mx-auto"></div>
                    <p className="text-[8px] text-slate-400 line-clamp-2">{certsList[activeCertIndex].num}</p>
                    <span className="absolute bottom-1 right-1 bg-orange-brand text-[8px] text-white px-1.5 py-0.5 rounded font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">VIEW</span>
                  </div>
                </a>
              ) : (
                <div className="h-44 w-32 bg-navy flex-shrink-0 rounded border-4 border-slate-800 shadow-md flex items-center justify-center p-2 text-center text-white relative">
                  <div className="absolute inset-2 border border-orange-brand/50 rounded pointer-events-none opacity-50"></div>
                  <div className="space-y-2">
                    <Award className="h-10 w-10 text-orange-brand mx-auto" />
                    <p className="text-[10px] font-extrabold tracking-wider leading-none">DOONGWOO PATENT</p>
                    <div className="h-0.5 bg-orange-brand w-12 mx-auto"></div>
                    <p className="text-[8px] text-slate-400 line-clamp-2">{certsList[activeCertIndex].num}</p>
                  </div>
                </div>
              )}

              {/* Right Side: Title and metadata */}
              <div className="flex-1 space-y-3">
                <span className="px-2.5 py-1 text-[10px] font-bold bg-orange-brand/10 text-orange-brand rounded-sm">
                  {lang === 'ko' ? '동우산업주식회사 신뢰인증' : 'Verified Standard'}
                </span>
                <h4 className="text-xl font-bold text-navy">
                  {certsList[activeCertIndex].name}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {certsList[activeCertIndex].desc}
                </p>
                
                {/* File open / View Link */}
                {certsList[activeCertIndex].image ? (
                  <div className="pt-1.5">
                    <a 
                      href={getEmbedImageUrl(certsList[activeCertIndex].image)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-brand hover:bg-orange-brand-hover text-white text-xs font-bold rounded shadow transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      <span>{lang === 'ko' ? '인증서/특허 원본 확인하기' : 'View Certificate Document'}</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-mono">
                    {lang === 'ko' ? '인증 관리 등급: 국가 공인 시험 성적 및 우수 보증제 준수' : 'Certified Grade: Public testing standard and ISO audit passed'}
                  </p>
                )}
                
                <div className="flex items-center space-x-2 pt-3">
                  <button 
                    onClick={() => setActiveCertIndex(prev => (prev - 1 + certsList.length) % certsList.length)}
                    className="p-1.5 bg-white border border-border-light rounded-full hover:bg-orange-brand hover:text-white hover:border-transparent transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-500 select-none">
                    {activeCertIndex + 1} / {certsList.length}
                  </span>
                  <button 
                    onClick={() => setActiveCertIndex(prev => (prev + 1) % certsList.length)}
                    className="p-1.5 bg-white border border-border-light rounded-full hover:bg-orange-brand hover:text-white hover:border-transparent transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              등록된 특허 및 제품인증서가 없습니다.
            </div>
          )}
        </div>
      </section>

      {/* SECTION ⑦: NEWS AND EXHIBITIONS */}
      <section className="bg-slate-50 py-16 border-b border-border-light" id="section-news">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-xs font-bold text-orange-brand tracking-wider uppercase">MEDIA & INFO</h2>
              <h3 className="text-3xl font-extrabold text-navy">
                {lang === 'ko' ? '동우산업주식회사 홍보 및 주요 소식' : 'Dongwoo Industry Media Center'}
              </h3>
            </div>
            <button 
              onClick={() => setCurrentView('news')}
              className="text-xs font-bold text-orange-brand hover:text-orange-brand-hover flex items-center space-x-1"
            >
              <span>{lang === 'ko' ? '홍보센터 전체보기' : 'Media Center'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item) => (
              <div 
                key={item.id}
                onClick={() => setCurrentView('news')}
                className="bg-white border border-border-light p-6 rounded-lg shadow-sm hover:shadow-md cursor-pointer group space-y-3 flex flex-col justify-between transition-all"
              >
                <div className="space-y-2">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 rounded-sm tracking-wide uppercase">
                    {item.type}
                  </span>
                  <h4 className="font-bold text-navy group-hover:text-orange-brand transition-colors line-clamp-1 text-sm">
                    {lang === 'ko' ? item.title : item.titleEn}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {lang === 'ko' ? item.content : item.contentEn}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-gray-100 pt-3">
                  <span>{item.date}</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{item.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION ⑧: QUICK CONTACT & CONSULTATION */}
      <section className="bg-white py-16" id="section-contact-quick">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-navy text-white rounded-lg overflow-hidden shadow-xl border border-white/10">
            
            {/* Contact Info Detail */}
            <div className="p-8 sm:p-12 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="px-3 py-1 bg-orange-brand text-white text-xs font-bold rounded-sm tracking-wider uppercase">
                  FAST INQUIRY
                </span>
                <h3 className="text-3xl font-extrabold tracking-tight">
                  {lang === 'ko' ? '도로안전시설 설계와 시공,\n지금 빠르게 문의하세요.' : 'Road Safety Design & Construction.\nRequest consultation now.'}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {lang === 'ko' 
                    ? '관급 표준도면 설계 지원, 설계 도면 CAD(DWG) 전송 및 수량별 현장 우대 도매 견적을 전문 상담원과 전담팀이 신속히 답변해 드립니다.'
                    : 'CAD drawings, custom standard specs design, and bulk orders discounts. Specialists respond within minutes.'}
                </p>
              </div>

              <div className="space-y-3.5 pt-6 border-t border-white/10">
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="h-4.5 w-4.5 text-orange-brand" />
                  <span className="font-bold">대표상담: 031-965-1133</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4.5 w-4.5 text-orange-brand" />
                  <span>dongwoo116@hanmail.net</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Clock className="h-4.5 w-4.5 text-orange-brand" />
                  <span className="text-slate-300">{lang === 'ko' ? '상담 가능 시간: 평일 오전 9시 - 오후 6시' : 'Mon-Fri 09:00 - 18:00'}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="bg-slate-800/40 p-8 sm:p-12 border-l border-white/10 flex flex-col justify-center">
              {inquirySuccess ? (
                <div className="text-center space-y-3 py-12">
                  <ShieldCheck className="h-16 w-16 text-green-400 mx-auto animate-bounce" />
                  <h4 className="text-xl font-bold">{lang === 'ko' ? '문의 등록 완료' : 'Inquiry Submitted'}</h4>
                  <p className="text-xs text-slate-300">
                    {lang === 'ko' ? '보내주신 상세 내역이 성공적으로 전달되었습니다. 곧 유선으로 연락드리겠습니다.' : 'Your details have been successfully received. We will contact you shortly.'}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{lang === 'ko' ? '성함/업체명 *' : 'Name/Company *'}</label>
                      <input 
                        type="text" 
                        required
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({...inquiryForm, name: e.target.value})}
                        placeholder="홍길동 대리" 
                        className="w-full bg-navy/60 border border-white/20 rounded px-3.5 py-2 text-sm focus:outline-none focus:border-orange-brand text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{lang === 'ko' ? '연락처 *' : 'Phone *'}</label>
                      <input 
                        type="text" 
                        required
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({...inquiryForm, phone: e.target.value})}
                        placeholder="010-1234-5678" 
                        className="w-full bg-navy/60 border border-white/20 rounded px-3.5 py-2 text-sm focus:outline-none focus:border-orange-brand text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{lang === 'ko' ? '이메일' : 'Email'}</label>
                      <input 
                        type="email" 
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({...inquiryForm, email: e.target.value})}
                        placeholder="user@example.com" 
                        className="w-full bg-navy/60 border border-white/20 rounded px-3.5 py-2 text-sm focus:outline-none focus:border-orange-brand text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">{lang === 'ko' ? '문의 구분' : 'Type'}</label>
                      <select 
                        value={inquiryForm.type}
                        onChange={(e: any) => setInquiryForm({...inquiryForm, type: e.target.value})}
                        className="w-full bg-navy/60 border border-white/20 rounded px-3.5 py-2 text-sm focus:outline-none focus:border-orange-brand text-white"
                      >
                        <option value="estimate">{lang === 'ko' ? '도매 견적문의' : 'Price Quote'}</option>
                        <option value="request">{lang === 'ko' ? '도면/자료요청' : 'CAD/Spec Request'}</option>
                        <option value="catalog">{lang === 'ko' ? '카탈로그 신청' : 'Catalog Order'}</option>
                        <option value="qna">{lang === 'ko' ? '단순 일반문의' : 'General Inquiry'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{lang === 'ko' ? '상세 문의 내용 *' : 'Message *'}</label>
                    <textarea 
                      required
                      rows={3}
                      value={inquiryForm.content}
                      onChange={(e) => setInquiryForm({...inquiryForm, content: e.target.value})}
                      placeholder={lang === 'ko' ? '필요한 제품군 및 규격, 납품 희망 수량 등을 적어주세요.' : 'Enter your message details...'} 
                      className="w-full bg-navy/60 border border-white/20 rounded px-3.5 py-2 text-sm focus:outline-none focus:border-orange-brand text-white resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-orange-brand hover:bg-orange-brand-hover text-white rounded font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>{lang === 'ko' ? '빠른 문의하기 신청' : 'Submit Consultation Request'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
