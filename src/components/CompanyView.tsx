import React, { useState, useEffect } from 'react';
import { 
  Award, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Settings, 
  Clock, 
  Building,
  Target,
  Sparkles,
  ChevronRight,
  Eye,
  Info,
  Plus,
  Trash2,
  Edit3,
  X,
  UploadCloud
} from 'lucide-react';
import { auth, DBService, getEmbedImageUrl } from '../lib/firebase';
import { CertItem } from '../types';

interface CompanyViewProps {
  lang: 'ko' | 'en';
}

export default function CompanyView({ lang }: CompanyViewProps) {
  const [activeTab, setActiveTab] = useState<'ceo' | 'vision' | 'history' | 'certs'>('ceo');
  const [isAdmin, setIsAdmin] = useState(false);
  const [bannerBg, setBannerBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');
  const [orgChartImg, setOrgChartImg] = useState<string>('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ceoGreeting, setCeoGreeting] = useState<any>(null);

  useEffect(() => {
    DBService.getBanners().then(b => {
      if (b) {
        if (b.company) setBannerBg(b.company);
        if (b.orgChart) setOrgChartImg(b.orgChart);
      }
    });
    DBService.getCertifications().then(setCerts);
    DBService.getCeoGreeting().then(setCeoGreeting);
  }, []);

  useEffect(() => {
    const checkAdmin = () => {
      const logged = localStorage.getItem('dw_admin_logged') === 'true' || !!auth.currentUser;
      setIsAdmin(logged);
    };
    checkAdmin();
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkAdmin();
    });
    return () => unsubscribe();
  }, []);

  // Updated history data based on real history: http://dong-woo.net/sub/sub_1_2.php
  const historyData = [
    { year: '1985.07', ko: '동우산업사 설립', en: 'Established Dongwoo Industry' },
    { year: '1992.06', ko: '동우산업(주) 법인 설립', en: 'Established Dongwoo Industry Co. ltd.' },
    { year: '1992.08', ko: '철물공사 (전문건설업) 면허 취득)', en: 'Registered Designs' },
    { year: '1993.05', ko: '전기공사,도장공사 (전문건설업) 면허취득', en: 'Acquired ISO 9001 Certification' },
    { year: '1997.04', ko: '조우건설(주) 설립(철물공사,도장공사, 옥외광고업 등록 )', en: 'Acquired Designs & Patents' },
    { year: '1999.06', ko: '옥외광고업 등록', en: 'Signed PPS Third-Party Contract' },
    { year: '2001.08', ko: 'KS A 3505 (반사안전 표지판) 인증 획득', en: 'Added Designs and Utility Models' },
    { year: '2009.03', ko: 'ISO9001 획득', en: 'Built and moved to self-owned factory in Goyang' },
    { year: '2010.01', ko: '산업디자인 전문회사 및 기업부설연구소 인정', en: 'Added Multiple Patents' },
    { year: '2010.08', ko: '가로시설물용 지주의 시공방법 및 그 구조특허 취득', en: 'Acquired MAIN-BIZ Certification' },
    { year: '2011.07', ko: '우수발명품 우선 구매 추천확인', en: 'Acquired ISO 14001 Certification' },
    { year: '2012.09', ko: '경기도 옥외광고 모범기업 인증', en: 'Acquired INNO-BIZ Certification' },
    { year: '2013.01', ko: '기술혁신형 중소기업(INNO-BIZ) 확인', en: 'Acquired INNO-BIZ Certification' },
    { year: '2013.04', ko: '단체표준 표시인증(휀스,버스승강장)', en: 'Acquired INNO-BIZ Certification' },
    { year: '2014.08', ko: '현수식 도로표지판/조립식 도로표지판 특허 취득', en: 'Acquired INNO-BIZ Certification' }
  
  ];

  const tabs = [
    { id: 'ceo', ko: 'CEO 인사말', en: 'CEO Message' },
    { id: 'vision', ko: '기업비전 & 조직도', en: 'Vision & Org' },
    { id: 'history', ko: '주요 연혁', en: 'History' },
    { id: 'certs', ko: '특허 및 인증현황', en: 'Patents & Certs' }
  ];

  // Limit displayed certifications
  const displayedCerts = isExpanded ? certs : certs.slice(0, 4);

  return (
    <div className="w-full bg-slate-50 min-h-screen" id="company-view">
      
      {/* Banner */}
      <section className="relative py-20 overflow-hidden border-b border-gray-200" id="company-banner">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center brightness-[1.1] bg-white" style={{ backgroundImage: `url('${getEmbedImageUrl(bannerBg)}')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center sm:text-left space-y-3">
          <span className="inline-block px-3 py-1 bg-orange-500 text-white rounded-md text-xs font-black uppercase tracking-widest">{lang === 'ko' ? '회사소개' : 'About Us'}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {lang === 'ko' ? '도로안전의 미래를 짓다' : 'Building the Future of Road Safety'}
          </h1>
          <p className="text-sm text-slate-100 max-w-xl font-bold leading-relaxed drop-shadow-sm">
            {lang === 'ko' ? '최고의 규격, 정직한 품질, 한 차원 높은 안전 가치로 생명을 지키는 최첨단 안전 인프라를 만듭니다.' : 'We manufacture cutting-edge safety infrastructures to protect lives with premium standards and solid quality.'}
          </p>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-20 z-40 shadow-sm" id="company-tabs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-2 overflow-x-auto py-3 justify-start sm:justify-center scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                }`}
              >
                {lang === 'ko' ? tab.ko : tab.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" id="company-content">
        
        {/* CEO Greeting Tab */}
        {activeTab === 'ceo' && ceoGreeting && (
          <div 
            className="relative border border-slate-200 rounded-3xl p-8 sm:p-14 shadow-md max-w-4xl mx-auto overflow-hidden min-h-[850px] flex flex-col justify-between" 
            id="tab-ceo"
            style={{
              backgroundImage: `url('${getEmbedImageUrl(ceoGreeting.bgImg) || '/uploads/ae95d482-263e-4409-ba45-7a6fcda4a52c_1783060259227.jpg'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[0.5px]"></div>
            
            <div className="relative z-10 flex flex-col justify-between h-full flex-1 pt-12 sm:pt-16 space-y-8">
              <div className="text-center space-y-4">
                <span className="text-[20px] sm:text-[24px] font-serif italic font-extrabold text-orange-500 tracking-[0.25em] block uppercase drop-shadow-xs">CEO GREETINGS</span>
                <h3 className="text-2xl sm:text-3.5xl font-black text-slate-900 tracking-tight leading-normal whitespace-pre-line font-handwriting">
                  {lang === 'ko' ? ceoGreeting.title : (ceoGreeting.titleEn || ceoGreeting.title)}
                </h3>
              </div>

              <div className="max-w-2xl mx-auto px-2 sm:px-6 text-[18px] sm:text-[22px] text-slate-800 space-y-6 leading-[2.1] font-handwriting">
                <p className="font-extrabold text-[20px] sm:text-[25px] text-slate-950 border-b-2 border-orange-500/20 pb-1.5 inline-block">
                  {lang === 'ko' ? ceoGreeting.subtitle : (ceoGreeting.subtitleEn || ceoGreeting.subtitle)}
                </p>
                <div className="whitespace-pre-line leading-[2.1]">
                  {lang === 'ko' ? ceoGreeting.content : (ceoGreeting.contentEn || ceoGreeting.content)}
                </div>
              </div>

              {/* CEO Signature and Name block */}
              <div className="flex flex-col items-end pr-2 sm:pr-8 pt-6 border-t border-slate-200/40 font-handwriting">
                {ceoGreeting.date && (
                  <p className="text-sm sm:text-lg text-slate-500 font-bold mb-1">{ceoGreeting.date}</p>
                )}
                <div className="flex items-center space-x-4">
                  <h4 className="text-[20px] sm:text-[26px] font-extrabold text-slate-950 tracking-tight">
                    {lang === 'ko' ? ceoGreeting.ceoName : (ceoGreeting.ceoNameEn || ceoGreeting.ceoName)}
                  </h4>
                  {ceoGreeting.signatureImg ? (
                    <img 
                      src={getEmbedImageUrl(ceoGreeting.signatureImg)} 
                      alt="Signature" 
                      className="h-10 sm:h-14 object-contain" 
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">({lang === 'ko' ? '서명' : 'Signature'})</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vision & Org Tab */}
        {activeTab === 'vision' && (
          <div className="space-y-8" id="tab-vision">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: '고객 중심 신뢰경영', titleEn: 'Trust-based Quality', desc: '국가 관급 규격의 완벽 준수로 하자 제로, 현장 피드백 10분 즉시 처리를 준수합니다.', icon: <ShieldCheck className="h-6 w-6 text-orange-500" /> },
                { title: '기술 융합 스마트 혁신', titleEn: 'Smart Technology Integration', desc: 'LED 결합 제품, 탄성 신소재 등 연구개발 부문에 적극 투자합니다.', icon: <Sparkles className="h-6 w-6 text-orange-500" /> },
                { title: '지속가능성 & 친환경', titleEn: 'Eco-friendly Materials', desc: '자연에서 분해/재활용이 가능한 우레탄 조인트 기술로 환경 보존에 기여합니다.', icon: <Target className="h-6 w-6 text-orange-500" /> },
              ].map((v, idx) => (
                <div key={idx} className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm text-center space-y-3">
                  <div className="h-12 w-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    {v.icon}
                  </div>
                  <h4 className="font-extrabold text-slate-900">{lang === 'ko' ? v.title : v.titleEn}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>

            {/* Org chart diagram container */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">ORGANIZATION CHART</span>
                <h3 className="text-2xl font-extrabold text-slate-900">{lang === 'ko' ? '동우산업 조직도' : 'Company Organization Chart'}</h3>
                <p className="text-xs text-slate-500">{lang === 'ko' ? '체계적인 기술 지원과 신속한 응대를 위한 유기적인 연합 구조' : 'An organic structure for systematic technical support and fast delivery.'}</p>
              </div>

              {orgChartImg ? (
                <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 p-3 shadow-inner">
                  <img 
                    src={getEmbedImageUrl(orgChartImg)} 
                    alt="동우산업 조직도" 
                    className="w-full h-auto object-contain mx-auto max-h-[700px] rounded-xl"
                  />
                </div>
              ) : (
                /* Graphical representation of hierarchy */
                <div className="max-w-xl mx-auto space-y-6 pt-6 font-semibold text-xs">
                  <div className="bg-orange-500 text-white py-3 px-6 rounded-lg max-w-xs mx-auto shadow">
                    {lang === 'ko' ? '대표이사 (President)' : 'President'}
                  </div>
                  <div className="h-6 w-0.5 bg-gray-300 mx-auto"></div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow">
                      <p className="text-orange-400 font-bold">{lang === 'ko' ? '기술연구소' : 'R&D Center'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{lang === 'ko' ? '신소재 / 스마트설계' : 'CAD & Smart IoT'}</p>
                    </div>
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow">
                      <p className="text-orange-400 font-bold">{lang === 'ko' ? '제조생산본부' : 'Manufacturing'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{lang === 'ko' ? '사출 / 압출 / 조립' : 'Injection & Quality'}</p>
                    </div>
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow">
                      <p className="text-orange-400 font-bold">{lang === 'ko' ? '해외/국내영업부' : 'Sales Division'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{lang === 'ko' ? '조달청 / 해외 파트너' : 'B2B Procurement'}</p>
                    </div>
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow">
                      <p className="text-orange-400 font-bold">{lang === 'ko' ? '시공관리팀' : 'Civil Engineering'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{lang === 'ko' ? '전국 현장 시공 및 보수' : 'Site installation'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Timeline */}
        {activeTab === 'history' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm" id="tab-history">
            <div className="relative border-l-2 border-orange-200 ml-4 md:ml-32 space-y-12 py-4">
              {historyData.map((item, i) => (
                <div key={i} className="relative group">
                  {/* Circle locator */}
                  <div className="absolute -left-2 top-1.5 h-4 w-4 bg-orange-500 rounded-full border-4 border-white group-hover:scale-125 transition-transform"></div>
                  
                  {/* Left-side absolute year in desktop */}
                  <div className="hidden md:block absolute -left-32 top-0.5 text-right w-24 font-mono font-extrabold text-2xl text-slate-900">
                    {item.year}
                  </div>

                  <div className="ml-6 space-y-1">
                    {/* Year on mobile */}
                    <div className="md:hidden font-mono font-extrabold text-lg text-orange-500">
                      {item.year}
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug">
                      {lang === 'ko' ? item.ko : item.en}
                    </p>
                    <p className="text-xs text-slate-400">
                      {lang === 'ko' ? ' ' : 'Complied with official government public design specifications'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patents & Certs */}
        {activeTab === 'certs' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6" id="tab-certs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">CERTIFICATIONS</span>
                <h3 className="text-2xl font-extrabold text-slate-900">{lang === 'ko' ? '특허 및 품질인증서' : 'Patents & Certificates'}</h3>
              </div>
              <div className="flex items-center mt-4 sm:mt-0">
                <span className="text-xs text-slate-400 font-mono">Total {certs.length} Registrations</span>
              </div>
            </div>

            {/* Changed to 3 columns grid with A4 aspect ratio thumbnails as requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
              {displayedCerts.map((c) => (
                <div 
                  key={c.id} 
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col relative group hover:shadow-lg hover:border-orange-300 transition-all duration-300"
                >
                  {/* A4 Aspect Ratio Vertical Thumbnail */}
                  <div 
                    onClick={() => setZoomImage(c.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80')}
                    className="aspect-[210/297] w-full bg-slate-50 border-b border-gray-100 overflow-hidden relative cursor-pointer group"
                  >
                    <img 
                      src={getEmbedImageUrl(c.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80')} 
                      alt={c.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1 shadow">
                        <Eye className="h-3.5 w-3.5 text-orange-500" />
                        <span>{lang === 'ko' ? '크게 보기' : 'Enlarge'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Information Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-1.5">
                        <div className="h-5 w-5 bg-orange-100 text-orange-600 rounded flex items-center justify-center flex-shrink-0">
                          <Award className="h-3 w-3" />
                        </div>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                          {c.auth.split('|')[0]?.trim()}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-950 text-sm tracking-tight leading-snug group-hover:text-orange-500 transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400">
                        {c.auth.split('|')[1]?.trim() || c.auth}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed pt-1 font-normal line-clamp-3">
                        {c.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All (전체보기) Button */}
            {certs.length > 4 && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-6 py-2 border border-gray-300 hover:border-orange-500 text-slate-700 hover:text-orange-600 rounded-full text-xs font-extrabold transition-all flex items-center space-x-1"
                >
                  <span>{isExpanded ? (lang === 'ko' ? '접기' : 'Show Less') : (lang === 'ko' ? '전체보기' : 'View All')}</span>
                  <ChevronRight className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Location & Interactive map illustration */}
        <div className="mt-12 bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6" id="company-location">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-orange-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">{lang === 'ko' ? '오시는 길 (동우산업(주))' : 'Office & Factory Location'}</h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ko' ? '경기도 고양시 일산동구 견달산로 225번길 61' : '61, Gyeondalsan-ro 225beon-gil, Ilsandong-gu, Goyang-si, Gyeonggi-do, Korea'}
                </p>
              </div>
            </div>
            <div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("경기도 고양시 일산동구 견달산로 225번길 61")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow transition-colors"
              >
                <span>{lang === 'ko' ? '네비게이션 / 지도 열기' : 'Open in Google Maps'}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </div>
          </div>

          {/* Real Interactive Google Maps centered on Siksa-dong, Goyang-si */}
          <div className="h-96 bg-slate-100 rounded-2xl border border-gray-200 overflow-hidden relative shadow-sm" id="interactive-google-map">
            <iframe
              title="Dongwoo Industry Location Map"
              src={`https://maps.google.com/maps?q=${encodeURIComponent("경기도 고양시 일산동구 견달산로 225번길 61")}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>

      </div>

      {/* Patent Certificate Zoom Modal */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white rounded-3xl p-3 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-orange-500 text-white p-2 rounded-full transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-y-auto w-full h-full flex items-center justify-center p-4 bg-slate-50 rounded-2xl">
              <img 
                src={zoomImage} 
                alt="Enlarged Certificate" 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
