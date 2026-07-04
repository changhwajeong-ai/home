export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon?: string; // Lucide icon name
  image?: string; // Category image URL
  isActive: boolean;
  order: number;
}

export interface ProductSpec {
  material: string; // 재질
  spec1: string; // 규격 1 (설치높이 등 대체)
  spec2: string; // 규격 2 (정밀규격 등 대체)
  spec3: string; // 규격 3 (추가 필드)
  features: string; // 특징
  installation: string; // 설치방법
  maintenance: string; // 유지관리
  height?: string; // 하위 호환성용
  size?: string; // 하위 호환성용
  otherInfo?: string; // 기타정보 (통합 필드)
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

export interface ProductFile {
  name: string;
  type: 'pdf' | 'dwg' | '3d' | 'catalog' | 'test' | 'cert';
  url: string;
  size?: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  images: string[];
  specifications: ProductSpec;
  specificationsEn: ProductSpec;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  isVisible: boolean;
  order: number;
  files: ProductFile[];
  certifications: string[]; // ['ISO 9001', '특허제품', 'KS인증'] etc.
  relatedProducts?: string[]; // product IDs
  projects?: string[]; // project IDs
  seo?: SEOConfig;
  g2bIdentifier?: string; // 나라장터 식별번호
  g2bLink?: string; // 나라장터 구매 링크
}

export interface Project {
  id: string;
  title: string;
  titleEn: string;
  client?: string; // 발주처 (KO)
  clientEn?: string; // 발주처 (EN)
  location: string; // e.g., '서울', '부산', '경기'
  locationEn: string;
  date: string;
  products: string[]; // list of product IDs used
  images: string[];
  description: string;
  descriptionEn: string;
  projectType?: '시공' | '납품';
}

export interface NewsItem {
  id: string;
  title: string;
  titleEn: string;
  content: string;
  contentEn: string;
  type: 'notice' | 'news' | 'exhibition' | 'press' | 'video';
  date: string;
  views: number;
  videoUrl?: string;
  images?: string[];
}

export interface DownloadItem {
  id: string;
  title: string;
  titleEn: string;
  category: 'cert' | 'test' | 'drawing' | 'catalog';
  fileUrl: string;
  fileSize: string;
  downloadsCount: number;
  date: string;
  images?: string[];
  files?: ProductFile[];
  description?: string;
  descriptionEn?: string;
  originalFileName?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  content: string;
  type: 'qna' | 'request' | 'catalog' | 'estimate'; // 문의, 자료요청, 카탈로그, 견적
  date: string;
  status: 'pending' | 'answered';
  answer?: string;
  isPrivate?: boolean;
  password?: string;
}

export interface SearchLog {
  query: string;
  count: number;
}

export interface VisitorStat {
  date: string;
  count: number;
}

export interface CertItem {
  id: string;
  title: string;
  auth: string;
  desc: string;
  image?: string;
}

export interface CeoGreeting {
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  content: string;
  contentEn: string;
  date: string;
  ceoName: string;
  ceoNameEn: string;
  signatureImg: string;
  bgImg: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  recipient: string; // Comma-separated list of company emails (e.g. dongwoo116@daum.net, dongwoo116@hanmail.net)
}
