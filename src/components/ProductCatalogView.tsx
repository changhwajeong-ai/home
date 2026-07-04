import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Search, 
  Check, 
  Plus, 
  RefreshCw, 
  Download, 
  FileText, 
  ChevronRight, 
  HelpCircle,
  X,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { Category, Product } from '../types';

interface ProductCatalogViewProps {
  lang: 'ko' | 'en';
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  searchFilterQuery: string;
  setSearchFilterQuery: (query: string) => void;
}

export default function ProductCatalogView({
  lang,
  selectedCategory,
  setSelectedCategory,
  selectedProductId,
  setSelectedProductId,
  searchFilterQuery,
  setSearchFilterQuery
}: ProductCatalogViewProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Advanced Filters
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedHeight, setSelectedHeight] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [bannerBg, setBannerBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');

  useEffect(() => {
    DBService.getCategories().then(cats => setCategories(cats.filter(c => c.isActive)));
    DBService.getProducts().then(prods => setAllProducts(prods.filter(p => p.isVisible)));
    DBService.getBanners().then(b => {
      if (b && b.products) {
        setBannerBg(b.products);
      }
    });
  }, []);

  useEffect(() => {
    let result = [...allProducts];

    // Category filter
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Material advanced filter
    if (selectedMaterial !== 'all') {
      result = result.filter(p => 
        p.specifications.material.toLowerCase().includes(selectedMaterial.toLowerCase()) ||
        p.specificationsEn.material.toLowerCase().includes(selectedMaterial.toLowerCase())
      );
    }

    // Height advanced filter
    if (selectedHeight !== 'all') {
      result = result.filter(p => p.specifications.height.includes(selectedHeight));
    }

    // Tag advanced filter
    if (selectedTag !== 'all') {
      result = result.filter(p => p.tags.includes(selectedTag));
    }

    // Search bar filter
    if (searchFilterQuery.trim()) {
      const q = searchFilterQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.nameEn.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.specifications.material.toLowerCase().includes(q) ||
        p.specifications.size.toLowerCase().includes(q)
      );
    }

    setFilteredProducts(result);
  }, [allProducts, selectedCategory, selectedMaterial, selectedHeight, selectedTag, searchFilterQuery]);

  // Handle product selection to view details
  const handleViewDetails = (id: string) => {
    setSelectedProductId(id);
  };

  // Pagination states
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedMaterial, selectedHeight, selectedTag, searchFilterQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedMaterial('all');
    setSelectedHeight('all');
    setSelectedTag('all');
    setSearchFilterQuery('');
  };

  // Quick download stats update
  const handleFileDownload = (id: string, fileName: string) => {
    alert(lang === 'ko' ? `[${fileName}] 다운로드 요청이 처리되었습니다. 다운로드 통계가 갱신됩니다.` : `[${fileName}] Download initiated.`);
    DBService.recordDownload(id);
  };

  // Unique tags for filter sidebar
  const uniqueTags = Array.from(new Set(allProducts.flatMap(p => p.tags)));
  const materialsList = [
    { label: lang === 'ko' ? '전체 재질' : 'All Materials', value: 'all' },
    { label: lang === 'ko' ? '탄소강관 (스틸)' : 'Steel', value: '스틸' },
    { label: lang === 'ko' ? '폴리우레탄' : 'Polyurethane', value: '우레탄' },
    { label: lang === 'ko' ? '화강석 (석재)' : 'Granite', value: '석재' },
    { label: lang === 'ko' ? '알루미늄' : 'Aluminum', value: '알루미늄' }
  ];

  const heightsList = [
    { label: lang === 'ko' ? '전체 높이' : 'All Heights', value: 'all' },
    { label: '850mm', value: '850mm' },
    { label: '800mm', value: '800mm' },
    { label: '700mm', value: '700mm' },
    { label: '900mm', value: '900mm' }
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8" id="catalog-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner with Smart Search */}
        <div className="relative rounded-2xl py-4 px-8 sm:py-6 sm:px-12 mb-8 overflow-hidden shadow-lg border border-gray-200">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center brightness-[1.1] bg-white" style={{ backgroundImage: `url('${getEmbedImageUrl(bannerBg)}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-orange-500 text-xs font-black uppercase tracking-widest drop-shadow-sm">SMART FILTERING SYSTEM</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {lang === 'ko' ? '도로안전시설물 스마트 카탈로그' : 'Smart Safety Facilities Catalog'}
            </h1>
            <p className="text-sm text-slate-100 font-bold leading-relaxed drop-shadow-sm">
              {lang === 'ko' 
                ? '원하는 시설물군을 선택하고 재질, 높이, 키워드를 조합하여 즉시 설계 및 도면 자료를 찾아보실 수 있습니다.'
                : 'Filter products by material, height, and usage, and instantly download CAD designs and specification sheets.'}
            </p>

            {/* In-page Smart search bar */}
            <div className="relative pt-2">
              <input 
                type="text"
                placeholder={lang === 'ko' ? '제품군, 재질, 모델명으로 즉시 검색... (예: LED, 볼라드, 분리대, DW-S100)' : 'Search by models, material, specs...'}
                value={searchFilterQuery}
                onChange={(e) => setSearchFilterQuery(e.target.value)}
                className="w-full bg-white text-slate-900 rounded-full py-3.5 px-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-brand shadow-md border border-gray-200 font-medium"
              />
              <Search className="absolute left-4 top-5.5 h-4.5 w-4.5 text-slate-400" />
              {searchFilterQuery && (
                <button 
                  onClick={() => setSearchFilterQuery('')}
                  className="absolute right-4 top-5.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT COLUMN: SIDEBAR FILTERS */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Category Filter */}
            <div className="bg-white rounded-lg border border-border-light p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-navy flex items-center space-x-2 text-sm">
                  <Filter className="h-4 w-4 text-orange-brand" />
                  <span>{lang === 'ko' ? '시설물 대분류' : 'Categories'}</span>
                </h3>
                <button 
                  onClick={handleResetFilters}
                  className="text-[10px] text-orange-brand hover:underline flex items-center space-x-1 font-bold"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>{lang === 'ko' ? '필터 초기화' : 'Reset'}</span>
                </button>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 text-sm font-bold rounded transition-colors flex items-center justify-between ${
                    selectedCategory === 'all'
                      ? 'bg-orange-brand text-white font-bold'
                      : 'text-slate-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{lang === 'ko' ? '전체 시설물 보기' : 'All Products'}</span>
                  <span className="text-xs opacity-70">({allProducts.length})</span>
                </button>

                {categories.map((cat) => {
                  const count = allProducts.filter(p => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 text-sm font-bold rounded transition-colors flex items-center justify-between ${
                        selectedCategory === cat.id
                          ? 'bg-orange-brand text-white font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{lang === 'ko' ? cat.name : cat.nameEn}</span>
                      <span className="text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Smart Specification Filters */}
            <div className="bg-white rounded-lg border border-border-light p-6 shadow-sm space-y-5">
              <h3 className="font-extrabold text-navy text-sm border-b border-gray-100 pb-3">
                {lang === 'ko' ? '상세 스마트 필터' : 'Specification Filters'}
              </h3>

              {/* Material Dropdown Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">{lang === 'ko' ? '시설물 재질' : 'Material'}</label>
                <div className="flex flex-col gap-1">
                  {materialsList.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMaterial(m.value)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center justify-between ${
                        selectedMaterial === m.value 
                          ? 'bg-orange-brand/10 text-orange-brand font-bold border border-orange-brand/20' 
                          : 'text-slate-500 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span>{m.label}</span>
                      {selectedMaterial === m.value && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height Dropdown Filter */}
              <div className="space-y-1.5 pt-3 border-t border-gray-100">
                <label className="text-xs font-bold text-navy">{lang === 'ko' ? '규격 높이 (Height)' : 'Height'}</label>
                <div className="flex flex-col gap-1">
                  {heightsList.map((h) => (
                    <button
                      key={h.value}
                      onClick={() => setSelectedHeight(h.value)}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center justify-between ${
                        selectedHeight === h.value 
                          ? 'bg-orange-brand/10 text-orange-brand font-bold border border-orange-brand/20' 
                          : 'text-slate-500 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <span>{h.label}</span>
                      {selectedHeight === h.value && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Cloud Filter */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <label className="text-xs font-bold text-navy">{lang === 'ko' ? '설치장소 및 용도 태그' : 'Utility Tags'}</label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                      selectedTag === 'all'
                        ? 'bg-orange-brand text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'ko' ? '전체 태그' : 'All'}
                  </button>
                  {uniqueTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-sm ${
                        selectedTag === tag
                          ? 'bg-orange-brand text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: PRODUCT CARDS LIST */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="flex items-center justify-between bg-white border border-border-light px-6 py-4 rounded-lg shadow-sm">
              <p className="text-xs font-bold text-slate-500">
                {lang === 'ko' 
                  ? `검색 결과: 총 ${filteredProducts.length}개의 시설물이 조회되었습니다.` 
                  : `Found ${filteredProducts.length} safety products.`}
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-border-light rounded-lg p-16 text-center space-y-4 shadow-sm">
                <HelpCircle className="h-16 w-16 text-orange-brand/50 mx-auto animate-pulse" />
                <h4 className="text-lg font-bold text-navy">{lang === 'ko' ? '검색 필터 결과 없음' : 'No Products Match Filters'}</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {lang === 'ko' 
                    ? '설정하신 재질, 높이, 키워드 조합에 매칭되는 제품이 없습니다. 필터를 초기화하거나 검색어를 줄여보세요.' 
                    : 'Try resetting the specification filters to find more relevant items.'}
                </p>
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-navy hover:bg-orange-brand text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ko' ? '필터 및 검색어 초기화' : 'Reset Filters'}
                </button>
              </div>
            ) : (() => {
              const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
              const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
              const indexOfLastItem = activePage * itemsPerPage;
              const indexOfFirstItem = indexOfLastItem - itemsPerPage;
              const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

              const startPage = Math.floor((activePage - 1) / 10) * 10 + 1;
              const endPage = Math.min(totalPages, startPage + 9);
              const pages = [];
              for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
              }

              return (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentProducts.map((prod) => {
                      return (
                        <div 
                          key={prod.id}
                          className="bg-white border border-border-light hover:border-orange-brand rounded-lg overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group relative"
                        >

                          {/* Image Frame */}
                          <div className="h-64 sm:h-72 bg-white flex items-center justify-center p-4 border-b border-gray-100 relative cursor-pointer" onClick={() => handleViewDetails(prod.id)}>
                            <img 
                              src={getEmbedImageUrl(prod.images[0]) || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'} 
                              alt={prod.name}
                              className="max-w-full max-h-full object-contain group-hover:scale-103 transition-transform duration-300"
                            />
                            <div className="absolute bottom-3 right-3 flex space-x-1">
                              {prod.isNew && <span className="bg-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">NEW</span>}
                              {prod.isPopular && <span className="bg-orange-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">BEST</span>}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold text-orange-brand uppercase tracking-widest">{prod.categoryId}</p>
                              <h4 
                                onClick={() => handleViewDetails(prod.id)}
                                className="font-bold text-navy hover:text-orange-brand cursor-pointer transition-colors text-sm line-clamp-1"
                              >
                                {lang === 'ko' ? prod.name : prod.nameEn}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-2 h-10 leading-relaxed">
                                {lang === 'ko' ? prod.description : prod.descriptionEn}
                              </p>
                            </div>

                            {/* Specs overview table preview */}
                            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-[10px] space-y-1 text-slate-600 font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">{lang === 'ko' ? '재질:' : 'Mat:'}</span>
                                <span className="text-slate-800 font-semibold line-clamp-1">{lang === 'ko' ? prod.specifications.material : prod.specificationsEn.material}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">{lang === 'ko' ? '규격/높이:' : 'Size/H:'}</span>
                                <span className="text-slate-800 font-semibold">{prod.specifications.height} ({prod.specifications.size})</span>
                              </div>
                            </div>

                            {/* Detail Link */}
                            <button 
                              onClick={() => handleViewDetails(prod.id)}
                              className="w-full py-2 bg-navy hover:bg-orange-brand text-white rounded text-xs font-bold transition-colors flex items-center justify-center space-x-1 shadow-sm cursor-pointer"
                            >
                              <span>{lang === 'ko' ? '제품 상세 규격보기' : 'View Full Specifications'}</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>

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

          </div>

        </div>

      </div>



    </div>
  );
}
