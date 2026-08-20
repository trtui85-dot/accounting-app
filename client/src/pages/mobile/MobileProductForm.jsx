import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get, post, put } from '../../api.js';

const empty = { name: '', description: '', unit_price: '', tva_rate: '16', unit: '' };

export default function MobileProductForm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    get(`/products/${id}`).then(d => {
      setForm({ name: d.name || '', description: d.description || '', unit_price: d.unit_price ?? '', tva_rate: d.tva_rate ?? '16', unit: d.unit || '' });
      setLoading(false);
    });
  }, [id, isEdit]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('Nom requis');
    setSaving(true);
    try {
      const body = { ...form, unit_price: form.unit_price === '' ? null : Number(form.unit_price), tva_rate: form.tva_rate === '' ? null : Number(form.tva_rate) };
      if (isEdit) await put(`/products/${id}`, body); else await post('/products', body);
      navigate('/products');
    } catch { alert('Erreur'); }
    setSaving(false);
  };

  if (loading) return <div className="m-spinner" />;

  return (
    <form onSubmit={handleSubmit} className="m-form">
      <div className="m-form-group"><label className="m-form-label">Nom *</label><input className="m-form-input" value={form.name} onChange={set('name')} required /></div>
      <div className="m-form-group"><label className="m-form-label">Description</label><textarea className="m-form-textarea" rows={2} value={form.description} onChange={set('description')} /></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="m-form-group" style={{ flex: 1 }}><label className="m-form-label">Prix unitaire</label><input className="m-form-input" type="number" min="0" step="0.01" value={form.unit_price} onChange={set('unit_price')} /></div>
        <div className="m-form-group" style={{ flex: 1 }}><label className="m-form-label">TVA %</label><input className="m-form-input" type="number" min="0" max="100" value={form.tva_rate} onChange={set('tva_rate')} /></div>
      </div>
      <div className="m-form-group">
        <label className="m-form-label">Unité</label>
        <select className="m-form-select" value={form.unit} onChange={set('unit')}>
          <option value="">—</option>
          {['unité','heure','jour','projet','mois','an','lot','page','course'].map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="m-btn-row">
        <button type="button" className="m-btn-full secondary" onClick={() => navigate(-1)}>{t('cancel')}</button>
        <button type="submit" className="m-btn-full primary" disabled={saving}>{saving ? '...' : t('save')}</button>
      </div>
    </form>
  );
}
