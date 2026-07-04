import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import CompanyView from './components/CompanyView';
import ProductCatalogView from './components/ProductCatalogView';
import ProductDetailView from './components/ProductDetailView';
import TechDocsView from './components/TechDocsView';
import ProjectsView from './components/ProjectsView';
import NewsCenterView from './components/NewsCenterView';
import CustomerCenterView from './components/CustomerCenterView';
import AdminCMSView from './components/AdminCMSView';
import ProductComparison from './components/ProductComparison';
import AIChatSupport from './components/AIChatSupport';
import { DBService } from './lib/firebase';

export default function App() {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilterQuery, setSearchFilterQuery] = useState<string>('');

  useEffect(() => {
    // Record visitor statistics
    DBService.recordVisitor();

    // Support back button logic via popstate
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || 'home';
      const prodId = params.get('prodId');
      
      setCurrentView(view);
      setSelectedProductId(prodId);
    };

    window.addEventListener('popstate', handleLocationChange);
    handleLocationChange(); // Trigger first load

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Update query params on navigation changes
  const navigateTo = (view: string, prodId: string | null = null) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    if (prodId) {
      url.searchParams.set('prodId', prodId);
    } else {
      url.searchParams.delete('prodId');
    }
    window.history.pushState({}, '', url.toString());
    setCurrentView(view);
    setSelectedProductId(prodId);
  };

  const handleSelectProduct = (id: string) => {
    navigateTo('products', id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-orange-500 selection:text-white" id="main-app-shell">
      
      {/* Corporate Header */}
      <Header 
        lang={lang}
        setLang={setLang}
        currentView={currentView}
        setCurrentView={(v) => navigateTo(v, null)}
        setSelectedCategory={setSelectedCategory}
        setSelectedProductId={setSelectedProductId}
        onSearchSubmit={(q) => {
          setSelectedCategory('all');
          setSearchFilterQuery(q);
          navigateTo('products', null);
        }}
        openChat={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
      />

      {/* Primary Content Router */}
      <main className="flex-grow">
        {selectedProductId ? (
          /* Detailed Single Product View */
          <ProductDetailView 
            lang={lang}
            productId={selectedProductId}
            onBack={() => navigateTo('products', null)}
            setCurrentView={(v) => navigateTo(v, null)}
            setSelectedProductId={handleSelectProduct}
          />
        ) : (
          /* Multi-screen view dispatcher */
          <>
            {currentView === 'home' && (
              <HomeView 
                lang={lang} 
                setCurrentView={(v) => navigateTo(v, null)}
                setSelectedCategory={setSelectedCategory}
                setSelectedProductId={handleSelectProduct}
              />
            )}
            {currentView === 'company' && (
              <CompanyView lang={lang} />
            )}
            {currentView === 'products' && (
              <ProductCatalogView 
                lang={lang}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedProductId={selectedProductId}
                setSelectedProductId={setSelectedProductId}
                searchFilterQuery={searchFilterQuery}
                setSearchFilterQuery={setSearchFilterQuery}
              />
            )}
            {currentView === 'tech' && (
              <TechDocsView lang={lang} />
            )}
            {currentView === 'projects' && (
              <ProjectsView 
                lang={lang}
                setSelectedProductId={handleSelectProduct}
                setCurrentView={(v) => navigateTo(v, null)}
              />
            )}
            {currentView === 'news' && (
              <NewsCenterView lang={lang} />
            )}
            {currentView === 'customer' && (
              <CustomerCenterView lang={lang} />
            )}
            {currentView === 'admin' && (
              <AdminCMSView lang={lang} />
            )}
          </>
        )}
      </main>

      {/* Corporate Footer */}
      <Footer 
        currentView={currentView}
        lang={lang} 
        setCurrentView={(v) => navigateTo(v, null)}
      />

      {/* Global Product Side-by-Side Comparison Modal Grid */}
      {isCompareOpen && (
        <ProductComparison 
          lang={lang}
          compareList={compareList}
          onClose={() => setIsCompareOpen(false)}
          setCompareList={setCompareList}
          setSelectedProductId={handleSelectProduct}
          setCurrentView={(v) => navigateTo(v, null)}
        />
      )}

      {/* Floating Interactive AI Technical Safety Chatbot */}
      {currentView !== 'admin' && (
        <AIChatSupport lang={lang} />
      )}

    </div>
  );
}
