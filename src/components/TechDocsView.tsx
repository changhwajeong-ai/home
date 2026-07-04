import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Search, 
  File, 
  CheckCircle, 
  Briefcase, 
  Calendar,
  Layers,
  Award,
  Eye,
  X
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { DownloadItem } from '../types';

interface TechDocsViewProps {
  lang: 'ko' | 'en';
}

export default function TechDocsView({ lang }: TechDocsViewProps) {
  const fallbackImages = {
    catalog: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    drawing: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    test: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=600&q=80',
    cert: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80'
  };

  const categoryLabels = {
    catalog: lang === 'ko' ? '종합 카탈로그' : 'Brochures',
    drawing: lang === 'ko' ? 'CAD 표준도면 (DWG)' : 'CAD Drawings',
    test: lang === 'ko' ? '시험성적서' : 'Test Reports',
    cert: lang === 'ko' ? '인증서 및 특허자료' : 'Certificates & Patents'
  };

  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [filteredDownloads, setFilteredDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'catalog' | 'drawing' | 'test'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const [bannerBg, setBannerBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DownloadItem | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    DBService.getDownloads().then(setDownloads);
    DBService.getBanners().then(b => {
      if (b && b.tech) {
        setBannerBg(b.tech);
      }
    });
  }, []);

  useEffect(() => {
    let result = [...downloads];

    // Filter by type
    if (activeTab !== 'all') {
      result = result.filter(d => d.category === activeTab);
    }

    // Filter by search bar query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title.toLowerCase().includes(q) || 
        d.titleEn.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        (d.descriptionEn && d.descriptionEn.toLowerCase().includes(q))
      );
    }

    setFilteredDownloads(result);
  }, [downloads, activeTab, searchQuery, lang]);

  const handleDownload = async (item: DownloadItem) => {
    if (!item.fileUrl || item.fileUrl === '#' || item.fileUrl.trim() === '') {
      const errorMsg = lang === 'ko' ? '첨부 자료가 없습니다' : 'No attachment found.';
      showToast(errorMsg, 'error');
      try { alert(errorMsg); } catch (e) {}
      return;
    }

    // Safe extraction of the original filename
    let originalName = item.originalFileName || '';
    if (!originalName) {
      try {
        const decoded = decodeURIComponent(item.fileUrl);
        const pathOnly = decoded.split('?')[0];
        const parts = pathOnly.split('/');
        originalName = parts[parts.length - 1];
      } catch (e) {
        console.warn('Could not parse original filename from URL:', e);
      }
    }

    // Safe fallback if the filename is empty or not clear
    if (!originalName || !originalName.includes('.')) {
      let ext = 'pdf';
      const urlPath = item.fileUrl.split('?')[0];
      if (urlPath.includes('.')) {
        const parts = urlPath.split('.');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length <= 4) {
          ext = lastPart;
        }
      }
      const title = lang === 'ko' ? item.title : item.titleEn;
      const cleanTitle = title.replace(/[\/\\?%*:|"<>\s]/g, '_');
      originalName = `${cleanTitle}.${ext}`;
    }

    try {
      let downloadedViaBlob = false;

      // Force-bust browser cache by appending timestamp query parameter (unless it's a base64 data URL)
      const fetchUrl = item.fileUrl.startsWith('data:') 
        ? item.fileUrl 
        : `${item.fileUrl}${item.fileUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;

      // Try fetching as a Blob so that the browser's download attribute is 100% respected
      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = originalName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          downloadedViaBlob = true;
        }
      } catch (corsOrNetworkErr) {
        console.warn('CORS or network policy blocked Blob fetch, falling back to standard window navigation:', corsOrNetworkErr);
      }

      // Standard fallback download handler (if CORS doesn't permit Blob fetch)
      if (!downloadedViaBlob) {
        const link = document.createElement('a');
        link.href = fetchUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Record download count in database
      await DBService.recordDownload(item.id);

      // Alert both alert() (fallback) and custom toast (guaranteed visibility)
      const successMsg = lang === 'ko' ? '다운로드가 완료 되었습니다' : 'Download completed successfully.';
      showToast(successMsg, 'success');
      try {
        alert(successMsg);
      } catch (e) {
        console.warn('Standard alert blocked by browser:', e);
      }

      // Refresh local state with updated downloads list
      const updatedList = await DBService.getDownloads();
      setDownloads(updatedList);
    } catch (error) {
      console.error('Download execution error:', error);
      const failMsg = lang === 'ko' ? '다운로드가 제대로 되지 않았습니다. 다시 확인해주세요' : 'Download did not complete properly. Please check again.';
      showToast(failMsg, 'error');
      try {
        alert(failMsg);
      } catch (e) {}
    }
  };

  const handleIndividualDownload = async (file: { name: string; url: string; size?: string }, itemId: string) => {
    if (!file.url || file.url === '#' || file.url.trim() === '') {
      const errorMsg = lang === 'ko' ? '첨부 자료가 없습니다' : 'No attachment found.';
      showToast(errorMsg, 'error');
      try { alert(errorMsg); } catch (e) {}
      return;
    }

    let originalName = file.name || '';
    if (!originalName || !originalName.includes('.')) {
      let ext = 'pdf';
      const urlPath = file.url.split('?')[0];
      if (urlPath.includes('.')) {
        const parts = urlPath.split('.');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length <= 4) {
          ext = lastPart;
        }
      }
      originalName = `${originalName || 'document'}.${ext}`;
    }

    try {
      let downloadedViaBlob = false;

      const fetchUrl = file.url.startsWith('data:') 
        ? file.url 
        : `${file.url}${file.url.includes('?') ? '&' : '?'}t=${Date.now()}`;

      try {
        const response = await fetch(fetchUrl);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = originalName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          downloadedViaBlob = true;
        }
      } catch (corsOrNetworkErr) {
        console.warn('CORS or network policy blocked Blob fetch, falling back to standard window navigation:', corsOrNetworkErr);
      }

      if (!downloadedViaBlob) {
        const link = document.createElement('a');
        link.href = fetchUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      await DBService.recordDownload(itemId);

      const successMsg = lang === 'ko' ? '다운로드가 완료 되었습니다' : 'Download completed successfully.';
      showToast(successMsg, 'success');
      try {
        alert(successMsg);
      } catch (e) {
        console.warn('Standard alert blocked by browser:', e);
      }

      const updatedList = await DBService.getDownloads();
      setDownloads(updatedList);
      
      const updatedItem = updatedList.find(d => d.id === itemId);
      if (updatedItem) {
        setSelectedItem(updatedItem);
      }
    } catch (error) {
      console.error('Download execution error:', error);
      const failMsg = lang === 'ko' ? '다운로드가 제대로 되지 않았습니다. 다시 확인해주세요' : 'Download did not complete properly. Please check again.';
      showToast(failMsg, 'error');
      try {
        alert(failMsg);
      } catch (e) {}
    }
  };

  const tabs = [
    { id: 'all', ko: '전체 자료', en: 'All Documents' },
    { id: 'catalog', ko: '종합 카탈로그', en: 'Brochures' },
    { id: 'drawing', ko: 'CAD 표준도면 (DWG)', en: 'CAD Drawings' },
    { id: 'test', ko: '시험성적서', en: 'Test Reports' }
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8" id="tech-docs-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="relative rounded-3xl py-10 px-8 sm:py-14 sm:px-12 mb-8 overflow-hidden shadow border border-gray-200">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center brightness-[1.1] bg-white" style={{ backgroundImage: `url('${getEmbedImageUrl(bannerBg)}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-orange-500 text-xs font-black uppercase tracking-widest drop-shadow-sm">TECHNICAL DOWNLOAD CENTER</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {lang === 'ko' ? '동우산업(주) 기술자료 다운로드 센터' : 'Dongwoo Industry Co., Ltd. Technical Download Center'}
            </h1>
            <p className="text-sm text-slate-100 font-bold leading-relaxed drop-shadow-sm">
              {lang === 'ko' 
                ? '오토캐드(AutoCAD DWG) 상세 표준 설계 도면, 정적 하중 충격 성적서 및 공인인증서를 일괄 제공합니다.'
                : 'Download AutoCAD layout designs, state testing parameters, and compliance certificates instantly.'}
            </p>
          </div>
        </div>

        {/* Search & Tabs / Details dual view */}
        {selectedItem ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Back button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="inline-flex items-center space-x-2 text-slate-700 hover:text-orange-500 font-extrabold text-xs transition-colors bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-xs"
            >
              <span>← {lang === 'ko' ? '기술자료 목록으로 돌아가기' : 'Back to Technical Documents List'}</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Side: Representative Image / Thumbnail Preview */}
              <div className="lg:col-span-5 bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-500 tracking-wider uppercase">
                    {lang === 'ko' ? '대표이미지' : 'Representative Image'}
                  </h3>
                  <span className="bg-orange-500/10 text-orange-600 text-[10px] font-black px-2.5 py-0.5 rounded uppercase">
                    {categoryLabels[selectedItem.category as 'catalog' | 'drawing' | 'test' | 'cert'] || selectedItem.category}
                  </span>
                </div>
                
                <div className="aspect-square bg-slate-50 rounded-2xl border border-gray-150 p-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={getEmbedImageUrl(selectedItem.fileUrl || fallbackImages[selectedItem.category] || fallbackImages.drawing)}
                    alt={selectedItem.title}
                    className="max-w-full max-h-full object-contain rounded-lg hover:scale-102 transition-transform duration-300 cursor-pointer"
                    onClick={() => setSelectedImg(selectedItem.fileUrl || fallbackImages[selectedItem.category] || fallbackImages.drawing)}
                    title={lang === 'ko' ? '원본 크기로 보기' : 'View full size'}
                  />
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  {lang === 'ko' ? '* 이미지를 클릭하시면 원본 이미지 크기로 상세 확인 가능합니다.' : '* Click the image to view the original file size.'}
                </p>
              </div>

              {/* Right Side: Metadata and Sequential downloadable drawing files list */}
              <div className="lg:col-span-7 bg-white border border-gray-200 p-6 sm:p-8 rounded-3xl shadow-xs space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-900 text-white text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                      {categoryLabels[selectedItem.category as 'catalog' | 'drawing' | 'test' | 'cert'] || selectedItem.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {selectedItem.id}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {lang === 'ko' ? selectedItem.title : selectedItem.titleEn}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    {lang === 'ko'
                      ? (selectedItem.description || '본 파일은 기술 표준 사양을 완벽히 수록한 설계 자원입니다. 표준 도면 및 시험성적 관련 실물 문서입니다.')
                      : (selectedItem.descriptionEn || 'This document contains official technical specifications, compliance parameters, and certified drawing layout data.')}
                  </p>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 text-[11px] text-slate-500 font-mono">
                    <div>
                      <span className="text-slate-400 block mb-0.5">{lang === 'ko' ? '등록일' : 'Date Created'}</span>
                      <strong className="text-slate-800 font-black">{selectedItem.date || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">{lang === 'ko' ? '다운로드 수' : 'Total Downloads'}</span>
                      <strong className="text-slate-800 font-black">{selectedItem.downloadsCount || 0}회</strong>
                    </div>
                  </div>
                </div>

                {/* Attached drawings / papers list sequentially below representative image */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-slate-950 flex items-center space-x-1">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span>{lang === 'ko' ? '설계 도면 및 첨부 서류 리스트' : 'Drawing & Document Downloads'}</span>
                  </h3>

                  <div className="space-y-2">
                    {selectedItem.files && selectedItem.files.length > 0 ? (
                      selectedItem.files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-orange-50/50 border border-gray-200 hover:border-orange-200 rounded-2xl transition-all gap-3 group"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600">
                              <File className="h-4 w-4" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono uppercase">
                                <span className="font-extrabold text-slate-500">{file.type}</span> 
                                {file.size && ` | ${file.size}`}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleIndividualDownload(file, selectedItem.id)}
                            className="bg-slate-900 hover:bg-orange-500 text-white hover:text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 whitespace-nowrap self-stretch sm:self-auto transition-all shadow-xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{lang === 'ko' ? '다운로드 받기' : 'Download File'}</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 bg-slate-50 border border-dashed border-gray-200 rounded-2xl">
                        <p className="text-xs text-slate-400 font-medium">
                          {lang === 'ko' ? '첨부된 설계 도면 및 서류가 없습니다.' : 'No attached drawing files found.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
              
              {/* Tabs List */}
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none pb-2 md:pb-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-xs font-extrabold rounded-lg whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                    }`}
                  >
                    {lang === 'ko' ? tab.ko : tab.en}
                  </button>
                ))}
              </div>

              {/* Local Search input */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder={lang === 'ko' ? '기술 자료명 검색...' : 'Search files...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

            </div>

            {/* Files Grid Frame */}
            <div>
              {filteredDownloads.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-3xl py-16 text-center text-slate-400 space-y-2 shadow-sm">
                  <File className="h-12 w-12 mx-auto animate-pulse" />
                  <p className="text-xs font-bold">{lang === 'ko' ? '등록된 기술 자료가 없습니다.' : 'No technical files found.'}</p>
                </div>
              ) : (() => {
                const totalPages = Math.ceil(filteredDownloads.length / itemsPerPage);
                const activePage = Math.max(1, Math.min(currentPage, totalPages || 1));
                const indexOfLastItem = activePage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentDownloads = filteredDownloads.slice(indexOfFirstItem, indexOfLastItem);

                const startPage = Math.floor((activePage - 1) / 10) * 10 + 1;
                const endPage = Math.min(totalPages, startPage + 9);
                const pages = [];
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }

                return (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {currentDownloads.map((item) => {
                        const thumbUrl = item.fileUrl || fallbackImages[item.category as 'catalog' | 'drawing' | 'test' | 'cert'] || fallbackImages.drawing;

                        return (
                          <div 
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div>
                              {/* Compact Thumbnail Image Container (Fixed height instead of giant aspect-ratio) */}
                              <div className="h-44 sm:h-48 bg-slate-50 overflow-hidden relative border-b border-gray-100 p-3 flex items-center justify-center">
                                <img 
                                  src={getEmbedImageUrl(thumbUrl)} 
                                  alt={item.title}
                                  className="max-w-full max-h-full object-contain group-hover:scale-102 transition-transform duration-300"
                                />
                                <span className="absolute top-2 right-2 bg-slate-900/95 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                  {categoryLabels[item.category as 'catalog' | 'drawing' | 'test' | 'cert'] || item.category}
                                </span>
                              </div>

                              {/* Text contents: Title, Summary */}
                              <div className="p-4 pb-2 space-y-1.5">
                                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm line-clamp-1 leading-snug">
                                  {lang === 'ko' ? item.title : item.titleEn}
                                </h4>
                                
                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium h-9 overflow-hidden">
                                  {lang === 'ko' 
                                    ? (item.description || '본 파일은 기술 표준 사양을 완벽히 수록한 설계 자원입니다. 표준 도면 및 시험성적 관련 실물 문서입니다.') 
                                    : (item.descriptionEn || 'This document contains official technical specifications, compliance parameters, and certified drawing layout data.')}
                                </p>
                              </div>
                            </div>

                            {/* Compact Footer specs / download button */}
                            <div className="p-4 pt-0 space-y-3">
                              <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                                <span>Files: <strong className="text-slate-600 font-bold">{(item.files || []).length}개</strong></span>
                                <span>Downloads: <strong className="text-slate-600 font-bold">{item.downloadsCount}</strong></span>
                              </div>
                              
                              <button
                                onClick={() => setSelectedItem(item)}
                                className="w-full py-2 bg-slate-950 hover:bg-orange-500 hover:text-white text-white text-[11px] font-extrabold rounded-xl flex items-center justify-center space-x-1 transition-all shadow-xs"
                              >
                                <Download className="h-3 w-3" />
                                <span>{lang === 'ko' ? '다운로드 페이지로 가기' : 'Go to Download Page'}</span>
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

          {/* Guidelines notes */}
          <div className="bg-slate-100 p-6 rounded-2xl border border-gray-200 flex items-start space-x-3 text-xs leading-relaxed text-slate-600">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-slate-900">{lang === 'ko' ? '안내 말씀' : 'Document standards notes'}</p>
              <p>
                {lang === 'ko'
                  ? '모든 CAD(DWG) 파일과 카탈로그 도안은 국토교통부 표준 시방 기준을 준수합니다. 관리자 로그인 시 실시간 업로드 및 삭제가 가능하며, 방문 고객의 실시간 다운로드 집계 통계가 대시보드에 반영됩니다.'
                  : 'All CAD/DWG and catalog specifications follow the official guidelines. Authorized administrators can upload, remove, and review download metrics dynamically.'}
              </p>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Original Image Modal Popup */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn"
          onClick={() => setSelectedImg(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden p-3 shadow-2xl transition-all scale-100 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
              <span className="text-xs font-black text-slate-800">
                {lang === 'ko' ? '품질인증 및 특허증 원본 이미지 보기' : 'Certification / Patent Document Viewer'}
              </span>
              <button 
                onClick={() => setSelectedImg(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
                title={lang === 'ko' ? '닫기' : 'Close'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Image Container */}
            <div className="p-4 bg-slate-50 flex items-center justify-center max-h-[80vh] overflow-y-auto rounded-2xl">
              <img 
                src={getEmbedImageUrl(selectedImg)} 
                alt="Original Certificate" 
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification popup overlay */}
      {toast.show && (
        <div 
          className="fixed bottom-8 right-8 z-[9999] flex items-center space-x-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold transition-all transform translate-y-0 scale-100 animate-slideUp duration-300"
          id="download-success-toast"
        >
          {toast.type === 'success' ? (
            <div className="bg-green-500/10 p-1.5 rounded-lg text-green-500">
              <CheckCircle className="h-4 w-4" />
            </div>
          ) : (
            <div className="bg-red-500/10 p-1.5 rounded-lg text-red-500">
              <X className="h-4 w-4" />
            </div>
          )}
          <span className="text-slate-100 pr-2">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
