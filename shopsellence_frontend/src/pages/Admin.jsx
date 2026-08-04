import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [outfits, setOutfits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalPageViews: 0,
    totalCartAdds: 0,
    totalCheckouts: 0,
    dailyViews: [],
    topOutfits: [],
    recentEvents: []
  });

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState(null);
  const [outfitForm, setOutfitForm] = useState({
    name: '',
    category: 'outfits',
    price: '',
    oldPrice: '',
    image: '',
    badge: '',
    badgeText: '',
    fabric: '',
    sizes: 'S, M, L, XL, 2XL',
    colours: '#D4AF37, #1F2937',
    description: '',
    availability: 'In Stock',
    tags: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Modal forms

  // Settings
  const [settingsForm, setSettingsForm] = useState({
    currentPasscode: '',
    newPasscode: ''
  });
  const [settingsMsg, setSettingsMsg] = useState({ type: '', text: '' });

  // Initial Auth Check
  useEffect(() => {
    const token = sessionStorage.getItem('shopsellence_admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch admin dashboard details
  useEffect(() => {
    let intervalId;
    if (isAuthenticated) {
      fetchDashboardData();
      // Enable real-time updates without socket.io via short polling
      intervalId = setInterval(() => {
        fetchDashboardData();
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, activeTab]);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Outfits
      const outfitsRes = await fetch(`${API_URL}/api/outfits`);
      if (outfitsRes.ok) {
        const data = await outfitsRes.json();
        setOutfits(data);
      }

      // 2. Fetch Enquiries
      const enquiriesRes = await fetch(`${API_URL}/api/enquiries`);
      if (enquiriesRes.ok) {
        const data = await enquiriesRes.json();
        setEnquiries(data);
      }

      // 4. Fetch Analytics
      const analyticsRes = await fetch(`${API_URL}/api/analytics`);
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Failed to load admin dashboard statistics:', e);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('shopsellence_admin_token', data.token);
        setIsAuthenticated(true);
      } else {
        const err = await response.json();
        setLoginError(err.error || 'Authentication failed.');
      }
    } catch (err) {
      setLoginError('Error connecting to backend API.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('shopsellence_admin_token');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // Outfit CRUD
  const openAddOutfit = () => {
    setEditingOutfit(null);
    setOutfitForm({
      name: '',
      category: 'outfits',
      price: '',
      oldPrice: '',
      image: '',
      badge: '',
      badgeText: '',
      fabric: '',
      sizes: 'S, M, L, XL, 2XL',
      colours: '#D4AF37, #1F2937',
      description: '',
      availability: 'In Stock',
      tags: ''
    });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const openEditOutfit = (item) => {
    setEditingOutfit(item);
    setOutfitForm({
      name: item.name,
      category: item.category,
      price: item.price,
      oldPrice: item.oldPrice || '',
      image: item.image,
      badge: item.badge || '',
      badgeText: item.badgeText || '',
      fabric: item.fabric || '',
      sizes: item.sizes || 'S, M, L, XL, 2XL',
      colours: (item.colours || []).join(', '),
      description: item.description || '',
      availability: item.availability || 'In Stock',
      tags: (item.tags || []).join(', ')
    });
    setImageFile(null);
    setImagePreview(item.image.startsWith('http') || item.image.startsWith('data:') ? item.image : `/${item.image}`);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveOutfit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', outfitForm.name);
    formData.append('category', outfitForm.category);
    formData.append('price', outfitForm.price);
    formData.append('oldPrice', outfitForm.oldPrice);
    formData.append('description', outfitForm.description);
    formData.append('fabric', outfitForm.fabric);
    formData.append('sizes', outfitForm.sizes);
    formData.append('colours', outfitForm.colours);
    formData.append('availability', outfitForm.availability);
    formData.append('badge', outfitForm.badge);
    formData.append('badgeText', outfitForm.badgeText);
    formData.append('tags', outfitForm.tags);
    
    if (imageFile) {
      formData.append('imageFile', imageFile);
    } else {
      formData.append('image', outfitForm.image);
    }

    try {
      const url = editingOutfit
        ? `${API_URL}/api/outfits/${editingOutfit.id}`
        : `${API_URL}/api/outfits`;
      const method = editingOutfit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchDashboardData();
        alert(editingOutfit ? 'Outfit updated successfully.' : 'Outfit created successfully.');
      } else {
        alert('Failed to save outfit.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving outfit record.');
    }
  };

  const deleteOutfit = async (id) => {
    if (window.confirm('Are you sure you want to delete this outfit?')) {
      try {
        const response = await fetch(`${API_URL}/api/outfits/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchDashboardData();
        } else {
          alert('Failed to delete outfit.');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Inbox Enquiries
  const deleteEnquiry = async (id) => {
    if (window.confirm('Delete this message?')) {
      try {
        const response = await fetch(`${API_URL}/api/enquiries/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchDashboardData();
        }
      } catch (e) {}
    }
  };

  const clearAllEnquiries = async () => {
    if (window.confirm('Are you sure you want to clear ALL enquiries?')) {
      try {
        const response = await fetch(`${API_URL}/api/enquiries`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchDashboardData();
        }
      } catch (e) {}
    }
  };

  // Measurements CRM
  const deleteMeasurement = async (id) => {
    if (window.confirm('Delete this measurement sheet?')) {
      try {
        const response = await fetch(`${API_URL}/api/measurements/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchDashboardData();
        }
      } catch (e) {}
    }
  };

  // Settings updating
  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsMsg({ type: '', text: '' });
    try {
      const response = await fetch(`${API_URL}/api/change-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      const data = await response.json();
      if (response.ok) {
        setSettingsMsg({ type: 'success', text: 'Passcode updated! Re-login required.' });
        setSettingsForm({ currentPasscode: '', newPasscode: '' });
        setTimeout(() => handleLogout(), 2000);
      } else {
        setSettingsMsg({ type: 'error', text: data.error || 'Failed to update passcode.' });
      }
    } catch (err) {
      setSettingsMsg({ type: 'error', text: 'Failed to connect to API.' });
    }
  };

  // Render Login state if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        background: 'var(--purple-950)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'var(--purple-900)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '400px',
          padding: '36px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          color: 'white',
          textAlign: 'center'
        }}>
          <img src="/shopsellence_images/logo.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'cover', margin: '0 auto 16px', border: '2px solid var(--gold)', borderRadius: '50%' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '8px' }}>Shopsellence Admin</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '24px' }}>Please authenticate using the admin passcode</p>
          
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin passcode"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                fontSize: '1rem',
                marginBottom: '16px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            {loginError && <p style={{ color: 'var(--red-500)', fontSize: '0.85rem', marginBottom: '16px' }}>⚠️ {loginError}</p>}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                color: 'var(--purple-950)',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(212,175,55,0.3)'
              }}
            >
              Sign In ✦
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const totalOutfits = outfits.length;
  const outfitsCount = outfits.filter(o => o.category === 'outfits').length;
  const suitsCount = outfits.filter(o => o.category === 'suit').length;
  const shoesCount = outfits.filter(o => o.category === 'shoes').length;
  const accessoriesCount = outfits.filter(o => o.category === 'accessories').length;
  const inboxCount = enquiries.length;

  return (
    <div className="admin-body">
      {/* MOBILE TOP BAR */}
      <div className="admin-mobile-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '1.6rem',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Toggle Sidebar"
          >
            ☰
          </button>
          <img src="/shopsellence_images/logo.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--gold)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '1.1rem' }}>Shopsellence <span style={{ color: 'var(--gold)' }}>✦</span></span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem'
          }}
        >
          Sign Out
        </button>
      </div>

      {/* SIDEBAR OVERLAY */}
      {isSidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand-header">
          <img src="/shopsellence_images/logo.png" alt="Logo" className="admin-brand-logo" />
          <span className="admin-brand-name">Shopsellence <span>✦</span></span>
        </div>
        <ul className="admin-menu-list">
          <li className={`admin-menu-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}>
              <span className="icon">📊</span>
              <span>Dashboard</span>
            </button>
          </li>
          <li className={`admin-menu-item ${activeTab === 'outfits' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('outfits'); setIsSidebarOpen(false); }}>
              <span className="icon">👗</span>
              <span>Outfits Manager</span>
            </button>
          </li>
          <li className={`admin-menu-item ${activeTab === 'inbox' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('inbox'); setIsSidebarOpen(false); }}>
              <span className="icon">📬</span>
              <span>Inbox ({inboxCount})</span>
            </button>
          </li>
          <li className={`admin-menu-item ${activeTab === 'analytics' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('analytics'); setIsSidebarOpen(false); }}>
              <span className="icon">📈</span>
              <span>Analytics</span>
            </button>
          </li>
          <li className={`admin-menu-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}>
              <span className="icon">⚙️</span>
              <span>Settings</span>
            </button>
          </li>
        </ul>
        <div style={{ marginTop: 'auto', padding: '10px 0', textAlign: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)',
              padding: '6px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'var(--transition)'
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="admin-main-content">
        <header className="admin-content-header">
          <h1 style={{ textTransform: 'capitalize' }}>
            {activeTab === 'dashboard' ? 'Overview' : activeTab === 'outfits' ? 'Inventory' : activeTab}
          </h1>
          {activeTab === 'outfits' && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="🔍 Search name or price..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: 'white',
                  fontSize: '0.9rem',
                  outline: 'none',
                  minWidth: '240px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              <button className="btn-admin-primary" onClick={openAddOutfit}>
                ➕ Add Outfit
              </button>
            </div>
          )}
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="info">
                  <h3>Outfits</h3>
                  <div className="number">{outfitsCount}</div>
                </div>
                <div className="icon-box">🧥</div>
              </div>
              <div className="admin-stat-card">
                <div className="info">
                  <h3>Suit</h3>
                  <div className="number">{suitsCount}</div>
                </div>
                <div className="icon-box">👔</div>
              </div>
              <div className="admin-stat-card">
                <div className="info">
                  <h3>Shoes</h3>
                  <div className="number">{shoesCount}</div>
                </div>
                <div className="icon-box">👞</div>
              </div>
              <div className="admin-stat-card">
                <div className="info">
                  <h3>Accessories</h3>
                  <div className="number">{accessoriesCount}</div>
                </div>
                <div className="icon-box">💼</div>
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-light)', marginBottom: '16px' }}>
              Recent Customer Messages
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {enquiries.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--purple-900)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: '4px solid var(--gold)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--gold-light)', fontSize: '1rem' }}>{item.name}</strong>
                    <span>{item.date}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--purple-500)', marginBottom: '10px' }}>📧 {item.email}</div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', fontSize: '0.95rem' }}>
                    {item.message}
                  </p>
                </div>
              ))}
              {enquiries.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px' }}>No unread enquiries.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: OUTFITS MANAGER */}
        {activeTab === 'outfits' && (() => {
          const filteredOutfits = outfits.filter(o => 
            o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.price && o.price.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          const totalPages = Math.ceil(filteredOutfits.length / itemsPerPage);
          const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
          const startIndex = (validCurrentPage - 1) * itemsPerPage;
          const paginatedOutfits = filteredOutfits.slice(startIndex, startIndex + itemsPerPage);

          return (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Img</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Fabric</th>
                    <th>Badge</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOutfits.map((item) => {
                    const imgUrl = item.image.startsWith('http') || item.image.startsWith('data:')
                      ? item.image
                      : `/${item.image}`;
                    return (
                      <tr key={item.id}>
                        <td>
                          <img
                            src={imgUrl}
                            className="admin-img-cell"
                            alt={item.name}
                            onError={(e) => {
                              e.target.src = '/shopsellence_images/logo.png';
                            }}
                          />
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--gold-light)' }}>{item.name}</td>
                        <td style={{ textTransform: 'capitalize' }}>{item.category}</td>
                        <td style={{ fontWeight: 700 }}>{item.price}</td>
                        <td>{item.fabric || '-'}</td>
                        <td>
                          <span className={`admin-badge-span ${item.badge || 'none'}`}>
                            {item.badgeText || 'None'}
                          </span>
                        </td>
                        <td>
                          <button className="admin-btn-action edit" onClick={() => openEditOutfit(item)}>
                            ✏️ Edit
                          </button>
                          <button className="admin-btn-action delete" onClick={() => deleteOutfit(item.id)}>
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOutfits.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                        No matching outfits found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="admin-pagination" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  borderBottomLeftRadius: '12px',
                  borderBottomRightRadius: '12px',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Showing <strong style={{ color: 'var(--gold-light)' }}>{filteredOutfits.length > 0 ? startIndex + 1 : 0}</strong> to <strong style={{ color: 'var(--gold-light)' }}>{Math.min(startIndex + itemsPerPage, filteredOutfits.length)}</strong> of <strong style={{ color: 'var(--gold-light)' }}>{filteredOutfits.length}</strong> outfits
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={validCurrentPage === 1}
                      style={{
                        background: validCurrentPage === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                        color: validCurrentPage === 1 ? 'rgba(255,255,255,0.3)' : 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ◀ Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          background: pageNum === validCurrentPage ? 'linear-gradient(135deg, var(--gold), var(--gold-light))' : 'rgba(255,255,255,0.1)',
                          color: pageNum === validCurrentPage ? 'var(--purple-950)' : 'white',
                          border: pageNum === validCurrentPage ? 'none' : '1px solid rgba(255,255,255,0.1)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: pageNum === validCurrentPage ? 700 : 500,
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={validCurrentPage === totalPages}
                      style={{
                        background: validCurrentPage === totalPages ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                        color: validCurrentPage === totalPages ? 'rgba(255,255,255,0.3)' : 'white',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: validCurrentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: INBOX */}
        {activeTab === 'inbox' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <button
                className="admin-btn-action delete"
                style={{ padding: '10px 20px', borderRadius: '8px' }}
                onClick={clearAllEnquiries}
                disabled={enquiries.length === 0}
              >
                🧹 Clear All Messages
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {enquiries.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--purple-900)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative'
                  }}
                >
                  <button
                    onClick={() => deleteEnquiry(item.id)}
                    style={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      fontSize: '1.2rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 style={{ color: 'var(--gold-light)' }}>{item.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{item.date}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--purple-500)', fontWeight: 500, marginBottom: '12px' }}>
                    📧 {item.email}
                  </div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.6,
                    background: 'rgba(0, 0, 0, 0.15)',
                    padding: '16px',
                    borderRadius: '10px',
                    borderLeft: '3px solid var(--gold)'
                  }}>
                    {item.message}
                  </p>
                </div>
              ))}
              {enquiries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
                  📬 Your inbox is clean. No enquiries yet!
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ANALYTICS */}
        {activeTab === 'analytics' && (() => {
          const maxViews = Math.max(...(analytics.dailyViews || []).map(d => d.views), 10);
          const totalViews = analytics.totalPageViews || 0;
          const totalCart = analytics.totalCartAdds || 0;
          const totalCheckouts = analytics.totalCheckouts || 0;
          const conversionRate = totalViews > 0 ? ((totalCheckouts / totalViews) * 100).toFixed(1) : '0.0';

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Analytics Stats Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card" style={{ background: 'var(--purple-900)' }}>
                  <div className="info">
                    <h3>Total Views</h3>
                    <div className="number">{totalViews}</div>
                  </div>
                  <div className="icon-box" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-light)' }}>👁</div>
                </div>
                <div className="admin-stat-card" style={{ background: 'var(--purple-900)' }}>
                  <div className="info">
                    <h3>Cart Additions</h3>
                    <div className="number">{totalCart}</div>
                  </div>
                  <div className="icon-box" style={{ background: 'rgba(168,85,247,0.1)', color: 'rgb(168,85,247)' }}>🛒</div>
                </div>
                <div className="admin-stat-card" style={{ background: 'var(--purple-900)' }}>
                  <div className="info">
                    <h3>WhatsApp Checkouts</h3>
                    <div className="number">{totalCheckouts}</div>
                  </div>
                  <div className="icon-box" style={{ background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)' }}>📞</div>
                </div>
                <div className="admin-stat-card" style={{ background: 'var(--purple-900)' }}>
                  <div className="info">
                    <h3>Conversion Rate</h3>
                    <div className="number">{conversionRate}%</div>
                  </div>
                  <div className="icon-box" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold-light)' }}>📈</div>
                </div>
              </div>

              {/* Chart Section */}
              <div style={{
                background: 'var(--purple-900)',
                padding: '24px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-light)', marginBottom: '20px', fontSize: '1.2rem' }}>
                  📊 Daily Traffic Overview
                </h3>
                {(!analytics.dailyViews || analytics.dailyViews.length === 0) ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    No views tracked yet. Data will populate in real-time as users browse.
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    height: '240px',
                    padding: '20px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    {analytics.dailyViews.map((d) => {
                      const pct = (d.views / maxViews) * 100;
                      return (
                        <div key={d.date} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: 1,
                          height: '100%',
                          justifyContent: 'flex-end'
                        }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--gold-light)', marginBottom: '8px', fontWeight: 600 }}>
                            {d.views}
                          </span>
                          <div style={{
                            width: '40px',
                            height: `${pct}%`,
                            background: 'linear-gradient(to top, var(--gold), var(--gold-light))',
                            borderRadius: '6px 6px 0 0',
                            transition: 'height 0.4s ease',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(212,175,55,0.2)'
                          }} title={`Date: ${d.date} | Views: ${d.views}`}></div>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                            {d.date.substring(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Products & Activity Feed Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Popular Outfits */}
                <div style={{
                  background: 'var(--purple-900)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-light)', marginBottom: '16px', fontSize: '1.2rem' }}>
                    🔥 Top Viewed Items
                  </h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                          <th style={{ padding: '8px 4px' }}>Product Name</th>
                          <th style={{ padding: '8px 4px' }}>Category</th>
                          <th style={{ padding: '8px 4px', textAlign: 'right' }}>Interest (Views)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics.topOutfits || []).map((o, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px 4px', color: 'white', fontWeight: 600 }}>{o.name}</td>
                            <td style={{ padding: '10px 4px', textTransform: 'capitalize', color: 'rgba(255,255,255,0.6)' }}>{o.category}</td>
                            <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--gold-light)' }}>{o.views}</td>
                          </tr>
                        ))}
                        {(!analytics.topOutfits || analytics.topOutfits.length === 0) && (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>
                              No product views logged yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Live Activity Feed */}
                <div style={{
                  background: 'var(--purple-900)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-light)', fontSize: '1.2rem', margin: 0 }}>
                      ⚡ Live Event Stream
                    </h3>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(34,197,94,0.1)', color: 'rgb(34,197,94)', padding: '4px 10px', borderRadius: '10px', fontWeight: 600 }}>
                      Real-time Feed
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxHeight: '320px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {(analytics.recentEvents || []).map((ev, idx) => {
                      let text = '';
                      let icon = '';
                      let color = 'rgba(255,255,255,0.85)';
                      if (ev.type === 'page_view') {
                        text = `Visited page: ${ev.data?.page || 'Unknown'}`;
                        icon = '👁';
                      } else if (ev.type === 'outfit_view') {
                        text = `Viewed product details: ${ev.data?.outfitName || 'Unknown'}`;
                        icon = '🔎';
                      } else if (ev.type === 'cart_add') {
                        text = `Added item to cart: ${ev.data?.outfitName || 'Unknown'}`;
                        icon = '🛒';
                        color = 'rgb(168,85,247)';
                      } else if (ev.type === 'checkout') {
                        text = `Initiated Checkout (${ev.data?.items} items, ₦${(ev.data?.total || 0).toLocaleString()})`;
                        icon = '📞';
                        color = 'var(--gold)';
                      }
                      
                      const timeStr = new Date(ev.timestamp).toLocaleTimeString();

                      return (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          padding: '8px 12px',
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          fontSize: '0.82rem'
                        }}>
                          <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ color, fontWeight: 500 }}>{text}</div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{timeStr}</div>
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics.recentEvents || analytics.recentEvents.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>
                        No user actions captured yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="admin-table-container" style={{ padding: '28px', background: 'var(--purple-900)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--gold-light)', marginBottom: '8px' }}>
              🔒 Admin Passcode Settings
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Modify the authentication passcode required to access this dashboard.
            </p>
            <form onSubmit={handleSettingsSubmit}>
              <div className="admin-form-grid" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Current Passcode</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter current passcode"
                    value={settingsForm.currentPasscode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, currentPasscode: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>New Passcode (min 6 characters)</label>
                  <input
                    type="password"
                    required
                    minlength="6"
                    placeholder="Enter new passcode"
                    value={settingsForm.newPasscode}
                    onChange={(e) => setSettingsForm({ ...settingsForm, newPasscode: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
              </div>
              
              {settingsMsg.text && (
                <div style={{
                  marginBottom: '20px',
                  color: settingsMsg.type === 'success' ? 'var(--teal-500)' : 'var(--red-500)',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}>
                  {settingsMsg.text}
                </div>
              )}

              <button type="submit" className="btn-admin-primary" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: 'white' }}>
                🔐 Update Passcode
              </button>
            </form>
          </div>
        )}
      </main>

      {/* CRUD OUTFIT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay open" style={{ display: 'flex' }} onClick={() => setIsModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>
                {editingOutfit ? 'Edit Outfit Details' : 'Add Outfit'}
              </h2>
              <button className="close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            </header>

            <form onSubmit={saveOutfit}>
              <div className="admin-form-grid">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Outfit Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Royal Agbada"
                    value={outfitForm.name}
                    onChange={(e) => setOutfitForm({ ...outfitForm, name: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Category</label>
                  <select
                    value={outfitForm.category}
                    onChange={(e) => setOutfitForm({ ...outfitForm, category: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  >
                    <option value="outfits" style={{ background: '#1C1026' }}>Outfits</option>
                    <option value="suit" style={{ background: '#1C1026' }}>Suit</option>
                    <option value="shoes" style={{ background: '#1C1026' }}>Shoes</option>
                    <option value="accessories" style={{ background: '#1C1026' }}>Accessories</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Price</label>
                  <input
                    type="text"
                    required
                    placeholder="₦80,000"
                    value={outfitForm.price}
                    onChange={(e) => setOutfitForm({ ...outfitForm, price: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Old Price (Optional)</label>
                  <input
                    type="text"
                    placeholder="₦100,000"
                    value={outfitForm.oldPrice}
                    onChange={(e) => setOutfitForm({ ...outfitForm, oldPrice: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Fabric Material</label>
                  <input
                    type="text"
                    required
                    placeholder="Premium Brocade Lace"
                    value={outfitForm.fabric}
                    onChange={(e) => setOutfitForm({ ...outfitForm, fabric: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Available Sizes</label>
                  <input
                    type="text"
                    required
                    placeholder="S, M, L, XL, 2XL"
                    value={outfitForm.sizes}
                    onChange={(e) => setOutfitForm({ ...outfitForm, sizes: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Colours (Comma-separated Hex, e.g. #D4AF37, #000)</label>
                  <input
                    type="text"
                    required
                    placeholder="#D4AF37, #1F2937"
                    value={outfitForm.colours}
                    onChange={(e) => setOutfitForm({ ...outfitForm, colours: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Tags (Comma-separated, e.g. Shoes, Pants, Shirts, Polo)</label>
                  <input
                    type="text"
                    placeholder="Pants, Shirts, Polo"
                    value={outfitForm.tags}
                    onChange={(e) => setOutfitForm({ ...outfitForm, tags: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Badge (Optional)</label>
                  <select
                    value={outfitForm.badge}
                    onChange={(e) => setOutfitForm({ ...outfitForm, badge: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  >
                    <option value="" style={{ background: '#1C1026' }}>None</option>
                    <option value="new" style={{ background: '#1C1026' }}>New</option>
                    <option value="sale" style={{ background: '#1C1026' }}>Sale</option>
                    <option value="luxury" style={{ background: '#1C1026' }}>Luxury</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Badge Text</label>
                  <input
                    type="text"
                    placeholder="New / Sale / Hot"
                    value={outfitForm.badgeText}
                    onChange={(e) => setOutfitForm({ ...outfitForm, badgeText: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Image File Upload (Converts to Base64 in Database)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Image Preview:</p>
                      <img src={imagePreview} alt="Preview" style={{ width: '80px', height: '100px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Description</label>
                  <textarea
                    required
                    placeholder="Describe the dress/suit detailing..."
                    value={outfitForm.description}
                    onChange={(e) => setOutfitForm({ ...outfitForm, description: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', resize: 'vertical', minHeight: '80px' }}
                  ></textarea>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEWING CRM NOTES MODAL */}
      {viewingNotes && (
        <div className="modal-overlay open" style={{ display: 'flex' }} onClick={() => setViewingNotes(null)}>
          <div className="modal" style={{ maxWidth: '450px', background: '#1C1026' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setViewingNotes(null)}>✕</button>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '16px' }}>
              📐 Custom Sizing Notes
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
              <div>
                <strong>Client:</strong> {viewingNotes.name}
              </div>
              <div>
                <strong>Height:</strong> {viewingNotes.height || '-'}
              </div>
              <div style={{
                marginTop: '10px',
                background: 'rgba(0,0,0,0.25)',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: '3px solid var(--purple-500)'
              }}>
                <strong style={{ color: 'var(--gold-light)', display: 'block', marginBottom: '6px' }}>Special Request Guidelines:</strong>
                <p style={{ lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>
                  {viewingNotes.notes || 'No custom notes provided.'}
                </p>
              </div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-admin-primary"
                onClick={() => setViewingNotes(null)}
              >
                Close Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
