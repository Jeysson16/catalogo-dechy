import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ZoomIn, ZoomOut, Volume2, VolumeX, SkipBack, ChevronLeft, ChevronRight, SkipForward, 
  Play, Pause, Maximize, Minimize, X, Plus, Sparkles, ShieldCheck, Award, Zap, CheckCircle2 
} from 'lucide-react';
import { flipbookAudio } from '../utils/audioEffects';

interface FlipbookCatalogProps {
  products: any[];
  categories: string[];
  selectedBranch: any;
  onClose: () => void;
  onAddToCart: (product: any) => void;
  primaryColor?: string;
}

interface BookPage {
  type: 'cover' | 'editorial' | 'category-hero' | 'product-grid';
  title?: string;
  subtitle?: string;
  category?: string;
  products?: any[];
  pageNumber: number;
}

export const FlipbookCatalog: React.FC<FlipbookCatalogProps> = ({
  products,
  categories,
  selectedBranch,
  onClose,
  onAddToCart,
  primaryColor = '#f59e0b'
}) => {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isSoundPlaying, setIsSoundPlaying] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Organize catalog into paired pages (2 pages per spread: Left and Right)
  const allPages = useMemo(() => {
    const pages: BookPage[] = [];
    let pageNum = 1;

    // Page 1: Editorial Note / Inside Cover (Left)
    pages.push({
      type: 'editorial',
      title: 'INNOVACIÓN & DISEÑO',
      subtitle: 'Bienvenido al modo de lectura interactiva de nuestro catálogo oficial. Desarrollado con tecnología de alta fidelidad para una experiencia envolvente y relajante.',
      pageNumber: pageNum++
    });

    // Page 2: Front Cover (Right)
    pages.push({
      type: 'cover',
      title: selectedBranch?.name ? `CATÁLOGO OFICIAL — ${selectedBranch.name.toUpperCase()}` : 'CATÁLOGO DE PRODUCTOS & SOLUCIONES 2026',
      subtitle: 'COLECCIÓN EXCLUSIVA & DISPOSITIVOS DE ALTA GAMA',
      pageNumber: pageNum++
    });

    // Group products by category and create editorial spreads
    categories.forEach(cat => {
      const catProducts = products.filter(p => p.category === cat);
      if (catProducts.length === 0) return;

      // Add Category Hero Page (always starts on a new page)
      pages.push({
        type: 'category-hero',
        category: cat,
        title: `${cat.toUpperCase()} SERIE`,
        subtitle: 'Diseño inteligente, alta durabilidad y acabados estéticos de primera clase',
        pageNumber: pageNum++
      });

      // Split products into blocks of 4 products per page
      const chunkSize = 4;
      for (let i = 0; i < catProducts.length; i += chunkSize) {
        const chunk = catProducts.slice(i, i + chunkSize);
        pages.push({
          type: 'product-grid',
          category: cat,
          products: chunk,
          pageNumber: pageNum++
        });
      }
    });

    // If total pages is odd, add an end cover page to keep even spreads
    if (pages.length % 2 !== 0) {
      pages.push({
        type: 'editorial',
        title: 'GRACIAS POR SU PREFERENCIA',
        subtitle: 'Para cotizaciones personalizadas o pedidos especiales, consulte directamente a través de nuestro carrito o vía WhatsApp.',
        pageNumber: pageNum++
      });
    }

    return pages;
  }, [products, categories, selectedBranch]);

  // Spreads are pairs of [LeftPage, RightPage]
  const spreads = useMemo(() => {
    const pairs: [BookPage, BookPage][] = [];
    for (let i = 0; i < allPages.length; i += 2) {
      if (allPages[i] && allPages[i+1]) {
        pairs.push([allPages[i], allPages[i+1]]);
      }
    }
    return pairs;
  }, [allPages]);

  const totalPages = allPages.length;
  const currentSpread = spreads[currentSpreadIndex] || spreads[0];

  const handlePageChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < spreads.length && newIndex !== currentSpreadIndex) {
      setCurrentSpreadIndex(newIndex);
      flipbookAudio.playPageFlip();
    }
  };

  const toggleSound = () => {
    const active = flipbookAudio.toggleAmbient();
    setIsSoundPlaying(active);
  };

  // Keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handlePageChange(currentSpreadIndex + 1);
      if (e.key === 'ArrowLeft') handlePageChange(currentSpreadIndex - 1);
      if (e.key === 'Escape' && !document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpreadIndex, spreads.length]);

  // Auto-play interval
  useEffect(() => {
    let timer: any = null;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setCurrentSpreadIndex(prev => {
          const next = (prev + 1) % spreads.length;
          flipbookAudio.playPageFlip();
          return next;
        });
      }, 6000);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, spreads.length]);

  // Fullscreen handle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullScreen(true))
        .catch(err => console.warn("Fullscreen Error:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullScreen(false))
        .catch(err => console.warn("Exit Fullscreen Error:", err));
    }
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPage = Number(jumpPageInput);
    if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
      const spreadIdx = Math.floor((targetPage - 1) / 2);
      handlePageChange(spreadIdx);
      setJumpPageInput('');
    }
  };

  const handleAddWithFeedback = (p: any) => {
    onAddToCart(p);
    setAddedToast(`¡${p.name} añadido!`);
    setTimeout(() => setAddedToast(null), 2500);
  };

  // Render individual page content
  const renderPage = (page: BookPage, isLeft: boolean) => {
    if (!page) return <div className="w-full h-full bg-slate-900" />;

    if (page.type === 'editorial') {
      return (
        <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-stone-950 text-slate-300 border-r border-slate-800/50">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-serif text-sm tracking-widest uppercase mb-6">
              <Sparkles className="w-4 h-4" /> Editorial & Garantía
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6 leading-tight">
              {page.title}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light mb-8 max-w-sm">
              {page.subtitle}
            </p>
            <div className="space-y-4 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Productos garantizados contra defectos de fabricación.</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Acabados de lujo e inspección de calidad premium.</span>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Atención al cliente y asesoría especializada rápida.</span>
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-slate-500 flex items-center justify-between pt-6 border-t border-slate-800/40">
            <span>DECHY CORPORATIVE 2026</span>
            <span>PÁGINA {page.pageNumber}</span>
          </div>
        </div>
      );
    }

    if (page.type === 'cover') {
      return (
        <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-bl from-amber-950/40 via-slate-950 to-neutral-950 text-white relative overflow-hidden group border-l border-slate-800/50">
          <div className="absolute -right-16 -top-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-1000" />
          
          <div className="z-10">
            <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold tracking-widest uppercase mb-8">
              Edición Oficial
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight leading-none mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {page.title}
            </h1>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded mb-6" />
            <p className="text-sm sm:text-base text-slate-300 font-light max-w-md">
              {page.subtitle}
            </p>
          </div>

          <div className="z-10 bg-slate-900/60 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl mt-6">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Instrucciones Rápidas</h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside font-light">
              <li>Usa las flechas del teclado <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono">→</kbd> o haz clic en las páginas para avanzar.</li>
              <li>Activa el <strong>Sonidito de Calma</strong> 🔊 arriba para música ambiental de relajación.</li>
              <li>Haz clic en <strong>+ Añadir</strong> para preparar tu cotización.</li>
            </ul>
          </div>

          <div className="text-xs font-mono text-slate-500 flex items-center justify-between z-10 pt-6 border-t border-slate-800/40">
            <span>MODO REVISTA INTERACTIVA</span>
            <span>PÁGINA {page.pageNumber}</span>
          </div>
        </div>
      );
    }

    if (page.type === 'category-hero') {
      return (
        <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-r from-stone-950 via-slate-950 to-neutral-900 text-white relative overflow-hidden border-r border-slate-800/50">
          <div className="absolute -left-24 -bottom-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/3 w-80 h-80 rounded-full border-4 border-amber-500/20 opacity-30 pointer-events-none shadow-[0_0_80px_rgba(245,158,11,0.25)]" />

          <div className="z-10 mt-12">
            <span className="text-xs uppercase font-mono tracking-[0.3em] text-amber-400 mb-2 block">
              COLECCIÓN EXCLUSIVA
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight text-white mb-6">
              {page.title}
            </h2>
            <div className="w-20 h-1 bg-amber-500 rounded mb-6" />
            <p className="text-sm text-slate-300 max-w-sm font-light leading-relaxed">
              {page.subtitle}. Productos seleccionados especialmente para cumplir los estándares más rigurosos de funcionalidad, estética y eficiencia de consumo.
            </p>
          </div>

          <div className="z-10 grid grid-cols-2 gap-4 my-8 max-w-xs text-xs text-slate-300 font-light">
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="block font-bold text-amber-400 text-sm mb-1">100%</span>
              Garantía de calidad
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
              <span className="block font-bold text-amber-400 text-sm mb-1">Stock</span>
              Entrega inmediata
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 flex items-center justify-between z-10 pt-4 border-t border-slate-800/40">
            <span className="uppercase">{page.category}</span>
            <span>PÁGINA {page.pageNumber}</span>
          </div>
        </div>
      );
    }

    if (page.type === 'product-grid') {
      return (
        <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-neutral-950 to-zinc-950 text-white border-l border-slate-800/50">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
                {page.category}
              </span>
              <span className="text-xs font-light text-slate-400">
                Especificaciones & Modelos
              </span>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {page.products?.map((p, idx) => {
                const img = p.images?.[0] || p.imageUrl || '/img/hero_lifestyle_bg.png';
                const price = Number(p.price) || Number(p.unitPrice) || 0;
                return (
                  <div key={p.id || idx} className="group flex flex-col bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 rounded-xl overflow-hidden transition-all duration-300 p-3 shadow-lg">
                    <div className="relative w-full h-36 sm:h-44 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center mb-3 border border-slate-800/50">
                      <img 
                        src={img} 
                        alt={p.name} 
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                      {p.isOnSale && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          OFERTA
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-60 transition-opacity" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono text-xs font-extrabold text-amber-400 tracking-wider uppercase truncate">
                            {p.sku || p.code || `MOD-${idx + 1}`}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-400">
                            S/ {price.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-white transition-colors mb-1.5">
                          {p.name}
                        </h4>
                      </div>

                      <div className="text-[10px] text-slate-400 space-y-0.5 mb-3 pt-1 border-t border-slate-800/60 font-light">
                        <div className="flex justify-between">
                          <span>Categoría:</span>
                          <span className="text-slate-300 truncate font-mono max-w-[110px]">{p.category || 'Varios'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stock aprox:</span>
                          <span className={p.currentStock > 0 ? "text-emerald-400 font-semibold" : "text-amber-400"}>
                            {p.currentStock > 0 ? `${p.currentStock} unid.` : 'Consultar'}
                          </span>
                        </div>
                        {p.unitsPerBox && p.unitsPerBox > 1 && (
                          <div className="flex justify-between text-slate-350">
                            <span>Caja:</span>
                            <span>{p.unitsPerBox} uds</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddWithFeedback(p)}
                        className="w-full mt-auto bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 hover:border-amber-400 text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Añadir a Cotización</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 flex items-center justify-between pt-4 border-t border-slate-800/40">
            <span>CATÁLOGO DE MODELOS</span>
            <span>PÁGINA {page.pageNumber}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col justify-between select-none overflow-hidden text-white font-sans">
      {/* Toast feedback when adding product */}
      <AnimatePresence>
        {addedToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[300] bg-emerald-500 text-slate-950 font-extrabold px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm border border-white/20"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{addedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP CONTROLS BAR (exact layout inspired by photo) */}
      <div className="w-full py-3 px-4 sm:px-8 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold font-mono uppercase text-amber-400 tracking-widest px-2.5 py-1 bg-amber-500/10 rounded border border-amber-500/30 hidden sm:inline-block">
            Modo Revista
          </span>
          <span className="text-xs text-slate-400 hidden lg:inline font-light">
            Navegación interactiva estilo libro digital
          </span>
        </div>

        {/* Center Control Pill */}
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-900 border border-slate-700/80 rounded-full px-3 py-1.5 shadow-xl text-slate-300 text-xs font-medium">
          {/* Zoom Controls */}
          <button 
            onClick={() => setIsZoomed(!isZoomed)} 
            className={`p-1.5 rounded-full transition-colors ${isZoomed ? 'bg-amber-500 text-slate-950' : 'hover:bg-slate-800 hover:text-white'}`}
            title="Zoom (Ampliar/Reducir)"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
          
          {/* Sound Toggle */}
          <button 
            onClick={toggleSound} 
            className={`p-1.5 rounded-full transition-colors relative ${isSoundPlaying ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}
            title="Sonido de Calma (Música ambiental relajante para leer)"
          >
            {isSoundPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          {/* Navigation Controls */}
          <button 
            onClick={() => handlePageChange(0)} 
            disabled={currentSpreadIndex === 0}
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
            title="Primera página"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button 
            onClick={() => handlePageChange(currentSpreadIndex - 1)} 
            disabled={currentSpreadIndex === 0}
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
            title="Página Anterior (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono px-2 text-slate-200 text-xs font-bold">
            {currentSpreadIndex + 1} / {spreads.length}
          </span>

          <button 
            onClick={() => handlePageChange(currentSpreadIndex + 1)} 
            disabled={currentSpreadIndex === spreads.length - 1}
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
            title="Página Siguiente (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button 
            onClick={() => handlePageChange(spreads.length - 1)} 
            disabled={currentSpreadIndex === spreads.length - 1}
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
            title="Última página"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          {/* Auto Play */}
          <button 
            onClick={() => setIsAutoPlaying(!isAutoPlaying)} 
            className={`p-1.5 rounded-full transition-colors ${isAutoPlaying ? 'bg-amber-500 text-slate-950' : 'hover:bg-slate-800 hover:text-white'}`}
            title="Pase automático de páginas"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button 
            onClick={toggleFullScreen} 
            className="p-1.5 hover:bg-slate-800 hover:text-white rounded-full hidden sm:inline-block"
            title="Pantalla completa"
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

        {/* Right Corner: Page Jumper and Close */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleGoToPage} className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-400">Pág:</span>
            <input 
              type="text" 
              value={jumpPageInput}
              onChange={e => setJumpPageInput(e.target.value)}
              placeholder={`${currentSpread[0]?.pageNumber || 1}-${currentSpread[1]?.pageNumber || 2}`} 
              className="w-10 bg-transparent text-center font-mono text-amber-400 outline-none font-bold"
            />
            <button type="submit" className="text-[10px] font-extrabold bg-slate-800 hover:bg-amber-500 hover:text-slate-950 px-1.5 py-0.5 rounded transition-colors uppercase">
              GO
            </button>
          </form>

          <button 
            onClick={onClose}
            className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95"
            title="Cerrar Modo Revista"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar</span>
          </button>
        </div>
      </div>

      {/* MAIN BOOK SPREAD VIEWPORT */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 md:p-12 overflow-y-auto overflow-x-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-neutral-950">
        
        {/* Left Big Arrow */}
        <button 
          onClick={() => handlePageChange(currentSpreadIndex - 1)} 
          disabled={currentSpreadIndex === 0}
          className="absolute left-2 sm:left-6 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-amber-400 flex items-center justify-center shadow-2xl disabled:opacity-20 disabled:hover:bg-slate-900 disabled:hover:text-slate-300 transition-all transform hover:scale-105 active:scale-95 hidden md:flex"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        {/* Right Big Arrow */}
        <button 
          onClick={() => handlePageChange(currentSpreadIndex + 1)} 
          disabled={currentSpreadIndex === spreads.length - 1}
          className="absolute right-2 sm:right-6 z-30 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900/80 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700 hover:border-amber-400 flex items-center justify-center shadow-2xl disabled:opacity-20 disabled:hover:bg-slate-900 disabled:hover:text-slate-300 transition-all transform hover:scale-105 active:scale-95 hidden md:flex"
        >
          <ChevronRight className="w-7 h-7" />
        </button>

        {/* The 2-Page Book Spread Container */}
        <div className={`w-full max-w-6xl transition-transform duration-500 ${isZoomed ? 'scale-125 my-12' : 'scale-100'} perspective-[2000px]`}>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSpreadIndex}
              initial={{ rotateY: 12, opacity: 0, scale: 0.95 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              exit={{ rotateY: -12, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[520px] md:min-h-[640px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.85)] border border-slate-800 relative bg-slate-950"
            >
              {/* Central book binding spine and page fold shadow (Desktop Only) */}
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 w-8 h-full z-20 pointer-events-none bg-gradient-to-r from-black/50 via-neutral-900/40 to-black/50 shadow-[0_0_20px_rgba(0,0,0,0.8)] border-x border-white/5" />

              {/* LEFT PAGE */}
              <div className="w-full h-full relative z-10 flex flex-col bg-slate-950">
                {renderPage(currentSpread[0], true)}
              </div>

              {/* RIGHT PAGE */}
              <div className="w-full h-full relative z-10 flex flex-col bg-slate-950 hidden md:block">
                {renderPage(currentSpread[1], false)}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mobile indicator for second page on small screens */}
          {currentSpread[1] && (
            <div className="mt-4 block md:hidden w-full min-h-[520px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              {renderPage(currentSpread[1], false)}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM PAGINATION THUMbs (Inspired by bottom numbered pills in photo) */}
      <div className="w-full py-3 px-6 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md flex items-center justify-center gap-2 overflow-x-auto z-30 scrollbar-thin scrollbar-thumb-slate-700">
        {spreads.map((spread, idx) => {
          const isSelected = idx === currentSpreadIndex;
          const leftNum = spread[0]?.pageNumber || '?';
          const rightNum = spread[1]?.pageNumber;
          const label = rightNum ? `${leftNum}-${rightNum}` : `${leftNum}`;

          return (
            <button
              key={idx}
              onClick={() => handlePageChange(idx)}
              className={`px-3 sm:px-4 py-1.5 rounded-full font-mono text-xs font-bold tracking-tight transition-all shrink-0 ${
                isSelected 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
