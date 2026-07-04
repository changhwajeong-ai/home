import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Calendar, 
  ExternalLink, 
  Grid, 
  Map, 
  ChevronRight, 
  ChevronLeft,
  Layers,
  Award,
  X,
  Maximize2
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { Project, Product } from '../types';

interface ProjectsViewProps {
  lang: 'ko' | 'en';
  setSelectedProductId: (id: string | null) => void;
  setCurrentView: (view: string) => void;
}

export default function ProjectsView({
  lang,
  setSelectedProductId,
  setCurrentView
}: ProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [bannerBg, setBannerBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Pagination states
  const itemsPerPage = 6;
  const [constructionsPage, setConstructionsPage] = useState(1);
  const [deliveriesPage, setDeliveriesPage] = useState(1);

  useEffect(() => {
    setConstructionsPage(1);
    setDeliveriesPage(1);
  }, [selectedRegion, searchQuery]);

  useEffect(() => {
    DBService.getProjects().then(setProjects);
    DBService.getProducts().then(setProducts);
    DBService.getBanners().then(b => {
      if (b && b.projects) {
        setBannerBg(b.projects);
      }
    });
  }, []);

  useEffect(() => {
    let result = [...projects];

    if (selectedRegion !== 'all') {
      if (selectedRegion === '기타') {
        result = result.filter(p => {
          const loc = p.location;
          const locEn = p.locationEn;
          return !loc.includes('서울') && !loc.includes('경기') && !loc.includes('인천') &&
                 !locEn.includes('Seoul') && !locEn.includes('Gyeonggi') && !locEn.includes('Incheon');
        });
      } else {
        const engMap: { [key: string]: string } = { '서울': 'Seoul', '경기': 'Gyeonggi', '인천': 'Incheon' };
        const engVal = engMap[selectedRegion] || '';
        result = result.filter(p => p.location.includes(selectedRegion) || p.locationEn.includes(engVal));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.titleEn.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q) ||
        p.products.some(id => id.toLowerCase().includes(q))
      );
    }

    setFilteredProjects(result);
  }, [projects, selectedRegion, searchQuery]);

  const handleProductClick = (prodName: string) => {
    // Attempt to match by name or ID
    const match = products.find(p => p.name.includes(prodName) || p.id === prodName);
    if (match) {
      setSelectedProductId(match.id);
      setCurrentView('products');
    } else {
      alert(lang === 'ko' ? `[${prodName}] 제품 상세 정보를 조회하려면 제품소개 탭을 참조하십시오.` : `View details for [${prodName}] in Products.`);
    }
  };

  const getRegionCount = (key: string) => {
    if (key === '서울') return projects.filter(p => p.location.includes('서울') || p.locationEn.includes('Seoul')).length;
    if (key === '경기') return projects.filter(p => p.location.includes('경기') || p.locationEn.includes('Gyeonggi')).length;
    if (key === '인천') return projects.filter(p => p.location.includes('인천') || p.locationEn.includes('Incheon')).length;
    return projects.filter(p => {
      const loc = p.location;
      const locEn = p.locationEn;
      return !loc.includes('서울') && !loc.includes('경기') && !loc.includes('인천') &&
             !locEn.includes('Seoul') && !locEn.includes('Gyeonggi') && !locEn.includes('Incheon');
    }).length;
  };

  const baseRegions = [
    { key: '서울', label: lang === 'ko' ? '서울' : 'Seoul' },
    { key: '경기', label: lang === 'ko' ? '경기' : 'Gyeonggi' },
    { key: '인천', label: lang === 'ko' ? '인천' : 'Incheon' },
    { key: '기타', label: lang === 'ko' ? '기타' : 'Others' },
  ];

  // Sort by count in descending order (가장 많은 지역부터 적은 지역 순)
  const sortedRegions = [...baseRegions].sort((a, b) => getRegionCount(b.key) - getRegionCount(a.key));

  const regionsList = [
    { label: lang === 'ko' ? `전국 (${projects.length})` : `All (${projects.length})`, value: 'all' },
    ...sortedRegions.map(r => ({
      label: `${r.label} (${getRegionCount(r.key)})`,
      value: r.key
    }))
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8" id="projects-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="relative rounded-3xl py-10 px-8 sm:py-14 sm:px-12 mb-8 overflow-hidden shadow border border-gray-200">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center brightness-[1.1] bg-white" style={{ backgroundImage: `url('${getEmbedImageUrl(bannerBg)}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-orange-500 text-xs font-black uppercase tracking-widest drop-shadow-sm">DOONGWOO PORTFOLIO</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {lang === 'ko' ? '전국 도로안전시설 완공 시공사례' : 'National Road Safety Installation Reference Cases'}
            </h1>
            <p className="text-sm text-slate-100 font-bold leading-relaxed drop-shadow-sm">
              {lang === 'ko' 
                ? '동우산업(주)의 고강도 안전시설물이 시공된 서울 광화문, 경기 일산, 인천 송도 등 전국 실제 현장 사진과 적용 제품들을 열람할 수 있습니다.'
                : 'Browse through our real installation projects in Seoul, Gyeonggi, Incheon, and other regions.'}
            </p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm mb-8">
          
          <div className="flex flex-wrap items-center gap-2">
            {regionsList.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRegion(r.value)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-lg whitespace-nowrap transition-colors ${
                  selectedRegion === r.value
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-gray-200 text-slate-600">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : ''}`}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md ${viewMode === 'map' ? 'bg-white text-orange-600 shadow-sm' : ''}`}
                title="Map view"
              >
                <Map className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input 
                type="text"
                placeholder={lang === 'ko' ? '공사명, 모델명 검색...' : 'Search projects...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

        </div>

        {/* Content Body */}
        {(() => {
          const constructions = filteredProjects
            .filter(p => !p.projectType || p.projectType === '시공')
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          const deliveries = filteredProjects
            .filter(p => p.projectType === '납품')
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

          return (
            <>
              {viewMode === 'map' ? (
                /* Simulated Map Overviews */
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="flex items-center space-x-2 border-b border-gray-150 pb-4">
                    <Map className="h-5 w-5 text-orange-500" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      {lang === 'ko' ? '시공 현장 전국 디지털 맵 분포' : 'Spatial Distribution of Safety Projects'}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Map Illustration (Left) */}
                    <div className="lg:col-span-4 bg-slate-100 h-96 rounded-2xl border border-gray-200 relative overflow-hidden flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80')" }}></div>
                      <div className="text-center space-y-3 z-10 relative">
                        <p className="text-xl">🗺️</p>
                        <p className="text-xs font-bold text-slate-700">
                          {lang === 'ko' ? '전국 지주형 안전 표지 및 볼라드 시공 지점' : 'Projects Mapping'}
                        </p>
                        <div className="flex justify-center gap-1.5 flex-wrap max-w-[200px] mx-auto">
                          {constructions.map(p => (
                            <span key={p.id} className="bg-orange-500 text-white font-mono font-bold text-[8px] px-1.5 py-0.5 rounded">
                              {p.location}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mapped cases list (Right) */}
                    <div className="lg:col-span-8 space-y-4">
                      {constructions.map((p) => (
                        <div 
                          key={p.id}
                          className="p-4 border border-gray-200 rounded-xl bg-slate-50 flex items-center justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded">
                                {p.location}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
                            </div>
                            <h4 
                              className="font-bold text-xs text-slate-900 cursor-pointer hover:text-orange-600 transition-colors"
                              onClick={() => {
                                setSelectedProject(p);
                                setActiveImageIdx(0);
                              }}
                            >
                              {p.title}
                            </h4>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedProject(p);
                              setActiveImageIdx(0);
                            }}
                            className="text-xs font-bold text-orange-600 hover:underline"
                          >
                            상세 사진 및 도면 보기
                          </button>
                        </div>
                      ))}
                      {constructions.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          검색 조건에 부합하는 완공 시공사례가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (() => {
                const totalPages = Math.ceil(constructions.length / itemsPerPage);
                const activePage = Math.max(1, Math.min(constructionsPage, totalPages || 1));
                const indexOfLastItem = activePage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentConstructions = constructions.slice(indexOfFirstItem, indexOfLastItem);

                const startPage = Math.floor((activePage - 1) / 10) * 10 + 1;
                const endPage = Math.min(totalPages, startPage + 9);
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                return (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {currentConstructions.map((proj) => (
                        <div 
                          key={proj.id}
                          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md flex flex-col justify-between group"
                        >
                          <div>
                            <div className="h-52 bg-slate-100 overflow-hidden relative cursor-pointer" onClick={() => {
                              setSelectedProject(proj);
                              setActiveImageIdx(0);
                            }}>
                              <img 
                                src={getEmbedImageUrl(proj.images[0]) || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'} 
                                alt={proj.title}
                                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                              />
                              <span className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                                {lang === 'ko' ? proj.location : proj.locationEn}
                              </span>
                            </div>

                            <div className="p-5 space-y-2">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                                <div className="flex items-center space-x-1.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>{proj.date}</span>
                                </div>
                                {proj.client && (
                                  <span className="text-orange-600 font-bold max-w-[120px] truncate" title={lang === 'ko' ? proj.client : proj.clientEn}>
                                    {lang === 'ko' ? proj.client : (proj.clientEn || proj.client)}
                                  </span>
                                )}
                              </div>

                              <h4 
                                className="font-bold text-slate-900 text-sm line-clamp-1 leading-snug cursor-pointer hover:text-orange-600 transition-colors"
                                onClick={() => {
                                  setSelectedProject(proj);
                                  setActiveImageIdx(0);
                                }}
                              >
                                {lang === 'ko' ? proj.title : proj.titleEn}
                              </h4>

                              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                                {lang === 'ko' ? proj.description : proj.descriptionEn}
                              </p>
                            </div>
                          </div>

                          {/* Double sided product tags section */}
                          <div className="p-5 pt-0 space-y-4">
                            <div className="border-t border-gray-100 pt-3 space-y-1.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Applied Road Safety Products</p>
                              <div className="flex flex-wrap gap-1">
                                {(proj.products || []).map((prod, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleProductClick(prod)}
                                    className="text-[9px] font-bold bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded text-orange-600 px-2 py-0.5 transition-colors cursor-pointer"
                                  >
                                    {prod}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => {
                                  setSelectedProject(proj);
                                  setActiveImageIdx(0);
                                }}
                                className="text-xs font-extrabold text-orange-600 hover:text-orange-700 transition-colors flex items-center space-x-0.5 cursor-pointer"
                              >
                                <span>시공상세 및 도면보기</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                      {constructions.length === 0 && (
                        <div className="col-span-full bg-white border border-gray-150 rounded-2xl p-12 text-center text-slate-400 text-xs">
                          검색 조건에 부합하는 완공 시공사례가 없습니다.
                        </div>
                      )}
                    </div>

                    {/* Pagination UI Controls for constructions */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                        <span className="text-xs font-bold text-slate-500 font-mono">
                          Page {activePage} of {totalPages}
                        </span>
                        
                        <div className="flex items-center flex-wrap gap-1">
                          <button
                            onClick={() => setConstructionsPage(1)}
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
                            onClick={() => setConstructionsPage(Math.max(1, activePage - 10))}
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
                            onClick={() => setConstructionsPage(Math.max(1, activePage - 1))}
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
                              onClick={() => setConstructionsPage(p)}
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
                            onClick={() => setConstructionsPage(Math.min(totalPages, activePage + 1))}
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
                            onClick={() => setConstructionsPage(Math.min(totalPages, activePage + 10))}
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
                            onClick={() => setConstructionsPage(totalPages)}
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

              {/* Separator and Delivery Records Section */}
              <div className="mt-16 space-y-6" id="delivery-records-section">
                <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">DELIVERY RECORDS</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 mt-1">동우산업(주) 도로안전시설 납품 실적</h2>
                    <p className="text-xs text-slate-400 mt-1">현장 시공 과정 없이 고품질 도로안전시설물 및 볼라드 제품만 안전하게 납품 및 공급 완료한 실적입니다.</p>
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <span className="text-xs font-mono text-slate-400">Total {deliveries.length} Deliveries</span>
                  </div>
                </div>

                {deliveries.length > 0 ? (() => {
                  const totalPages = Math.ceil(deliveries.length / itemsPerPage);
                  const activePage = Math.max(1, Math.min(deliveriesPage, totalPages || 1));
                  const indexOfLastItem = activePage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentDeliveries = deliveries.slice(indexOfFirstItem, indexOfLastItem);

                  const startPage = Math.floor((activePage - 1) / 10) * 10 + 1;
                  const endPage = Math.min(totalPages, startPage + 9);
                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }

                  return (
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-gray-200 bg-slate-50 text-slate-400 font-extrabold uppercase tracking-wider">
                                <th className="py-4 px-6">납품 일자 (Date)</th>
                                <th className="py-4 px-6">납품 지역 (Location)</th>
                                <th className="py-4 px-6">사업 / 납품처 (Project / Client)</th>
                                <th className="py-4 px-6">납품 항목 (Supplied Products)</th>
                                <th className="py-4 px-6">상세 설명 (Description)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-slate-700 font-medium">
                              {currentDeliveries.map((del) => (
                                <tr key={del.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-4 px-6 font-mono font-bold text-slate-500 whitespace-nowrap">{del.date}</td>
                                  <td className="py-4 px-6 whitespace-nowrap">
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase">
                                      {lang === 'ko' ? del.location : del.locationEn}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 font-black text-slate-900 text-sm">
                                    {lang === 'ko' ? del.title : del.titleEn}
                                  </td>
                                  <td className="py-4 px-6">
                                    <div className="flex flex-wrap gap-1">
                                      {del.products.map((prod, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => handleProductClick(prod)}
                                          className="text-[9px] font-bold bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded text-orange-600 px-2 py-0.5 transition-colors cursor-pointer"
                                        >
                                          {prod}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-slate-500 max-w-xs truncate" title={lang === 'ko' ? del.description : del.descriptionEn}>
                                    {lang === 'ko' ? del.description : del.descriptionEn}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Pagination UI Controls for deliveries */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
                          <span className="text-xs font-bold text-slate-500 font-mono">
                            Page {activePage} of {totalPages}
                          </span>
                          
                          <div className="flex items-center flex-wrap gap-1">
                            <button
                              onClick={() => setDeliveriesPage(1)}
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
                              onClick={() => setDeliveriesPage(Math.max(1, activePage - 10))}
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
                              onClick={() => setDeliveriesPage(Math.max(1, activePage - 1))}
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
                                onClick={() => setDeliveriesPage(p)}
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
                              onClick={() => setDeliveriesPage(Math.min(totalPages, activePage + 1))}
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
                              onClick={() => setDeliveriesPage(Math.min(totalPages, activePage + 10))}
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
                              onClick={() => setDeliveriesPage(totalPages)}
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
                })() : (
                  <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-slate-400 text-xs">
                    검색 조건 또는 해당 지역에 부합하는 납품 실적 데이터가 존재하지 않습니다.
                  </div>
                )}
              </div>
            </>
          );
        })()}

      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-fade-in h-[85vh] max-h-[850px]">
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full z-10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Left side: Images gallery slider */}
            <div className="md:w-1/2 bg-slate-100 flex flex-col justify-between p-6 h-full">
              <div 
                onClick={() => setZoomedImage(getEmbedImageUrl(selectedProject.images[activeImageIdx]) || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80')}
                className="flex-1 flex items-center justify-center min-h-[300px] rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm cursor-zoom-in group/img relative"
                title={lang === 'ko' ? '클릭 시 원본 크기로 확대합니다' : 'Click to zoom to original size'}
              >
                <img 
                  src={getEmbedImageUrl(selectedProject.images[activeImageIdx]) || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'} 
                  alt={selectedProject.title} 
                  className="w-full h-full object-cover group-hover/img:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 text-slate-900 font-extrabold text-[11px] px-3 py-1.5 rounded-lg shadow-md flex items-center space-x-1">
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>{lang === 'ko' ? '원본 확대보기' : 'View Original'}</span>
                  </span>
                </div>
              </div>
              {selectedProject.images && selectedProject.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto py-1 scrollbar-none justify-center">
                  {selectedProject.images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImageIdx === idx ? 'border-orange-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={getEmbedImageUrl(img)} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right side: Project info and CAD blue prints */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto h-full">
              <div className="space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-slate-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-md uppercase">
                      {lang === 'ko' ? selectedProject.location : selectedProject.locationEn}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedProject.date}</span>
                    </span>
                    {selectedProject.client && (
                      <span className="bg-orange-50 text-orange-600 border border-orange-100 font-bold text-[10px] px-2.5 py-1 rounded-md">
                        {lang === 'ko' ? `발주처: ${selectedProject.client}` : `Client: ${selectedProject.clientEn || selectedProject.client}`}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {lang === 'ko' ? selectedProject.title : selectedProject.titleEn}
                  </h3>
                </div>

                <div className="border-t border-gray-150 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">시공 현장 상세 설명 / Summary</p>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {lang === 'ko' ? selectedProject.description : selectedProject.descriptionEn}
                  </p>
                </div>

                {/* Applied safety products */}
                <div className="border-t border-gray-150 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Applied Safety Products</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProject.products.map((prod, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedProject(null);
                          setSelectedProductId(prod);
                          setCurrentView('products');
                        }}
                        className="text-[10px] font-bold bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-lg text-orange-600 px-2.5 py-1 transition-all"
                      >
                        {prod}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AutoCAD files or Blueprint list */}
                {((selectedProject as any).files || []).length > 0 && (
                  <div className="border-t border-gray-150 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">CAD Drawing Blueprints</p>
                    <div className="space-y-1.5">
                      {((selectedProject as any).files || []).map((file: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-gray-200">
                          <span className="text-xs font-bold text-slate-800 line-clamp-1 flex items-center space-x-1">
                            <span className="text-orange-500 font-bold font-mono">CAD</span>
                            <span className="text-slate-700">{file.name}</span>
                          </span>
                          <a 
                            href={file.url}
                            download={file.name}
                            onClick={(e) => {
                              if (!file.url || file.url === '#') {
                                e.preventDefault();
                                alert(lang === 'ko' ? '등록된 다운로드 파일이 없습니다.' : 'No file registered.');
                              } else {
                                alert(lang === 'ko' ? `[${file.name}] 파일 다운로드가 시작됩니다.` : `[${file.name}] Download started.`);
                              }
                            }}
                            className="text-[10px] font-bold text-orange-600 hover:bg-orange-100 px-2.5 py-1 rounded-md transition-colors font-sans"
                          >
                            다운로드 ({file.size || '1.5MB'})
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Original Image Zoom Modal Overlay */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/25 text-white p-2.5 rounded-full z-10 transition-colors"
            title={lang === 'ko' ? '닫기' : 'Close'}
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="max-w-[95vw] max-h-[95vh] relative flex items-center justify-center select-none" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomedImage} 
              alt="Zoomed Original Screen" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {/* Navigation Arrows for Zoomed Image */}
            {selectedProject.images && selectedProject.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIdx = (activeImageIdx - 1 + selectedProject.images.length) % selectedProject.images.length;
                    setActiveImageIdx(prevIdx);
                    setZoomedImage(getEmbedImageUrl(selectedProject.images[prevIdx]));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
                  title={lang === 'ko' ? '이전 사진' : 'Previous'}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextIdx = (activeImageIdx + 1) % selectedProject.images.length;
                    setActiveImageIdx(nextIdx);
                    setZoomedImage(getEmbedImageUrl(selectedProject.images[nextIdx]));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors"
                  title={lang === 'ko' ? '다음 사진' : 'Next'}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
