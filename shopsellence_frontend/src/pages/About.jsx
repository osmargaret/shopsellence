import React, { useEffect } from 'react';
import { API_URL } from '../config';

export default function About() {
  useEffect(() => {
    // Track about page view
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', data: { page: 'About' } })
      }).catch(() => {});
    } catch (e) {}
  }, []);

  return (
    <>
      <div className="page-hero" style={{ backgroundImage: "url('/shopsellence_images/Hero_section.png')" }}>
        <div className="page-hero-content">
          <h1 className="page-hero-title"><span className="icon" role="img" aria-label="sparkles">✨</span> Our Story</h1>
          <p className="page-hero-sub">Celebrating identity and elegance through every thread and fabric.</p>
        </div>
      </div>
      <section className="page-section" style={{ marginTop: '0', paddingTop: '20px' }}>
        <div className="container">
          <div className="about-grid">
          <div className="about-text">
            <h2>About Shopsellence</h2>
            <p>
              At Shopsellence, we believe that style is a celebration of identity.
              Our boutique brings together the finest fabrics, bold designs, and cultural
              richness to create pieces that make you feel extraordinary.
            </p>
            <p>
              From bespoke suits to flowing gowns, every outfit is crafted with care,
              ensuring you look and feel your best for every moment that matters.
            </p>

            <div className="address-block">
              <h4>📍 Nigeria</h4>
              <p>55 Adeniran Ogunsanya, Surulere,</p>
              <p>Lagos, Nigeria.</p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem', color: 'var(--purple-700)' }}>
                <span style={{ fontSize: '1.3rem' }}>✉</span>
                <a href="mailto:shopsellence@gmail.com" style={{ fontWeight: 500 }}>
                  shopsellence@gmail.com
                </a>
              </p>
            </div>
          </div>
          <div className="about-image">
            <img
              src="/shopsellence_images/CEO_OF_SHOPSELLENCE.jpg"
              alt="Agbafor Treasure - CEO of Shopsellence"
              className="ceo-profile-img"
              onError={(e) => {
                e.target.src = '/shopsellence_images/logo.png';
              }}
            />
            <h3 style={{ marginTop: '20px' }}>Agbafor Treasure</h3>
            <p
              style={{
                color: 'var(--purple-500)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginTop: '4px'
              }}
            >
              Founder &amp; Creative Director
            </p>
            <p style={{ color: 'var(--gray-600)', marginTop: '12px', maxWidth: '360px', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Every piece at Shopsellence begins as a vision of sophistication. Under the creative direction of Agbafor Treasure, we curate and craft premium men's clothing and luxury shoes that define style, quality, and class. We weave confidence into every stitch, turning high-quality fabrics and premium leather into bespoke masterpieces designed to elevate the modern individual.
            </p>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
