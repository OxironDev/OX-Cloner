'use client';

import { useState, useEffect, useRef } from 'react';
import { translations } from '@/lib/translations';

export default function Home() {
  const [lang, setLang] = useState('tr');
  const [t, setT] = useState(translations.tr);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const [formData, setFormData] = useState({
    userToken: '',
    sourceGuildId: '',
    targetGuildId: '',
    password: process.env.NEXT_PUBLIC_API_PASSWORD || '',
    resetTargetServer: true,
    rateLimitDelay: 1000
  });

  const [fastMode, setFastMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [status, setStatus] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showToken, setShowToken] = useState(false);
  const logRef = useRef(null);

  // Language detection & Persistence
  useEffect(() => {
    const savedLang = localStorage.getItem('oxiron_lang');
    if (savedLang && translations[savedLang]) {
      handleLangChange(savedLang);
    } else {
      const userLang = navigator.language || navigator.userLanguage;
      if (userLang.startsWith('es')) handleLangChange('es');
      else if (userLang.startsWith('fr')) handleLangChange('fr');
      else if (userLang.startsWith('de')) handleLangChange('de');
      else if (userLang.startsWith('pt')) handleLangChange('pt');
      else if (userLang.startsWith('it')) handleLangChange('it');
      else if (userLang.startsWith('en')) handleLangChange('en');
      else handleLangChange('tr');
    }
  }, []);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    setT(translations[newLang]);
    setIsLangOpen(false);
    localStorage.setItem('oxiron_lang', newLang);
  };

  const fetchInfo = async () => {
    if (!formData.userToken || !formData.sourceGuildId || !formData.targetGuildId) return;
    try {
      const response = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang }),
      });
      const data = await response.json();
      if (response.ok && !data.error) {
        setServerInfo(data);
      }
    } catch (err) {
      setServerInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setIsValidating(true); // Always show validating on button click

    // 1. MANDATORY VALIDATION ON CLICK
    try {
      const valRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang }),
      });
      const valData = await valRes.json();

      if (!valRes.ok) {
        if (valData.error === 'TOKEN_INVALID') throw new Error(t.errorInvalidToken);
        if (valData.error === 'NO_ADMIN') throw new Error(t.errorNoAdmin);
        if (valData.error === 'GUILD_NOT_FOUND') throw new Error(t.error);
        throw new Error(valData.error || t.error);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
      setIsValidating(false);
      return; // STOP HERE if validation fails
    }

    setIsValidating(false);
    await fetchInfo(); // Fetch info for display before starting clone

    // 2. START CLONING
    setLoading(true);
    setLogs([]);
    setStatus({ type: 'info', message: t.cloningStarted });

    try {
      const response = await fetch('/api/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === 'OVERLOAD') throw new Error(t.systemOverload);
        if (data.error === 'TIMEOUT') throw new Error(t.timeoutError);
        throw new Error(data.error || t.error);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setStatus({ type: 'success', message: t.success }); // Force success at the end
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.message === 'DONE') {
              setStatus({ type: 'success', message: t.success });
            } else if (data.error) {
              setStatus({ type: 'error', message: data.error });
            } else {
              setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), text: data.message }]);
            }
          }
        }
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message || t.connectionError });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // CRITICAL: If inputs change, reset serverInfo to force re-validation on next submit
    setServerInfo(null);
    setStatus(null);
  };

  return (
    <main>
      <div className="lang-selector">
        <div className={`custom-select ${isLangOpen ? 'open' : ''}`}>
          <div className="select-trigger" onClick={() => setIsLangOpen(!isLangOpen)}>
            <img src={`https://flagcdn.com/w40/${lang === 'en' ? 'us' : lang}.png`} alt={lang} className="flag-img" />
            <span>{lang.toUpperCase()}</span>
            <span className="arrow"></span>
          </div>
          {isLangOpen && (
            <div className="select-options">
              {['tr', 'en', 'es', 'fr', 'de', 'pt', 'it'].map((l) => (
                <div key={l} className="option" onClick={() => handleLangChange(l)}>
                  <img src={`https://flagcdn.com/w40/${l === 'en' ? 'us' : l === 'de' ? 'de' : l}.png`} alt={l} className="flag-img" /> {l.toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <header>
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </header>

        {/* PREVIEW CARDS (Visible whenever serverInfo exists) */}
        {serverInfo && (
          <div className="info-section">
            <div className="info-row">
              <div className="info-card user">
                <img src={serverInfo.user.avatar} alt="Avatar" />
                <div className="details">
                  <span className="val">{serverInfo.user.username}</span>
                  <span className="label">{t.connectedAccount}</span>
                </div>
              </div>
            </div>
            {serverInfo.source && (
              <div className="info-row">
                <div className="info-card server">
                  <img src={serverInfo.source.icon || 'https://via.placeholder.com/40'} alt="Source" />
                  <div className="details">
                    <span className="val">{serverInfo.source.name}</span>
                    <span className="meta">{serverInfo.source.channels} {t.channels} • {serverInfo.source.roles} {t.roles} • {serverInfo.source.memberCount} {t.members}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {loading || logs.length > 0 ? (
          <div className="clone-view">
            <div className="section-title">{t.liveLogs}</div>
            <div className="live-log" ref={logs.length > 0 ? (e => { if (e) e.scrollTop = e.scrollHeight }) : null}>
              {logs.map((log, i) => (
                <div key={i} className={`log-entry ${i === logs.length - 1 ? 'active' : ''}`}>
                  <span className="timestamp">[{log.time}]</span>
                  <span className="text">&gt; {log.text}</span>
                </div>
              ))}
            </div>
            {status && <div className={`status-message status-${status.type}`}>{status.message}</div>}
            {!loading && (
              <button
                className="back-btn"
                onClick={() => {
                  setLoading(false);
                  setLogs([]);
                  setStatus(null);
                  setServerInfo(null);
                }}
              >
                {t.goBack}
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>{t.userToken}</label>
                <div className="input-wrapper">
                  <input
                    type={showToken ? 'text' : 'password'}
                    name="userToken"
                    placeholder={t.mfaTokenPlaceholder}
                    value={formData.userToken}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>{t.sourceGuildId}</label>
                <input type="text" name="sourceGuildId" placeholder={t.sourcePlaceholder} value={formData.sourceGuildId} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>{t.targetGuildId}</label>
                <input type="text" name="targetGuildId" placeholder={t.targetPlaceholder} value={formData.targetGuildId} onChange={handleChange} required />
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="resetTargetServer" name="resetTargetServer" checked={formData.resetTargetServer} onChange={handleChange} />
                <label htmlFor="resetTargetServer" style={{ color: formData.resetTargetServer ? '#ffffff' : 'var(--accent)' }}>
                  {t.resetTargetServer}
                </label>
              </div>

              <div className="checkbox-group">
                <input 
                  type="checkbox" 
                  id="fastMode" 
                  checked={fastMode} 
                  onChange={(e) => {
                    const isFast = e.target.checked;
                    setFastMode(isFast);
                    setFormData(prev => ({ ...prev, rateLimitDelay: isFast ? 500 : 1000 }));
                  }} 
                />
                <label htmlFor="fastMode" style={{ color: fastMode ? '#ffffff' : 'var(--accent)' }}>
                  {t.fastMode}
                </label>
              </div>

              {fastMode && (
                <div className="fast-mode-warn">
                  ⚠️ {t.fastModeWarn}
                </div>
              )}
              <div className="actions">
                <button type="submit" disabled={isValidating || loading}>
                  <div className="btn-content">
                    {(isValidating || loading) && <div className="spinner"></div>}
                    <span>{isValidating ? (lang === 'tr' ? 'Kontrol Ediliyor...' : 'Validating...') : t.startClone}</span>
                  </div>
                </button>
              </div>
            </div>
            {status && <div className={`status-message status-${status.type}`}>{status.message}</div>}
          </form>
        )}
      </div>

      <footer>{t.footer}</footer>
    </main>
  );
}
