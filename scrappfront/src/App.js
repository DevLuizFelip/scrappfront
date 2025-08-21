import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import './App.css'; // Importa o nosso ficheiro CSS

// --- Constantes ---
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// --- Componentes Individuais ---

// Cabeçalho da Aplicação
const Header = ({ onAddLinkClick, currentView, setCurrentView }) => (
    <header className="app-header">
        <div className="container">
            <div className="header-content">
                <div>
                    <h1 className="header-title">Image Feed</h1>
                    <p className="header-subtitle">Seu agregador de imagens da web.</p>
                </div>
                <button onClick={onAddLinkClick} className="add-link-button">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
            </div>
            <nav className="tabs-nav">
                <button onClick={() => setCurrentView('feed')} className={`tab-button ${currentView === 'feed' ? 'active' : ''}`}>Feed</button>
                <button onClick={() => setCurrentView('favorites')} className={`tab-button ${currentView === 'favorites' ? 'active' : ''}`}>Favoritos</button>
            </nav>
        </div>
    </header>
);

// Componente para listar as fontes (links)
const SourcesList = ({ sources, onRemoveSource, onSyncSource, syncingSourceId }) => (
    <aside className="sources-list-container">
        <h2 className="sources-list-title">Fontes Adicionadas</h2>
        {sources.length > 0 ? (
            <ul className="sources-list">
                {sources.map(source => (
                    <li key={source.id} className="source-item">
                        <span className="source-name">{source.name}</span>
                        <div className="source-item-buttons">
                            <button onClick={() => onSyncSource(source.id)} className="source-sync-btn" title="Sincronizar fonte" disabled={syncingSourceId === source.id}>
                                {syncingSourceId === source.id ? (
                                    <svg className="spinner" viewBox="0 0 50 50"><circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle></svg>
                                ) : (
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"></path></svg>
                                )}
                            </button>
                            <button onClick={() => onRemoveSource(source.id)} className="source-remove-btn" title="Remover fonte">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="sources-list-empty">Nenhuma fonte adicionada.</p>
        )}
    </aside>
);

// Card de uma Imagem no Grid
const ImageCard = ({ image, onImageClick, onToggleFavorite, onDownload }) => (
    <div className="image-card" onClick={onImageClick}>
        <img src={image.src} alt={image.alt} className="image-card-img" loading="lazy" />
        <div className="image-card-overlay">
            <div className="image-card-info">
                <p className="source">{image.source}</p>
                <p className="author">by {image.author}</p>
            </div>
            <div className="image-card-actions">
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(image.id, !image.isFavorited); }}>
                    <svg className={image.isFavorited ? 'favorite' : ''} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDownload(image); }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
            </div>
        </div>
    </div>
);

// Grid de Imagens Virtualizado
const VirtualizedImageGrid = ({ images, onImageClick, ...props }) => {
    const parentRef = useRef();
    const getColumnCount = () => {
        if (typeof window === 'undefined') return 5;
        if (window.innerWidth >= 1024) return 5;
        if (window.innerWidth >= 768) return 4;
        if (window.innerWidth >= 640) return 3;
        return 2;
    };
    const [columnCount, setColumnCount] = useState(getColumnCount());
    useEffect(() => {
        const handleResize = () => setColumnCount(getColumnCount());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const rowCount = Math.ceil(images.length / columnCount);
    const rowVirtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 350,
        overscan: 5,
    });

    return (
        <div ref={parentRef} className="virtual-grid-container">
            <div className="virtual-grid-inner" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const startIndex = virtualRow.index * columnCount;
                    const itemsInRow = images.slice(startIndex, startIndex + columnCount);
                    return (
                        <div key={virtualRow.key} className="virtual-grid-row" style={{ transform: `translateY(${virtualRow.start}px)` }}>
                            {itemsInRow.map((image, i) => {
                                const imageIndex = startIndex + i;
                                return (
                                    <ImageCard key={image.id} image={image} onImageClick={() => onImageClick(imageIndex)} {...props} />
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// Modal de Visualização de Imagem
const ImageModal = ({ image, onClose, onPrev, onNext, onToggleFavorite, onDownload }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    if (!image) return null;

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="image-modal-close-btn">&times;</button>
                <img src={image.src} alt={image.alt} className="image-modal-img" />
                <div className="image-modal-actions">
                    <button onClick={() => onToggleFavorite(image.id, !image.isFavorited)}>
                        <svg className={image.isFavorited ? 'favorite' : ''} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"></path></svg>
                    </button>
                    <button onClick={() => onDownload(image)}>
                         <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </button>
                </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="modal-nav-btn prev">&#10094;</button>
            <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="modal-nav-btn next">&#10095;</button>
        </div>
    );
};

// Modal para Adicionar Link ATUALIZADO
const AddLinkModal = ({ isOpen, onClose, onFetch }) => {
    const [scrapeType, setScrapeType] = useState('single'); // 'single' ou 'multi'
    const [url, setUrl] = useState('');
    const [urlPattern, setUrlPattern] = useState('');
    const [startPage, setStartPage] = useState('1');
    const [endPage, setEndPage] = useState('10');
    const [isFetching, setIsFetching] = useState(false);

    const handleSubmit = async () => {
        setIsFetching(true);
        const payload = scrapeType === 'single'
            ? { url }
            : { urlPattern, startPage, endPage };
        
        await onFetch(payload);

        setIsFetching(false);
        setUrl('');
        setUrlPattern('');
        setStartPage('1');
        setEndPage('10');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="add-link-modal-content" onClick={e => e.stopPropagation()}>
                <div className="add-link-modal-header">
                    <h2 className="add-link-modal-title">Adicionar Link</h2>
                    <button onClick={onClose} className="add-link-modal-close-btn">&times;</button>
                </div>

                <div className="scrape-type-selector">
                    <button className={scrapeType === 'single' ? 'active' : ''} onClick={() => setScrapeType('single')}>URL Único</button>
                    <button className={scrapeType === 'multi' ? 'active' : ''} onClick={() => setScrapeType('multi')}>Múltiplas Páginas</button>
                </div>

                {scrapeType === 'single' ? (
                    <div>
                        <p className="add-link-modal-p">Cole um link para buscar imagens.</p>
                        <input value={url} onChange={e => setUrl(e.target.value)} type="url" placeholder="https://..." className="add-link-modal-input" />
                    </div>
                ) : (
                    <div>
                        <p className="add-link-modal-p">Insira um padrão de URL com `{'{page}'}` no lugar do número da página.</p>
                        <input value={urlPattern} onChange={e => setUrlPattern(e.target.value)} type="text" placeholder="https://exemplo.com/imagens?p={page}" className="add-link-modal-input" />
                        <div className="page-range-inputs">
                            <input value={startPage} onChange={e => setStartPage(e.target.value)} type="number" min="1" placeholder="Início" />
                            <span>até</span>
                            <input value={endPage} onChange={e => setEndPage(e.target.value)} type="number" min={startPage} placeholder="Fim" />
                        </div>
                    </div>
                )}
                
                <button onClick={handleSubmit} disabled={isFetching} className="add-link-modal-submit">
                    {isFetching ? 'A Buscar...' : 'Buscar Imagens'}
                </button>
            </div>
        </div>
    );
};


// --- Componente Principal da Aplicação ---
export default function App() {
    const [sources, setSources] = useState([]);
    const [allImages, setAllImages] = useState([]);
    const [currentView, setCurrentView] = useState('feed');
    const [isLoading, setIsLoading] = useState(true);
    const [modalIndex, setModalIndex] = useState(null);
    const [isAddLinkModalOpen, setAddLinkModalOpen] = useState(false);
    const [syncingSourceId, setSyncingSourceId] = useState(null);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [sourcesRes, imagesRes] = await Promise.all([
                fetch(`${API_URL}/api/sources`),
                fetch(`${API_URL}/api/images`)
            ]);
            const sourcesData = await sourcesRes.json();
            const imagesData = await imagesRes.json();
            setSources(sourcesData);
            setAllImages(imagesData);
        } catch (error) {
            console.error("Erro ao buscar dados iniciais:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleToggleFavorite = async (imageId, shouldBeFavorited) => {
        try {
            await fetch(`${API_URL}/api/favorites`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageId, favorite: shouldBeFavorited }) 
            });
            setAllImages(allImages.map(img => 
                img.id === imageId ? { ...img, isFavorited: shouldBeFavorited } : img
            ));
        } catch (error) {
            console.error("Erro ao atualizar favorito:", error);
        }
    };

    // Função de scrape ATUALIZADA para enviar o payload correto
    const handleScrape = async (payload) => {
        try {
            const response = await fetch(`${API_URL}/api/images/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido do servidor.' }));
                throw new Error(errorData.message || 'Falha ao buscar imagens.');
            }
            const data = await response.json();
            if (data && data.newSource && Array.isArray(data.newImages)) {
                setSources(prev => [...prev, data.newSource]);
                setAllImages(prev => [...data.newImages, ...prev]);
                setCurrentView('feed');
            } else {
                throw new Error("A resposta da API não continha os dados esperados.");
            }
        } catch (error) {
            console.error("Erro ao buscar imagens da URL:", error);
        }
    };
    
    const handleRemoveSource = async (sourceId) => {
        try {
            await fetch(`${API_URL}/api/sources/${sourceId}`, { method: 'DELETE' });
            fetchInitialData();
        } catch (error) {
            console.error("Erro ao remover fonte:", error);
        }
    };

    const handleSyncSource = async (sourceId) => {
        setSyncingSourceId(sourceId);
        try {
            const response = await fetch(`${API_URL}/api/sources/${sourceId}/sync`, { method: 'POST' });
            if (!response.ok) {
                throw new Error('Falha ao sincronizar.');
            }
            const { newImages } = await response.json();
            if (newImages && newImages.length > 0) {
                setAllImages(prev => [...newImages, ...prev]);
            }
            console.log(`${newImages.length} novas imagens encontradas.`);
        } catch (error) {
            console.error("Erro ao sincronizar fonte:", error);
        } finally {
            setSyncingSourceId(null);
        }
    };

    const handleDownload = (image) => {
        const imageUrl = encodeURIComponent(image.src);
        const downloadUrl = `${API_URL}/api/download?url=${imageUrl}`;
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        a.download = ''; 
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    
    const favoriteImages = allImages.filter(img => img.isFavorited);
    const feedImages = allImages.filter(img => img.sourceId !== null);

    const imagesToDisplay = currentView === 'feed' ? feedImages : favoriteImages;

    const openModal = (index) => setModalIndex(index);
    const closeModal = () => setModalIndex(null);

    const showNextImage = () => {
        if (modalIndex !== null) setModalIndex((modalIndex + 1) % imagesToDisplay.length);
    };

    const showPrevImage = () => {
        if (modalIndex !== null) setModalIndex((modalIndex - 1 + imagesToDisplay.length) % imagesToDisplay.length);
    };
    
    const renderMainContent = () => {
        if (isLoading) {
            return <div className="loading-message"><p>A carregar...</p></div>;
        }
        if (sources.length === 0) {
            return (
                <div className="empty-message welcome-message">
                    <h2>Bem-vindo ao seu Image Feed!</h2>
                    <p>Para começar, adicione um link no botão '+' acima para buscar imagens.</p>
                </div>
            );
        }
        if (currentView === 'feed') {
            if (feedImages.length === 0) {
                return <div className="empty-message"><p>O seu feed está vazio. Adicione um novo link para ver mais imagens.</p></div>;
            }
            return (
                <VirtualizedImageGrid images={feedImages} onImageClick={openModal} onToggleFavorite={handleToggleFavorite} onDownload={handleDownload} />
            );
        }
        if (currentView === 'favorites') {
            if (favoriteImages.length === 0) {
                return <div className="empty-message"><p>Você ainda não favoritou nenhuma imagem.</p></div>;
            }
            return (
                <VirtualizedImageGrid images={favoriteImages} onImageClick={openModal} onToggleFavorite={handleToggleFavorite} onDownload={handleDownload} />
            );
        }
    };

    return (
        <div className="app">
            <Header onAddLinkClick={() => setAddLinkModalOpen(true)} currentView={currentView} setCurrentView={setCurrentView} />
            
            <div className="app-body-container container">
                <SourcesList 
                    sources={sources} 
                    onRemoveSource={handleRemoveSource}
                    onSyncSource={handleSyncSource}
                    syncingSourceId={syncingSourceId}
                />
                
                <main className="main-content">
                    {renderMainContent()}
                </main>
            </div>

            {modalIndex !== null && (
                <ImageModal 
                    image={imagesToDisplay[modalIndex]}
                    onClose={closeModal}
                    onNext={showNextImage}
                    onPrev={showPrevImage}
                    onToggleFavorite={handleToggleFavorite}
                    onDownload={handleDownload}
                />
            )}
            
            <AddLinkModal isOpen={isAddLinkModalOpen} onClose={() => setAddLinkModalOpen(false)} onFetch={handleScrape} />
        </div>
    );
}
