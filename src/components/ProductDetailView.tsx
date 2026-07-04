import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  MessageSquare, 
  Settings, 
  MapPin, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { Product, Project } from '../types';

interface ProductDetailViewProps {
  lang: 'ko' | 'en';
  productId: string;
  onBack: () => void;
  setCurrentView: (view: string) => void;
  setSelectedProductId: (id: string | null) => void;
}

export default function ProductDetailView({
  lang,
  productId,
  onBack,
  setCurrentView,
  setSelectedProductId
}: ProductDetailViewProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    DBService.getProductById(productId).then(async (prod) => {
      if (prod) {
        setProduct(prod);
        setActiveImage(prod.images[0] || '');

        const allProds = await DBService.getProducts();

        // Fetch similar products (same category, excluding current, limit 2)
        const similar = allProds
          .filter(p => p.categoryId === prod.categoryId && p.id !== prod.id)
          .slice(0, 2);
        setSimilarProducts(similar);

        // Fetch related products
        if (prod.relatedProducts && prod.relatedProducts.length > 0) {
          const related = allProds.filter(p => prod.relatedProducts.includes(p.id));
          setRelatedProducts(related);
        } else {
          setRelatedProducts([]);
        }

        // Fetch related projects (Double-sided linking!)
        const allProjs = await DBService.getProjects();
        const relatedProjs = allProjs.filter(proj => 
          (proj.products || []).includes(prod.id) || 
          prod.projects?.includes(proj.id)
        );
        setRelatedProjects(relatedProjs);
      }
    });
  }, [productId]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <p>{lang === 'ko' ? '제품 정보를 불러오지 못했습니다.' : 'Failed to load product details.'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded">
          {lang === 'ko' ? '목록으로 돌아가기' : 'Back to Catalog'}
        </button>
      </div>
    );
  }

  const handleDownload = (fileName: string) => {
    alert(lang === 'ko' ? `[${fileName}] 설계 도면 및 서류 다운로드 요청이 정상 접수되었습니다.` : `[${fileName}] Download completed.`);
    DBService.recordDownload(product.id);
  };

  const handleQuoteRedirect = () => {
    setCurrentView('customer');
  };

  const currentSpecs = lang === 'ko' ? product.specifications : product.specificationsEn;

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8" id="product-detail-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-orange-brand transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{lang === 'ko' ? '전체 카탈로그로 돌아가기' : 'Back to Product Catalog'}</span>
          </button>
          <span className="text-[10px] bg-orange-brand/10 text-orange-brand font-bold px-2.5 py-1 rounded-sm uppercase">
            Model: {product.id.toUpperCase()}
          </span>
        </div>

        {/* TOP PANEL: IMAGE FRAME & SUMMARY CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-lg border border-border-light p-6 sm:p-8 shadow-sm mb-8">
          
          {/* Images Slider Frame (Left) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="h-96 bg-white rounded overflow-hidden border border-border-light flex items-center justify-center">
              <img 
                src={getEmbedImageUrl(activeImage)} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain p-2"
              />
            </div>
            
            {/* Thumbnails list */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`h-16 w-16 rounded overflow-hidden border-2 flex-shrink-0 transition-all bg-white flex items-center justify-center ${
                      activeImage === img ? 'border-orange-brand shadow-sm font-bold' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={getEmbedImageUrl(img)} alt="Thumb" className="max-w-full max-h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Summary Specs Panel (Right) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1">
                {product.certifications.map((cert, idx) => (
                  <span key={idx} className="bg-slate-50 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-sm border border-border-light flex items-center space-x-1">
                    <ShieldCheck className="h-3 w-3 text-orange-brand" />
                    <span>{cert}</span>
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
                {lang === 'ko' ? product.name : product.nameEn}
              </h1>

              <p className="text-[16.8px] text-slate-600 leading-relaxed">
                {lang === 'ko' ? product.description : product.descriptionEn}
              </p>

              {/* Brief Quick Spec */}
              <div className="border-t border-b border-border-light py-4 space-y-2 text-[14.4px] font-mono">
                {product.g2bIdentifier && (
                  <div className="grid grid-cols-12">
                    <span className="col-span-4 text-slate-400 font-bold">{lang === 'ko' ? '● 식별 번호' : '● G2B Identifier'}</span>
                    <span className="col-span-8 text-orange-600 font-bold">{product.g2bIdentifier}</span>
                  </div>
                )}
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-400 font-bold">{lang === 'ko' ? '● 대표 재질' : '● Material'}</span>
                  <span className="col-span-8 text-slate-800 font-semibold">{currentSpecs.material}</span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-400 font-bold">{lang === 'ko' ? '● 설치 규격' : '● Dimensions'}</span>
                  <span className="col-span-8 text-slate-800 font-semibold">
                    {currentSpecs.spec1 || currentSpecs.height || ''} 
                    {currentSpecs.spec2 || (lang === 'ko' ? product.specifications.size : product.specificationsEn.size) ? ` / ${currentSpecs.spec2 || (lang === 'ko' ? product.specifications.size : product.specificationsEn.size)}` : ''}
                    {currentSpecs.spec3 ? ` / ${currentSpecs.spec3}` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-12">
                  <span className="col-span-4 text-slate-400 font-bold">{lang === 'ko' ? '● 주요 태그' : '● Usage tags'}</span>
                  <span className="col-span-8 text-slate-800 font-semibold">#{product.tags.join(', #')}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="w-full">
              {product.g2bLink ? (
                <a 
                  href={product.g2bLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-orange-brand hover:bg-orange-brand-hover text-white rounded text-[14.4px] font-bold transition-colors shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer text-center"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{lang === 'ko' ? '나라장터에서 구매하기' : 'Purchase on G2B'}</span>
                </a>
              ) : (
                <button 
                  onClick={() => alert(lang === 'ko' ? '나라장터 구매 링크가 등록되지 않았습니다. 관리자 메뉴에서 링크를 등록해 주십시오.' : 'Nara Jangter purchasing link has not been registered yet.')}
                  className="w-full py-3 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded text-[14.4px] font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{lang === 'ko' ? '나라장터에서 구매하기' : 'Purchase on G2B'}</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* MIDDLE PANEL: TECHNICAL SPECIFICATIONS (TABLES) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Detailed Spec Table (Col-span 2) */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-border-light p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-3 flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-brand" />
              <span>{lang === 'ko' ? '상세 기술 사양 및 설치 정보' : 'Technical Specifications'}</span>
            </h3>

            <div className="border border-border-light rounded overflow-hidden font-mono text-xs">
              {[
                ...(product.g2bIdentifier ? [{ label: lang === 'ko' ? '나라장터 식별번호' : 'G2B Identifier', value: product.g2bIdentifier }] : []),
                { label: lang === 'ko' ? '주요 재질 (Material)' : 'Material Spec', value: currentSpecs.material },
                { label: lang === 'ko' ? '규격 1' : 'Specification 1', value: currentSpecs.spec1 || currentSpecs.height || '' },
                { label: lang === 'ko' ? '규격 2' : 'Specification 2', value: currentSpecs.spec2 || (lang === 'ko' ? product.specifications.size : product.specificationsEn.size) || '' },
                { label: lang === 'ko' ? '규격 3' : 'Specification 3', value: currentSpecs.spec3 || '' },
                { 
                  label: lang === 'ko' ? '기타 정보' : 'Other Info', 
                  value: currentSpecs.otherInfo || [
                    currentSpecs.features ? (lang === 'ko' ? `● 제품 기능적 특장점: ${currentSpecs.features}` : `Features: ${currentSpecs.features}`) : '',
                    currentSpecs.installation ? (lang === 'ko' ? `● 권장 기초 설치 공정: ${currentSpecs.installation}` : `Installation: ${currentSpecs.installation}`) : '',
                    currentSpecs.maintenance ? (lang === 'ko' ? `● 유지보수 및 사후관리: ${currentSpecs.maintenance}` : `Maintenance: ${currentSpecs.maintenance}`) : ''
                  ].filter(Boolean).join('\n\n') || '-' 
                }
              ].map((row, idx) => (
                <div key={idx} className={`grid grid-cols-12 p-3.5 border-b border-border-light ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}>
                  <span className="col-span-12 sm:col-span-3 text-slate-400 font-bold">{row.label}</span>
                  <span className="col-span-12 sm:col-span-9 text-slate-800 font-semibold leading-relaxed whitespace-pre-line">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Products panel (Col-span 1) */}
          <div className="bg-white rounded-lg border border-border-light p-6 shadow-sm flex flex-col justify-between">
            {similarProducts.length > 0 ? (
              <div className="space-y-5 w-full">
                <h3 className="text-base font-bold text-navy border-b border-gray-100 pb-3 flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-orange-brand" />
                  <span>{lang === 'ko' ? '비슷한 제품 추천' : 'Recommended Similar Products'}</span>
                </h3>

                <div className="flex flex-col gap-5">
                  {similarProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProductId(p.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group bg-slate-50 hover:bg-orange-brand/[0.03] border border-border-light rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md flex flex-row items-stretch h-36 sm:h-44"
                    >
                      {/* Left Side: Double sized/larger image with floating tag */}
                      <div className="relative w-32 sm:w-40 flex-shrink-0 overflow-hidden bg-white border-r border-gray-100 flex items-center justify-center p-2">
                        <img 
                          src={getEmbedImageUrl(p.images[0])} 
                          alt={p.name} 
                          className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[9px] font-bold text-orange-brand uppercase bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-orange-brand/20 shadow-xs">
                            {p.categoryId}
                          </span>
                        </div>
                      </div>

                      {/* Right Side: Detail information */}
                      <div className="p-4 sm:p-5 flex-1 min-w-0 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="font-extrabold text-sm sm:text-base text-navy group-hover:text-orange-brand transition-colors line-clamp-1 leading-snug">
                            {lang === 'ko' ? p.name : p.nameEn}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                            {lang === 'ko' ? p.specifications.material : p.specificationsEn.material}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-1 leading-normal">
                            {lang === 'ko' 
                              ? (p.specifications.spec1 || p.specifications.height || '') 
                              : (p.specificationsEn.spec1 || p.specificationsEn.height || '')}
                            { (p.specifications.spec2 || p.specifications.size) && ` / ${lang === 'ko' ? (p.specifications.spec2 || p.specifications.size) : (p.specificationsEn.spec2 || p.specificationsEn.size)}` }
                          </p>
                        </div>
                        
                        <div className="flex items-center text-[11px] font-bold text-orange-brand group-hover:translate-x-1 transition-transform duration-200 mt-2">
                          <span>{lang === 'ko' ? '제품 상세보기' : 'View Details'}</span>
                          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[180px]"></div>
            )}
          </div>

        </div>

        {/* BOTTOM PANEL: DOUBLE-SIDED LINKED PROJECTS & RELATED PRODUCTS */}
        <div className="space-y-8">
          
          {/* Linked Projects (Where this product was installed) */}
          {relatedProjects.length > 0 && (
            <div className="bg-navy text-white rounded-lg p-6 sm:p-8 border border-white/10 shadow-sm space-y-5">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-orange-brand" />
                <h3 className="text-lg font-bold">
                  {lang === 'ko' ? `이 안전시설물이 실제 시공된 현장사례 (${relatedProjects.length})` : `Real installations of this product (${relatedProjects.length})`}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedProjects.map((proj) => (
                  <div 
                    key={proj.id}
                    onClick={() => setCurrentView('projects')}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded p-4 flex items-center space-x-4 cursor-pointer transition-all group"
                  >
                    <img src={proj.images[0]} alt={proj.title} className="h-16 w-16 rounded object-cover flex-shrink-0" />
                    <div className="space-y-1 truncate">
                      <span className="bg-orange-brand/10 text-orange-brand border border-orange-brand/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                        {proj.location} / {proj.date}
                      </span>
                      <h4 className="text-xs font-bold text-white group-hover:text-orange-brand transition-colors truncate">
                        {lang === 'ko' ? proj.title : proj.titleEn}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">{lang === 'ko' ? proj.description : proj.descriptionEn}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-orange-brand flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Products list */}
          {relatedProducts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-navy flex items-center space-x-1.5">
                <Sparkles className="h-5 w-5 text-orange-brand" />
                <span>{lang === 'ko' ? '함께 설계에 반영하는 연관 안전시설물' : 'Related Traffic Safety Products'}</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className="bg-white border border-border-light rounded overflow-hidden p-4 hover:shadow-md transition-all cursor-pointer group text-center flex flex-col justify-between"
                  >
                    <div className="h-32 w-full bg-white flex items-center justify-center mb-3 rounded overflow-hidden">
                      <img src={p.images[0]} alt={p.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <h4 className="font-bold text-xs text-navy group-hover:text-orange-brand transition-colors truncate">
                      {lang === 'ko' ? p.name : p.nameEn}
                    </h4>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{p.categoryId}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
