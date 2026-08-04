import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Track contact page view
    try {
      fetch(`${API_URL}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page_view', data: { page: 'Contact' } })
      }).catch(() => {});
    } catch (e) {}
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, message } = formData;

    if (name && email && message) {
      setIsSending(true);

      // Save to SQL database
      try {
        const response = await fetch(`${API_URL}/api/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        if (response.ok) {
          console.log('✅ Enquiry saved to backend');
        }
      } catch (err) {
        console.warn('Backend server offline, saved locally:', err);
        // Fallback: save to localStorage for real-time offline visibility in admin panel
        try {
          const localMsgs = JSON.parse(localStorage.getItem('shopsellence_messages') || '[]');
          localMsgs.push({
            name,
            email,
            message,
            date: new Date().toLocaleString()
          });
          localStorage.setItem('shopsellence_messages', JSON.stringify(localMsgs));
        } catch (e) {}
      }

      setIsSending(false);

      // Redirect to WhatsApp
      const waMsg = encodeURIComponent(
        `Hi Shopsellence! My name is ${name} (${email}). Message: ${message}`
      );
      window.open(`https://wa.me/2347032550563?text=${waMsg}`, '_blank');
      
      // Reset form
      setFormData({ name: '', email: '', message: '' });
    }
  };

  return (
    <>
      <div className="page-hero" style={{ backgroundImage: "url('/shopsellence_images/Hero_section.png')" }}>
        <div className="page-hero-content">
          <h1 className="page-hero-title"><span className="icon" role="img" aria-label="mailbox">📬</span> Contact Us</h1>
          <p className="page-hero-sub">We'd love to hear from you — reach out for enquiries, orders, or styling advice.</p>
        </div>
      </div>
      <section className="page-section" style={{ marginTop: '0', paddingTop: '20px' }}>
        <div className="container">

        <div className="contact-grid">
          <div className="contact-info">
            <div className="info-item">
              <div className="icon">📍</div>
              <div className="text">
                <h4>Visit Us</h4>
                <p>55 Adeniran Ogunsanya, Surulere, Lagos, Nigeria</p>
              </div>
            </div>
            <div className="info-item">
              <div className="icon">📞</div>
              <div className="text">
                <h4>Call / WhatsApp</h4>
                <p>07032550563</p>
              </div>
            </div>
            <div className="info-item">
              <div className="icon">✉</div>
              <div className="text">
                <h4>Email</h4>
                <p>
                  <a href="mailto:shopsellence@gmail.com" style={{ color: 'var(--purple-700)', fontWeight: 500 }}>
                    shopsellence@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="contact-form">
            <h3>Send a Message</h3>
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                placeholder="Full name"
                required
                value={formData.name}
                onChange={handleChange}
              />

              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />

              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                placeholder="Tell us about your style needs…"
                required
                value={formData.message}
                onChange={handleChange}
              ></textarea>

              <button type="submit" className="btn-primary-form" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Message via WhatsApp →'}
              </button>
            </form>
          </div>
        </div>
      </div>
      </section>
    </>
  );
}
