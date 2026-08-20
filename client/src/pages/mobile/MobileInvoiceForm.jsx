import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get, post, put } from '../../api.js';
import { Plus, Trash2 } from 'lucide-react';

export default function MobileInvoiceForm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ key: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tva_rate: 16 }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([get('/clients'), get('/products')]).then(([c, p]) => { setClients(c); setProducts(p); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    get(`/invoices/${id}`).then(inv => {
      if (inv.status !== 'draft') { navigate(`/invoices/${id}`); return; }
      setClientId(inv.client_id || '');
      setIssueDate(inv.issue_date?.split('T')[0] || '');
      setDueDate(inv.due_date?.split('T')[0] || '');
      setNotes(inv.notes || '');
      if (inv.items?.length) setLines(inv.items.map((it, i) => ({ key: i, product_id: it.product_id || '', description: it.description || '', quantity: it.quantity ?? 1, unit_price: it.unit_price ?? 0, tva_rate: it.tva_rate ?? 16 })));
    });
  }, [id, isEdit]);

  const updateLine = (key, field, val) => setLines(prev => prev.map(l => l.key === key ? { ...l, [field]: val } : l));
  const onProduct = (key, pid) => {
    const p = products.find(x => String(x.id) === String(pid));
    setLines(prev => prev.map(l => l.key === key ? { ...l, product_id: pid, description: p?.description || p?.name || '', unit_price: p?.unit_price ?? 0, tva_rate: p?.tva_rate ?? 16 } : l));
  };
  const addLine = () => setLines(prev => [...prev, { key: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tva_rate: 16 }]);
  const removeLine = (key) => { if (lines.length > 1) setLines(prev => prev.filter(l => l.key !== key)); };

  const totals = lines.reduce((a, l) => {
    const sub = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0);
    const tva = sub * ((Number(l.tva_rate) || 0) / 100);
    return { subtotal: a.subtotal + sub, tva: a.tva + tva };
  }, { subtotal: 0, tva: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return alert('Sélectionnez un client');
    setSaving(true);
    try {
      const payload = {
        client_id: Number(clientId), issue_date: issueDate, due_date: dueDate, notes,
        items: lines.map(l => ({ product_id: l.product_id ? Number(l.product_id) : null, description: l.description, quantity: Number(l.quantity) || 1, unit_price: Number(l.unit_price) || 0, tva_rate: Number(l.tva_rate) || 0 })),
      };
      if (isEdit) await put(`/invoices/${id}`, payload);
      else await post('/invoices', payload);
      navigate('/invoices');
    } catch (err) { alert(err.message || 'Erreur'); }
    setSaving(false);
  };

  if (loading) return <div className="m-spinner" />;

  return (
    <form onSubmit={handleSubmit} className="m-form">
      <div className="m-form-group">
        <label className="m-form-label">{t('client')} *</label>
        <select className="m-form-select" value={clientId} onChange={e => setClientId(e.target.value)} required>
          <option value="">{t('client')}</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <div className="m-form-group" style={{ flex: 1 }}>
          <label className="m-form-label">{t('issue_date')}</label>
          <input className="m-form-input" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
        </div>
        <div className="m-form-group" style={{ flex: 1 }}>
          <label className="m-form-label">{t('due_date')}</label>
          <input className="m-form-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="m-section-title" style={{ marginTop: 4 }}>{t('items')}</div>
      {lines.map(line => {
        const sub = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
        const tva = sub * ((Number(line.tva_rate) || 0) / 100);
        return (
          <div key={line.key} className="m-item-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <select style={{ flex: 1, padding: '4px 6px', border: '1px solid #e5e5e5', borderRadius: 6, fontSize: 11 }} value={line.product_id} onChange={e => onProduct(line.key, e.target.value)}>
                <option value="">—</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {lines.length > 1 && <button type="button" className="m-item-remove" onClick={() => removeLine(line.key)}><Trash2 size={12} /></button>}
            </div>
            <div className="m-item-row-fields">
              <div className="m-item-field"><label>{t('quantity')}</label><input type="number" min="0" value={line.quantity} onChange={e => updateLine(line.key, 'quantity', e.target.value)} /></div>
              <div className="m-item-field"><label>{t('unit_price')}</label><input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(line.key, 'unit_price', e.target.value)} /></div>
              <div className="m-item-field"><label>{t('tva_rate')}%</label><input type="number" min="0" max="100" value={line.tva_rate} onChange={e => updateLine(line.key, 'tva_rate', e.target.value)} /></div>
            </div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{fmt.format(sub)} + {fmt.format(tva)} TVA</div>
          </div>
        );
      })}
      <button type="button" className="m-add-line" onClick={addLine}><Plus size={14} /> {t('add_line')}</button>

      <div className="m-totals" style={{ marginTop: 6 }}>
        <div className="m-totals-row"><span>{t('subtotal')}</span><span>{fmt.format(totals.subtotal)} MRU</span></div>
        <div className="m-totals-row"><span>{t('total_tva')}</span><span>{fmt.format(totals.tva)} MRU</span></div>
        <div className="m-totals-row grand"><span>{t('total')}</span><span>{fmt.format(totals.subtotal + totals.tva)} MRU</span></div>
      </div>

      <textarea className="m-form-textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes')} />

      <div className="m-btn-row" style={{ marginTop: 4 }}>
        <button type="button" className="m-btn-full secondary" onClick={() => navigate(-1)}>{t('cancel')}</button>
        <button type="submit" className="m-btn-full primary" disabled={saving}>{saving ? '...' : t('save')}</button>
      </div>
    </form>
  );
}

const fmt = new Intl.NumberFormat('fr-MR');
