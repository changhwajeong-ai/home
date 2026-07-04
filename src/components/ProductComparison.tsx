import React, { useState, useEffect } from 'react';
import { 
  X, 
  BarChart2, 
  CheckCircle, 
  Download, 
  FileText, 
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { DBService } from '../lib/firebase';
import { Product } from '../types';

interface ProductComparisonProps {
  lang: 'ko' | 'en';
  compareList: string[];
  onClose: () => void;
  setCompareList: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedProductId: (id: string | null) => void;
  setCurrentView: (view: string) => void;
}

export default function ProductComparison({
  lang,
  compareList,
  onClose,
  setCompareList,
  setSelectedProductId,
  setCurrentView
}: ProductComparisonProps) {
  const [productsToCompare, setProductsToCompare] = useState<Product[]>([]);

  useEffect(() => {
    if (compareList.length > 0) {
      DBService.getProducts().then(allProds => {
        const filtered = allProds.filter(p => compareList.includes(p.id));
        setProductsToCompare(filtered);
      });
    }
  }, [compareList]);

  if (compareList.length === 0) {
    return null;
  }

  const handleRemove = (id: string) => {
    setCompareList(prev => prev.filter(x => x !== id));
  };

  const handleProductRedirect = (id: string) => {
    setSelectedProductId(id);
    setCurrentView('products');
    onClose();
  };

  const handleFileDownload = (prodId: string, fileName: string) => {
    alert(lang === 'ko' ? `[${fileName}] 다운로드 요청이 처리되었습니다.` : `[${fileName}] Download initiated.`);
    DBService.recordDownload(prodId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" id="comparison-modal">
      <div className="bg-white w-full max-w-5xl rounded-lg overflow-hidden shadow-2xl border border-border-light flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-navy text-white px-6 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <BarChart2 className="h-6 w-6 text-orange-brand" />
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-white">
                {lang === 'ko' ? '도로안전시설물 규격/사양 비교 분석' : 'Product Specification Matrix Comparison'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {lang === 'ko' ? '영업사원 및 조달 담당자를 위한 고품격 기술 사양 비교표입니다.' : 'Technical specification comparison grid for procurement experts.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Comparison Matrix */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {productsToCompare.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p>{lang === 'ko' ? '비교할 제품을 선택해 주세요.' : 'Please select products to compare.'}</p>
            </div>
          ) : (
            <div className="border border-border-light rounded overflow-hidden shadow-inner">
              <table className="w-full text-xs font-mono text-left border-collapse">
                
                {/* Table Header: Names and images */}
                <thead>
                  <tr className="bg-slate-50 border-b border-border-light">
                    <th className="p-4 font-extrabold text-slate-400 uppercase tracking-wider w-1/4">
                      {lang === 'ko' ? '비교 항목' : 'Specifications'}
                    </th>
                    {productsToCompare.map((prod) => (
                      <th key={prod.id} className="p-4 font-extrabold text-navy border-l border-border-light relative group">
                        <button 
                          onClick={() => handleRemove(prod.id)}
                          className="absolute top-2 right-2 p-1 bg-gray-200 hover:bg-red-500 hover:text-white text-slate-500 rounded-full transition-colors cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="space-y-3 pt-2 text-center sm:text-left">
                          <img src={prod.images[0]} alt={prod.name} className="h-20 w-full sm:w-32 object-cover rounded shadow-sm mx-auto sm:mx-0" />
                          <div className="space-y-1">
                            <span className="text-[8px] bg-orange-brand/10 text-orange-brand font-bold px-2 py-0.5 rounded uppercase">
                              {prod.categoryId}
                            </span>
                            <h4 
                              onClick={() => handleProductRedirect(prod.id)}
                              className="font-bold text-navy hover:text-orange-brand cursor-pointer transition-colors line-clamp-2 h-8"
                            >
                              {lang === 'ko' ? prod.name : prod.nameEn}
                            </h4>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-border-light bg-white">
                  
                  {/* Material Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? '주요 재질 (Material)' : 'Material'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light font-semibold text-slate-800">
                        {lang === 'ko' ? prod.specifications.material : prod.specificationsEn.material}
                      </td>
                    ))}
                  </tr>

                  {/* Height Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? '설치 높이 (Height)' : 'Height'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light font-bold text-navy">
                        {prod.specifications.height}
                      </td>
                    ))}
                  </tr>

                  {/* Size Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? '규격 및 두께 (Size)' : 'Dimensions'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light font-semibold text-slate-800">
                        {prod.specifications.size}
                      </td>
                    ))}
                  </tr>

                  {/* Features Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? '제품 특장점 (Features)' : 'Key Features'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light text-xs text-slate-600 leading-relaxed font-semibold">
                        {lang === 'ko' ? prod.specifications.features : prod.specificationsEn.features}
                      </td>
                    ))}
                  </tr>

                  {/* Installation Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? '설치 공법 (Installation)' : 'Installation'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light text-xs text-slate-600 leading-relaxed font-semibold font-mono">
                        {lang === 'ko' ? prod.specifications.installation : prod.specificationsEn.installation}
                      </td>
                    ))}
                  </tr>

                  {/* Certifications Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? '보유 인증 (Certs)' : 'Certifications'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light">
                        <div className="flex flex-wrap gap-1">
                          {prod.certifications.map((c, i) => (
                            <span key={i} className="bg-slate-50 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] border border-border-light">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Downloads Row */}
                  <tr>
                    <td className="p-4 font-bold text-slate-400 bg-slate-50/50">{lang === 'ko' ? 'CAD/PDF 파일' : 'Design Files'}</td>
                    {productsToCompare.map((prod) => (
                      <td key={prod.id} className="p-4 border-l border-border-light space-y-1">
                        {prod.files.map((file, i) => (
                          <button
                            key={i}
                            onClick={() => handleFileDownload(prod.id, file.name)}
                            className="w-full text-left bg-slate-50 hover:bg-orange-brand/10 hover:text-orange-brand border border-border-light px-2 py-1 rounded text-[10px] flex items-center justify-between transition-colors text-slate-700 cursor-pointer"
                          >
                            <span className="truncate flex items-center space-x-1">
                              <FileText className="h-3 w-3 text-orange-brand" />
                              <span className="truncate">{file.name}</span>
                            </span>
                            <Download className="h-3 w-3 text-slate-400" />
                          </button>
                        ))}
                      </td>
                    ))}
                  </tr>

                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-border-light px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <CheckCircle className="h-4.5 w-4.5 text-green-600" />
            <span>{lang === 'ko' ? '비교 데이터는 국토부 도로안전시설물 설치 지침 표준안에 부합합니다.' : 'Specs adhere strictly to civil regulations standards.'}</span>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setCompareList([])}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              {lang === 'ko' ? '선택 비우기' : 'Clear All'}
            </button>
            <button 
              onClick={() => {
                setCurrentView('customer');
                onClose();
              }}
              className="px-5 py-2 bg-orange-brand hover:bg-orange-brand-hover text-white rounded text-xs font-bold transition-colors shadow-sm flex items-center space-x-1 cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{lang === 'ko' ? '견적 비교 문의하기' : 'Request Inquiry on Selection'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
