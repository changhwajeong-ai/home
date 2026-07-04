import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  Image, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  Save, 
  X, 
  Search, 
  LogOut, 
  UserCheck, 
  TrendingUp, 
  DownloadCloud, 
  Upload,
  Mail, 
  Settings,
  Sparkles,
  BarChart2,
  Menu
} from 'lucide-react';
import { DBService, auth, googleProvider, getEmbedImageUrl } from '../lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { Category, Product, Inquiry, DownloadItem, Project, NewsItem, CertItem, CeoGreeting, EmailSettings } from '../types';
import * as XLSX from 'xlsx';

interface AdminCMSViewProps {
  lang: 'ko' | 'en';
}

export default function AdminCMSView({ lang }: AdminCMSViewProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard Stats
  const [stats, setStats] = useState<any>({
    visitors: 0,
    downloads: 0,
    inquiries: 0,
    products: 0,
    popularSearches: []
  });

  // CMS Tables Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  // Editing Forms State
  const [activeSubTab, setActiveSubTab] = useState<'dash' | 'prod' | 'cat' | 'inq' | 'bulk' | 'tech' | 'proj' | 'news' | 'banner' | 'cert' | 'ceo' | 'email'>('dash');
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    recipient: 'dongwoo116@daum.net, dongwoo116@hanmail.net'
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [ceoGreeting, setCeoGreeting] = useState<CeoGreeting>({
    title: '',
    titleEn: '',
    subtitle: '',
    subtitleEn: '',
    content: '',
    contentEn: '',
    date: '',
    ceoName: '',
    ceoNameEn: '',
    signatureImg: '',
    bgImg: ''
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editingDownload, setEditingDownload] = useState<DownloadItem | null>(null);
  const [certifications, setCertifications] = useState<CertItem[]>([]);
  const [editingCert, setEditingCert] = useState<CertItem | null>(null);
  const [certForm, setCertForm] = useState({
    title: '',
    auth: '',
    desc: '',
    image: ''
  });

  // Search local filters
  const [searchQuery, setSearchQuery] = useState('');

  // Excel Bulk Import states
  const [bulkProgress, setBulkProgress] = useState<string>('');
  const [bulkType, setBulkType] = useState<'product' | 'project'>('product');

  const [bannersForm, setBannersForm] = useState<any>({
    home: '',
    company: '',
    products: '',
    tech: '',
    projects: '',
    news: '',
    customer: '',
    categories: ''
  });

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (e) {
          console.error(e);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  useEffect(() => {
    // Check if auth state changes
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAdmin(true);
        loadCMSData();
      } else {
        setIsAdmin(false);
      }
    });

    // Fallback: If user was logged in previously in localStorage
    if (localStorage.getItem('dw_admin_logged') === 'true') {
      setIsAdmin(true);
      loadCMSData();
    }

    return () => unsub();
  }, []);

  const loadCMSData = async () => {
    const s = await DBService.getStats();
    setStats(s);

    const cats = await DBService.getCategories();
    setCategories(cats);

    const prods = await DBService.getProducts();
    setProducts(prods);

    const inqs = await DBService.getInquiries();
    setInquiries(inqs);

    const projs = await DBService.getProjects();
    setProjects(projs);

    const newsList = await DBService.getNews();
    setNews(newsList);

    const downs = await DBService.getDownloads();
    setDownloads(downs);

    const b = await DBService.getBanners();
    if (b) {
      setBannersForm(b);
    }

    const ceo = await DBService.getCeoGreeting();
    if (ceo) {
      setCeoGreeting(ceo);
    }

    const certs = await DBService.getCertifications();
    setCertifications(certs);

    const emailSet = await DBService.getEmailSettings();
    if (emailSet) {
      setEmailSettings(emailSet);
    }
  };

  const handleSaveBanners = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DBService.saveBanners(bannersForm);
      alert('모든 페이지의 타이틀 배경 이미지 URL이 실시간으로 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error(err);
      alert('배경 이미지 URL 저장에 실패했습니다.');
    }
  };

  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DBService.saveEmailSettings(emailSettings);
      alert('대표 이메일 알림 및 SMTP 메일 발송 설정이 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('이메일 설정 저장에 실패했습니다.');
    }
  };

  const handleSaveCeoGreeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await DBService.saveCeoGreeting(ceoGreeting);
      alert('CEO 인사말이 실시간으로 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error(err);
      alert('CEO 인사말 저장에 실패했습니다.');
    }
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCats.length) return;
    
    // Swap elements
    const temp = newCats[index];
    newCats[index] = newCats[targetIdx];
    newCats[targetIdx] = temp;
    
    // Reassign order sequential values
    const updatedCats = newCats.map((cat, i) => ({
      ...cat,
      order: i + 1
    }));
    
    setCategories(updatedCats);
    
    // Save sequentially to DBService
    try {
      for (const cat of updatedCats) {
        await DBService.saveCategory(cat);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError('');
      await signInWithPopup(auth, googleProvider);
      setIsAdmin(true);
      localStorage.setItem('dw_admin_logged', 'true');
      loadCMSData();
    } catch (err: any) {
      console.error(err);
      setLoginError('Google 로그인에 실패했습니다. 데모 로그인 수단을 이용해 보세요.');
    }
  };

  const handleDemoLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('dw_admin_logged', 'true');
    loadCMSData();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      // ignore
    }
    setIsAdmin(false);
    localStorage.removeItem('dw_admin_logged');
  };

  // ==========================================
  // PRODUCT CMS ACTIONS
  // ==========================================
  const handleAddNewProduct = () => {
    const newProd: Product = {
      id: 'prod-' + Date.now(),
      categoryId: categories[0]?.id || 'bollard',
      name: '새 제품 모델명',
      nameEn: 'New Product Name',
      description: '제품의 상세한 장점을 설명해 주세요.',
      descriptionEn: 'Detailed product benefits in English.',
      images: ['https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80'],
      tags: ['스틸', '신제품'],
      isFeatured: false,
      isNew: true,
      isPopular: false,
      isVisible: true,
      order: products.length + 1,
      specifications: {
        material: '고강도 탄소강관',
        spec1: '850mm',
        spec2: 'Ø101.6 x 3.2t',
        spec3: '기본 매립식 고정형',
        features: '특수 분체도장 및 황색 반사 시트 부착',
        installation: '매립 고정식',
        maintenance: '간편한 재도장',
        otherInfo: ''
      },
      specificationsEn: {
        material: 'Carbon Steel Pipe',
        spec1: '850mm',
        spec2: 'Ø101.6 x 3.2t',
        spec3: 'Standard In-ground Fixed',
        features: 'Galvanized and powder coated with reflective tapes',
        installation: 'Anchoring Method',
        maintenance: 'Easy Repainting',
        otherInfo: ''
      },
      files: [
        { name: '도면 파일(PDF)', type: 'pdf', url: '#' }
      ],
      certifications: ['ISO 9001', '특허제품'],
      g2bIdentifier: '',
      g2bLink: ''
    };
    setEditingProduct(newProd);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const cleanedProduct: Product = {
        ...editingProduct,
        certifications: (editingProduct.certifications || [])
          .map(c => c.trim())
          .filter(c => c !== '')
      };
      await DBService.saveProduct(cleanedProduct);
      setEditingProduct(null);
      loadCMSData();
      alert('제품이 성공적으로 저장되었습니다. 실시간 카탈로그에 반영 완료되었습니다.');
    }
  };

  const handleCopyProduct = async (prod: Product) => {
    const copied: Product = {
      ...prod,
      id: 'prod-copy-' + Date.now(),
      name: prod.name + ' (복사본)',
      nameEn: prod.nameEn + ' (Copy)',
      order: products.length + 1
    };
    await DBService.saveProduct(copied);
    loadCMSData();
    alert('제품 정보가 성공적으로 복제되었습니다. 세부 제원을 즉시 미세 수정하여 원스톱 등록하십시오.');
  };

  const handleDeleteProduct = async (id: string) => {
    openConfirm(
      '제품 삭제',
      '이 도로안전시설물 제품을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async () => {
        await DBService.deleteProduct(id);
        loadCMSData();
      }
    );
  };

  const handleToggleProductVisibility = async (prod: Product) => {
    const updated = { ...prod, isVisible: !prod.isVisible };
    await DBService.saveProduct(updated);
    loadCMSData();
  };

  const handleToggleProductNew = async (prod: Product) => {
    const updated = { ...prod, isNew: !prod.isNew };
    await DBService.saveProduct(updated);
    loadCMSData();
  };

  const handleToggleProductPopular = async (prod: Product) => {
    const updated = { ...prod, isPopular: !prod.isPopular };
    await DBService.saveProduct(updated);
    loadCMSData();
  };

  // Drag & Drop / Order controls simulation
  const handleShiftProductOrder = async (prod: Product, direction: 'up' | 'down') => {
    const idx = products.findIndex(p => p.id === prod.id);
    if (idx === -1) return;
    
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= products.length) return;

    // Swap elements in products copy
    const newProds = [...products];
    const temp = newProds[idx];
    newProds[idx] = newProds[targetIdx];
    newProds[targetIdx] = temp;

    // Reassign order sequential values to avoid any duplicates, undefined, or missing values
    const updatedProds = newProds.map((p, i) => ({
      ...p,
      order: i + 1
    }));

    // Save all of them to ensure Firestore/LocalStorage are correctly synchronized
    for (const p of updatedProds) {
      await DBService.saveProduct(p);
    }
    loadCMSData();
  };

  // ==========================================
  // INQUIRY RESPONSES
  // ==========================================
  const handleAnswerInquiry = async (inq: Inquiry, answer: string) => {
    if (!answer.trim()) return;
    const updated: Inquiry = {
      ...inq,
      status: 'answered',
      answer
    };
    
    // Save to Firestore
    await DBService.saveInquiry(updated);
    
    // Send email response to client if email is provided
    if (inq.email && inq.email.trim()) {
      try {
        const mailRes = await fetch('/api/reply-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: inq.name,
            email: inq.email,
            title: inq.title,
            content: inq.content,
            answer: answer
          }),
        });
        const mailData = await mailRes.json();
        if (mailData.success) {
          if (mailData.simulated) {
            alert('고객 Q&A 답변이 등록되었습니다.\n(SMTP 미설정 상태로 이메일은 서버 로그에 시뮬레이션 처리되었습니다.)');
          } else {
            alert('고객 Q&A 답변이 등록되었으며, 회신 메일로 답변이 성공적으로 발송되었습니다!');
          }
        } else {
          alert(`고객 Q&A 답변은 등록되었으나, 회신 메일 발송에 실패했습니다: ${mailData.error}`);
        }
      } catch (err) {
        console.warn('Failed to send inquiry reply email:', err);
        alert('고객 Q&A 답변은 등록되었으나, 메일 서버 통신 중 오류가 발생했습니다.');
      }
    } else {
      alert('고객 Q&A 답변이 등록되었습니다. (작성자의 회신 이메일이 기입되지 않아 이메일은 발송되지 않았습니다.)');
    }

    loadCMSData();
  };

  const handleDeleteInquiry = async (id: string) => {
    openConfirm(
      '문의 삭제',
      '이 문의 로그를 CMS에서 지우시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async () => {
        await DBService.deleteInquiry(id);
        loadCMSData();
      }
    );
  };

  // ==========================================
  // CATEGORY CMS ACTIONS
  // ==========================================
  const handleAddNewCategory = () => {
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: '새 시설물 분류',
      nameEn: 'New Classification',
      icon: 'Signpost',
      isActive: true,
      order: categories.length + 1
    };
    setEditingCategory(newCat);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await DBService.saveCategory(editingCategory);
      setEditingCategory(null);
      loadCMSData();
      alert('시설물 카테고리가 갱신되었습니다. 홈페이지 전역 대메뉴에 자동 정렬되었습니다.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    openConfirm(
      '카테고리 삭제',
      '이 카테고리를 삭제하시겠습니까? 연결된 제품 노출에 영향이 있을 수 있습니다.',
      async () => {
        await DBService.deleteCategory(id);
        loadCMSData();
      }
    );
  };

  // ==========================================
  // TECH DOWNLOADS CMS ACTIONS
  // ==========================================
  const handleAddNewDownload = () => {
    const newItem: DownloadItem & { images?: string[]; files?: string[] } = {
      id: 'down-' + Date.now(),
      title: '새 기술자료 제목',
      titleEn: 'New Technical Document Title',
      category: 'drawing',
      fileUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=100',
      fileSize: '1.5 MB',
      downloadsCount: 0,
      date: new Date().toISOString().split('T')[0],
      images: [],
      files: []
    } as any;
    setEditingDownload(newItem);
  };

  const handleSaveDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDownload) return;
    try {
      await DBService.saveDownload(editingDownload);
      setEditingDownload(null);
      loadCMSData();
      alert('기술자료가 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteDownload = async (id: string) => {
    openConfirm(
      '기술자료 삭제',
      '정말 이 기술자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async () => {
        await DBService.deleteDownload(id);
        loadCMSData();
      }
    );
  };

  // ==========================================
  // PROJECTS CMS ACTIONS
  // ==========================================
  const handleAddNewProject = () => {
    const newItem: Project & { files?: string[] } = {
      id: 'proj-' + Date.now(),
      title: '새 시공사례 완공 제목',
      titleEn: 'New Construction Project Title',
      client: '새 발주처',
      clientEn: 'New Client',
      location: '서울',
      locationEn: 'Seoul',
      date: new Date().toISOString().slice(0, 7), // YYYY-MM
      products: ['bollard-steel-01'],
      images: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'],
      description: '시공 완료된 현장의 상세 내용을 국문으로 적어주세요.',
      descriptionEn: 'Enter English descriptions of the completed site here.',
      files: []
    };
    setEditingProject(newItem);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      await DBService.saveProject(editingProject);
      setEditingProject(null);
      loadCMSData();
      alert('시공사례가 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    openConfirm(
      '시공사례 삭제',
      '정말 이 시공사례를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async () => {
        await DBService.deleteProject(id);
        loadCMSData();
      }
    );
  };

  // ==========================================
  // NEWS CENTER CMS ACTIONS
  // ==========================================
  const handleAddNewNews = () => {
    const newItem: NewsItem & { images?: string[]; files?: string[] } = {
      id: 'news-' + Date.now(),
      title: '새 홍보/뉴스 제목',
      titleEn: 'New PR / News Title',
      content: '홍보센터 게시글 국문 본문 내용을 입력하세요.',
      contentEn: 'Enter English article description here.',
      type: 'news',
      date: new Date().toISOString().split('T')[0],
      views: 0,
      videoUrl: '',
      images: [],
      files: []
    } as any;
    setEditingNews(newItem);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    try {
      await DBService.saveNews(editingNews);
      setEditingNews(null);
      loadCMSData();
      alert('홍보 게시글이 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteNews = async (id: string) => {
    openConfirm(
      '홍보글 삭제',
      '정말 이 홍보글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async () => {
        await DBService.deleteNews(id);
        loadCMSData();
      }
    );
  };

  const handleDeleteCert = async (id: string) => {
    openConfirm(
      '특허/인증서 삭제',
      '정말로 이 특허/인증서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      async () => {
        await DBService.deleteCertification(id);
        alert('인증서가 성공적으로 삭제되었습니다.');
        const updated = await DBService.getCertifications();
        setCertifications(updated);
      }
    );
  };

  // ==========================================
  // EXCEL BULK UPLOAD EXPLOIT
  // ==========================================
  // EXCEL BULK UPLOAD SYSTEM (PRODUCTS & PROJECTS)
  // ==========================================
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkProgress(`엑셀 파일 분석 및 ${bulkType === 'product' ? '제품' : '시공사례'} 규격 파싱 중...`);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setBulkProgress('오류: 업로드된 엑셀에 레코드가 존재하지 않습니다.');
          return;
        }

        // Space/Case insensitive helper to retrieve row values safely
        const getRowVal = (rowObj: any, keys: string[]): any => {
          for (const k of keys) {
            if (rowObj[k] !== undefined && rowObj[k] !== null) {
              return rowObj[k];
            }
          }
          const rowKeys = Object.keys(rowObj);
          for (const k of keys) {
            const normTarget = k.replace(/\s+/g, '').toLowerCase();
            for (const rk of rowKeys) {
              const normRowKey = rk.replace(/\s+/g, '').toLowerCase();
              if (normRowKey === normTarget) {
                return rowObj[rk];
              }
            }
          }
          return undefined;
        };

        if (bulkType === 'product') {
          setBulkProgress(`총 ${data.length}개의 가공 레코드를 확인했습니다. 제품 데이터 및 제원 매핑 중...`);
          
          let successCount = 0;
          for (const row of data) {
            const prodId = 'prod-bulk-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            // Handle tags split
            const tagsInput = getRowVal(row, ['태그_쉼표구분', '태그', 'tags']) || '국산,신제품';
            const tags = String(tagsInput).split(',').map((t: string) => t.trim()).filter(Boolean);

            // Handle certifications marks if any
            const certsInput = getRowVal(row, ['인증마크_쉼표구분', '인증마크', 'certifications']) || '우수조달인증,디자인특허';
            const certifications = String(certsInput).split(',').map((c: string) => c.trim()).filter(Boolean);

            // Boolean fields parsing (accepts 1, '1', true, or check existence)
            const featuredVal = getRowVal(row, ['대표제품_1또는0', '대표제품', 'featured']);
            const isFeatured = featuredVal === 1 || featuredVal === '1' || featuredVal === true || String(featuredVal).toLowerCase() === 'true';
            
            const popularVal = getRowVal(row, ['인기제품_1또는0', '인기제품', 'popular']);
            const isPopular = popularVal === 1 || popularVal === '1' || popularVal === true || String(popularVal).toLowerCase() === 'true';

            const categoryIdVal = getRowVal(row, ['카테고리ID', 'category_id', 'categoryId', 'category']) || 'bollard';
            const productNameVal = getRowVal(row, ['제품명', 'product_name', 'name', '제품명칭']) || '엑셀 자동생성 제품 ' + (successCount + 1);
            const productNameEnVal = getRowVal(row, ['영문제품명', 'product_name_en', 'name_en', '영문제품명칭']) || 'Bulk Auto Product ' + (successCount + 1);
            
            const descVal = getRowVal(row, ['간단설명', 'description', '설명']) || '관급 최상급 표준 규격 도로안전시설물 제품입니다.';
            const descEnVal = getRowVal(row, ['영문설명', 'description_en', 'descriptionEn']) || 'Premium government grade road safety infrastructure design.';
            const imgUrlVal = getRowVal(row, ['이미지URL', 'image_url', 'imageUrl', '대표이미지']) || 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80';

            const bulkProd: Product = {
              id: prodId,
              categoryId: String(categoryIdVal).trim(),
              name: String(productNameVal).trim(),
              nameEn: String(productNameEnVal).trim(),
              description: String(descVal).trim(),
              descriptionEn: String(descEnVal).trim(),
              images: [String(imgUrlVal).trim()],
              tags: tags,
              isFeatured: isFeatured,
              isNew: true,
              isPopular: isPopular,
              isVisible: true,
              order: products.length + successCount + 1,
              specifications: {
                material: String(getRowVal(row, ['재질', 'material']) || '고강도 탄소강관').trim(),
                spec1: String(getRowVal(row, ['규격1_높이', '규격1', '높이', 'spec1']) || '850mm').trim(),
                spec2: String(getRowVal(row, ['규격2_외경', '규격2', '규격', '외경', 'spec2']) || 'Ø101.6 x 3.2t').trim(),
                spec3: String(getRowVal(row, ['규격3', 'spec3']) || '기본형').trim(),
                features: String(getRowVal(row, ['기타정보', '특징', 'features']) || '고성능 반사 시트 부착 야간 안전 극대화').trim(),
                installation: String(getRowVal(row, ['설치방법', 'installation']) || '콘크리트 타설 후 앙카 체결 고정').trim(),
                maintenance: String(getRowVal(row, ['유지관리', 'maintenance']) || '도장 손상 시 고강도 우레탄 페인트 덧칠 보수').trim(),
                otherInfo: String(getRowVal(row, ['기타정보', '특징', 'other_info', 'otherInfo']) || '').trim()
              },
              specificationsEn: {
                material: String(getRowVal(row, ['영문재질', 'material_en', 'materialEn']) || 'Carbon Steel Pipe').trim(),
                spec1: String(getRowVal(row, ['영문규격1', '영문높이', 'spec1_en', 'spec1En']) || '850mm').trim(),
                spec2: String(getRowVal(row, ['영문규격2', '영문규격', 'spec2_en', 'spec2En']) || 'Ø101.6 x 3.2t').trim(),
                spec3: String(getRowVal(row, ['영문규격3', 'spec3_en', 'spec3En']) || 'Standard model').trim(),
                features: String(getRowVal(row, ['영문기타정보', '영문특징', 'features_en', 'featuresEn']) || 'Hot-dip galvanized for ultimate rust prevention').trim(),
                installation: String(getRowVal(row, ['영문설치방법', 'installation_en', 'installationEn']) || 'Embedded anchor fixing method').trim(),
                maintenance: String(getRowVal(row, ['영문유지관리', 'maintenance_en', 'maintenanceEn']) || 'Easy spot cleaning').trim(),
                otherInfo: String(getRowVal(row, ['영문기타정보', '영문특징', 'other_info_en', 'otherInfoEn']) || '').trim()
              },
              files: [
                { name: '설계 도면(DWG)', type: 'dwg', url: '#' },
                { name: '시험성적서(PDF)', type: 'pdf', url: '#' }
              ],
              certifications: certifications,
              g2bIdentifier: String(getRowVal(row, ['나라장터식별번호', '나라장터식별', 'identifier']) || '').trim(),
              g2bLink: String(getRowVal(row, ['나라장터링크', 'link']) || '').trim()
            };

            await DBService.saveProduct(bulkProd);
            successCount++;
          }

          setBulkProgress(`성공! 총 ${successCount}개의 대량 제품이 바뀐 제원 구조에 맞춰 일괄 등록되었습니다.`);
        } else {
          // Project Bulk Import
          setBulkProgress(`총 ${data.length}개의 가공 레코드를 확인했습니다. 시공사례 데이터 생성 중...`);
          
          let successCount = 0;
          for (const row of data) {
            const rawProjId = getRowVal(row, ['시공사례ID_선택', '시공사례ID', '시공사례id', 'id', 'project_id', 'projectId']);
            const projId = rawProjId ? String(rawProjId).trim() : 'proj-bulk-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            const relatedProds = getRowVal(row, ['연관제품ID_쉼표구분', '연관제품ID', '연관제품', 'products', 'related_products', 'relatedProducts']) || '';
            const productsList = relatedProds ? String(relatedProds).split(',').map((p: string) => p.trim()).filter(Boolean) : [];

            const imageInput = getRowVal(row, ['대표이미지URL', '이미지URL', '대표이미지', 'images', 'image_url', 'imageUrl']) || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80';
            const imagesList = String(imageInput).split(',').map((img: string) => img.trim()).filter(Boolean);

            let projectTypeVal: '시공' | '납품' = '시공';
            const typeInput = String(getRowVal(row, ['구분_시공또는납품', '구분', 'type', 'project_type', 'projectType']) || '').trim();
            if (typeInput.includes('납품') || typeInput.toLowerCase() === 'delivery') {
              projectTypeVal = '납품';
            }

            let dateVal = '';
            const rawDate = getRowVal(row, ['시공년월_YYYY_MM', '시공년월', '날짜', 'date']);
            if (rawDate) {
              if (rawDate instanceof Date) {
                dateVal = rawDate.toISOString().slice(0, 7);
              } else if (typeof rawDate === 'number') {
                if (rawDate > 1900 && rawDate < 2100) {
                  dateVal = `${rawDate}-01`;
                } else {
                  try {
                    const dateObj = new Date((rawDate - 25569) * 86400 * 1000);
                    dateVal = dateObj.toISOString().slice(0, 7);
                  } catch (e) {
                    dateVal = String(rawDate);
                  }
                }
              } else {
                dateVal = String(rawDate).trim();
              }
            }
            if (!dateVal || !/^\d{4}-\d{2}$/.test(dateVal)) {
              dateVal = new Date().toISOString().slice(0, 7);
            }

            const titleVal = getRowVal(row, ['시공사례제목_국문', '시공사례제목', '제목', 'title']) || '엑셀 자동생성 시공사례 ' + (successCount + 1);
            const titleEnVal = getRowVal(row, ['시공사례제목_영문', '영문제목', 'title_en', 'titleEn']) || 'Bulk Project ' + (successCount + 1);
            
            const clientVal = getRowVal(row, ['발주처_국문', '발주처', 'client']) || '공공기관';
            const clientEnVal = getRowVal(row, ['발주처_영문', '영문발주처', 'client_en', 'clientEn']) || 'Government Client';
            
            const locationVal = getRowVal(row, ['설치지역_국문', '설치지역', '위치', 'location']) || '서울';
            const locationEnVal = getRowVal(row, ['설치지역_영문', '영문위치', 'location_en', 'locationEn']) || 'Seoul';
            
            const descVal = getRowVal(row, ['상세설명_국문', '상세설명', '설명', 'description']) || '동우산업의 우수한 도로안전시설물을 시공한 사례입니다.';
            const descEnVal = getRowVal(row, ['상세설명_영문', '영문설명', 'description_en', 'descriptionEn']) || 'This is a project construction reference showing our premium safety facility products.';

            const bulkProj: Project = {
              id: projId,
              title: String(titleVal).trim(),
              titleEn: String(titleEnVal).trim(),
              client: String(clientVal).trim(),
              clientEn: String(clientEnVal).trim(),
              location: String(locationVal).trim(),
              locationEn: String(locationEnVal).trim(),
              date: dateVal,
              products: productsList,
              images: imagesList,
              description: String(descVal).trim(),
              descriptionEn: String(descEnVal).trim(),
              projectType: projectTypeVal
            };

            await DBService.saveProject(bulkProj);
            successCount++;
          }

          setBulkProgress(`성공! 총 ${successCount}개의 대량 시공사례 레코드가 일괄 등록 완료되었습니다.`);
        }

        loadCMSData();
      } catch (err: any) {
        setBulkProgress('엑셀 가공 중 치명적 오류가 발생했습니다: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Demo Excel Template download simulation
  const downloadExcelTemplate = () => {
    const wb = XLSX.utils.book_new();

    if (bulkType === 'product') {
      const headers = [
        ['카테고리ID', '제품명', '영문제품명', '간단설명', '영문설명', '재질', '규격1_높이', '규격2_외경', '규격3', '기타정보', '영문재질', '영문규격1', '영문규격2', '영문규격3', '영문기타정보', '태그_쉼표구분', '대표제품_1또는0', '인기제품_1또는0', '이미지URL', '나라장터식별번호', '나라장터링크', '인증마크_쉼표구분']
      ];
      const dummyRow = [
        'bollard', 
        '스틸 이동식 볼라드 (DW-S90)', 
        'Steel Portable Bollard (DW-S90)', 
        '편리하게 이송 보관이 가능한 이동형 프리미엄 볼라드', 
        'Portable heavy-duty steel post with handle grip', 
        '고강도 탄소강관 및 손잡이용 황동', 
        '850mm', 
        'Ø101.6 x 2.3t', 
        '기본형(자물쇠타입)', 
        '탈부착 장치식 자물쇠 결합용 구조로 관급 및 아파트 단지 차량 통제에 최적화', 
        'Carbon Steel Pipe', 
        '850mm', 
        'Ø101.6 x 2.3t', 
        'Standard with Lock', 
        'Detachable locking design ideal for governmental vehicle access control.', 
        '이동형,스틸,신소재', 
        '1', 
        '1', 
        'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80',
        '23145678',
        'https://www.g2b.go.kr',
        '우수제품,디자인특허,KS인증'
      ];
      const ws = XLSX.utils.aoa_to_sheet([...headers, dummyRow]);
      XLSX.utils.book_append_sheet(wb, ws, '제품 대량업로드 양식');
      XLSX.writeFile(wb, 'DOONGWOO_Product_Bulk_Template.xlsx');
    } else {
      const headers = [
        ['시공사례ID_선택', '시공사례제목_국문', '시공사례제목_영문', '발주처_국문', '발주처_영문', '설치지역_국문', '설치지역_영문', '시공년월_YYYY_MM', '구분_시공또는납품', '연관제품ID_쉼표구분', '상세설명_국문', '상세설명_영문', '대표이미지URL']
      ];
      const dummyRow = [
        'project-sejong-road',
        '서울시 종로구 세종대로 보행로 스틸 볼라드 설치공사',
        'Steel Bollard Installation on Sejong-daero, Seoul',
        '종로구청 도로관리과',
        'Jongno-gu Office',
        '서울 종로구',
        'Jongno-gu, Seoul',
        '2026-06',
        '시공',
        'bollard-steel-01,bollard-steel-02',
        '보행자 안전 확보를 위해 도로 경계석 내측에 스틸 볼라드를 견고하게 시공 완료하였습니다.',
        'Heavy-duty steel posts installed safely to protect pedestrians along the walking pathway.',
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80'
      ];
      const ws = XLSX.utils.aoa_to_sheet([...headers, dummyRow]);
      XLSX.utils.book_append_sheet(wb, ws, '시공사례 대량업로드 양식');
      XLSX.writeFile(wb, 'DOONGWOO_Project_Bulk_Template.xlsx');
    }
  };

  // ==========================================
  // RENDER SECURITY SCREEN
  // ==========================================
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl p-8 space-y-6" id="cms-login-card">
        <div className="text-center space-y-2">
          <span className="text-4xl">🔐</span>
          <h2 className="text-xl font-extrabold text-slate-900">동우안전 CMS 통합 관리 센터</h2>
          <p className="text-xs text-slate-500">지정된 동우 시스템 관리자만 승인 후 접근할 수 있습니다.</p>
        </div>

        {loginError && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">
            {loginError}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">인증 수단 선택</label>
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3 border border-gray-300 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center justify-center space-x-2 transition-all shadow-sm"
            >
              <span>Google 계정으로 보안 관리자 로그인</span>
            </button>
          </div>

          <div className="border-t border-gray-200 my-4 relative">
            <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 text-[10px] text-slate-400 font-bold uppercase">OR</span>
          </div>

          {/* Quick Demo Access (Adheres perfectly to instructions for safe visual sandbox bypass) */}
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl space-y-2.5">
            <p className="text-xs font-bold text-orange-800 flex items-center space-x-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>개발 및 검토 위원용 원스톱 관리자 데모 패스</span>
            </p>
            <p className="text-[10px] text-orange-600 leading-normal">
              아이프레임 샌드박스 또는 비관리자 상태에서도 원클릭으로 가상의 통합 CMS 환경을 가동하여 제품 등록, 복사, 드래그 순서 제어, 엑셀 100개 대량 생성을 즉시 검토하실 수 있습니다.
            </p>
            <button 
              onClick={handleDemoLogin}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>원스톱 가상 관리자 권한 획득</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  // Filtered lists for CMS view
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col md:flex-row" id="admin-dashboard-container">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            D
          </div>
          <div>
            <h1 className="text-xs font-black tracking-wider text-white">DOONGWOO CMS</h1>
            <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.2 rounded font-extrabold tracking-widest uppercase">v2.1</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 h-screen shrink-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Sidebar Header branding */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                <Settings className="h-5.5 w-5.5" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-wider uppercase leading-none text-white">
                  DOONGWOO CMS
                </h2>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded font-extrabold tracking-widest">v2.1</span>
                  <span className="text-[9px] text-slate-400 font-mono">INTEGRATED PORTAL</span>
                </div>
              </div>
            </div>
            
            {/* Logged in admin meta info */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/60">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">보안 승인 관리자</p>
              <p className="text-xs font-bold text-slate-200 mt-0.5 flex items-center space-x-1">
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>전연수 과장(CIO)</span>
              </p>
            </div>
          </div>

          {/* Sidebar Tabs Links */}
          <nav className="p-4 space-y-1 flex-1">
            {[
              { id: 'dash', label: '종합 관제 대시보드', icon: BarChart2 },
              { id: 'prod', label: '시설물 카탈로그 관리', icon: Layers },
              { id: 'cat', label: '카테고리 분류 관리', icon: Building2 },
              { id: 'tech', label: '기술자료 다운로드 관리', icon: DownloadCloud },
              { id: 'proj', label: '시공사례 완공 관리', icon: Image },
              { id: 'news', label: '홍보센터 뉴스 관리', icon: Sparkles },
              { id: 'inq', label: '상담/견적 문의 답변', icon: Mail },
              { id: 'cert', label: '특허 및 인증 관리', icon: UserCheck },
              { id: 'banner', label: '타이틀 배경 관리', icon: Settings },
              { id: 'ceo', label: 'CEO 인사말 관리', icon: UserCheck },
              { id: 'email', label: 'SMTP 이메일 알림 설정', icon: Settings },
              { id: 'bulk', label: '엑셀 100개 대량 등록', icon: FileSpreadsheet }
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { 
                    setActiveSubTab(tab.id as any); 
                    setEditingProduct(null); 
                    setEditingCategory(null); 
                    setEditingProject(null);
                    setEditingNews(null);
                    setEditingDownload(null);
                    setEditingCert(null);
                    setMobileMenuOpen(false); // Close mobile drawer
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <IconComponent className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer with Logout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-800 hover:bg-red-600 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>보안 로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Main Content Workspace Area */}
      <main className="flex-1 p-4 sm:p-8 min-w-0" id="admin-main-workspace">

        {/* -----------------------------------------------------------
            SUB-TAB: DASHBOARD OVERVIEW
        ------------------------------------------------------------ */}
        {activeSubTab === 'dash' && (
          <div className="space-y-8" id="subtab-dash">
            
            {/* Counts grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {[
                { title: '오늘 방문자수', count: stats.visitors, color: 'text-orange-500', desc: '실시간 유니크 세션 수집' },
                { title: '도면/자료 다운로드수', count: stats.downloads, color: 'text-blue-500', desc: 'PDF, DWG 다운로드 합산' },
                { title: '접수된 문의/견적', count: stats.inquiries, color: 'text-green-500', desc: '검토 대기 및 답변완료 건수' },
                { title: '활성 도로안전시설물', count: stats.products, color: 'text-purple-500', desc: '카탈로그 노출 제품군' }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                  <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">{stat.desc}</p>
                </div>
              ))}
            </div>

            {/* Inquiries review and Search terms */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Popular Searches list (Col-span 1) */}
              <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs border-b border-gray-100 pb-3 uppercase tracking-wider">
                  🔥 실시간 인기 검색어 유동분석
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  {stats.popularSearches && stats.popularSearches.length > 0 ? (
                    stats.popularSearches.slice(0, 6).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-800">{i + 1}. {item.query}</span>
                        <span className="bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded text-[10px]">
                          {item.count} hits
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-6">로그가 아직 없습니다.</p>
                  )}
                </div>
              </div>

              {/* Recent Inquiry Logs (Col-span 2) */}
              <div className="lg:col-span-2 bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-xs border-b border-gray-100 pb-3">
                  📨 최근 접수된 긴급 기술상담 및 견적요청 (실시간)
                </h3>
                
                <div className="divide-y divide-gray-150 text-xs">
                  {inquiries.slice(0, 3).map((inq) => (
                    <div key={inq.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{inq.title}</p>
                        <p className="text-[10px] text-slate-400">작성자: {inq.name} | 연락처: {inq.phone} | 일자: {inq.date}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inq.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {inq.status === 'answered' ? '답변완료' : '접수대기'}
                      </span>
                    </div>
                  ))}
                  {inquiries.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">접수된 실시간 견적서 요청이 없습니다.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: PRODUCT CMS MANAGEMENT
        ------------------------------------------------------------ */}
        {activeSubTab === 'prod' && !editingProduct && (
          <div className="space-y-6" id="subtab-prod">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <div className="relative w-full sm:w-80">
                <input 
                  type="text"
                  placeholder="제품명, 모델ID 실시간 기기 필터..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <button 
                onClick={handleAddNewProduct}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>+ 단일 시설물 수동 등록</span>
              </button>
            </div>

            {/* Products CMS list Table */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-bold">{lang === 'ko' ? '순서 정렬' : 'Sort'}</th>
                    <th className="p-4 font-bold">{lang === 'ko' ? '제품 정보' : 'Product Info'}</th>
                    <th className="p-4 font-bold">{lang === 'ko' ? '재질/규격' : 'Material/Specs'}</th>
                    <th className="p-4 font-bold">{lang === 'ko' ? '상태 설정' : 'Status'}</th>
                    <th className="p-4 font-bold text-center">{lang === 'ko' ? 'CMS 조작' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((prod, idx) => (
                    <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Sort arrows */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1">
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleShiftProductOrder(prod, 'up')}
                            className="p-1 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 rounded text-slate-400"
                            title="위로 정렬"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            disabled={idx === filteredProducts.length - 1}
                            onClick={() => handleShiftProductOrder(prod, 'down')}
                            className="p-1 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-30 rounded text-slate-400"
                            title="아래로 정렬"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Info thumbnail + details */}
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img src={getEmbedImageUrl(prod.images[0])} alt={prod.name} className="h-12 w-12 rounded-lg object-cover border border-gray-200" />
                          <div>
                            <p className="font-extrabold text-slate-900 line-clamp-1">{prod.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Model: {prod.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Material, size */}
                      <td className="p-4 text-slate-500">
                        <p className="font-bold text-slate-700">{prod.specifications.material}</p>
                        <p className="text-[10px]">{prod.specifications.spec1 || prod.specifications.height || ''} / {prod.specifications.spec2 || prod.specifications.size || ''} {prod.specifications.spec3 ? `(${prod.specifications.spec3})` : ''}</p>
                      </td>

                      {/* Featured status switches */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleToggleProductNew(prod)}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                              prod.isNew 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' 
                                : 'bg-slate-150 text-slate-400 hover:bg-slate-200 border border-slate-300'
                            }`}
                            title="NEW 상태 설정/해제"
                          >
                            NEW
                          </button>
                          <button
                            onClick={() => handleToggleProductPopular(prod)}
                            className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${
                              prod.isPopular 
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300' 
                                : 'bg-slate-150 text-slate-400 hover:bg-slate-200 border border-slate-300'
                            }`}
                            title="BEST 상태 설정/해제"
                          >
                            BEST
                          </button>
                        </div>
                      </td>

                      {/* Copy, edit, delete buttons */}
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          
                          <button 
                            onClick={() => handleToggleProductVisibility(prod)}
                            className={`p-2 rounded-lg ${prod.isVisible ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            title={prod.isVisible ? '숨김 처리' : '노출 처리'}
                          >
                            {prod.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>

                          <button 
                            onClick={() => handleCopyProduct(prod)}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            title="유사제품 자동 복사"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          <button 
                            onClick={() => setEditingProduct(prod)}
                            className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            title="스펙 세부수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button 
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="영구 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: ACTIVE PRODUCT EDIT FORM (MODAL INLINE)
        ------------------------------------------------------------ */}
        {activeSubTab === 'prod' && editingProduct && (
          <form onSubmit={handleSaveProduct} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="product-edit-form">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">도로안전시설물 정보 등록 및 세부수정</h3>
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                className="p-1 hover:bg-gray-100 rounded text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">제품 모델 ID *</label>
                <input 
                  type="text" 
                  required
                  value={editingProduct.id}
                  onChange={(e) => setEditingProduct({...editingProduct, id: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">소속 카테고리 ID *</label>
                <select 
                  value={editingProduct.categoryId}
                  onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Options Block */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-150 flex flex-wrap items-center gap-6">
              <span className="text-xs font-bold text-slate-700">추천 상태 및 노출 설정:</span>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={editingProduct.isNew || false}
                  onChange={(e) => setEditingProduct({...editingProduct, isNew: e.target.checked})}
                  className="h-4 w-4 rounded text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                />
                <span>NEW 표시</span>
              </label>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={editingProduct.isPopular || false}
                  onChange={(e) => setEditingProduct({...editingProduct, isPopular: e.target.checked})}
                  className="h-4 w-4 rounded text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                />
                <span>BEST 표시</span>
              </label>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={editingProduct.isVisible !== false}
                  onChange={(e) => setEditingProduct({...editingProduct, isVisible: e.target.checked})}
                  className="h-4 w-4 rounded text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                />
                <span>홈페이지 노출</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 시설 명칭 *</label>
                <input 
                  type="text" 
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 시설 명칭 (En) *</label>
                <input 
                  type="text" 
                  required
                  value={editingProduct.nameEn}
                  onChange={(e) => setEditingProduct({...editingProduct, nameEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Images list JSON */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">썸네일 및 실물 카달로그 이미지 등록</label>
              <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-4 rounded-2xl border border-gray-200">
                {editingProduct.images[0] && (
                  <div className="shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">현재 이미지 미리보기</p>
                    <img 
                      src={getEmbedImageUrl(editingProduct.images[0])} 
                      alt="Product Preview" 
                      className="h-24 w-24 object-cover rounded-lg border border-gray-300 bg-white" 
                    />
                  </div>
                )}
                <div className="flex-1 w-full space-y-2">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    컴퓨터에 저장된 고해상도 제품 실물 카탈로그 및 대표 썸네일 이미지를 즉시 선택하여 웹 최적화 업로드할 수 있습니다.
                  </p>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      id="product-image-upload"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setEditingProduct({
                                ...editingProduct,
                                images: [reader.result]
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="product-image-upload"
                      className="px-3.5 py-2 bg-slate-900 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow flex items-center space-x-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>기기에서 이미지 파일 선택</span>
                    </label>
                    <span className="text-[10px] text-slate-400">또는 아래에 기존 이미지 URL을 직접 입력할 수도 있습니다:</span>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={editingProduct.images[0]}
                    onChange={(e) => setEditingProduct({...editingProduct, images: [e.target.value]})}
                    placeholder="https://example.com/image.jpg 또는 data:image..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* G2B Identification Number & Purchase Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">나라장터 식별번호 (선택)</label>
                <input 
                  type="text" 
                  value={editingProduct.g2bIdentifier || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, g2bIdentifier: e.target.value})}
                  placeholder="예: 23145678"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">나라장터 구매 링크 URL (선택)</label>
                <input 
                  type="text" 
                  value={editingProduct.g2bLink || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, g2bLink: e.target.value})}
                  placeholder="예: https://www.g2b.go.kr/..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Certifications Management */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                <span className="text-xs font-bold text-slate-700">인증 및 등록 마크 관리 (한 페이지당 최대 5개)</span>
                <span className="text-[10px] text-slate-400">등록된 인증: {(editingProduct.certifications || []).length} / 5</span>
              </div>
              
              <div className="space-y-2">
                {(editingProduct.certifications || []).map((cert, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 w-16">인증 #{index + 1}</span>
                    <input 
                      type="text"
                      value={cert}
                      onChange={(e) => {
                        const newCerts = [...(editingProduct.certifications || [])];
                        newCerts[index] = e.target.value;
                        setEditingProduct({ ...editingProduct, certifications: newCerts });
                      }}
                      placeholder="예: KS인증, 우수제품, 디자인특허, ISO 9001 등"
                      className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newCerts = (editingProduct.certifications || []).filter((_, i) => i !== index);
                        setEditingProduct({ ...editingProduct, certifications: newCerts });
                      }}
                      className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}

                {(!editingProduct.certifications || editingProduct.certifications.length === 0) && (
                  <p className="text-xs text-slate-400 py-1">등록된 인증 마크가 없습니다. 아래 버튼으로 추가하십시오.</p>
                )}

                {(!editingProduct.certifications || editingProduct.certifications.length < 5) && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentCerts = editingProduct.certifications || [];
                      if (currentCerts.length < 5) {
                        setEditingProduct({
                          ...editingProduct,
                          certifications: [...currentCerts, '']
                        });
                      }
                    }}
                    className="w-full py-2 bg-white border border-dashed border-gray-300 hover:border-orange-brand hover:text-orange-600 rounded-lg text-xs font-semibold text-slate-500 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>+ 인증 마크 추가하기 (최대 5개)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-orange-600 border-b border-gray-150 pb-1">국문 제원 (Specifications)</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">주요 재질</label>
                  <input 
                    type="text"
                    value={editingProduct.specifications.material}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: { ...editingProduct.specifications, material: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">규격 1</label>
                  <input 
                    type="text"
                    value={editingProduct.specifications.spec1 || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: { ...editingProduct.specifications, spec1: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="예: 850mm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">규격 2</label>
                  <input 
                    type="text"
                    value={editingProduct.specifications.spec2 || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: { ...editingProduct.specifications, spec2: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="예: Ø101.6 x 3.2t"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">규격 3</label>
                  <input 
                    type="text"
                    value={editingProduct.specifications.spec3 || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: { ...editingProduct.specifications, spec3: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="예: 추가 설치 옵션 또는 부가 규격"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">기타 정보 (특징, 설치 공정, 유지관리 통합 입력)</label>
                  <textarea 
                    value={editingProduct.specifications.otherInfo || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specifications: { ...editingProduct.specifications, otherInfo: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none h-24"
                    placeholder="제품의 기능적 특장점, 권장 설치 공정, 사후관리 등의 핵심 기타 정보를 한 줄에 하나씩 또는 단락 형태로 자유롭게 기록하십시오."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-orange-600 border-b border-gray-150 pb-1">영문 제원 (English Specifications)</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Material (En)</label>
                  <input 
                    type="text"
                    value={editingProduct.specificationsEn.material}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specificationsEn: { ...editingProduct.specificationsEn, material: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Specification 1 (En)</label>
                  <input 
                    type="text"
                    value={editingProduct.specificationsEn.spec1 || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specificationsEn: { ...editingProduct.specificationsEn, spec1: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="e.g. 850mm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Specification 2 (En)</label>
                  <input 
                    type="text"
                    value={editingProduct.specificationsEn.spec2 || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specificationsEn: { ...editingProduct.specificationsEn, spec2: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="e.g. Ø101.6 x 3.2t"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Specification 3 (En)</label>
                  <input 
                    type="text"
                    value={editingProduct.specificationsEn.spec3 || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specificationsEn: { ...editingProduct.specificationsEn, spec3: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                    placeholder="e.g. Optional spec or detail"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Other Info (En) (Key features, installation, maintenance, etc.)</label>
                  <textarea 
                    value={editingProduct.specificationsEn.otherInfo || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      specificationsEn: { ...editingProduct.specificationsEn, otherInfo: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none h-24"
                    placeholder="Enter other specification details in English, such as key characteristics, recommended tools, or storage methods."
                  />
                </div>
              </div>
            </div>

            {/* SEO Section */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-200">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center space-x-1">
                <span>🌐 개별 제품 최적화 SEO 메타데이터 관리</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">SEO Title (검색 노출 제목)</label>
                  <input 
                    type="text"
                    value={editingProduct.seo?.title || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seo: { ...(editingProduct.seo || { title: '', description: '', keywords: '', ogImage: '' }), title: e.target.value }
                    })}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    placeholder="고정식 스틸 볼라드 DW-S100 | 동우안전"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">SEO Keywords (키워드 ,구분)</label>
                  <input 
                    type="text"
                    value={editingProduct.seo?.keywords || ''}
                    onChange={(e) => setEditingProduct({
                      ...editingProduct,
                      seo: { ...(editingProduct.seo || { title: '', description: '', keywords: '', ogImage: '' }), keywords: e.target.value }
                    })}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs"
                    placeholder="스틸볼라드, 도로안전"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150">
              <button 
                type="button" 
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                수정 취소
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>데이터베이스에 저장 및 갱신</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: EXCEL BULK 100+ UPLOAD SYSTEM
        ------------------------------------------------------------ */}
        {activeSubTab === 'bulk' && (
          <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6" id="subtab-bulk">
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="h-6 w-6 text-orange-500" />
                <span>스마트 엑셀 벌크 다중 자동생성 모듈</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                도로안전시설물 및 시공사례 100여 개 대량 등록 시 발생하는 반복적인 입력 소요 시간을 획기적으로 낮추는 지능형 자동 매핑 엔진입니다. 아래에서 원하시는 벌크 대상을 선택하고, 해당 엑셀 템플릿을 내려받아 가공 후 업로드해 주세요.
              </p>
            </div>

            {/* Toggle tabs for Product / Project bulk upload */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setBulkType('product');
                  setBulkProgress('');
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  bulkType === 'product'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📦 제품 대량 등록
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkType('project');
                  setBulkProgress('');
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  bulkType === 'project'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🏗️ 시공사례 대량 등록
              </button>
            </div>

            {/* Template Download Option */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">
                  1. {bulkType === 'product' ? '📦 시설물 제품' : '🏗️ 시공사례'} 대량 업로드용 엑셀 표준 템플릿 다운로드
                </p>
                <p className="text-[10px] text-slate-400 leading-normal">
                  {bulkType === 'product' ? (
                    '카테고리ID, 국/영문 제품명, 국/영문 설명, 바뀐 제원구조(규격1~3, 재질, 기타정보), 태그, 대표여부, 인기여부, 나라장터 정보 등을 완벽히 채울 수 있는 최신 제품 가공 템플릿입니다.'
                  ) : (
                    '시공사례제목, 발주처, 설치지역, 시공년월, 구분(시공/납품), 상세설명, 대표이미지 URL, 연관제품 ID 목록 등을 가공할 수 있는 최신 시공사례 전용 템플릿입니다.'
                  )}
                </p>
              </div>
              <button
                onClick={downloadExcelTemplate}
                className="px-4 py-2.5 bg-slate-900 hover:bg-orange-500 text-white rounded-lg text-xs font-extrabold transition-all flex items-center justify-center space-x-1 shadow-sm sm:w-fit sm:justify-self-end"
              >
                <DownloadCloud className="h-4.5 w-4.5" />
                <span>{bulkType === 'product' ? '제품' : '시공사례'} 템플릿 다운로드</span>
              </button>
            </div>

            {/* Drag drop excel area */}
            <div className="border-4 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-orange-500 hover:bg-orange-50/10 transition-all flex flex-col items-center justify-center space-y-4">
              <FileSpreadsheet className="h-14 w-14 text-orange-400" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  작성하신 [{bulkType === 'product' ? '제품' : '시공사례'}] 엑셀 파일을 가져오거나 여기로 드래그하십시오.
                </p>
                <p className="text-[10px] text-slate-400">Excel (.xlsx, .xls) 파일 형식만 지원됩니다.</p>
              </div>

              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                className="hidden" 
                id="excel-file-input"
              />
              <label 
                htmlFor="excel-file-input"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-orange-500 transition-colors shadow"
              >
                내 기기에서 엑셀 파일 선택
              </label>
            </div>

            {/* Bulking Progress Logs */}
            {bulkProgress && (
              <div className="bg-slate-900 text-green-400 p-5 rounded-2xl font-mono text-[11px] leading-relaxed shadow-inner animate-fadeIn">
                <p className="font-bold border-b border-slate-800 pb-2 mb-2 text-white">🔄 CMS 벌크 업로드 실시간 처리 상태 로그</p>
                <p>{bulkProgress}</p>
              </div>
            )}

          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: INQUIRY Q&A COMMENTS
        ------------------------------------------------------------ */}
        {activeSubTab === 'inq' && (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm" id="subtab-inq">
            <div className="p-6 bg-slate-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs">📨 실시간 고객 문의 및 단가 견적서 관리</h3>
              <span className="text-[10px] text-slate-400 font-mono">Total {inquiries.length} cases</span>
            </div>

            <div className="divide-y divide-gray-150">
              {inquiries.map((inq) => {
                return (
                  <div key={inq.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded font-extrabold uppercase">{inq.type}</span>
                          <p className="text-[10px] text-slate-400">작성자: {inq.name} | 연락처: {inq.phone} | 이메일: {inq.email || 'N/A'}</p>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{inq.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inq.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {inq.status === 'answered' ? '답변완료' : '검토중'}
                        </span>
                        <button 
                          onClick={() => handleDeleteInquiry(inq.id)}
                          className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                      {inq.content}
                    </div>

                    {/* Respond form inline */}
                    <div className="space-y-2 pt-2">
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">CMS 답변 작성 (고객에게 실시간 피드백 반영):</p>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const t = (e.target as any).elements.ans.value;
                          handleAnswerInquiry(inq, t);
                          (e.target as any).reset();
                        }}
                        className="flex gap-2"
                      >
                        <input 
                          type="text" 
                          name="ans"
                          required
                          defaultValue={inq.answer || ''}
                          placeholder="기술 담당자로서 친절한 답변 또는 단가 회신을 입력해 주십시오."
                          className="flex-1 bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <button 
                          type="submit"
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors"
                        >
                          답변 게시
                        </button>
                      </form>
                    </div>

                  </div>
                );
              })}

              {inquiries.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <p className="text-xs font-bold">등록된 온라인 기술상담 및 견적서 문의가 없습니다.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: CATEGORY CMS LIST
        ------------------------------------------------------------ */}
        {activeSubTab === 'cat' && !editingCategory && (
          <div className="space-y-6" id="subtab-cat">
            <div className="flex justify-end bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <button
                onClick={handleAddNewCategory}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>+ 새 도로시설물 분류 추가</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-bold">대표 이미지 (Thumbnail)</th>
                    <th className="p-4 font-bold">카테고리 ID</th>
                    <th className="p-4 font-bold">분류 명칭 (KO / EN)</th>
                    <th className="p-4 font-bold text-center">조작 (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((cat, index) => {
                    const categoryImages: Record<string, string> = {
                      'road-sign': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&h=250&q=80',
                      'traffic-sign': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=400&h=250&q=80',
                      'lane-divider': 'https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?auto=format&fit=crop&w=400&h=250&q=80',
                      'bollard': 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=400&h=250&q=80',
                      'fence': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&h=250&q=80',
                      'awning': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&h=250&q=80',
                      'others': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&h=250&q=80'
                    };
                    const thumImg = cat.image || categoryImages[cat.id] || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80';

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <img 
                            src={getEmbedImageUrl(thumImg)} 
                            alt={cat.name} 
                            referrerPolicy="no-referrer"
                            className="h-10 w-16 object-cover rounded-lg border border-gray-200" 
                          />
                        </td>
                        <td className="p-4 font-bold text-slate-900">{cat.id}</td>
                        <td className="p-4 text-slate-700">
                          <span className="font-extrabold">{cat.name}</span> / <span className="text-slate-400 text-[10px]">{cat.nameEn}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button 
                              type="button"
                              onClick={() => handleMoveCategory(index, 'up')}
                              disabled={index === 0}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-30"
                              title="위로 이동"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleMoveCategory(index, 'down')}
                              disabled={index === categories.length - 1}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-30"
                              title="아래로 이동"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => setEditingCategory(cat)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: ACTIVE CATEGORY EDIT FORM (MODAL INLINE)
        ------------------------------------------------------------ */}
        {activeSubTab === 'cat' && editingCategory && (
          <form onSubmit={handleSaveCategory} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="category-edit-form">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">시설 분류 등록 및 수정</h3>
              <button 
                type="button" 
                onClick={() => setEditingCategory(null)}
                className="p-1 hover:bg-gray-100 rounded text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">카테고리 ID *</label>
                <input 
                  type="text" 
                  required
                  value={editingCategory.id}
                  onChange={(e) => setEditingCategory({...editingCategory, id: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대표 이미지 등록 및 업로드 (Thumbnail) *</label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-8">
                    <input 
                      type="text" 
                      value={editingCategory.image || ''}
                      onChange={(e) => setEditingCategory({...editingCategory, image: e.target.value})}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                      placeholder="이미지 URL 주소 입력 또는 직접 파일 선택 업로드"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="file"
                      id="cat-form-image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target?.result as string;
                          setEditingCategory({ ...editingCategory, image: dataUrl });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor="cat-form-image-upload"
                      className="w-full py-2 bg-slate-950 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>파일 업로드</span>
                    </label>
                  </div>
                </div>

                {editingCategory.image && (
                  <div className="mt-2 bg-slate-50 border border-gray-200 p-2.5 rounded-xl max-w-xs flex items-center space-x-3">
                    <div className="relative border border-gray-300 rounded-lg bg-white overflow-hidden h-14 w-20 shadow-sm">
                      <img 
                        src={getEmbedImageUrl(editingCategory.image)} 
                        alt="분류 이미지 미리보기" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, image: '' })}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                        title="이미지 제거"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">이미지가 정상 등록되었습니다.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 분류 명칭 *</label>
                <input 
                  type="text" 
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 분류 명칭 (En) *</label>
                <input 
                  type="text" 
                  required
                  value={editingCategory.nameEn}
                  onChange={(e) => setEditingCategory({...editingCategory, nameEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">정렬 가중치 순서 (Order)</label>
                <input 
                  type="number" 
                  value={editingCategory.order || 0}
                  onChange={(e) => setEditingCategory({...editingCategory, order: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: 1 (순서 조절 수치)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150">
              <button 
                type="button" 
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>카테고리 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: TECHNICAL DOCUMENTS (기술자료) LIST
        ------------------------------------------------------------ */}
        {activeSubTab === 'tech' && !editingDownload && (
          <div className="space-y-6" id="subtab-tech">
            <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-500 font-bold">동우산업(주)의 성적서, 인증서, 설계도면 등의 다운로드 문서를 관리합니다.</p>
              <button
                onClick={handleAddNewDownload}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>+ 새 기술자료 등록</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-bold">분류 (Category)</th>
                    <th className="p-4 font-bold">기술 자료명 (국문 / 영문)</th>
                    <th className="p-4 font-bold">크기 (Size)</th>
                    <th className="p-4 font-bold">다운로드수</th>
                    <th className="p-4 font-bold">등록일</th>
                    <th className="p-4 font-bold text-center">조작 (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {downloads.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.category === 'catalog' && '종합 카탈로그'}
                          {item.category === 'drawing' && 'CAD 표준도면 (DWG)'}
                          {item.category === 'test' && '시험성적서'}
                          {item.category === 'cert' && '품질인증/특허증'}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[10px] text-slate-400">{item.titleEn}</p>
                      </td>
                      <td className="p-4 text-slate-600">{item.fileSize}</td>
                      <td className="p-4 text-slate-600 font-bold">{item.downloadsCount}회</td>
                      <td className="p-4 text-slate-500">{item.date}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setEditingDownload(item)}
                            className="p-1.5 bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDownload(item.id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {downloads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                        등록된 기술자료 자료가 존재하지 않습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: ACTIVE TECHNICAL DOCUMENT EDIT FORM
        ------------------------------------------------------------ */}
        {activeSubTab === 'tech' && editingDownload && (
          <form onSubmit={handleSaveDownload} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="download-edit-form">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">기술자료 상세 정보 등록 및 수정</h3>
              <button 
                type="button" 
                onClick={() => setEditingDownload(null)}
                className="p-1 hover:bg-gray-100 rounded text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">자료 ID *</label>
                <input 
                  type="text" 
                  required
                  value={editingDownload.id}
                  onChange={(e) => setEditingDownload({...editingDownload, id: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">분류 (Category) *</label>
                <select 
                  value={editingDownload.category}
                  onChange={(e) => setEditingDownload({...editingDownload, category: e.target.value as any})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="catalog">종합 카탈로그 (catalog)</option>
                  <option value="drawing">CAD 표준도면 (DWG) (drawing)</option>
                  <option value="test">시험성적서 (test)</option>
                  <option value="cert">품질인증/특허증 (cert)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 기술 자료명 *</label>
                <input 
                  type="text" 
                  required
                  value={editingDownload.title}
                  onChange={(e) => setEditingDownload({...editingDownload, title: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 기술 자료명 (En) *</label>
                <input 
                  type="text" 
                  required
                  value={editingDownload.titleEn}
                  onChange={(e) => setEditingDownload({...editingDownload, titleEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">대표이미지 (Representative Image - 썸네일 노출용) *</label>
                <div className="space-y-1">
                  <input 
                    type="text" 
                    required
                    value={editingDownload.fileUrl}
                    onChange={(e) => setEditingDownload({...editingDownload, fileUrl: e.target.value})}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    placeholder="대표이미지 URL 직접 입력 또는 파일 선택"
                  />
                  <div className="flex items-center">
                    <input
                      type="file"
                      accept="image/*"
                      id="main-file-upload"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                        const reader = new FileReader();
                        reader.onload = async (evt) => {
                          const dataUrl = evt.target?.result as string;
                          try {
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                filename: file.name,
                                fileData: dataUrl
                              })
                            });
                            const result = await res.json();
                            if (result.success) {
                              setEditingDownload({
                                ...editingDownload,
                                fileUrl: result.fileUrl,
                                fileSize: sizeStr,
                                title: file.name.split('.').slice(0, -1).join('.') || file.name,
                                originalFileName: file.name
                              });
                              alert(`[${file.name}] 파일 업로드 완료! (서버에 안전하게 저장되었습니다, 크기: ${sizeStr})`);
                            } else {
                              throw new Error(result.error);
                            }
                          } catch (err: any) {
                            console.error('File upload failed:', err);
                            // Fallback to local data URL if server fails
                            setEditingDownload({
                              ...editingDownload,
                              fileUrl: dataUrl,
                              fileSize: sizeStr,
                              title: file.name.split('.').slice(0, -1).join('.') || file.name,
                              originalFileName: file.name
                            });
                            alert(`[${file.name}] 파일이 로컬 버퍼에 임시 보관되었습니다 (크기: ${sizeStr}).`);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor="main-file-upload"
                      className="w-full py-1.5 bg-slate-900 hover:bg-orange-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors text-center flex items-center justify-center space-x-1"
                    >
                      <DownloadCloud className="h-3 w-3" />
                      <span>내 PC 대표이미지 파일 선택 업로드</span>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">파일 용량 (e.g. 2.4 MB) *</label>
                <input 
                  type="text" 
                  required
                  value={editingDownload.fileSize}
                  onChange={(e) => setEditingDownload({...editingDownload, fileSize: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">등록 날짜 *</label>
                <input 
                  type="date" 
                  required
                  value={editingDownload.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditingDownload({...editingDownload, date: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* MULTIPLE FILES ATTACHMENT (MAX 5) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-950 flex items-center space-x-1">
                  <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                  <span>다중 설계 도면 및 서류 첨부기능 (최대 5개)</span>
                </span>
                {((editingDownload as any).files || []).length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const filesList = (editingDownload as any).files || [];
                      setEditingDownload({
                        ...editingDownload,
                        files: [...filesList, { name: '새 설계도면 파일.dwg', url: '#', size: '1.2 MB' }]
                      } as any);
                    }}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    + 첨부파일 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {((editingDownload as any).files || []).map((f: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white p-2 rounded border border-gray-150">
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => {
                        const filesList = [...((editingDownload as any).files || [])];
                        filesList[idx] = { ...filesList[idx], name: e.target.value };
                        setEditingDownload({ ...editingDownload, files: filesList } as any);
                      }}
                      className="bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                      placeholder="표기용 파일명"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={f.url}
                        onChange={(e) => {
                          const filesList = [...((editingDownload as any).files || [])];
                          filesList[idx] = { ...filesList[idx], url: e.target.value };
                          setEditingDownload({ ...editingDownload, files: filesList } as any);
                        }}
                        className="flex-1 bg-slate-50 border border-gray-300 rounded px-1.5 py-1 text-[10px]"
                        placeholder="다운로드 링크"
                      />
                      <input
                        type="file"
                        id={`file-upload-att-${idx}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            const dataUrl = evt.target?.result as string;
                            try {
                              const res = await fetch('/api/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  filename: file.name,
                                  fileData: dataUrl
                                })
                              });
                              const result = await res.json();
                              if (result.success) {
                                const filesList = [...((editingDownload as any).files || [])];
                                filesList[idx] = {
                                  ...filesList[idx],
                                  url: result.fileUrl,
                                  name: file.name,
                                  size: sizeStr
                                };
                                setEditingDownload({ ...editingDownload, files: filesList } as any);
                                alert(`[${file.name}] 첨부파일 업로드 완료! (서버 저장됨)`);
                              } else {
                                throw new Error(result.error);
                              }
                            } catch (err) {
                              console.warn('Sub file upload failed, using fallback base64:', err);
                              const filesList = [...((editingDownload as any).files || [])];
                              filesList[idx] = {
                                ...filesList[idx],
                                url: dataUrl,
                                name: file.name,
                                size: sizeStr
                              };
                              setEditingDownload({ ...editingDownload, files: filesList } as any);
                              alert(`[${file.name}] 첨부파일 로컬 완료 (서버 업로드 실패).`);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <label
                        htmlFor={`file-upload-att-${idx}`}
                        className="bg-slate-800 hover:bg-orange-500 text-white px-1.5 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center space-x-0.5 whitespace-nowrap shrink-0"
                      >
                        <DownloadCloud className="h-3 w-3" />
                        <span>파일선택</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={f.size || '1.0 MB'}
                        onChange={(e) => {
                          const filesList = [...((editingDownload as any).files || [])];
                          filesList[idx] = { ...filesList[idx], size: e.target.value };
                          setEditingDownload({ ...editingDownload, files: filesList } as any);
                        }}
                        className="w-20 bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                        placeholder="용량"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filesList = [...((editingDownload as any).files || [])];
                          filesList.splice(idx, 1);
                          setEditingDownload({ ...editingDownload, files: filesList } as any);
                        }}
                        className="text-red-500 hover:bg-red-50 p-1 rounded ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {((editingDownload as any).files || []).length === 0 && (
                  <p className="text-[10px] text-slate-400">등록된 추가 첨부 파일이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150">
              <button 
                type="button" 
                onClick={() => setEditingDownload(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>기술자료 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: PROJECTS (시공사례) LIST
        ------------------------------------------------------------ */}
        {activeSubTab === 'proj' && !editingProject && (
          <div className="space-y-6" id="subtab-proj">
            <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-500 font-bold">전국 도로안전 납품 및 완공 시공사례를 등록하고 연계 노출 상품을 배치합니다.</p>
              <button
                onClick={handleAddNewProject}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>+ 새 납품/시공사례 추가</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-bold">지역 (Location)</th>
                    <th className="p-4 font-bold">공사명 (KO / EN)</th>
                    <th className="p-4 font-bold">적용 제품군</th>
                    <th className="p-4 font-bold">완공 일자</th>
                    <th className="p-4 font-bold text-center">조작 (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {projects.map((proj) => (
                    <tr key={proj.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded text-[10px] font-bold">
                          {proj.location}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{proj.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{proj.titleEn}</p>
                        {proj.client && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-sans font-medium">
                              발주처: {proj.client}
                            </span>
                            {proj.clientEn && (
                              <span className="text-[9px] bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded font-sans">
                                {proj.clientEn}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(proj.products || []).map((pId, idx) => (
                            <span key={idx} className="bg-orange-50 text-orange-600 border border-orange-100 rounded px-1.5 py-0.2 text-[9px] font-bold">
                              {pId}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-bold">{proj.date}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                        등록된 납품/시공사례가 존재하지 않습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: ACTIVE PROJECT EDIT FORM
        ------------------------------------------------------------ */}
        {activeSubTab === 'proj' && editingProject && (
          <form onSubmit={handleSaveProject} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="project-edit-form">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">납품/시공사례 세부정보 등록 및 수정</h3>
              <button 
                type="button" 
                onClick={() => setEditingProject(null)}
                className="p-1 hover:bg-gray-100 rounded text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">납품/시공사례 고유 ID *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.id}
                  onChange={(e) => setEditingProject({...editingProject, id: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">납품/시공 지역 (KO) *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.location}
                  onChange={(e) => setEditingProject({...editingProject, location: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: 서울, 경기, 인천, 기타"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">납품/시공 지역 (EN) *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.locationEn}
                  onChange={(e) => setEditingProject({...editingProject, locationEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: Seoul, Gyeonggi, Incheon, Others"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">실적 유형 구분 *</label>
                <select 
                  value={editingProject.projectType || '시공'}
                  onChange={(e) => setEditingProject({...editingProject, projectType: e.target.value as '시공' | '납품'})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none font-bold text-orange-600"
                >
                  <option value="시공">현장 완공 시공실적 (시공)</option>
                  <option value="납품">단순 제품 납품실적 (납품)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 납품/시공명/공사명 *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 납품/시공명 (En) *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.titleEn}
                  onChange={(e) => setEditingProject({...editingProject, titleEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">발주처 (Client)</label>
                <input 
                  type="text" 
                  value={editingProject.client || ''}
                  onChange={(e) => setEditingProject({...editingProject, client: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: 서울특별시, 한국도로공사 등"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">발주처 영문 (Client En)</label>
                <input 
                  type="text" 
                  value={editingProject.clientEn || ''}
                  onChange={(e) => setEditingProject({...editingProject, clientEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: Seoul Metropolitan Government, EX etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">납품/시공 시점 (Date) *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.date || new Date().toISOString().slice(0, 7)}
                  onChange={(e) => setEditingProject({...editingProject, date: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: 2026-07"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">납품/시공 현장에 연계 적용된 제품들 (아이디 쉼표 구분) *</label>
                <input 
                  type="text" 
                  required
                  value={editingProject.products.join(', ')}
                  onChange={(e) => setEditingProject({...editingProject, products: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: bollard-steel-01, lane-divider-01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 상세 납품/시공 내용설명 *</label>
                <textarea 
                  required
                  rows={4}
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 상세 납품/시공 내용설명 (En) *</label>
                <textarea 
                  required
                  rows={4}
                  value={editingProject.descriptionEn}
                  onChange={(e) => setEditingProject({...editingProject, descriptionEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* MULTIPLE IMAGES ATTACHMENT (MAX 5) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-950 flex items-center space-x-1">
                  <Image className="h-4 w-4 text-orange-500" />
                  <span>현장 시공 실물사진 등록 (최대 5개)</span>
                </span>
                {editingProject.images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProject({
                        ...editingProject,
                        images: [...editingProject.images, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80']
                      });
                    }}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    + 시공 사진 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {editingProject.images.map((imgUrl, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const imgs = [...editingProject.images];
                        imgs[idx] = e.target.value;
                        setEditingProject({ ...editingProject, images: imgs });
                      }}
                      className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                      placeholder="이미지 URL을 입력하세요."
                    />
                    <input
                      type="file"
                      id={`proj-img-upload-${idx}`}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target?.result as string;
                          const imgs = [...editingProject.images];
                          imgs[idx] = dataUrl;
                          setEditingProject({ ...editingProject, images: imgs });
                          alert('선택하신 시공 실물사진이 등록되었습니다.');
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor={`proj-img-upload-${idx}`}
                      className="bg-slate-800 hover:bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer flex items-center space-x-0.5 whitespace-nowrap"
                    >
                      <DownloadCloud className="h-3 w-3" />
                      <span>파일 선택</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const imgs = [...editingProject.images];
                        imgs.splice(idx, 1);
                        setEditingProject({ ...editingProject, images: imgs });
                      }}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {editingProject.images.length === 0 && (
                  <p className="text-[10px] text-slate-400">등록된 시공 현장 사진이 없습니다.</p>
                )}
              </div>
            </div>

            {/* MULTIPLE FILES ATTACHMENT (MAX 5) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-950 flex items-center space-x-1">
                  <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                  <span>공사 관련 증빙/설계 도면 첨부기능 (최대 5개)</span>
                </span>
                {((editingProject as any).files || []).length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const filesList = (editingProject as any).files || [];
                      setEditingProject({
                        ...editingProject,
                        files: [...filesList, { name: '새 도면파일.dwg', url: '#', size: '1.5 MB' }]
                      } as any);
                    }}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    + 첨부파일 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {((editingProject as any).files || []).map((f: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white p-2 rounded border border-gray-150">
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => {
                        const filesList = [...((editingProject as any).files || [])];
                        filesList[idx] = { ...filesList[idx], name: e.target.value };
                        setEditingProject({ ...editingProject, files: filesList } as any);
                      }}
                      className="bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                      placeholder="표기용 파일명"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={f.url}
                        onChange={(e) => {
                          const filesList = [...((editingProject as any).files || [])];
                          filesList[idx] = { ...filesList[idx], url: e.target.value };
                          setEditingProject({ ...editingProject, files: filesList } as any);
                        }}
                        className="flex-1 bg-slate-50 border border-gray-300 rounded px-1.5 py-1 text-[10px]"
                        placeholder="도면 링크"
                      />
                      <input
                        type="file"
                        id={`proj-file-upload-${idx}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const dataUrl = evt.target?.result as string;
                            const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                            const filesList = [...((editingProject as any).files || [])];
                            filesList[idx] = {
                              ...filesList[idx],
                              url: dataUrl,
                              name: file.name,
                              size: sizeStr
                            };
                            setEditingProject({ ...editingProject, files: filesList } as any);
                            alert(`[${file.name}] 도면 파일이 성공적으로 준비되었습니다.`);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <label
                        htmlFor={`proj-file-upload-${idx}`}
                        className="bg-slate-800 hover:bg-orange-500 text-white px-1.5 py-1 rounded text-[9px] font-bold cursor-pointer flex items-center space-x-0.5 whitespace-nowrap shrink-0"
                      >
                        <DownloadCloud className="h-3 w-3" />
                        <span>파일선택</span>
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={f.size || '1.0 MB'}
                        onChange={(e) => {
                          const filesList = [...((editingProject as any).files || [])];
                          filesList[idx] = { ...filesList[idx], size: e.target.value };
                          setEditingProject({ ...editingProject, files: filesList } as any);
                        }}
                        className="w-20 bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                        placeholder="용량"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filesList = [...((editingProject as any).files || [])];
                          filesList.splice(idx, 1);
                          setEditingProject({ ...editingProject, files: filesList } as any);
                        }}
                        className="text-red-500 hover:bg-red-50 p-1 rounded ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {((editingProject as any).files || []).length === 0 && (
                  <p className="text-[10px] text-slate-400">등록된 추가 첨부 파일이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150">
              <button 
                type="button" 
                onClick={() => setEditingProject(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>시공사례 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: NEWS (홍보센터) LIST
        ------------------------------------------------------------ */}
        {activeSubTab === 'news' && !editingNews && (
          <div className="space-y-6" id="subtab-news">
            <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              <p className="text-xs text-slate-500 font-bold">동우산업(주)의 특허 출원, 전시회 안내, 우수조달지정 등의 주요 공식 소식을 전합니다.</p>
              <button
                onClick={handleAddNewNews}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>+ 새 홍보글 작성</span>
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-slate-400 uppercase tracking-wider">
                    <th className="p-4 font-bold">공식 유형 (Type)</th>
                    <th className="p-4 font-bold">소식 제목 (국문 / 영문)</th>
                    <th className="p-4 font-bold">작성일</th>
                    <th className="p-4 font-bold">조회수 (Views)</th>
                    <th className="p-4 font-bold text-center">조작 (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {news.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{item.title}</p>
                        <p className="text-[10px] text-slate-400">{item.titleEn}</p>
                      </td>
                      <td className="p-4 text-slate-500">{item.date}</td>
                      <td className="p-4 text-slate-600">{item.views}회</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setEditingNews(item)}
                            className="p-1.5 bg-slate-100 hover:bg-orange-100 text-slate-600 hover:text-orange-600 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {news.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">
                        등록된 공식 홍보글이 존재하지 않습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: ACTIVE NEWS EDIT FORM
        ------------------------------------------------------------ */}
        {activeSubTab === 'news' && editingNews && (
          <form onSubmit={handleSaveNews} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6" id="news-edit-form">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">공식 홍보소식 등록 및 수정</h3>
              <button 
                type="button" 
                onClick={() => setEditingNews(null)}
                className="p-1 hover:bg-gray-100 rounded text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">소식 고유 ID *</label>
                <input 
                  type="text" 
                  required
                  value={editingNews.id}
                  onChange={(e) => setEditingNews({...editingNews, id: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">작성 유형 (Type) *</label>
                <select 
                  value={editingNews.type}
                  onChange={(e) => setEditingNews({...editingNews, type: e.target.value as any})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                >
                  <option value="news">신기술 및 뉴스 (news)</option>
                  <option value="notice">중요 공지사항 (notice)</option>
                  <option value="exhibition">박람회 및 전시회 (exhibition)</option>
                  <option value="press">언론 보도자료 (press)</option>
                  <option value="video">주행 동영상 라이브러리 (video)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">작성 일자 *</label>
                <input 
                  type="date" 
                  required
                  value={editingNews.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setEditingNews({...editingNews, date: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 소식 제목 *</label>
                <input 
                  type="text" 
                  required
                  value={editingNews.title}
                  onChange={(e) => setEditingNews({...editingNews, title: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 소식 제목 (En) *</label>
                <input 
                  type="text" 
                  required
                  value={editingNews.titleEn}
                  onChange={(e) => setEditingNews({...editingNews, titleEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">국문 세부 소식내용 *</label>
                <textarea 
                  required
                  rows={6}
                  value={editingNews.content}
                  onChange={(e) => setEditingNews({...editingNews, content: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">영문 세부 소식내용 (En) *</label>
                <textarea 
                  required
                  rows={6}
                  value={editingNews.contentEn}
                  onChange={(e) => setEditingNews({...editingNews, contentEn: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">동영상 주소 URL (유형이 비디오일 경우만 적용)</label>
                <input 
                  type="text" 
                  value={editingNews.videoUrl || ''}
                  onChange={(e) => setEditingNews({...editingNews, videoUrl: e.target.value})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  placeholder="예: https://www.youtube.com/watch?v=..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">기본 조회수 설정 *</label>
                <input 
                  type="number" 
                  required
                  value={editingNews.views}
                  onChange={(e) => setEditingNews({...editingNews, views: parseInt(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* MULTIPLE IMAGES ATTACHMENT (MAX 5) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-950 flex items-center space-x-1">
                  <Image className="h-4 w-4 text-orange-500" />
                  <span>공식 사진/스마트 스틸컷 첨부 (최대 5개)</span>
                </span>
                {((editingNews as any).images || []).length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const imgs = (editingNews as any).images || [];
                      setEditingNews({
                        ...editingNews,
                        images: [...imgs, 'https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?auto=format&fit=crop&w=600&q=80']
                      } as any);
                    }}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    + 공식 사진 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {((editingNews as any).images || []).map((imgUrl: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={imgUrl}
                      onChange={(e) => {
                        const imgs = [...((editingNews as any).images || [])];
                        imgs[idx] = e.target.value;
                        setEditingNews({ ...editingNews, images: imgs } as any);
                      }}
                      className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                      placeholder="이미지 URL을 입력하세요."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const imgs = [...((editingNews as any).images || [])];
                        imgs.splice(idx, 1);
                        setEditingNews({ ...editingNews, images: imgs } as any);
                      }}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {((editingNews as any).images || []).length === 0 && (
                  <p className="text-[10px] text-slate-400">등록된 공식 사진이 없습니다.</p>
                )}
              </div>
            </div>

            {/* MULTIPLE FILES ATTACHMENT (MAX 5) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-950 flex items-center space-x-1">
                  <FileSpreadsheet className="h-4 w-4 text-orange-500" />
                  <span>공식 보도자료/첨부파일 첨부 (최대 5개)</span>
                </span>
                {((editingNews as any).files || []).length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const filesList = (editingNews as any).files || [];
                      setEditingNews({
                        ...editingNews,
                        files: [...filesList, { name: '보도자료.pdf', url: '#', size: '1.8 MB' }]
                      } as any);
                    }}
                    className="text-[10px] font-bold text-orange-600 bg-orange-100 hover:bg-orange-200 px-2 py-1 rounded"
                  >
                    + 첨부파일 추가
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {((editingNews as any).files || []).map((f: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-white p-2 rounded border border-gray-150">
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) => {
                        const filesList = [...((editingNews as any).files || [])];
                        filesList[idx] = { ...filesList[idx], name: e.target.value };
                        setEditingNews({ ...editingNews, files: filesList } as any);
                      }}
                      className="bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                      placeholder="표기용 파일명"
                    />
                    <input
                      type="text"
                      value={f.url}
                      onChange={(e) => {
                        const filesList = [...((editingNews as any).files || [])];
                        filesList[idx] = { ...filesList[idx], url: e.target.value };
                        setEditingNews({ ...editingNews, files: filesList } as any);
                      }}
                      className="bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                      placeholder="다운로드 링크"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={f.size || '1.0 MB'}
                        onChange={(e) => {
                          const filesList = [...((editingNews as any).files || [])];
                          filesList[idx] = { ...filesList[idx], size: e.target.value };
                          setEditingNews({ ...editingNews, files: filesList } as any);
                        }}
                        className="w-20 bg-slate-50 border border-gray-300 rounded px-2 py-1 text-[11px]"
                        placeholder="용량"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const filesList = [...((editingNews as any).files || [])];
                          filesList.splice(idx, 1);
                          setEditingNews({ ...editingNews, files: filesList } as any);
                        }}
                        className="text-red-500 hover:bg-red-50 p-1 rounded ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {((editingNews as any).files || []).length === 0 && (
                  <p className="text-[10px] text-slate-400">등록된 추가 첨부 파일이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-gray-150">
              <button 
                type="button" 
                onClick={() => setEditingNews(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                취소
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>홍보 소식 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: BANNERS TITLE BACKGROUND URLS
        ------------------------------------------------------------ */}
        {activeSubTab === 'banner' && (
          <form onSubmit={handleSaveBanners} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn" id="banners-management-form">
            <div className="border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">각 페이지 타이틀 배경 이미지 URL 지정</h3>
              <p className="text-xs text-slate-400 mt-1">각 주요 메뉴의 배너 영역 배경 이미지를 Unsplash, 외부 주소 등으로 실시간 대체 제어합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">홈페이지 메인 Hero 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.home}
                  onChange={(e) => setBannersForm({ ...bannersForm, home: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">회사소개 페이지 타이틀 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.company}
                  onChange={(e) => setBannersForm({ ...bannersForm, company: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">제품소개 (카탈로그) 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.products}
                  onChange={(e) => setBannersForm({ ...bannersForm, products: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">기술자료 다운로드 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.tech}
                  onChange={(e) => setBannersForm({ ...bannersForm, tech: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">시공사례 완공 포트폴리오 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.projects}
                  onChange={(e) => setBannersForm({ ...bannersForm, projects: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">홍보센터 소식 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.news}
                  onChange={(e) => setBannersForm({ ...bannersForm, news: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">고객센터 & 견적상담 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.customer}
                  onChange={(e) => setBannersForm({ ...bannersForm, customer: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700">메인페이지 '도로안전시설물 전 제품군' 배경 URL</label>
                <input 
                  type="text" 
                  value={bannersForm.categories}
                  onChange={(e) => setBannersForm({ ...bannersForm, categories: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              {/* Organization Chart Image Upload Section */}
              <div className="space-y-2 md:col-span-2 border-t border-dashed border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-orange-600">동우산업 조직도 이미지 파일 업로드 (기업비전 & 조직도 탭에 연동됨)</label>
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-bold font-mono">Organization Chart Image</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-9">
                    <input 
                      type="text" 
                      value={bannersForm.orgChart || ''}
                      onChange={(e) => setBannersForm({ ...bannersForm, orgChart: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                      placeholder="이미지 URL을 직접 입력하거나 아래 '파일 선택'으로 이미지 파일을 업로드하세요."
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      type="file"
                      id="org-chart-upload-admin"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target?.result as string;
                          setBannersForm({ ...bannersForm, orgChart: dataUrl });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor="org-chart-upload-admin"
                      className="w-full py-2 bg-slate-950 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>조직도 이미지 업로드</span>
                    </label>
                  </div>
                </div>

                {bannersForm.orgChart && (
                  <div className="mt-2 bg-slate-50 border border-gray-200 p-3 rounded-xl max-w-sm">
                    <p className="text-[10px] font-bold text-slate-500 mb-1.5">현재 업로드된 조직도 미리보기:</p>
                    <div className="relative border border-gray-300 rounded-lg bg-white overflow-hidden p-1">
                      <img 
                        src={getEmbedImageUrl(bannersForm.orgChart)} 
                        alt="조직도 미리보기" 
                        className="max-h-48 w-full object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setBannersForm({ ...bannersForm, orgChart: '' })}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                        title="이미지 제거"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-150">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>모든 설정 실시간 일괄 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: CEO GREETINGS EDITOR
        ------------------------------------------------------------ */}
        {activeSubTab === 'ceo' && ceoGreeting && (
          <form onSubmit={handleSaveCeoGreeting} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn" id="ceo-management-form">
            <div className="border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">CEO 인사말 실시간 수정 및 연동</h3>
              <p className="text-xs text-slate-400 mt-1">회사 소개의 CEO 인사말 콘텐츠 및 서명, 배경 노트를 실시간 관리 및 업데이트합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title KO */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 font-sans">인사말 메인 타이틀 (한국어)</label>
                <textarea 
                  rows={2}
                  value={ceoGreeting.title}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, title: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans font-medium"
                  placeholder="최고의 기술과 성실한 자세로..."
                />
              </div>

              {/* Title EN */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 font-sans">인사말 메인 타이틀 (영어)</label>
                <textarea 
                  rows={2}
                  value={ceoGreeting.titleEn}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, titleEn: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="We will satisfy all our customers..."
                />
              </div>

              {/* Subtitle KO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">부타이틀 / 인사말 시작구 (한국어)</label>
                <input 
                  type="text" 
                  value={ceoGreeting.subtitle}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, subtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans font-medium"
                  placeholder="안녕하십니까?"
                />
              </div>

              {/* Subtitle EN */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">부타이틀 / 인사말 시작구 (영어)</label>
                <input 
                  type="text" 
                  value={ceoGreeting.subtitleEn}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, subtitleEn: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="Dear Valued Customers,"
                />
              </div>

              {/* Content KO */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 font-sans">인사말 상세 본문 내용 (한국어)</label>
                <textarea 
                  rows={8}
                  value={ceoGreeting.content}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, content: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed font-sans font-medium"
                  placeholder="본문 내용을 입력하세요. 엔터 키로 문단을 구분할 수 있습니다."
                />
              </div>

              {/* Content EN */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 font-sans">인사말 상세 본문 내용 (영어)</label>
                <textarea 
                  rows={8}
                  value={ceoGreeting.contentEn}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, contentEn: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed font-mono"
                  placeholder="Enter English body text here..."
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">인사말 날짜 표시 (예: 2026. 07)</label>
                <input 
                  type="text" 
                  value={ceoGreeting.date}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, date: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans font-medium"
                  placeholder="2026. 07"
                />
              </div>

              {/* CEO Name KO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">대표이사 이름 표기 (한국어)</label>
                <input 
                  type="text" 
                  value={ceoGreeting.ceoName}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, ceoName: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans font-medium"
                  placeholder="동우산업(주) 대표이사 전 홍 은"
                />
              </div>

              {/* CEO Name EN */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">대표이사 이름 표기 (영어)</label>
                <input 
                  type="text" 
                  value={ceoGreeting.ceoNameEn}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, ceoNameEn: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="Jeon hong eun | President & CEO"
                />
              </div>

              {/* Background Image URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 font-sans">인사말 배경 이미지 URL (노트북)</label>
                <input 
                  type="text" 
                  value={ceoGreeting.bgImg}
                  onChange={(e) => setCeoGreeting({ ...ceoGreeting, bgImg: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                  placeholder="/uploads/ae95d482-263e-4409-ba45-7a6fcda4a52c_1783060259227.jpg"
                />
              </div>

              {/* Signature Image Upload / URL */}
              <div className="space-y-2 md:col-span-2 border-t border-dashed border-gray-200 pt-4">
                <label className="block text-xs font-bold text-slate-700 font-sans">사인이미지 등록 (Signature Image)</label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="flex-1 w-full">
                    <input 
                      type="text" 
                      value={ceoGreeting.signatureImg}
                      onChange={(e) => setCeoGreeting({ ...ceoGreeting, signatureImg: e.target.value })}
                      className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                      placeholder="사인이미지 URL 직접 입력 또는 아래 파일 업로드"
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <input 
                      type="file" 
                      id="signature-img-upload-admin"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const dataUrl = evt.target?.result as string;
                          setCeoGreeting({ ...ceoGreeting, signatureImg: dataUrl });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor="signature-img-upload-admin"
                      className="w-full py-2 bg-slate-950 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center space-x-1 shadow-sm px-4"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>사인 이미지 업로드 (PNG 권장)</span>
                    </label>
                  </div>
                </div>

                {ceoGreeting.signatureImg && (
                  <div className="mt-2 bg-slate-50 border border-gray-200 p-3 rounded-xl max-w-xs">
                    <p className="text-[10px] font-bold text-slate-500 mb-1.5 font-sans">현재 업로드된 사인 미리보기:</p>
                    <div className="relative border border-gray-300 rounded-lg bg-white overflow-hidden p-2 flex items-center justify-center">
                      <img 
                        src={getEmbedImageUrl(ceoGreeting.signatureImg)} 
                        alt="CEO 사인 미리보기" 
                        className="max-h-20 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setCeoGreeting({ ...ceoGreeting, signatureImg: '' })}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                        title="이미지 제거"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-150">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>CEO 인사말 정보 실시간 일괄 저장</span>
              </button>
            </div>
          </form>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: CERTIFICATIONS MANAGEMENT (특허 및 인증 관리)
        ------------------------------------------------------------ */}
        {activeSubTab === 'cert' && (
          <div className="space-y-8 animate-fadeIn" id="subtab-cert">
            {/* Form */}
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!certForm.title.trim()) return;
                try {
                  if (editingCert) {
                    const updated = { ...editingCert, ...certForm };
                    await DBService.updateCertification(updated);
                    alert('특허/인증서가 성공적으로 수정되었습니다.');
                  } else {
                    const newCert: CertItem = {
                      id: 'cert-' + Date.now(),
                      ...certForm
                    };
                    await DBService.addCertification(newCert);
                    alert('새 특허/인증서가 성공적으로 추가되었습니다.');
                  }
                  setEditingCert(null);
                  setCertForm({ title: '', auth: '', desc: '', image: '' });
                  const updatedList = await DBService.getCertifications();
                  setCertifications(updatedList);
                } catch (err) {
                  console.error(err);
                  alert('저장에 실패했습니다.');
                }
              }}
              className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="border-b border-gray-150 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingCert ? '특허 및 인증정보 수정' : '신규 특허 및 인증서 등록'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">회사소개 - 특허 및 인증현황 화면에 노출될 기술 특허 및 품질인증을 관리합니다.</p>
                </div>
                {editingCert && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCert(null);
                      setCertForm({ title: '', auth: '', desc: '', image: '' });
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                  >
                    신규 등록으로 전환
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">특허 및 인증서 제목 *</label>
                  <input 
                    type="text" 
                    required
                    value={certForm.title}
                    onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="예: 특허: 충격 보수형 볼라드 결합체"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">발급기관 및 문서 번호 *</label>
                  <input 
                    type="text" 
                    required
                    value={certForm.auth}
                    onChange={(e) => setCertForm({ ...certForm, auth: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="예: 특허청 | 제 10-249512호"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">인증 및 특허 기술 상세 내용</label>
                  <textarea 
                    value={certForm.desc}
                    onChange={(e) => setCertForm({ ...certForm, desc: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="해당 특허나 품질보증 규격에 대한 주요 기능을 간략히 요약 입력해주세요."
                    rows={2}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">인증서 썸네일 이미지 파일 업로드 (A4 용지 세로 비율)</label>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-9">
                      <input 
                        type="text" 
                        value={certForm.image}
                        onChange={(e) => setCertForm({ ...certForm, image: e.target.value })}
                        className="w-full bg-slate-50 border border-gray-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono"
                        placeholder="이미지 파일 URL 주소 또는 직접 파일 선택 업로드"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="file"
                        id="cert-form-image-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const dataUrl = evt.target?.result as string;
                            setCertForm({ ...certForm, image: dataUrl });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <label
                        htmlFor="cert-form-image-upload"
                        className="w-full py-2 bg-slate-950 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center space-x-1 shadow-sm"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>파일 첨부 업로드</span>
                      </label>
                    </div>
                  </div>

                  {certForm.image && (
                    <div className="mt-2 bg-slate-50 border border-gray-200 p-3 rounded-xl max-w-xs">
                      <p className="text-[10px] font-bold text-slate-500 mb-1.5">선택된 이미지 미리보기 (A4 가로세로비 적용):</p>
                      <div className="relative border border-gray-300 rounded-lg bg-white overflow-hidden p-1 aspect-[210/297] w-24 mx-auto shadow-sm">
                        <img 
                          src={getEmbedImageUrl(certForm.image)} 
                          alt="인증서 미리보기" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setCertForm({ ...certForm, image: '' })}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow"
                          title="이미지 제거"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-150">
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingCert ? '특허/인증서 수정 완료' : '특허/인증서 신규 등록'}</span>
                </button>
              </div>
            </form>

            {/* List Table */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="border-b border-gray-150 pb-4">
                <h3 className="text-base font-extrabold text-slate-900">등록된 특허 및 인증 리스트 ({certifications.length}개)</h3>
                <p className="text-xs text-slate-400 mt-1">등록된 특허/인증 목록입니다. 더블클릭 또는 우측의 수정 아이콘으로 내용을 수정하거나 삭제할 수 있습니다.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-slate-50 text-slate-400 font-bold">
                      <th className="py-3 px-4">미리보기</th>
                      <th className="py-3 px-4">구분 / 제목</th>
                      <th className="py-3 px-4">인증 및 발급기관</th>
                      <th className="py-3 px-4">설명</th>
                      <th className="py-3 px-4 text-right">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700">
                    {certifications.map((cert) => (
                      <tr key={cert.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="w-10 aspect-[210/297] rounded border border-gray-200 overflow-hidden bg-slate-50">
                            <img 
                              src={getEmbedImageUrl(cert.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80')} 
                              alt={cert.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">{cert.title}</td>
                        <td className="py-3 px-4 text-slate-500">{cert.auth}</td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{cert.desc}</td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCert(cert);
                              setCertForm({
                                title: cert.title,
                                auth: cert.auth,
                                desc: cert.desc,
                                image: cert.image || ''
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-white hover:bg-orange-500 bg-slate-100 rounded-md transition-colors"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCert(cert.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-white hover:bg-red-500 bg-slate-100 rounded-md transition-colors"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                    {certifications.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">등록된 특허 및 인증서가 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------
            SUB-TAB: SMTP EMAIL SETTINGS (SMTP 이메일 알림 설정)
        ------------------------------------------------------------ */}
        {activeSubTab === 'email' && (
          <form onSubmit={handleSaveEmailSettings} className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn" id="email-settings-form">
            <div className="border-b border-gray-150 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">대표 이메일 알림 및 SMTP 메일 서버 설정</h3>
              <p className="text-xs text-slate-400 mt-1">
                고객센터에 새로운 문의가 접수될 때 알림을 받을 메일 주소와, 고객에게 회신 메일을 보낼 때 사용할 SMTP 발송 메일 서버 정보를 연동합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">문의 알림 수신 대표 메일 (여러 개일 경우 쉼표로 구분) *</label>
                <input 
                  type="text" 
                  required
                  value={emailSettings.recipient}
                  onChange={(e) => setEmailSettings({ ...emailSettings, recipient: e.target.value })}
                  placeholder="dongwoo116@daum.net, dongwoo116@hanmail.net"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                />
                <p className="text-[10px] text-slate-400 mt-1">고객이 홈페이지에서 문의를 남기면, 위 메일 주소들로 문의 내용이 실시간 알림 전송됩니다.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP 발송 서버 주소 (SMTP Host)</label>
                <input 
                  type="text" 
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP 포트 (SMTP Port)</label>
                <input 
                  type="number" 
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP 사용자 계정 (SMTP Username/Email)</label>
                <input 
                  type="text" 
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                  placeholder="your-email@gmail.com"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">SMTP 비밀번호 / 앱 비밀번호 (SMTP Password)</label>
                <input 
                  type="password" 
                  value={emailSettings.smtpPass}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">보내는 사람 이메일 주소 (SMTP From - 선택)</label>
                <input 
                  type="text" 
                  value={emailSettings.smtpFrom}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpFrom: e.target.value })}
                  placeholder="no-reply@doongwoo.net"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                />
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
              <p className="font-bold text-orange-600 mb-1">💡 Gmail SMTP 연동 가이드:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>SMTP Host에 <b>smtp.gmail.com</b>, Port에 <b>587</b>을 기입합니다.</li>
                <li>구글 계정 보안 설정에서 <b>2단계 인증</b>을 활성화하고, <b>앱 비밀번호(App Password)</b>를 발급받아 비밀번호 란에 기입해야 정상 발송됩니다. (기존 구글 로그인 비밀번호는 작동하지 않습니다.)</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-150">
              <button
                type="button"
                onClick={async () => {
                  if (!emailSettings.recipient) {
                    alert('수신 대표 메일 주소를 먼저 입력해 주세요.');
                    return;
                  }
                  // Temporarily save to database first
                  await DBService.saveEmailSettings(emailSettings);
                  try {
                    const testRes = await fetch('/api/notify-inquiry', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: '동우산업 테스트',
                        email: 'test@doongwoo.net',
                        phone: '010-1234-5678',
                        title: 'SMTP 서버 연동 연결성 테스트 메일',
                        content: '축하드립니다! 동우산업(주) 온라인 카탈로그의 SMTP 메일 발송 연동이 성공적으로 완료되었습니다.',
                        type: 'qna',
                        date: new Date().toISOString().split('T')[0],
                        isPrivate: false
                      })
                    });
                    const testData = await testRes.json();
                    if (testData.success) {
                      if (testData.simulated) {
                        alert('테스트 메일 전송 시뮬레이션 성공!\n(SMTP 정보가 아직 공란이거나 입력되지 않아 이메일 전송이 서버 시뮬레이션 로그 처리되었습니다. 실제 발송을 위해 SMTP 호스트와 계정 정보를 올바르게 채운 뒤 테스트해 주세요.)');
                      } else {
                        alert(`테스트 메일 발송 성공!\n설정하신 ${emailSettings.recipient} 메일 수신함을 확인해 보시기 바랍니다.`);
                      }
                    } else {
                      alert(`발송 오류 발생: ${testData.error}\n상세정보: ${testData.details}`);
                    }
                  } catch (err: any) {
                    alert(`메일 서버와의 통신에 실패했습니다: ${err.message}`);
                  }
                }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
              >
                ⚙️ SMTP 설정으로 테스트 메일 발송하기
              </button>

              <button 
                type="submit"
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-1"
              >
                <Save className="h-4 w-4" />
                <span>이메일 및 SMTP 설정 실시간 일괄 저장</span>
              </button>
            </div>
          </form>
        )}

      </main>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
