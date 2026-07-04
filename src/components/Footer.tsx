import React from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface FooterProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  lang: 'ko' | 'en';
}

export default function Footer({ currentView, setCurrentView, lang }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy text-slate-300 border-t border-white/10" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="h-10">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 90" className="h-9 w-auto" aria-label="동우산업(주) Logo">
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
                
                {/* Right Side: Korean Text (White for dark bg) */}
                <text x="100" y="46" fontFamily="system-ui, -apple-system, 'Malgun Gothic', sans-serif" fontWeight="900" fontSize="42" fill="#ffffff" letterSpacing="-1.5">동우산업(주)</text>
                
                {/* Right Side: English Text (Slate-200 for dark bg) */}
                <text x="102" y="74" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="700" fontSize="21" fill="#e2e8f0" letterSpacing="-0.5">Dongwoo Industry Co., LTD.</text>
              </svg>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ko' 
                ? '동우산업(주)은 최고의 기술력과 장인정신으로 도로 교통 안전시설물 시장을 선도해 나가고 있습니다. 믿을 수 있는 품질과 정밀 설계로 보다 안전한 세상을 만듭니다.' 
                : 'Dongwoo Industry Co., LTD. leads the road safety facilities market with premium technology and craftsmanship. We create a safer world with reliable quality and precise design.'}
            </p>
            <div className="flex space-x-3 text-slate-400">
              <span className="text-xs border border-white/10 px-2.5 py-1 rounded bg-slate-800/50">ISO 9001</span>
              <span className="text-xs border border-white/10 px-2.5 py-1 rounded bg-slate-800/50">우수기자재</span>
            </div>
          </div>

          {/* Column 2: Fast Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {lang === 'ko' ? '빠른 메뉴' : 'Sitemap'}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentView('company')} className="hover:text-orange-brand transition-colors cursor-pointer text-left">
                  {lang === 'ko' ? '회사소개 (연혁/인증)' : 'About Doongwoo'}
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('products')} className="hover:text-orange-brand transition-colors cursor-pointer text-left">
                  {lang === 'ko' ? '제품소개 (카탈로그)' : 'Product Catalog'}
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('tech')} className="hover:text-orange-brand transition-colors cursor-pointer text-left">
                  {lang === 'ko' ? '기술자료 (도면/성적서)' : 'Technical Docs'}
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('projects')} className="hover:text-orange-brand transition-colors cursor-pointer text-left">
                  {lang === 'ko' ? '시공사례' : 'Projects'}
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-3">
              {lang === 'ko' ? '고객지원센터' : 'Support Center'}
            </h3>
            <div className="flex items-start space-x-2.5 text-xs text-slate-400">
              <Phone className="h-4 w-4 text-orange-brand flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">031-965-1133</p>
                <p className="text-[11px] text-slate-500">{lang === 'ko' ? '평일 09:00 - 18:00 (토/일 휴무)' : 'Mon-Fri 09:00 - 18:00'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 text-xs text-slate-400">
              <Mail className="h-4 w-4 text-orange-brand" />
              <span>dongwoo116@hanmail.net</span>
            </div>
            <div className="flex items-start space-x-2.5 text-xs text-slate-400">
              <MapPin className="h-4 w-4 text-orange-brand flex-shrink-0 mt-0.5" />
              <span>{lang === 'ko' ? '본사및 공장(410-821) 경기도 고양시 일산동구 견달산로 225번길 61' : 'Head Office & Factory: 61, Gyeondalsan-ro 225beon-gil, Ilsandong-gu, Goyang-si, Gyeonggi-do, Korea'}</span>
            </div>
          </div>

          {/* Column 4: Documentations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
              {lang === 'ko' ? '카탈로그 신청' : 'Brochure Request'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ko' ? '동우산업(주)의 통합 인쇄용 고해상도 카탈로그를 무료로 신청하실 수 있습니다.' : "You can request Dongwoo Industry's high-resolution printed brochures free of charge."}
            </p>
            <button 
              onClick={() => setCurrentView('customer')}
              className="w-full py-2 px-4 bg-orange-brand hover:bg-orange-brand-hover text-white rounded text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1 cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>{lang === 'ko' ? '카탈로그 우편 신청' : 'Apply for Mail Catalog'}</span>
            </button>
          </div>

        </div>

        {/* Corporate bottom detail */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <div className="text-center sm:text-left space-y-1">
            <p>동우산업(주) | 대표이사: 전홍은 | 사업자등록번호: 120-81-12180</p>
            <p>Copyright &copy; {currentYear} Dongwoo Industry Co., LTD. All Rights Reserved. Coordinated with Google AI Studio.</p>
          </div>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <button onClick={() => setCurrentView('admin')} className="hover:text-orange-brand flex items-center space-x-1 cursor-pointer">
              <ShieldCheck className="h-3 w-3" />
              <span>{lang === 'ko' ? '관리자 통합 CMS 로그인' : 'Admin CMS Login'}</span>
            </button>
            <span className="cursor-pointer hover:text-white">{lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}</span>
            <span className="cursor-pointer hover:text-white">{lang === 'ko' ? '이용약관' : 'Terms of Use'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
