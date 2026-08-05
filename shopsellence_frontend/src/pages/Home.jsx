import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import { API_URL } from '../config';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Track home page view
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', data: { page: 'Home' } })
      }).catch(() => {});
    } catch (e) {}

    // Fetch outfits
    const fetchFeatured = async () => {
      try {
        const response = await fetch(`${API_URL}/api/outfits?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          // Filter to first 6 items
          setFeatured(data.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load featured outfits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
    const interval = setInterval(fetchFeatured, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <HeroSlider />

      <section className="page-section" style={{ marginTop: 0, paddingTop: '60px' }}>
        <div className="container">
          <h2 className="section-title">✨ Featured Outfits</h2>
          <p className="section-sub">
            Curated looks for every occasion — from casual chic to red-carpet glam.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>
              Loading outfits...
            </div>
          ) : featured.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>
              No featured outfits found.
            </div>
          ) : (
            <div className="featured-grid">
              {featured.map((item) => {
                const imgUrl = item.image.startsWith('http') || item.image.startsWith('data:')
                  ? item.image
                  : `/${item.image}`;
                return (
                  <div
                    className="outfit-card"
                    key={item.id}
                    onClick={() => navigate(`/wardrobe?id=${item.id}`)}
                  >
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
                      <div className="category-tag">{item.category}</div>
                      <h3>{item.name}</h3>
                      <div className="price">
                        {item.price}
                        {item.oldPrice && <span className="old">{item.oldPrice}</span>}
                      </div>
                      <button
                        className="quick-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/wardrobe?id=${item.id}`);
                        }}
                      >
                        👁 View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              onClick={() => navigate('/wardrobe')}
              style={{
                display: 'inline-block',
                padding: '14px 44px',
                borderRadius: '50px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--purple-700), var(--purple-500))',
                color: 'var(--white)',
                fontWeight: 600,
                boxShadow: '0 8px 25px rgba(107, 59, 140, 0.25)',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'var(--transition)'
              }}
            >
              View All →
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
