import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  // Hide default footer inside the admin panel
  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) return null;

  return (
    <footer className="footer">
      <div className="container">
        <div className="brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img
              src="/shopsellence_images/logo.png"
              alt="Shopsellence Logo"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <h3 style={{ marginBottom: 0, fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--white)' }}>
              Shopsellence
            </h3>
          </div>
          <p>Bespoke fashion for the modern individual — where tradition meets trend.</p>
          <p style={{ marginTop: '8px', opacity: 0.5, fontSize: '0.85rem' }}>Lagos, Nigeria</p>
        </div>

        <div className="links">
          <h4>Navigation</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/wardrobe">Store</Link>
            </li>
            <li>
              <Link to="/about">About Us</Link>
            </li>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
          </ul>
        </div>

        <div className="contact-footer">
          <h4>Reach Us</h4>
          <p>55 Adeniran Ogunsanya, Surulere, Lagos</p>
          <p className="email" style={{ color: 'var(--gold)' }}>shopsellence@gmail.com</p>
          <p style={{ marginTop: '4px' }}>07032550563</p>
        </div>

        <div className="bottom">
          &copy; {new Date().getFullYear()} Shopsellence. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
