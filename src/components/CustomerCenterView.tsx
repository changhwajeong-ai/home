import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  HelpCircle, 
  Mail, 
  Phone, 
  Clock, 
  Lock, 
  Unlock,
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { DBService, getEmbedImageUrl } from '../lib/firebase';
import { Inquiry } from '../types';

interface CustomerCenterViewProps {
  lang: 'ko' | 'en';
}

export default function CustomerCenterView({ lang }: CustomerCenterViewProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [bannerBg, setBannerBg] = useState<string>('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="white"/></svg>');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Password-related states for unlocking private inquiries
  const [unlockedIds, setUnlockedIds] = useState<{[key: string]: boolean}>({});
  const [passwordInputs, setPasswordInputs] = useState<{[key: string]: string}>({});
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    content: '',
    type: 'estimate' as 'qna' | 'request' | 'catalog' | 'estimate',
    isPrivate: false,
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    DBService.getInquiries().then(setInquiries);
  }, [success]);

  useEffect(() => {
    DBService.getBanners().then(b => {
      if (b && b.customer) {
        setBannerBg(b.customer);
      }
    });
  }, []);

  const handleVerifyPassword = (id: string, correctPassword?: string) => {
    const inputPass = passwordInputs[id] || '';
    if (!correctPassword) {
      setUnlockedIds({ ...unlockedIds, [id]: true });
      return;
    }
    if (inputPass === correctPassword) {
      setUnlockedIds({ ...unlockedIds, [id]: true });
      setPasswordErrors({ ...passwordErrors, [id]: '' });
    } else {
      setPasswordErrors({ ...passwordErrors, [id]: '비밀번호가 일치하지 않습니다.' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.title || !form.content) {
      alert(lang === 'ko' ? '성함, 연락처, 제목, 내용을 필수 기입해주세요.' : 'Please fill out required fields.');
      return;
    }

    if (form.isPrivate && (!form.password || form.password.trim().length < 4)) {
      alert(lang === 'ko' ? '비공개글의 경우 비밀번호를 4자리 이상 입력해 주셔야 합니다.' : 'Please enter a password of at least 4 characters for private posts.');
      return;
    }

    setLoading(true);
    const newInquiry: Inquiry = {
      id: 'inq-' + Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      title: form.title,
      content: form.content,
      type: form.type,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      isPrivate: form.isPrivate,
      password: form.password
    };

    try {
      await DBService.saveInquiry(newInquiry);
      
      // Send notification alert email to dongwoo116@hanmail.net
      try {
        await fetch('/api/notify-inquiry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newInquiry),
        });
      } catch (mailErr) {
        console.warn('Failed to send email alert via API:', mailErr);
      }

      setSuccess(true);
      setForm({
        name: '',
        email: '',
        phone: '',
        title: '',
        content: '',
        type: 'estimate',
        isPrivate: false,
        password: ''
      });
    } catch (e) {
      alert('오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'form', ko: '문의 & 자료 신청하기', en: 'Online Form' },
    { id: 'list', ko: '전체 Q&A 게시판', en: 'Inquiries Board' }
  ];

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8" id="customer-center-view">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner */}
        <div className="relative rounded-3xl py-10 px-8 sm:py-14 sm:px-12 mb-8 overflow-hidden shadow border border-gray-200">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 origin-center brightness-[1.1] bg-white" style={{ backgroundImage: `url('${getEmbedImageUrl(bannerBg)}')` }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-orange-500 text-xs font-black uppercase tracking-widest drop-shadow-sm">CUSTOMER SERVICE</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
              {lang === 'ko' ? '동우산업(주) 고객지원 및 견적센터' : 'Dongwoo Industry Co., Ltd. Support & Quotation Center'}
            </h1>
            <p className="text-sm text-slate-100 font-bold leading-relaxed drop-shadow-sm">
              {lang === 'ko' 
                ? '도매 단가 견적, 시공 설계 도면 자문, 대리점 개설 계약 및 실물 카탈로그 우편 수령을 친절하게 상담해 드립니다.'
                : 'Request bulk pricing quotations, custom blueprints, regional agency openings, and hardcopy brochure orders.'}
            </p>
          </div>
        </div>

        {/* Local sub-navigation */}
        <div className="flex space-x-1 border-b border-gray-200 pb-4 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {lang === 'ko' ? tab.ko : tab.en}
            </button>
          ))}
        </div>

        {activeTab === 'form' ? (
          /* Submission Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12" id="customer-form-container">
            
            {/* Sidebar info cards (Col-span 4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Quick Call Box */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow space-y-4">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-widest">DOONGWOO HOTLINE</p>
                <div className="space-y-1">
                  <h4 className="text-lg font-extrabold">조달청 관급/도매 신속 대응</h4>
                  <p className="text-2xl font-black text-white">031-965-1133</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  설계사무소 도면 지원 및 지방자치단체 수량별 특별 도매 공급가 적용을 원하시면 유선 번호로 바로 전화를 주십시오.
                </p>
                <div className="flex flex-col gap-2 pt-2 text-[10px] text-slate-300 font-mono">
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span>이메일 접수</span>
                    <span className="font-bold">dongwoo116@hanmail.net</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span>상담시간</span>
                    <span>평일 09:00 - 18:00</span>
                  </div>
                </div>
              </div>

              {/* Secure Notice */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-sm text-slate-600 leading-normal text-xs">
                <div className="flex items-center space-x-1.5 text-orange-600 font-bold mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>개인정보 보호 안내</span>
                </div>
                <p>
                  작성해 주시는 연락처 및 이메일 정보는 오직 동우안전 안전시설물 견적 검토, 설계 도면 전송 및 카탈로그 등 등기 우편물 발송 용도로만 엄격히 수집·보호되며, 상담 완료 후 지체없이 안전하게 파기됩니다.
                </p>
              </div>

            </div>

            {/* Submission Form itself (Col-span 8) */}
            <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-8 sm:p-12 shadow-sm">
              
              {success ? (
                <div className="text-center py-16 space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
                  <h3 className="text-xl font-bold text-slate-900">상담 및 신청 완료</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    작성하신 동우산업(주) 도로시설 문의 및 설계요청 내역이 안전하게 접수되었습니다. 담당자가 서류 검토 후 즉시 메일 및 연락처로 회신 드리겠습니다.
                  </p>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    추가 문의 작성하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">이름/업체명 *</label>
                      <input 
                        type="text" 
                        required
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        placeholder="동우건설 김대리"
                        className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">연락처 *</label>
                      <input 
                        type="text" 
                        required
                        value={form.phone}
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                        placeholder="010-1234-5678"
                        className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">회신 이메일 주소</label>
                      <input 
                        type="email" 
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        placeholder="example@doongwoo.net"
                        className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">문의 업무 분류 *</label>
                      <select
                        value={form.type}
                        onChange={(e: any) => setForm({...form, type: e.target.value})}
                        className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                      >
                        <option value="estimate">도로시설 단가 및 대량 공급 견적 문의</option>
                        <option value="request">오토캐드(CAD) 상세 규격 도면 파일 요청</option>
                        <option value="catalog">인쇄 실물 종합 카탈로그 수령 우편 신청</option>
                        <option value="qna">단순 하자 보수 및 유지관리 자문</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">게시글 공개 설정 *</label>
                      <div className="flex items-center space-x-6 bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs h-[44px]">
                        <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-800">
                          <input 
                            type="radio" 
                            name="isPrivate"
                            checked={!form.isPrivate}
                            onChange={() => setForm({...form, isPrivate: false, password: ''})}
                            className="text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                          />
                          <span>공개글 (전체 공개)</span>
                        </label>
                        <label className="flex items-center space-x-1.5 cursor-pointer font-bold text-slate-800">
                          <input 
                            type="radio" 
                            name="isPrivate"
                            checked={form.isPrivate}
                            onChange={() => setForm({...form, isPrivate: true})}
                            className="text-orange-500 focus:ring-orange-500 h-3.5 w-3.5"
                          />
                          <span>비공개글 (제목만 공개)</span>
                        </label>
                      </div>
                    </div>

                    {form.isPrivate && (
                      <div className="animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">비밀번호 설정 * (4자리 이상)</label>
                        <input 
                          type="password" 
                          required={form.isPrivate}
                          maxLength={12}
                          value={form.password}
                          onChange={(e) => setForm({...form, password: e.target.value})}
                          placeholder="답변 확인 시 필요한 비밀번호 4~12자리"
                          className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">문의 제목 *</label>
                    <input 
                      type="text" 
                      required
                      value={form.title}
                      onChange={(e) => setForm({...form, title: e.target.value})}
                      placeholder="볼라드 및 분리대 수량별 납품 단가 자문 요청"
                      className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">상세 문의 내용 기재 *</label>
                    <textarea 
                      required
                      rows={6}
                      value={form.content}
                      onChange={(e) => setForm({...form, content: e.target.value})}
                      placeholder="납품받으실 현장 위치, 원하는 규격 수량, 도면 CAD 다운로드 관련 특이사항 등을 소상하게 기재해 주시면 신속한 단가 회신이 가능합니다."
                      className="w-full bg-slate-50 border border-gray-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-orange-500/10"
                  >
                    <Send className="h-4 w-4" />
                    <span>{loading ? '동우 안전 보안 전송 중...' : '공식 기술 상담 신청 완료하기'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Inquiry List Tab */
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm animate-fadeIn">
            <div className="p-5 border-b border-gray-150 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-xs flex items-center space-x-1.5">
                <span>📋 접수된 공식 문의 및 견적 의뢰 현황</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Total {inquiries.length} cases</span>
            </div>

            <div className="divide-y divide-gray-150 text-xs font-mono">
              {inquiries.map((item) => {
                const isExpanded = expandedId === item.id;
                
                const handleToggleExpand = () => {
                  setExpandedId(isExpanded ? null : item.id);
                };

                const isUnlocked = !item.isPrivate || unlockedIds[item.id];

                return (
                  <div 
                    key={item.id} 
                    onClick={handleToggleExpand}
                    className="p-5 transition-all select-none cursor-pointer hover:bg-slate-50"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded tracking-wider uppercase font-bold">
                            {item.type === 'estimate' ? '견적/납품 단가' : 
                             item.type === 'request' ? 'CAD 도면요청' : 
                             item.type === 'catalog' ? '카탈로그 수령' : '유지관리 자문'}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            item.isPrivate 
                              ? 'bg-red-50 text-red-600 border border-red-100' 
                              : 'bg-green-50 text-green-700 border border-green-100'
                          }`}>
                            {item.isPrivate ? '비공개' : '공개'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            작성자: {item.name.charAt(0)}** / {item.date}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-950 flex items-center space-x-1.5">
                          {item.isPrivate ? (
                            isUnlocked ? (
                              <Unlock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                            )
                          ) : (
                            <Unlock className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                          )}
                          <span className={item.isPrivate && !isUnlocked ? 'text-slate-500 font-normal italic' : 'text-slate-900'}>
                            {item.title}
                          </span>
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0 mt-2 sm:mt-0">
                        {item.status === 'answered' ? (
                          <span className="bg-green-100 text-green-700 font-extrabold px-2.5 py-1 rounded text-[10px] border border-green-200">
                            답변완료
                          </span>
                        ) : (
                          <span className="bg-orange-50 text-orange-600 font-extrabold px-2.5 py-1 rounded text-[10px] border border-orange-100">
                            검토 대기중
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {isExpanded ? '▲ 접기' : '▼ 펼치기'}
                        </span>
                      </div>
                    </div>

                    {/* Expandable detailed view */}
                    {isExpanded && (
                      <div className="mt-4">
                        {isUnlocked ? (
                          <div className="space-y-3 pl-2 border-l-2 border-orange-500/30">
                            {item.isPrivate && (
                              <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2.5 py-1.5 rounded-lg inline-flex items-center space-x-1">
                                <span>🔓 비밀번호로 인증된 비공개 문의내용입니다.</span>
                              </div>
                            )}
                            {/* Question body */}
                            <div className="p-4 bg-orange-50/20 border border-orange-100 rounded-xl space-y-1">
                              <p className="font-bold text-slate-800 text-[10px]">상세 문의 내용:</p>
                              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            </div>
                            
                            {/* Answer section if responded */}
                            {item.status === 'answered' && item.answer && (
                              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                <p className="font-bold text-orange-600 text-[10px] uppercase">동우안전 담당 기술자 답변:</p>
                                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Password Entry Form */
                          <div 
                            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm space-y-3 animate-fadeIn"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center space-x-2 text-slate-800">
                              <Lock className="h-4 w-4 text-orange-500" />
                              <span className="font-bold text-[11px]">비공개 문의 확인</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              이 문의글은 작성자 비공개 글입니다.<br />
                              작성 시 설정하셨던 비밀번호를 입력해 주십시오.
                            </p>
                            <div className="flex space-x-2">
                              <input 
                                type="password"
                                placeholder="비밀번호 4~12자리"
                                value={passwordInputs[item.id] || ''}
                                onChange={(e) => setPasswordInputs({ ...passwordInputs, [item.id]: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleVerifyPassword(item.id, item.password);
                                  }
                                }}
                                className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-sans"
                              />
                              <button
                                onClick={() => handleVerifyPassword(item.id, item.password)}
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
                              >
                                확인
                              </button>
                            </div>
                            {passwordErrors[item.id] && (
                              <p className="text-[10px] text-red-500 font-bold animate-pulse">
                                ⚠️ {passwordErrors[item.id]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {inquiries.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                  접수된 문의사항이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
