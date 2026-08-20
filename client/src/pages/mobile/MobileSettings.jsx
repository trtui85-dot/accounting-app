import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth.jsx';
import { get, put } from '../../api.js';
import { Globe, Building2, Save } from 'lucide-react';

export default function MobileSettings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get('/settings').then(s => { setSettings(s); setLoading(false); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await put('/settings', settings);
      alert(t('save') + ' ✓');
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const toggleLang = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('accounting_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  if (loading) return <div className="m-spinner" />;

  return (
    <div>
      <div className="m-settings-card">
        <h3><Globe size={16} /> {t('language')}</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`m-lang-btn ${i18n.language === 'fr' ? 'active' : ''}`} onClick={() => toggleLang('fr')}>Français</button>
          <button className={`m-lang-btn ${i18n.language === 'ar' ? 'active' : ''}`} onClick={() => toggleLang('ar')}>العربية</button>
        </div>
      </div>

      <div className="m-settings-card">
        <h3><Building2 size={16} /> {t('company_name')}</h3>
        <input className="m-settings-input" value={settings?.company_name || ''} onChange={e => setSettings({ ...settings, company_name: e.target.value })} placeholder={t('company_name')} />
        <input className="m-settings-input" value={settings?.company_phone || ''} onChange={e => setSettings({ ...settings, company_phone: e.target.value })} placeholder={t('company_phone')} />
        <input className="m-settings-input" value={settings?.company_email || ''} onChange={e => setSettings({ ...settings, company_email: e.target.value })} placeholder={t('company_email')} />
        <input className="m-settings-input" value={settings?.company_tva || ''} onChange={e => setSettings({ ...settings, company_tva: e.target.value })} placeholder={t('company_tva')} />
        <textarea className="m-settings-textarea" rows={2} value={settings?.company_address || ''} onChange={e => setSettings({ ...settings, company_address: e.target.value })} placeholder={t('company_address')} />
      </div>

      <div className="m-settings-card">
        <h3>Facturation</h3>
        <input className="m-settings-input" value={settings?.currency || ''} onChange={e => setSettings({ ...settings, currency: e.target.value })} placeholder="Devise" />
        <input className="m-settings-input" value={settings?.currency_symbol || ''} onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })} placeholder="Symbole" />
        <input className="m-settings-input" value={settings?.invoice_prefix || ''} onChange={e => setSettings({ ...settings, invoice_prefix: e.target.value })} placeholder="Préfixe facture" />
      </div>

      <div className="m-user-card">
        <div className="m-user-avatar-lg" style={{ background: user?.avatar_color || '#6366f1' }}>{user?.name?.[0]?.toUpperCase()}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{user?.phone} · {user?.role}</div>
        </div>
      </div>

      <button className="m-btn m-btn-primary" style={{ width: '100%', display: 'flex', marginTop: 4 }} onClick={handleSave} disabled={saving}>
        <Save size={16} /> {saving ? '...' : t('save')}
      </button>
    </div>
  );
}
