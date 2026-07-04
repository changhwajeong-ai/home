import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  limit,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { Category, Product, Project, NewsItem, DownloadItem, Inquiry, CertItem, CeoGreeting, EmailSettings } from '../types';

const firebaseConfig = {
  projectId: "gen-lang-client-0042466970",
  appId: "1:971476315513:web:97d4c3a4b40ca7cdce13a8",
  apiKey: "AIzaSyCvV-Kb0sL4LUC3gwT6cDJLsBy23VTM8_s",
  authDomain: "gen-lang-client-0042466970.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-9b9d7f9e-bf88-43db-b93f-a66556d3fcb5",
  storageBucket: "gen-lang-client-0042466970.firebasestorage.app",
  messagingSenderId: "971476315513"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

/**
 * Automatically converts Google Drive share links to embeddable direct image URLs.
 */
export function getEmbedImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                        trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                        trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      // Use lh3.googleusercontent.com/d/ which bypasses cookie check blocks and works beautifully in modern browsers
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }
  return trimmed;
}

// ==========================================
// DEFAULT SEED DATA (For out-of-the-box demo)
// ==========================================

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'road-sign', name: '도로표지판', nameEn: 'Road Signs', icon: 'Signpost', isActive: true, order: 1 },
  { id: 'traffic-sign', name: '교통안전표지판', nameEn: 'Traffic Safety Signs', icon: 'AlertTriangle', isActive: true, order: 2 },
  { id: 'lane-divider', name: '차선분리대', nameEn: 'Lane Dividers', icon: 'Spline', isActive: true, order: 3 },
  { id: 'bollard', name: '볼라드', nameEn: 'Bollards', icon: 'ShieldAlert', isActive: true, order: 4 },
  { id: 'fence', name: '디자인휀스', nameEn: 'Design Fences', icon: 'Grid3X3', isActive: true, order: 5 },
  { id: 'awning', name: '차양', nameEn: 'Awnings & Canopies', icon: 'Sun', isActive: true, order: 6 },
  { id: 'others', name: '기타도로안전시설물', nameEn: 'Other Safety Facilities', icon: 'MoreHorizontal', isActive: true, order: 7 }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'bollard-steel-01',
    categoryId: 'bollard',
    name: '고정식 스틸 볼라드 (DW-S100)',
    nameEn: 'Fixed Steel Bollard (DW-S100)',
    description: '고강도 탄소강관 재질로 제작되어 차량 충격으로부터 보행자와 시설물을 완벽히 보호합니다. 고성능 반사지 부착으로 야간 시인성이 극대화되었습니다.',
    descriptionEn: 'Made of high-strength carbon steel pipe to perfectly protect pedestrians and facilities from vehicle impacts. Reflective tape ensures maximum nighttime visibility.',
    images: [
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
    ],
    tags: ['고정식', '스틸', '고강도', '국산'],
    isFeatured: true,
    isNew: false,
    isPopular: true,
    isVisible: true,
    order: 1,
    certifications: ['KS인증', '우수제품'],
    relatedProducts: ['bollard-urethane-02', 'bollard-stone-03'],
    projects: ['proj-seoul-01'],
    specifications: {
      material: '고강도 탄소강관 (Carbon Steel Pipe)',
      spec1: '850mm',
      spec2: 'Ø101.6 x 3.2t',
      spec3: '고정형',
      features: '아연도금 후 분체도장으로 탁월한 부식 방지 효과 및 우수한 야간 시인성',
      installation: '콘크리트 타설 앙카 고정식',
      maintenance: '손상 시 고강도 우레탄 페인트 덧칠로 부분 보수 가능'
    },
    specificationsEn: {
      material: 'High-strength Carbon Steel Pipe',
      spec1: '850mm',
      spec2: 'Ø101.6 x 3.2t',
      spec3: 'Fixed',
      features: 'Hot-dip galvanized and powder coated for corrosion prevention and outstanding high visibility.',
      installation: 'Concrete anchor fixing method',
      maintenance: 'Partial repair is possible with high-durability paint'
    },
    files: [
      { name: 'DW-S100 도면(DWG)', type: 'dwg', url: '#', size: '1.2MB' },
      { name: 'DW-S100 제품 카탈로그(PDF)', type: 'pdf', url: '#', size: '2.4MB' }
    ],
    seo: {
      title: '고정식 스틸 볼라드 DW-S100 | 동우안전',
      description: '국내 최고 품질의 고강도 스틸 볼라드 DW-S100 상세 제원 및 도면 다운로드.',
      keywords: '스틸볼라드, 고정식볼라드, 도로안전시설, 동우안전',
      ogImage: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'
    },
    g2bIdentifier: '23145678',
    g2bLink: 'https://www.g2b.go.kr'
  },
  {
    id: 'bollard-urethane-02',
    categoryId: 'bollard',
    name: '고탄성 우레탄 볼라드 (DW-U80)',
    nameEn: 'Flexible Urethane Bollard (DW-U80)',
    description: '충격 흡수 성능이 우수한 고탄성 폴리우레탄 재질로, 차량과 충돌 시 복원력이 우수하여 차량 손상과 볼라드 손상을 최소화합니다.',
    descriptionEn: 'Made of flexible polyurethane with superior impact absorption. It recovers immediately upon vehicle collision, minimizing damage to both vehicle and post.',
    images: [
      'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'
    ],
    tags: ['이동식', '우레탄', '고탄성', '친환경'],
    isFeatured: true,
    isNew: true,
    isPopular: false,
    isVisible: true,
    order: 2,
    certifications: ['우수체육시설인증', '디자인특허'],
    relatedProducts: ['bollard-steel-01', 'bollard-stone-03'],
    projects: ['proj-busan-02'],
    specifications: {
      material: '폴리우레탄 (Polyurethane)',
      spec1: '800mm',
      spec2: 'Ø150 x 800H',
      spec3: '이동식',
      features: '완벽한 자가 복원력, 충격 흡수성, 탈부착이 용이한 구조',
      installation: '매립형 및 이동식 칼블럭 조립식',
      maintenance: '물 세척만으로 영구적인 표면 관리 가능'
    },
    specificationsEn: {
      material: 'Polyurethane',
      spec1: '800mm',
      spec2: 'Ø150 x 800H',
      spec3: 'Removable',
      features: 'Excellent self-recovery, shock absorption, easily detachable structure',
      installation: 'Base plate bolt fixing / Embedded option',
      maintenance: 'Washing with water is sufficient'
    },
    files: [
      { name: 'DW-U80 도면(DWG)', type: 'dwg', url: '#', size: '1.4MB' },
      { name: 'DW-U80 카탈로그(PDF)', type: 'pdf', url: '#', size: '3.1MB' }
    ],
    seo: {
      title: '고탄성 우레탄 볼라드 DW-U80 | 동우안전',
      description: '부드러우면서도 단단한 고탄성 우레탄 볼라드 복원력 테스트 시험성적서 제공.',
      keywords: '우레탄볼라드, 탄성볼라드, 도로안전, 복원력볼라드',
      ogImage: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80'
    },
    g2bIdentifier: '24567890',
    g2bLink: 'https://www.g2b.go.kr'
  },
  {
    id: 'bollard-stone-03',
    categoryId: 'bollard',
    name: '고급 화강석 석재 볼라드 (DW-G250)',
    nameEn: 'Premium Granite Stone Bollard (DW-G250)',
    description: '천연 화강석을 정밀 가공하여 제작된 최고급 볼라드로 주변 조경 및 보도환경과 고품격 조화를 이룹니다. 아파트 단지 및 보행자 전용 도로에 최적입니다.',
    descriptionEn: 'A high-end bollard made of precisely processed natural granite, beautifully harmonizing with surrounding landscaping. Perfect for premium residential complexes and pedestrian plazas.',
    images: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
    ],
    tags: ['고정식', '석재', '친환경', '조경형'],
    isFeatured: false,
    isNew: false,
    isPopular: true,
    isVisible: true,
    order: 3,
    certifications: ['친환경마크'],
    relatedProducts: ['bollard-steel-01', 'bollard-urethane-02'],
    projects: ['proj-seoul-01'],
    specifications: {
      material: '천연 화강석 (Natural Granite)',
      spec1: '700mm',
      spec2: 'Ø250 x 700H',
      spec3: '석재형',
      features: '천연 질감으로 고급스러운 도시 미관 형성, 우수한 내구성 및 반영구적 수명',
      installation: '하부 앙카 매립식 콘크리트 시공',
      maintenance: '주기적 표면 이물질 제거'
    },
    specificationsEn: {
      material: 'Natural Granite',
      spec1: '700mm',
      spec2: 'Ø250 x 700H',
      spec3: 'Stone-type',
      features: 'Natural texture offers elegant urban aesthetics, superb durability and semi-permanent life cycle',
      installation: 'Concrete foundation with bottom anchor embedment',
      maintenance: 'Periodic cleaning of surface dust'
    },
    files: [
      { name: 'DW-G250 도면(DWG)', type: 'dwg', url: '#', size: '0.8MB' },
      { name: 'DW-G250 시험성적서(PDF)', type: 'pdf', url: '#', size: '1.9MB' }
    ]
  },
  {
    id: 'road-sign-01',
    categoryId: 'road-sign',
    name: '고휘도 도로 안내 표지판',
    nameEn: 'High-Intensity Road Guide Sign',
    description: 'ASTM 표준 규격 고휘도 반사지를 사용하여 야간 및 폭우 시에도 선명한 시인성을 보장합니다. 고강도 알루미늄 판넬로 태풍 등의 극한 기후에 강합니다.',
    descriptionEn: 'Using ASTM standard high-intensity reflective sheet, ensuring crystal clear readability even during heavy rain or night. Heavy-duty aluminum panel stands strong against typhoons.',
    images: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'
    ],
    tags: ['도로안내', '알루미늄', '고휘도', '관급규격'],
    isFeatured: true,
    isNew: false,
    isPopular: true,
    isVisible: true,
    order: 4,
    certifications: ['KS인증', '우수기자재'],
    relatedProducts: [],
    projects: ['proj-seoul-01'],
    specifications: {
      material: '알루미늄 압출판 (Al 5052 H32) + 고휘도 반사지',
      spec1: '주문 제작 (Custom)',
      spec2: '두께 2.0t ~ 3.0t (크기 주문 제작)',
      spec3: '고휘도',
      features: '야간 반사 성능 우수, 변색 및 변형 방지 처리 적용',
      installation: '지주 조립식 고정 또는 아치형 밴드 고정',
      maintenance: '주기적인 반사지 세척 및 부착 상태 확인'
    },
    specificationsEn: {
      material: 'Aluminum Plate (Al 5052 H32) + High-intensity Reflective Sheet',
      spec1: 'Custom sizing',
      spec2: '2.0t - 3.0t thickness',
      spec3: 'High-intensity',
      features: 'Excellent night reflectivity, anti-discoloration and anti-warping coating',
      installation: 'Pole mounted / bracket band fixing',
      maintenance: 'Periodic sheet washing and adhesive inspection'
    },
    files: [
      { name: '표지판 표준 지면 설계도(PDF)', type: 'pdf', url: '#', size: '4.8MB' }
    ]
  },
  {
    id: 'lane-divider-01',
    categoryId: 'lane-divider',
    name: '우레탄 무단횡단금지 차선분리대',
    nameEn: 'Urethane Lane Separator Panel',
    description: '중앙선 침범 및 보행자 무단횡단을 원천 차단하기 위해 유기적으로 설계된 고탄성 차선분리대입니다. 파손 시 부분 교체가 매우 용이합니다.',
    descriptionEn: 'Organic high-elastic lane separator designed to prevent center line intrusion and pedestrian jaywalking. Highly convenient to replace individual segments upon damage.',
    images: [
      'https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?auto=format&fit=crop&w=600&q=80'
    ],
    tags: ['차선분리대', '무단횡단방지', '우레탄', '안전유도'],
    isFeatured: true,
    isNew: true,
    isPopular: true,
    isVisible: true,
    order: 5,
    certifications: ['우수디자인', '성능인증'],
    relatedProducts: [],
    projects: ['proj-busan-02'],
    specifications: {
      material: '폴리에틸렌 + 특수 우레탄 조인트',
      spec1: '900mm',
      spec2: '2000(L) x 150(W) x 900(H)',
      spec3: '무단횡단방지형',
      features: '반사지 삽입으로 우수한 야간 시인성, 연속 설치 및 곡선 부드러운 전개 가능',
      installation: '도로면 가공 후 앙카 체결 조립식',
      maintenance: '단품 파손 시 손상된 블록만 해체하여 간편 교체'
    },
    specificationsEn: {
      material: 'Polyethylene + Special Urethane Joint',
      spec1: '900mm',
      spec2: '2000(L) x 150(W) x 900(H)',
      spec3: 'Jaywalking prevention',
      features: 'High night-reflectivity inserts, continuous linear/curved alignment possible',
      installation: 'Road surface drilling & anchor joint assembly',
      maintenance: 'Individual blocks can be replaced on the spot'
    },
    files: [
      { name: '차선분리대 조립 도면(PDF)', type: 'pdf', url: '#', size: '2.1MB' }
    ]
  }
];

const DEFAULT_PROJECTS: Project[] = [
  {
    id: 'proj-seoul-01',
    title: '서울 광화문 광장 주변 보행자 안전 볼라드 시공',
    titleEn: 'Seoul Gwanghwamun Plaza Pedestrian Safety Bollard Installation',
    location: '서울',
    locationEn: 'Seoul',
    date: '2025-11',
    products: ['bollard-steel-01', 'bollard-stone-03', 'road-sign-01'],
    images: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
    ],
    description: '광화문 광장 재단장 사업에 발맞추어, 시민들이 안전하게 거닐 수 있도록 스틸 및 최고급 화강석 석재 볼라드를 혼합 시공하여 심미성과 내구성을 극대화하였습니다.',
    descriptionEn: 'Aligned with the Gwanghwamun Square Renewal project, we mixed steel and premium granite bollards to maximize both safety and modern urban aesthetics for citizens.'
  },
  {
    id: 'proj-seoul-02',
    title: '서울 강남대로 중앙차로 고휘도 차선분리대 교체 설치',
    titleEn: 'Seoul Gangnam Boulevard High-Visibility Lane Divider Installation',
    location: '서울',
    locationEn: 'Seoul',
    date: '2026-01',
    products: ['lane-divider-01'],
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
    ],
    description: '유동 인구 및 교통량이 세계적으로 극심한 강남대로 버스중앙차선에 고단성 반사 삽입형 차선분리대를 교체 시공하여 보행자 및 차량 충돌 위험성을 획기적으로 낮추었습니다.',
    descriptionEn: 'Replaced outdated separators on busy Gangnam Boulevard with high-elastic reflective dividers, drastically reducing collision risks between transit vehicles and pedestrians.'
  },
  {
    id: 'proj-seoul-03',
    title: '서울 마포구 공덕역 교차로 안전지대 우레탄 펜스 시공',
    titleEn: 'Seoul Mapo Gongdeok Intersection Pedestrian Safety Fence',
    location: '서울',
    locationEn: 'Seoul',
    date: '2026-02',
    products: ['bollard-urethane-02'],
    images: [
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'
    ],
    description: '보행자 무단횡단이 자주 발생하던 공덕역 사거리 주변 교통섬에 고기능성 안전휀스를 둘러 보행자 동선을 유도하고 무단횡단 교통사고를 원천 차단하였습니다.',
    descriptionEn: 'Installed high-durability safety fences on the traffic island at Gongdeok Station intersection, directing pedestrian pathways and fundamentally stopping jaywalking incidents.'
  },
  {
    id: 'proj-seoul-04',
    title: '서울 여의도 국회의사당 진입로 프리미엄 석재 볼라드 시공',
    titleEn: 'Seoul Yeouido Assembly Entrance Premium Granite Bollards',
    location: '서울',
    locationEn: 'Seoul',
    date: '2026-04',
    products: ['bollard-stone-03'],
    images: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
    ],
    description: '국가 중요 입구 조경과의 심미적 조화를 위해 최상급 천연 화강석 석재 볼라드를 시공하여 영구적인 외관 미관을 강화하고 불법 주정차를 물리적으로 원천 봉쇄하였습니다.',
    descriptionEn: 'Fitted premium natural granite stone bollards at the National Assembly entrance, achieving complete physical control of illegal parking while matching landscape architecture.'
  },
  {
    id: 'proj-gyeonggi-01',
    title: '경기 일산 킨텍스 대로변 주차 차선분리대 시공',
    titleEn: 'Gyeonggi Ilsan KINTEX Boulevard Parking Lane Divider',
    location: '경기',
    locationEn: 'Gyeonggi',
    date: '2025-12',
    products: ['lane-divider-01'],
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
    ],
    description: '킨텍스 전시장 인근 대형 수송버스 전용 주차구역 경계 구분을 위해 특수 복원식 조인트 차선분리대를 설치하여 대형 트럭의 불법 침범을 예방하였습니다.',
    descriptionEn: 'Placed special self-restorating lane separators along the exclusive bus parking lanes near KINTEX Exhibition Hall, securing public lanes against illegal truck encroachment.'
  },
  {
    id: 'proj-gyeonggi-02',
    title: '경기 판교 테크노밸리 사옥 진입로 고내성 스틸 볼라드 시공',
    titleEn: 'Gyeonggi Pangyo Techno Valley Office Entrance Steel Bollards',
    location: '경기',
    locationEn: 'Gyeonggi',
    date: '2026-02',
    products: ['bollard-steel-01'],
    images: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
    ],
    description: 'IT 대기업 사옥 앞 차량 인도 침범 사고 예방을 위해 매립 고정식 고강도 스틸 볼라드를 오렌지색 반사 시트와 함께 연속 시공하여 야간 가시성과 예방 신뢰성을 다졌습니다.',
    descriptionEn: 'Installed high-impact fixed carbon-steel bollards with bold yellow and orange warning sheets at IT office entrances, guarding sidewalks against vehicle encroachment.'
  },
  {
    id: 'proj-gyeonggi-03',
    title: '경기 수원시 광교호수공원 주변 산책로 보행자 보호 펜스 시공',
    titleEn: 'Gyeonggi Suwon Gwanggyo Lake Park Walkway Pedestrian Fences',
    location: '경기',
    locationEn: 'Gyeonggi',
    date: '2026-03',
    products: ['bollard-urethane-02'],
    images: [
      'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'
    ],
    description: '호수공원 주변 자전거 전용 도로와 인도의 교차구간에서 자전거 이탈 및 인도 진입 사고를 예방하기 위해 조경 조화형 탄성 볼라드를 대대적으로 증설하였습니다.',
    descriptionEn: 'To prevent bicycle and pedestrian crashes at Gwanggyo Lake Park intersections, we installed landscape-friendly yellow elastic safety posts across the walkways.'
  },
  {
    id: 'proj-incheon-01',
    title: '인천 송도 신도시 경제자유구역 사거리 안전휀스 설치',
    titleEn: 'Incheon Songdo Free Economic Zone Intersection Safety Fences',
    location: '인천',
    locationEn: 'Incheon',
    date: '2025-10',
    products: ['bollard-urethane-02', 'road-sign-01'],
    images: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80'
    ],
    description: '송도 신도시 내 초등학교 주변 어린이보호구역 스쿨존 차도와 인도 구분을 위해 충격 흡수 성능이 강화된 노랑 고탄성 안전포스트를 대량 공급 및 공사 완료하였습니다.',
    descriptionEn: 'Delivered school-zone child protective warning posts and high-luminosity road signs at Songdo Free Economic Zone crossings, increasing children commuting safety.'
  },
  {
    id: 'proj-incheon-02',
    title: '인천 국제공항 여객터미널 고속 진입로 고단성 차선분리대 시공',
    titleEn: 'Incheon Airport Terminal Expressway High-Elasticity Dividers',
    location: '인천',
    locationEn: 'Incheon',
    date: '2026-03',
    products: ['lane-divider-01'],
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
    ],
    description: '해외 여행객 및 급격히 가속하는 여객기 인근 주차 진입 고가도로에서 교통 흐름의 분기를 정확하게 안내하는 고휘도 반사 시트 밀착형 차선분리대를 설치했습니다.',
    descriptionEn: 'Fitted highly reflective lane dividers at the high-speed airport ramp split sections, guiding international travelers safely into designated terminals.'
  },
  {
    id: 'proj-busan-02',
    title: '부산 해운대 해변도로 무단횡단방지 분리대 설치공사',
    titleEn: 'Busan Haeundae Beach Road Anti-Jaywalking Divider Installation',
    location: '기타',
    locationEn: 'Others',
    date: '2026-03',
    products: ['bollard-urethane-02', 'lane-divider-01'],
    images: [
      'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80'
    ],
    description: '해운대 해안도로의 보행자 교통사고 급증 문제를 해결하기 위해 고휘도 무단횡단금지 분리대와 고탄성 우레탄 볼라드를 연속 시공하여 사고율을 90% 이상 경감시켰습니다.',
    descriptionEn: 'To solve the rising pedestrian accident rates on Haeundae Coastal Road, high-visibility lane separators and flexible urethane bollards were installed, decreasing incidents by over 90%.'
  }
];

const DEFAULT_NEWS: NewsItem[] = [
  {
    id: 'news-01',
    title: '동우안전 신제품 설명회 개최 및 도로안전 유공 포상 수상',
    titleEn: 'Doongwoo Safety New Product Exhibition and Award Ceremony',
    content: '동우안전이 2026 대한민국 도로교통 안전기술전시회에 참가하여 고휘도 탄성형 도로안전시설물 신제품을 선보여 많은 언론과 건설사 관계자들의 큰 관심을 받았으며, 정부포상을 수상했습니다.',
    contentEn: 'Doongwoo Safety participated in the 2026 Korea Road & Traffic Safety Technology Exhibition and unveiled brand-new high-luminosity flexible safety posts, securing national technical awards.',
    type: 'exhibition',
    date: '2026-06-15',
    views: 312
  },
  {
    id: 'news-02',
    title: '2026년도 상반기 공식 카탈로그 (국문/영문) 전면 개편 배포 안내',
    titleEn: '2026 First Half Official Catalog (KO/EN) Fully Revised Release',
    content: '더 다양해진 도로안전시설물 제품군과 CAD(DWG), 3D 모델링 설계 자원을 포괄한 2026년도 공식 종합 카탈로그가 배포되었습니다. 다운로드 센터와 각 제품 상세 정보창에서 즉시 보실 수 있습니다.',
    contentEn: 'The 2026 official comprehensive catalog is now available with rich architectural CAD, 3D and test result details. You can download pdf documents directly in our dynamic download center.',
    type: 'notice',
    date: '2026-05-30',
    views: 185
  }
];

const DEFAULT_DOWNLOADS: DownloadItem[] = [
  {
    id: 'down-cat-01',
    title: '2026 동우안전 종합 카탈로그 (국문)',
    titleEn: '2026 Doongwoo Safety General Catalog (KO)',
    category: 'catalog',
    fileUrl: '#',
    fileSize: '45.2 MB',
    downloadsCount: 1420,
    date: '2026-05-30'
  },
  {
    id: 'down-cat-02',
    title: '2026 Doongwoo Safety Product Catalog (EN)',
    titleEn: '2026 Doongwoo Safety Product Catalog (EN)',
    category: 'catalog',
    fileUrl: '#',
    fileSize: '38.6 MB',
    downloadsCount: 520,
    date: '2026-05-30'
  },
  {
    id: 'down-cert-01',
    title: 'ISO 9001 품질경영시스템 인증서',
    titleEn: 'ISO 9001 Quality Management System Certificate',
    category: 'cert',
    fileUrl: '#',
    fileSize: '2.1 MB',
    downloadsCount: 428,
    date: '2024-03-10'
  },
  {
    id: 'down-test-01',
    title: 'DW-S100 스틸 볼라드 정적 하중 충격 성적서',
    titleEn: 'DW-S100 Steel Bollard Impact Load Test Report',
    category: 'test',
    fileUrl: '#',
    fileSize: '5.4 MB',
    downloadsCount: 312,
    date: '2025-08-22'
  }
];

export const DEFAULT_CERTS: CertItem[] = [
  { id: '1', title: '특허: 충격 보수형 볼라드 결합체', auth: '특허청 | 제 10-249512호', desc: '충격 발생 시 이탈 복원 스프링 메커니즘을 내장한 고내구성 앙카용 하부 플레이트 특허', image: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?auto=format&fit=crop&w=600&q=80' },
  { id: '2', title: '특허: 태양광 LED 탑재 도로 차선분리대', auth: '특허청 | 제 10-285012호', desc: '주간 자가 발전 충전식 야간 고정밀 조도 센서 기반 자율 발광 주차선분리대 설계', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80' },
  { id: '3', title: '디자인등록: 시인성이 향상된 가변 볼라드', auth: '특허청 | 제 30-1094851호', desc: '볼라드 표면 요철 처리 및 반사 시트 밀착형 곡률 적용 외관 디자인 지적재산권', image: 'https://images.unsplash.com/photo-1581291518655-9523c932ebcf?auto=format&fit=crop&w=600&q=80' },
  { id: '4', title: 'ISO 9001:2015 품질보증', auth: '한국생산성본부인증원 | Q-4822호', desc: '도로표지판 및 금속제 도로안전시설의 생산 가공 및 시공 설계 전 과정의 품질 관리 규격 획득', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80' },
  { id: '5', title: '특허: 무단횡단 차단벽 연결 구조', auth: '특허청 | 제 10-299381호', desc: '보행자 무단횡단을 방지하는 안전 펜스용 다방향 힌지 조인트 조립 구조', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
  { id: '6', title: 'ISO 14001:2015 환경경영인증', auth: '한국생산성본부인증원 | E-5891호', desc: '친환경 우레탄 볼라드 제조 공정 및 가공 시설에 대한 친환경 시스템 규격 획득', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80' }
];

export interface BannerConfigs {
  home: string;
  company: string;
  products: string;
  tech: string;
  projects: string;
  news: string;
  customer: string;
  categories: string;
  orgChart?: string;
}

const DEFAULT_BANNERS: BannerConfigs = {
  home: '/src/assets/images/goyang_highway_exact_original_1782909936645.jpg',
  company: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1600&q=100',
  products: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=100',
  tech: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=100',
  projects: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=100',
  news: 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=1600&q=100',
  customer: 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=1600&q=100',
  categories: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=100',
  orgChart: ''
};

export const DEFAULT_CEO_GREETING: CeoGreeting = {
  title: '최고의 기술과 성실한 자세로\n고객 모두에게 최고의 만족을 드리겠습니다.',
  titleEn: 'We will satisfy all our customers with the best quality and service through endless dedication.',
  subtitle: '안녕하십니까?',
  subtitleEn: 'Dear Valued Customers,',
  content: '저희 동우산업(주)는 \'92년 06월 법인 설립 이후 "신용있는 사람이 되자", "노력하는 사람이 되자", "꿈을 가진 사람이 되자"라는 사훈 아래 도로표지판 및 각종 도로교통안전시설물 등을 제작, 시공하는 전문업체로서 축적된 기술과 부단한 연구개발을 통하여 고도의 기술력에 의한 안정된 품질과 우수한 기능을 가진 제품 생산 및 공급에 주력하고 있으며 고객으로부터 깊은 신뢰와 사랑을 받고 있는 기업입니다.\n\n저희 동우산업(주)의 품질방침은 ISO 9001 / KS Q ISO 9001, KS A 3505의 규격에 따른 품질경영시스템을 구축, 실행 및 생산제품에 대한 고객의 요구와 기대를 충족시키는데 있습니다.\n\n앞으로도 내일을 준비하고 미래를 추구하는 충실한 동반자로 최선을 다할 것을 약속드리며 약진하는 동우, 세계로 뻗어가는 동우산업(주)가 되기 위해 저희 임직원은 끊임없는 연구, 기술개발과 성실한 자세로 고객 모두에게 최고의 품질, 최고의 서비스로 만족을 드리겠습니다.',
  contentEn: 'Since our incorporation in June 1992, Dongwoo Industry Co., Ltd. has operated under the corporate mottos: "Be trustworthy," "Be diligent," and "Be a visionary." As a specialized company manufacturing and constructing road signs and various road traffic safety facilities, we focus on producing and supply products with highly stable quality and superior performance backed by advanced technology through accumulated expertise and relentless R&D, receiving deep trust and appreciation from our valued clients.\n\nOur quality policy is to establish and implement a robust quality management system in accordance with ISO 9001 / KS Q ISO 9001 and KS A 3505 standards, fully satisfying customer requirements and expectations for all of our manufactured products.\n\nWe promise to perform our absolute best as a faithful companion preparing for tomorrow and pursuing the future. To become a rapidly growing and globally expanding company, all of our executives and employees will strive to deliver the highest quality and best services with a sincere attitude and continuous R&D.',
  date: '2026. 07',
  ceoName: '동우산업(주) 대표이사 전 홍 은',
  ceoNameEn: 'Jeon hong eun | President & CEO, Dongwoo Industry Co., Ltd.',
  signatureImg: '',
  bgImg: '/uploads/ae95d482-263e-4409-ba45-7a6fcda4a52c_1783060259227.jpg'
};

// LocalStorage Helper for fail-safe data storage
const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalStorageItem = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
};

// ==========================================
// RESILIENT DB API
// ==========================================

export class DBService {
  private static isInitialized = false;

  // Track state locally as a fallback
  private static categories: Category[] = getLocalStorageItem('dw_categories', DEFAULT_CATEGORIES);
  private static products: Product[] = getLocalStorageItem('dw_products', DEFAULT_PRODUCTS);
  private static projects: Project[] = getLocalStorageItem('dw_projects', DEFAULT_PROJECTS);
  private static news: NewsItem[] = getLocalStorageItem('dw_news', DEFAULT_NEWS);
  private static downloads: DownloadItem[] = getLocalStorageItem('dw_downloads', DEFAULT_DOWNLOADS);
  private static certs: CertItem[] = getLocalStorageItem('dw_certs', DEFAULT_CERTS);
  private static banners: BannerConfigs = getLocalStorageItem('dw_banners', DEFAULT_BANNERS);
  private static ceoGreeting: CeoGreeting = getLocalStorageItem('dw_ceo_greeting', DEFAULT_CEO_GREETING);
  private static emailSettings: EmailSettings = getLocalStorageItem('dw_email_settings', {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    recipient: 'dongwoo116@daum.net, dongwoo116@hanmail.net'
  });
  private static inquiries: Inquiry[] = getLocalStorageItem('dw_inquiries', []);
  private static visitorCount = getLocalStorageItem('dw_visitors', 1450);
  private static searchLogs: { [key: string]: number } = getLocalStorageItem('dw_search_logs', {
    '볼라드': 120,
    '스틸': 85,
    '우레탄': 72,
    '표지판': 54,
    'LED': 41,
    '분리대': 33
  });

  // Seed Firestore
  public static async seedFirestore() {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (snap.empty) {
        console.log('Seeding firestore with current local data...');
        const batch = writeBatch(db);

        // Seed categories from current memory/local storage (which has local edits)
        for (const cat of this.categories) {
          batch.set(doc(db, 'categories', cat.id), cat);
        }
        // Seed products
        for (const prod of this.products) {
          batch.set(doc(db, 'products', prod.id), prod);
        }
        // Seed projects
        for (const proj of this.projects) {
          batch.set(doc(db, 'projects', proj.id), proj);
        }
        // Seed news
        for (const n of this.news) {
          batch.set(doc(db, 'news', n.id), n);
        }
        // Seed downloads
        for (const d of this.downloads) {
          batch.set(doc(db, 'downloads', d.id), d);
        }
        // Seed certifications
        for (const c of this.certs) {
          batch.set(doc(db, 'certifications', c.id), c);
        }
        // Seed banners settings
        batch.set(doc(db, 'settings', 'banners'), this.banners);
        
        await batch.commit();
        console.log('Firestore seeding completed successfully.');
      }
    } catch (err) {
      console.warn('Failed to seed firestore, continuing with local fallback:', err);
    }
  }

  // Initialize DB & sync with Firestore
  public static async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Seed firestore in background
    this.seedFirestore().then(async () => {
      // Sync local caches with firestore if success
      try {
        // --- 1. CATEGORIES ---
        const catSnap = await getDocs(collection(db, 'categories'));
        if (!catSnap.empty) {
          const fbCategories: Category[] = [];
          catSnap.forEach(d => fbCategories.push(d.data() as Category));
          
          // Bidirectional sync: upload any local-only category to Firestore
          const fbIds = new Set(fbCategories.map(c => c.id));
          const localOnly = this.categories.filter(c => !fbIds.has(c.id));
          for (const c of localOnly) {
            try {
              await setDoc(doc(db, 'categories', c.id), c);
              fbCategories.push(c);
            } catch (e) {
              console.warn('Sync upload failed for category:', c.id, e);
            }
          }
          
          this.categories = fbCategories.sort((a,b) => a.order - b.order);
          setLocalStorageItem('dw_categories', this.categories);
        } else {
          // Upload all local categories
          for (const c of this.categories) {
            try { await setDoc(doc(db, 'categories', c.id), c); } catch (e) {}
          }
        }

        // --- 2. PRODUCTS ---
        const prodSnap = await getDocs(collection(db, 'products'));
        if (!prodSnap.empty) {
          const fbProducts: Product[] = [];
          prodSnap.forEach(d => fbProducts.push(d.data() as Product));
          
          // Bidirectional sync: upload any local-only product to Firestore
          const fbIds = new Set(fbProducts.map(p => p.id));
          const localOnly = this.products.filter(p => !fbIds.has(p.id));
          for (const p of localOnly) {
            try {
              await setDoc(doc(db, 'products', p.id), p);
              fbProducts.push(p);
            } catch (e) {
              console.warn('Sync upload failed for product:', p.id, e);
            }
          }
          
          this.products = fbProducts.sort((a,b) => a.order - b.order);
          setLocalStorageItem('dw_products', this.products);
        } else {
          // Upload all local products
          for (const p of this.products) {
            try { await setDoc(doc(db, 'products', p.id), p); } catch (e) {}
          }
        }

        // --- 3. PROJECTS ---
        const projSnap = await getDocs(collection(db, 'projects'));
        if (!projSnap.empty) {
          const fbProjects: Project[] = [];
          projSnap.forEach(d => fbProjects.push(d.data() as Project));
          
          // Bidirectional sync
          const fbIds = new Set(fbProjects.map(p => p.id));
          const localOnly = this.projects.filter(p => !fbIds.has(p.id));
          for (const p of localOnly) {
            try {
              await setDoc(doc(db, 'projects', p.id), p);
              fbProjects.push(p);
            } catch (e) {
              console.warn('Sync upload failed for project:', p.id, e);
            }
          }
          
          this.projects = fbProjects;
          setLocalStorageItem('dw_projects', this.projects);
        } else {
          for (const p of this.projects) {
            try { await setDoc(doc(db, 'projects', p.id), p); } catch (e) {}
          }
        }

        // --- 4. NEWS ---
        const newsSnap = await getDocs(collection(db, 'news'));
        if (!newsSnap.empty) {
          const fbNews: NewsItem[] = [];
          newsSnap.forEach(d => fbNews.push(d.data() as NewsItem));
          
          // Bidirectional sync
          const fbIds = new Set(fbNews.map(n => n.id));
          const localOnly = this.news.filter(n => !fbIds.has(n.id));
          for (const n of localOnly) {
            try {
              await setDoc(doc(db, 'news', n.id), n);
              fbNews.push(n);
            } catch (e) {
              console.warn('Sync upload failed for news:', n.id, e);
            }
          }
          
          this.news = fbNews;
          setLocalStorageItem('dw_news', this.news);
        } else {
          for (const n of this.news) {
            try { await setDoc(doc(db, 'news', n.id), n); } catch (e) {}
          }
        }

        // --- 5. DOWNLOADS ---
        const downSnap = await getDocs(collection(db, 'downloads'));
        if (!downSnap.empty) {
          const fbDownloads: DownloadItem[] = [];
          downSnap.forEach(d => fbDownloads.push(d.data() as DownloadItem));
          
          // Bidirectional sync
          const fbIds = new Set(fbDownloads.map(d => d.id));
          const localOnly = this.downloads.filter(d => !fbIds.has(d.id));
          for (const d of localOnly) {
            try {
              await setDoc(doc(db, 'downloads', d.id), d);
              fbDownloads.push(d);
            } catch (e) {
              console.warn('Sync upload failed for downloads:', d.id, e);
            }
          }
          
          this.downloads = fbDownloads;
          setLocalStorageItem('dw_downloads', this.downloads);
        } else {
          for (const d of this.downloads) {
            try { await setDoc(doc(db, 'downloads', d.id), d); } catch (e) {}
          }
        }

        // --- 6. INQUIRIES ---
        const inqSnap = await getDocs(collection(db, 'inquiries'));
        if (!inqSnap.empty) {
          const fbInquiries: Inquiry[] = [];
          inqSnap.forEach(d => fbInquiries.push(d.data() as Inquiry));
          
          // Bidirectional sync
          const fbIds = new Set(fbInquiries.map(i => i.id));
          const localOnly = this.inquiries.filter(i => !fbIds.has(i.id));
          for (const i of localOnly) {
            try {
              await setDoc(doc(db, 'inquiries', i.id), i);
              fbInquiries.push(i);
            } catch (e) {
              console.warn('Sync upload failed for inquiry:', i.id, e);
            }
          }
          
          this.inquiries = fbInquiries;
          setLocalStorageItem('dw_inquiries', this.inquiries);
        } else {
          for (const i of this.inquiries) {
            try { await setDoc(doc(db, 'inquiries', i.id), i); } catch (e) {}
          }
        }

        // --- 7. CERTIFICATIONS ---
        const certSnap = await getDocs(collection(db, 'certifications'));
        if (!certSnap.empty) {
          const fbCerts: CertItem[] = [];
          certSnap.forEach(d => fbCerts.push(d.data() as CertItem));
          
          // Bidirectional sync
          const fbIds = new Set(fbCerts.map(c => c.id));
          const localOnly = this.certs.filter(c => !fbIds.has(c.id));
          for (const c of localOnly) {
            try {
              await setDoc(doc(db, 'certifications', c.id), c);
              fbCerts.push(c);
            } catch (e) {
              console.warn('Sync upload failed for certifications:', c.id, e);
            }
          }
          
          this.certs = fbCerts;
          setLocalStorageItem('dw_certs', this.certs);
        } else {
          for (const c of this.certs) {
            try { await setDoc(doc(db, 'certifications', c.id), c); } catch (e) {}
          }
        }

        // --- 8. BANNERS (SETTINGS) ---
        const bannerDoc = await getDoc(doc(db, 'settings', 'banners'));
        if (bannerDoc.exists()) {
          const fbBanners = bannerDoc.data() as BannerConfigs;
          // Merge local modifications into Firestore settings
          this.banners = { ...DEFAULT_BANNERS, ...this.banners, ...fbBanners };
          setLocalStorageItem('dw_banners', this.banners);
          try {
            await setDoc(doc(db, 'settings', 'banners'), this.banners);
          } catch (e) {}
        } else {
          try {
            await setDoc(doc(db, 'settings', 'banners'), this.banners);
          } catch (e) {}
        }

        // --- 9. CEO GREETING (SETTINGS) ---
        const ceoDoc = await getDoc(doc(db, 'settings', 'ceo_greeting'));
        if (ceoDoc.exists()) {
          const fbCeo = ceoDoc.data() as CeoGreeting;
          this.ceoGreeting = { ...DEFAULT_CEO_GREETING, ...this.ceoGreeting, ...fbCeo };
          setLocalStorageItem('dw_ceo_greeting', this.ceoGreeting);
          try {
            await setDoc(doc(db, 'settings', 'ceo_greeting'), this.ceoGreeting);
          } catch (e) {}
        } else {
          try {
            await setDoc(doc(db, 'settings', 'ceo_greeting'), this.ceoGreeting);
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Could not sync firestore, using local fallback:', err);
      }
    });

    // Increment visitor count on start
    this.visitorCount += 1;
    setLocalStorageItem('dw_visitors', this.visitorCount);
  }

  // ==========================================
  // CATEGORIES API
  // ==========================================
  public static async getCategories(): Promise<Category[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        const list: Category[] = [];
        snap.forEach(d => list.push(d.data() as Category));
        this.categories = list.sort((a,b) => a.order - b.order);
        setLocalStorageItem('dw_categories', this.categories);
      }
    } catch (e) {
      console.warn('Failed to fetch categories from Firestore, using cache:', e);
    }
    return this.categories;
  }

  public static async saveCategory(category: Category): Promise<void> {
    const idx = this.categories.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      this.categories[idx] = category;
    } else {
      this.categories.push(category);
    }
    this.categories.sort((a,b) => a.order - b.order);
    setLocalStorageItem('dw_categories', this.categories);

    try {
      await setDoc(doc(db, 'categories', category.id), category);
    } catch (e) {
      console.warn('Firestore write failed for categories:', e);
    }
  }

  public static async deleteCategory(id: string): Promise<void> {
    this.categories = this.categories.filter(c => c.id !== id);
    setLocalStorageItem('dw_categories', this.categories);

    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (e) {
      console.warn('Firestore delete failed for categories:', e);
    }
  }

  // ==========================================
  // PRODUCTS API
  // ==========================================
  public static async getProducts(): Promise<Product[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        const list: Product[] = [];
        snap.forEach(d => list.push(d.data() as Product));
        this.products = list.sort((a,b) => a.order - b.order);
        setLocalStorageItem('dw_products', this.products);
      }
    } catch (e) {
      console.warn('Failed to fetch products from Firestore, using cache:', e);
    }
    return this.products;
  }

  public static async getProductById(id: string): Promise<Product | undefined> {
    await this.initialize();
    // Return from current cache (or we can search after getProducts)
    const prods = await this.getProducts();
    return prods.find(p => p.id === id);
  }

  public static async saveProduct(product: Product): Promise<void> {
    const idx = this.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.products[idx] = product;
    } else {
      this.products.push(product);
    }
    this.products.sort((a,b) => a.order - b.order);
    setLocalStorageItem('dw_products', this.products);

    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (e) {
      console.warn('Firestore write failed for products:', e);
    }
  }

  public static async deleteProduct(id: string): Promise<void> {
    this.products = this.products.filter(p => p.id !== id);
    setLocalStorageItem('dw_products', this.products);

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.warn('Firestore delete failed for products:', e);
    }
  }

  // ==========================================
  // PROJECTS API
  // ==========================================
  public static async getProjects(): Promise<Project[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'projects'));
      if (!snap.empty) {
        const list: Project[] = [];
        snap.forEach(d => list.push(d.data() as Project));
        this.projects = list;
        setLocalStorageItem('dw_projects', this.projects);
      }
    } catch (e) {
      console.warn('Failed to fetch projects from Firestore, using cache:', e);
    }
    return this.projects;
  }

  public static async saveProject(project: Project): Promise<void> {
    const idx = this.projects.findIndex(p => p.id === project.id);
    if (idx >= 0) {
      this.projects[idx] = project;
    } else {
      this.projects.push(project);
    }
    setLocalStorageItem('dw_projects', this.projects);

    try {
      await setDoc(doc(db, 'projects', project.id), project);
    } catch (e) {
      console.warn('Firestore write failed for projects:', e);
    }
  }

  public static async deleteProject(id: string): Promise<void> {
    this.projects = this.projects.filter(p => p.id !== id);
    setLocalStorageItem('dw_projects', this.projects);

    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (e) {
      console.warn('Firestore delete failed for projects:', e);
    }
  }

  // ==========================================
  // NEWS API
  // ==========================================
  public static async getNews(): Promise<NewsItem[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'news'));
      if (!snap.empty) {
        const list: NewsItem[] = [];
        snap.forEach(d => list.push(d.data() as NewsItem));
        this.news = list;
        setLocalStorageItem('dw_news', this.news);
      }
    } catch (e) {
      console.warn('Failed to fetch news from Firestore, using cache:', e);
    }
    return this.news;
  }

  public static async saveNews(item: NewsItem): Promise<void> {
    const idx = this.news.findIndex(n => n.id === item.id);
    if (idx >= 0) {
      this.news[idx] = item;
    } else {
      this.news.push(item);
    }
    setLocalStorageItem('dw_news', this.news);

    try {
      await setDoc(doc(db, 'news', item.id), item);
    } catch (e) {
      console.warn('Firestore write failed for news:', e);
    }
  }

  public static async deleteNews(id: string): Promise<void> {
    this.news = this.news.filter(n => n.id !== id);
    setLocalStorageItem('dw_news', this.news);

    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (e) {
      console.warn('Firestore delete failed for news:', e);
    }
  }

  // ==========================================
  // DOWNLOADS API
  // ==========================================
  public static async getDownloads(): Promise<DownloadItem[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'downloads'));
      if (!snap.empty) {
        const list: DownloadItem[] = [];
        snap.forEach(d => list.push(d.data() as DownloadItem));
        this.downloads = list;
        setLocalStorageItem('dw_downloads', this.downloads);
      }
    } catch (e) {
      console.warn('Failed to fetch downloads from Firestore, using cache:', e);
    }
    return this.downloads;
  }

  public static async saveDownload(item: DownloadItem): Promise<void> {
    const idx = this.downloads.findIndex(d => d.id === item.id);
    if (idx >= 0) {
      this.downloads[idx] = item;
    } else {
      this.downloads.push(item);
    }
    setLocalStorageItem('dw_downloads', this.downloads);

    try {
      await setDoc(doc(db, 'downloads', item.id), item);
    } catch (e) {
      console.warn('Firestore write failed for downloads:', e);
    }
  }

  public static async deleteDownload(id: string): Promise<void> {
    this.downloads = this.downloads.filter(d => d.id !== id);
    setLocalStorageItem('dw_downloads', this.downloads);

    try {
      await deleteDoc(doc(db, 'downloads', id));
    } catch (e) {
      console.warn('Firestore delete failed for downloads:', e);
    }
  }

  public static async recordDownload(id: string): Promise<void> {
    const idx = this.downloads.findIndex(d => d.id === id);
    if (idx >= 0) {
      this.downloads[idx].downloadsCount += 1;
      setLocalStorageItem('dw_downloads', this.downloads);

      try {
        await updateDoc(doc(db, 'downloads', id), {
          downloadsCount: this.downloads[idx].downloadsCount
        });
      } catch (e) {
        // ignore
      }
    }
  }

  // ==========================================
  // INQUIRIES API
  // ==========================================
  public static async getInquiries(): Promise<Inquiry[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'inquiries'));
      if (!snap.empty) {
        const list: Inquiry[] = [];
        snap.forEach(d => list.push(d.data() as Inquiry));
        this.inquiries = list;
        setLocalStorageItem('dw_inquiries', this.inquiries);
      }
    } catch (e) {
      console.warn('Failed to fetch inquiries from Firestore, using cache:', e);
    }
    return this.inquiries;
  }

  public static async saveInquiry(inquiry: Inquiry): Promise<void> {
    const idx = this.inquiries.findIndex(i => i.id === inquiry.id);
    if (idx >= 0) {
      this.inquiries[idx] = inquiry;
    } else {
      this.inquiries.push(inquiry);
    }
    setLocalStorageItem('dw_inquiries', this.inquiries);

    try {
      await setDoc(doc(db, 'inquiries', inquiry.id), inquiry);
    } catch (e) {
      console.warn('Firestore write failed for inquiries:', e);
    }
  }

  public static async deleteInquiry(id: string): Promise<void> {
    this.inquiries = this.inquiries.filter(i => i.id !== id);
    setLocalStorageItem('dw_inquiries', this.inquiries);

    try {
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (e) {
      console.warn('Firestore delete failed for inquiries:', e);
    }
  }

  // ==========================================
  // SEARCH STATS API
  // ==========================================
  public static async getPopularSearches(): Promise<{ query: string; count: number }[]> {
    await this.initialize();
    return Object.entries(this.searchLogs)
      .map(([query, count]) => ({ query, count }))
      .sort((a,b) => b.count - a.count);
  }

  public static async recordSearch(queryStr: string): Promise<void> {
    if (!queryStr || queryStr.trim().length === 0) return;
    const trimmed = queryStr.trim();
    
    await this.initialize();
    this.searchLogs[trimmed] = (this.searchLogs[trimmed] || 0) + 1;
    setLocalStorageItem('dw_search_logs', this.searchLogs);

    try {
      // Record in firestore
      await setDoc(doc(db, 'searchLogs', trimmed), {
        query: trimmed,
        count: this.searchLogs[trimmed]
      });
    } catch (e) {
      // ignore
    }
  }

  // ==========================================
  // GENERAL STATS API
  // ==========================================
  public static async recordVisitor(): Promise<void> {
    await this.initialize();
    this.visitorCount += 1;
    setLocalStorageItem('dw_visitors', this.visitorCount);
    try {
      await setDoc(doc(db, 'stats', 'visitors'), { count: this.visitorCount });
    } catch (e) {
      // ignore
    }
  }

  public static async getBanners(): Promise<BannerConfigs> {
    await this.initialize();
    try {
      const bannerDoc = await getDoc(doc(db, 'settings', 'banners'));
      if (bannerDoc.exists()) {
        const fbBanners = bannerDoc.data() as BannerConfigs;
        this.banners = { ...DEFAULT_BANNERS, ...this.banners, ...fbBanners };
        setLocalStorageItem('dw_banners', this.banners);
      }
    } catch (e) {
      console.warn('Failed to fetch banners from Firestore, using cache:', e);
    }
    return this.banners;
  }

  public static async saveBanners(banners: BannerConfigs): Promise<void> {
    this.banners = banners;
    setLocalStorageItem('dw_banners', this.banners);
    try {
      await setDoc(doc(db, 'settings', 'banners'), banners);
    } catch (e) {
      console.warn('Firestore write failed for banners:', e);
    }
  }

  // ==========================================
  // CERTIFICATIONS API
  // ==========================================
  public static async getCertifications(): Promise<CertItem[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'certifications'));
      if (!snap.empty) {
        const list: CertItem[] = [];
        snap.forEach(d => list.push(d.data() as CertItem));
        this.certs = list;
        setLocalStorageItem('dw_certs', this.certs);
      }
    } catch (e) {
      console.warn('Failed to fetch certifications from Firestore, using cache:', e);
    }
    return this.certs;
  }

  public static async addCertification(cert: CertItem): Promise<void> {
    await this.initialize();
    this.certs = [...this.certs, cert];
    setLocalStorageItem('dw_certs', this.certs);
    try {
      await setDoc(doc(db, 'certifications', cert.id), cert);
    } catch (e) {
      console.warn('Firestore write failed for certifications:', e);
    }
  }

  public static async updateCertification(cert: CertItem): Promise<void> {
    await this.initialize();
    this.certs = this.certs.map(c => c.id === cert.id ? cert : c);
    setLocalStorageItem('dw_certs', this.certs);
    try {
      await setDoc(doc(db, 'certifications', cert.id), cert);
    } catch (e) {
      console.warn('Firestore update failed for certifications:', e);
    }
  }

  public static async deleteCertification(id: string): Promise<void> {
    await this.initialize();
    this.certs = this.certs.filter(c => c.id !== id);
    setLocalStorageItem('dw_certs', this.certs);
    try {
      await deleteDoc(doc(db, 'certifications', id));
    } catch (e) {
      console.warn('Firestore delete failed for certifications:', e);
    }
  }

  // ==========================================
  // CEO GREETINGS API
  // ==========================================
  public static async getCeoGreeting(): Promise<CeoGreeting> {
    await this.initialize();
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'ceo_greeting'));
      if (docSnap.exists()) {
        this.ceoGreeting = docSnap.data() as CeoGreeting;
        setLocalStorageItem('dw_ceo_greeting', this.ceoGreeting);
      }
    } catch (e) {
      console.warn('Failed to fetch CEO greeting from Firestore, using cache:', e);
    }
    return this.ceoGreeting;
  }

  public static async saveCeoGreeting(greeting: CeoGreeting): Promise<void> {
    await this.initialize();
    this.ceoGreeting = greeting;
    setLocalStorageItem('dw_ceo_greeting', greeting);
    try {
      await setDoc(doc(db, 'settings', 'ceo_greeting'), greeting);
    } catch (e) {
      console.warn('Firestore write failed for CEO greeting:', e);
    }
  }

  // ==========================================
  // EMAIL SETTINGS API
  // ==========================================
  public static async getEmailSettings(): Promise<EmailSettings> {
    await this.initialize();
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'email'));
      if (docSnap.exists()) {
        this.emailSettings = docSnap.data() as EmailSettings;
        setLocalStorageItem('dw_email_settings', this.emailSettings);
      }
    } catch (e) {
      console.warn('Failed to fetch email settings from Firestore, using cache:', e);
    }
    return this.emailSettings;
  }

  public static async saveEmailSettings(settings: EmailSettings): Promise<void> {
    await this.initialize();
    this.emailSettings = settings;
    setLocalStorageItem('dw_email_settings', settings);
    try {
      await setDoc(doc(db, 'settings', 'email'), settings);
    } catch (e) {
      console.warn('Firestore write failed for email settings:', e);
    }
  }

  public static async getStats() {
    await this.initialize();
    
    const downloadsSum = this.downloads.reduce((sum, d) => sum + d.downloadsCount, 0);
    const inquiriesCount = this.inquiries.length;
    const productsCount = this.products.length;

    return {
      visitors: this.visitorCount,
      downloads: downloadsSum,
      inquiries: inquiriesCount,
      products: productsCount,
      popularSearches: await this.getPopularSearches()
    };
  }
}
