import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_URL } from '../config';

export default function Wardrobe() {
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeTag, setActiveTag] = useState('');

  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const itemsPerPage = 6;

  useEffect(() => {
    // Track wardrobe page view
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', data: { page: 'Wardrobe' } })
      }).catch(() => {});
    } catch (e) {}

    // Fetch outfits
    const fetchOutfits = async () => {
      try {
        const response = await fetch(`${API_URL}/api/outfits`);
        if (response.ok) {
          const data = await response.json();
          setOutfits(data);

          // Check if there is an id in query params and open it
          const queryId = searchParams.get('id');
          if (queryId) {
            const matched = data.find((o) => String(o.id) === String(queryId));
            if (matched) {
              openModal(matched);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load wardrobe outfits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOutfits();
    const interval = setInterval(fetchOutfits, 5000);
    return () => clearInterval(interval);
  }, [searchParams]);

  const openModal = (outfit) => {
    setSelectedOutfit(outfit);
    
    // Default size and color selections
    const sizesList = (outfit.sizes || 'Free Size').split(',').map((s) => s.trim());
    setSelectedSize(sizesList[0] || 'Free Size');
    
    const colorsList = outfit.colours || [];
    setSelectedColor(colorsList[0] || '');

    // Track outfit view
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'outfit_view',
          data: { outfitId: outfit.id, outfitName: outfit.name }
        })
      }).catch(() => {});
    } catch (e) {}
  };

  const closeModal = () => {
    setSelectedOutfit(null);
    setSelectedSize('');
    setSelectedColor('');
    // Remove query params
    setSearchParams({});
  };

  // Filter outfits by tab category
  const categoryOutfits = category === 'all'
    ? outfits
    : outfits.filter((o) => o.category === category);

  // Extract unique tags for the currently filtered category outfits
  const uniqueTags = Array.from(
    new Set(
      categoryOutfits.flatMap((o) => o.tags || [])
    )
  ).filter(Boolean);

  // Further filter outfits by active tag
  const filteredOutfits = categoryOutfits.filter((o) => {
    if (!activeTag) return true;
    return (o.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase());
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredOutfits.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOutfits = filteredOutfits.slice(startIndex, startIndex + itemsPerPage);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setActiveTag(''); // Reset tag filter on category change
    setCurrentPage(1);
  };

  const getWhatsAppLink = (item) => {
    const waMsg = encodeURIComponent(
      `Hi Shopsellence! ✦\nI would like to order this bespoke piece:\n- *${item.name}*\n- Size: ${selectedSize}\n- Color: ${selectedColor}\n- Price: ${item.price}`
    );
    return `https://wa.me/2347032550563?text=${waMsg}`;
  };

  return (
    <>
      <div className="page-hero" style={{ backgroundImage: "url('/shopsellence_images/Hero_section.png')" }}>
        <div className="page-hero-content">
          <h1 className="page-hero-title">Wardrobe</h1>
          <p className="page-hero-sub">Explore our collections — from timeless classics to bold new statements.</p>
        </div>
      </div>
      <section className="page-section" style={{ marginTop: '0', paddingTop: '20px' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '10px' }}>Store</h2>
          <p className="section-sub" style={{ textAlign: 'center', marginBottom: '40px' }}>Explore our range of premium shoes and bespoke tailoring for men.</p>

          {/* Category Tabs */}
          <div className="category-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {['all', 'outfits', 'suit', 'shoes', 'accessories'].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`tab-btn ${category === cat ? 'active' : ''}`}
                style={{
                  padding: '10px 24px',
                  borderRadius: '50px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: category === cat ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : 'rgba(255, 255, 255, 0.05)',
                  color: category === cat ? 'var(--purple-950)' : 'var(--gray-600)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textTransform: 'capitalize',
                  outline: 'none'
                }}
              >
                {cat === 'suit' ? 'suits' : cat}
              </button>
            ))}
          </div>

          {/* Tag Sub-Filters */}
          {uniqueTags.length > 0 && (
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600 }}>Filter by Tag:</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setActiveTag(''); setCurrentPage(1); }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: activeTag === '' ? 'var(--gold)' : 'transparent',
                    color: activeTag === '' ? 'var(--purple-950)' : 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.85rem',
                    fontWeight: activeTag === '' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                >
                  All Tags
                </button>
                {uniqueTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => { setActiveTag(tag); setCurrentPage(1); }}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      background: activeTag.toLowerCase() === tag.toLowerCase() ? 'var(--gold)' : 'transparent',
                      color: activeTag.toLowerCase() === tag.toLowerCase() ? 'var(--purple-950)' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: activeTag.toLowerCase() === tag.toLowerCase() ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textTransform: 'capitalize',
                      outline: 'none'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-600)' }}>
            Loading wardrobe collections...
          </div>
        ) : paginatedOutfits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--gray-600)' }}>
            No outfits found in this category.
          </div>
        ) : (
          <>
            <div className="gallery-grid">
              {paginatedOutfits.map((item) => {
                const imgUrl = item.image.startsWith('http') || item.image.startsWith('data:')
                  ? item.image
                  : `/${item.image}`;
                return (
                  <div className="outfit-card" key={item.id} onClick={() => openModal(item)}>
                    <div className="card-img">
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="outfit-img"
                        onError={(e) => {
                          e.target.src = '/shopsellence_images/logo.png';
                        }}
                      />
                      {item.badgeText && (
                        <span className={`badge ${item.badge || ''}`}>
                          {item.badgeText}
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      <div className="category-tag" style={{ textTransform: 'capitalize' }}>
                        {item.category}
                      </div>
                      <h3>{item.name}</h3>
                      <div className="price">
                        {item.price}
                        {item.oldPrice && <span className="old">{item.oldPrice}</span>}
                      </div>
                      <button className="quick-view" onClick={() => openModal(item)}>
                        👁 View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Item Details View Modal Overlay */}
      {selectedOutfit && (
        <div className="modal-overlay open" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>
              ✕
            </button>
            <div className="modal-grid">
              <div className="modal-img-container">
                <img
                  src={
                    selectedOutfit.image.startsWith('http') || selectedOutfit.image.startsWith('data:')
                      ? selectedOutfit.image
                      : `/${selectedOutfit.image}`
                  }
                  alt={selectedOutfit.name}
                  onError={(e) => {
                    e.target.src = '/shopsellence_images/logo.png';
                  }}
                />
              </div>
              <div className="modal-content-details">
                <div className="modal-category" style={{ textTransform: 'capitalize' }}>
                  {selectedOutfit.category}
                </div>
                <h2 className="modal-title">{selectedOutfit.name}</h2>
                <div className="modal-price">
                  {selectedOutfit.price}
                  {selectedOutfit.oldPrice && <span className="old">{selectedOutfit.oldPrice}</span>}
                </div>
                <p className="modal-desc">{selectedOutfit.description}</p>

                <div className="modal-details-rows">
                  <div className="modal-detail-item">
                    <h5>Fabric</h5>
                    <p>{selectedOutfit.fabric || 'Premium Bespoke Blend'}</p>
                  </div>
                  <div className="modal-detail-item">
                    <h5>Available Sizes</h5>
                    <p>{selectedOutfit.sizes}</p>
                  </div>
                  <div className="modal-detail-item">
                    <h5>Availability</h5>
                    <p className="in-stock">{selectedOutfit.availability || 'In Stock'}</p>
                  </div>
                </div>

                {/* Color swatches */}
                {selectedOutfit.colours && selectedOutfit.colours.length > 0 && (
                  <div className="modal-colors-swatches">
                    <h5>Colours Available</h5>
                    <div className="color-swatches-row">
                      {selectedOutfit.colours.map((color) => (
                        <span
                          key={color}
                          className={`color-swatch ${selectedColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                        ></span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interactive Size & Color Dropdowns */}
                <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--purple-300)', marginBottom: '6px' }}>Select Size</h5>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontFamily: 'var(--font-sans)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        fontWeight: '500'
                      }}
                    >
                      {(selectedOutfit.sizes || 'Free Size').split(',').map((s) => (
                        <option value={s.trim()} key={s} style={{ background: '#1C1026' }}>
                          {s.trim()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--purple-300)', marginBottom: '6px' }}>Select Color</h5>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        fontFamily: 'var(--font-sans)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'white',
                        fontWeight: '500'
                      }}
                    >
                      {(selectedOutfit.colours || []).map((c) => (
                        <option value={c} key={c} style={{ background: '#1C1026' }}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Checkout & Add to Cart Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    className="btn-whatsapp"
                    style={{
                      justifyContent: 'center',
                      background: 'var(--purple-700)',
                      boxShadow: '0 8px 25px rgba(107,59,140,0.25)'
                    }}
                    onClick={() => {
                      addToCart(selectedOutfit, selectedSize, selectedColor);
                      closeModal();
                    }}
                  >
                    🛒 Add to Cart
                  </button>
                  <a
                    href={getWhatsAppLink(selectedOutfit)}
                    className="btn-whatsapp"
                    target="_blank"
                    rel="noreferrer"
                  >
                    💬 Buy Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </section>
    </>
  );
}
