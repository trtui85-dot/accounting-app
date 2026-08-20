import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Textarea, Select, Spinner, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { get, post, put } from '../api.js';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import './InvoiceForm.css';

const fmt = new Intl.NumberFormat('fr-MR');

function newLine() {
  return {
    key: Date.now() + Math.random(),
    product_id: '',
    description: '',
    quantity: 1,
    unit_price: 0,
    tva_rate: 16,
  };
}

function calcLine(line) {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unit_price) || 0;
  const rate = Number(line.tva_rate) || 0;
  const subtotal = qty * price;
  const tva = subtotal * (rate / 100);
  return { subtotal, tva, total: subtotal + tva };
}

export default function InvoiceForm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [client_id, setClientId] = useState('');
  const [issue_date, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [due_date, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([newLine()]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [editBlocked, setEditBlocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [clData, prData] = await Promise.all([
          get('/api/clients'),
          get('/api/products'),
        ]);
        setClients(clData);
        setProducts(prData);
      } catch {
        toast.error(t('error.loading'));
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const inv = await get(`/api/invoices/${id}`);
        if (inv.status !== 'draft') {
          setEditBlocked(true);
          return;
        }
        setClientId(inv.client_id || '');
        setIssueDate(inv.issue_date ? inv.issue_date.split('T')[0] : '');
        setDueDate(inv.due_date ? inv.due_date.split('T')[0] : '');
        setNotes(inv.notes || '');
        if (inv.items && inv.items.length > 0) {
          setLines(
            inv.items.map((it, i) => ({
              key: i + Date.now(),
              product_id: it.product_id || '',
              description: it.description || '',
              quantity: it.quantity ?? 1,
              unit_price: it.unit_price ?? 0,
              tva_rate: it.tva_rate ?? 16,
            }))
          );
        }
      } catch {
        toast.error(t('error.loading'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const updateLine = (key, field, value) => {
    setLines(prev =>
      prev.map(l => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const onProductChange = (key, productId) => {
    const prod = products.find(p => String(p.id) === String(productId));
    setLines(prev =>
      prev.map(l =>
        l.key === key
          ? {
              ...l,
              product_id: productId,
              description: prod?.description || prod?.name || '',
              unit_price: prod?.unit_price ?? 0,
              tva_rate: prod?.tva_rate ?? 16,
            }
          : l
      )
    );
  };

  const addLine = () => setLines(prev => [...prev, newLine()]);

  const removeLine = (key) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.key !== key));
  };

  const totals = lines.reduce(
    (acc, l) => {
      const { subtotal, tva } = calcLine(l);
      acc.subtotal += subtotal;
      acc.tva += tva;
      return acc;
    },
    { subtotal: 0, tva: 0 }
  );
  totals.total = totals.subtotal + totals.tva;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!client_id) {
      toast.error(t('validation.client_required') || 'Sélectionnez un client');
      return;
    }
    const payload = {
      client_id: Number(client_id),
      issue_date,
      due_date,
      notes,
      items: lines.map(l => ({
        product_id: l.product_id ? Number(l.product_id) : null,
        description: l.description,
        quantity: Number(l.quantity) || 1,
        unit_price: Number(l.unit_price) || 0,
        tva_rate: Number(l.tva_rate) || 0,
      })),
    };
    if (payload.items.length === 0) {
      toast.error(t('validation.items_required') || 'Ajoutez au moins une ligne');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await put(`/api/invoices/${id}`, payload);
      } else {
        await post('/api/invoices', payload);
      }
      toast.success(t('save') + ' ✓');
      navigate('/invoices');
    } catch (err) {
      toast.error(err.message || t('error.saving'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Spinner />
      </div>
    );
  }

  if (editBlocked) {
    return (
      <div className="page form-page">
        <PageHeader title={t('edit')}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            {t('back')}
          </button>
        </PageHeader>
        <div className="empty-state">
          <p>Seules les factures en brouillon peuvent être modifiées.</p>
          <button className="btn btn-primary" onClick={() => navigate(`/invoices/${id}`)}>
            Voir la facture
          </button>
        </div>
      </div>
    );
  }

  const clientOptions = clients.map(c => ({ value: String(c.id), label: c.name }));
  const productOptions = products.map(p => ({ value: String(p.id), label: p.name }));

  return (
    <div className="page form-page">
      <PageHeader title={isEdit ? t('edit') : t('new_invoice')}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          {t('back')}
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-grid">
            <Select
              label={t('client') + ' *'}
              options={clientOptions}
              placeholder={t('client')}
              value={client_id}
              onChange={e => setClientId(e.target.value)}
              required
            />
            <Input
              label={t('issue_date')}
              type="date"
              value={issue_date}
              onChange={e => setIssueDate(e.target.value)}
            />
            <Input
              label={t('due_date')}
              type="date"
              value={due_date}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">{t('items')}</h3>

          <div className="items-table">
            <div className="items-header">
              <span className="col-product">{t('product')}</span>
              <span className="col-desc">{t('description')}</span>
              <span className="col-qty">{t('quantity')}</span>
              <span className="col-price">{t('unit_price')}</span>
              <span className="col-tva">{t('tva_rate')}</span>
              <span className="col-sub">{t('subtotal')}</span>
              <span className="col-action"></span>
            </div>

            {lines.map(line => {
              const { subtotal, tva } = calcLine(line);
              return (
                <div key={line.key} className="item-row">
                  <div className="col-product">
                    <select
                      className="form-select"
                      value={line.product_id}
                      onChange={e => onProductChange(line.key, e.target.value)}
                    >
                      <option value="">—</option>
                      {productOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-desc">
                    <input
                      className="form-input"
                      value={line.description}
                      onChange={e => updateLine(line.key, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-qty">
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="1"
                      value={line.quantity}
                      onChange={e => updateLine(line.key, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-price">
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unit_price}
                      onChange={e => updateLine(line.key, 'unit_price', e.target.value)}
                    />
                  </div>
                  <div className="col-tva">
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={line.tva_rate}
                      onChange={e => updateLine(line.key, 'tva_rate', e.target.value)}
                    />
                  </div>
                  <div className="col-sub">
                    <span className="line-subtotal">{fmt.format(subtotal)}</span>
                    <span className="line-tva">+ {fmt.format(tva)}</span>
                  </div>
                  <div className="col-action">
                    <button
                      type="button"
                      className="btn btn-icon btn-danger"
                      onClick={() => removeLine(line.key)}
                      disabled={lines.length <= 1}
                      title={t('remove_line')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary add-line-btn"
            onClick={addLine}
          >
            <Plus size={18} />
            {t('add_line')}
          </button>
        </div>

        <div className="form-section">
          <div className="totals-section">
            <div className="totals-row">
              <span>{t('subtotal')}</span>
              <span>{fmt.format(totals.subtotal)} MRU</span>
            </div>
            <div className="totals-row">
              <span>{t('total_tva')}</span>
              <span>{fmt.format(totals.tva)} MRU</span>
            </div>
            <div className="totals-row totals-row-total">
              <span>{t('total')}</span>
              <span>{fmt.format(totals.total)} MRU</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <Textarea
            label={t('notes')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? '...' : t('save')}
          </button>
        </div>
      </form>
    </div>
  );
}
