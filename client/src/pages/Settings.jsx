import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';
import { get, put } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Globe, Building2, Save, Receipt } from 'lucide-react';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/settings').then(s => { setSettings(s); setLoading(false); });
  }, []);

  const handleSave = async () => {
    try {
      await put('/settings', settings);
      toast.success(t('save') + ' ✓');
    } catch (e) { toast.error(e.message); }
  };

  const toggleLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('accounting_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  if (loading) return <div className="spinner-container"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{t('settings')}</h1>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3><Globe size={18} /> {t('language')}</h3>
          <div className="lang-options">
            <button className={`lang-btn ${i18n.language === 'fr' ? 'active' : ''}`} onClick={() => toggleLang('fr')}>
              🇫🇷 Français
            </button>
            <button className={`lang-btn ${i18n.language === 'ar' ? 'active' : ''}`} onClick={() => toggleLang('ar')}>
              🇲🇷 العربية
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3><Building2 size={18} /> {t('company_name')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t('company_name')}</label>
              <input className="form-input" value={settings?.company_name || ''} onChange={e => setSettings({ ...settings, company_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('company_phone')}</label>
              <input className="form-input" value={settings?.company_phone || ''} onChange={e => setSettings({ ...settings, company_phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('company_email')}</label>
              <input className="form-input" type="email" value={settings?.company_email || ''} onChange={e => setSettings({ ...settings, company_email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('company_tva')}</label>
              <input className="form-input" value={settings?.company_tva || ''} onChange={e => setSettings({ ...settings, company_tva: e.target.value })} />
            </div>
            <div className="form-group full-width">
              <label className="form-label">{t('company_address')}</label>
              <textarea className="form-textarea" rows={2} value={settings?.company_address || ''} onChange={e => setSettings({ ...settings, company_address: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3><Receipt size={18} /> {t('invoices')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t('currency')}</label>
              <input className="form-input" value={settings?.currency || ''} onChange={e => setSettings({ ...settings, currency: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('currency_symbol')}</label>
              <input className="form-input" value={settings?.currency_symbol || ''} onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('invoice_prefix')}</label>
              <input className="form-input" value={settings?.invoice_prefix || ''} onChange={e => setSettings({ ...settings, invoice_prefix: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3>👤 {t('owner')}</h3>
          <div className="settings-user">
            <div className="user-avatar-lg" style={{ background: user?.avatar_color || '#6366f1' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="settings-user-name">{user?.name}</div>
              <div className="settings-user-email">{user?.phone}</div>
              <div className="settings-user-role">{user?.role}</div>
            </div>
          </div>
        </div>

        <div className="settings-save">
          <button className="btn btn-primary btn-lg" onClick={handleSave}>
            <Save size={18} /> {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
