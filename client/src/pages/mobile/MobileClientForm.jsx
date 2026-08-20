import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get, post, put } from '../../api.js';

const empty = { name: '', email: '', phone: '', mobile: '', address: '', city: '', country: 'Mauritanie', tva_number: '', notes: '' };

export default function MobileClientForm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    get(`/clients/${id}`).then(d => {
      setForm({ name: d.name || '', email: d.email || '', phone: d.phone || '', mobile: d.mobile || '', address: d.address || '', city: d.city || '', country: d.country || 'Mauritanie', tva_number: d.tva_number || '', notes: d.notes || '' });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nom requis');
    setSaving(true);
    try {
      if (isEdit) await put(`/clients/${id}`, form); else await post('/clients', form);
      navigate('/clients');
    } catch { alert('Erreur'); }
    setSaving(false);
  };

  if (loading) return <div className="m-spinner" />;

  return (
    <form onSubmit={handleSubmit} className="m-form">
      <div className="m-form-group"><label className="m-form-label">Nom *</label><input className="m-form-input" value={form.name} onChange={set('name')} required /></div>
      <div className="m-form-group"><label className="m-form-label">Email</label><input className="m-form-input" type="email" value={form.email} onChange={set('email')} /></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="m-form-group" style={{ flex: 1 }}><label className="m-form-label">Téléphone</label><input className="m-form-input" value={form.phone} onChange={set('phone')} /></div>
        <div className="m-form-group" style={{ flex: 1 }}><label className="m-form-label">Mobile</label><input className="m-form-input" value={form.mobile} onChange={set('mobile')} /></div>
      </div>
      <div className="m-form-group"><label className="m-form-label">Adresse</label><input className="m-form-input" value={form.address} onChange={set('address')} /></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="m-form-group" style={{ flex: 1 }}><label className="m-form-label">Ville</label><input className="m-form-input" value={form.city} onChange={set('city')} /></div>
        <div className="m-form-group" style={{ flex: 1 }}><label className="m-form-label">Pays</label><input className="m-form-input" value={form.country} onChange={set('country')} /></div>
      </div>
      <div className="m-form-group"><label className="m-form-label">N° TVA</label><input className="m-form-input" value={form.tva_number} onChange={set('tva_number')} /></div>
      <textarea className="m-form-textarea" rows={2} value={form.notes} onChange={set('notes')} placeholder="Notes" />
      <div className="m-btn-row">
        <button type="button" className="m-btn-full secondary" onClick={() => navigate(-1)}>{t('cancel')}</button>
        <button type="submit" className="m-btn-full primary" disabled={saving}>{saving ? '...' : t('save')}</button>
      </div>
    </form>
  );
}
