import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Select, StatusBadge, Badge, Spinner, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { useConfirm } from '../components/confirm.jsx';
import { get, put, post, del } from '../api.js';
import { Edit3, Trash2, Send, CreditCard, FileText, ArrowLeft } from 'lucide-react';
import './InvoiceDetail.css';

const fmt = new Intl.NumberFormat('fr-MR');

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'card', label: 'Carte' },
];

export default function InvoiceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await get(`/invoices/${id}`);
        setInvoice(data);
      } catch {
        toast.error(t('error.loading'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const refreshInvoice = async () => {
    try {
      const data = await get(`/invoices/${id}`);
      setInvoice(data);
    } catch {
      toast.error(t('error.loading'));
    }
  };

  const handleSend = async () => {
    const ok = await confirm('Marquer cette facture comme envoyée ?');
    if (!ok) return;
    try {
      await put(`/invoices/${id}/status`, { status: 'sent' });
      await refreshInvoice();
      toast.success(t('sent') + ' ✓');
    } catch {
      toast.error(t('error.saving'));
    }
  };

  const handleDelete = async () => {
    const ok = await confirm('Supprimer cette facture ?');
    if (!ok) return;
    try {
      await del(`/invoices/${id}`);
      toast.success(t('delete') + ' ✓');
      navigate('/invoices');
    } catch {
      toast.error(t('error.deleting'));
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    const remaining = (invoice.total || 0) - (invoice.paid_amount || 0);
    if (amount > remaining + 0.01) {
      toast.error('Le montant dépasse le reste à payer');
      return;
    }
    setPaying(true);
    try {
      await post(`/invoices/${id}/payments`, {
        amount,
        payment_date: payDate,
        method: payMethod,
        reference: payRef,
        notes: payNotes,
      });
      await refreshInvoice();
      setPayAmount('');
      setPayRef('');
      setPayNotes('');
      toast.success('Paiement enregistré ✓');
    } catch (err) {
      toast.error(err.message || t('error.saving'));
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="page"><Spinner /></div>;
  if (!invoice) return null;

  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const remaining = (invoice.total || 0) - (invoice.paid_amount || 0);

  return (
    <div className="page invoice-detail">
      <PageHeader
        title={invoice.invoice_number}
        subtitle={invoice.client_name || ''}
      >
        <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
          <ArrowLeft size={18} />
          {t('back')}
        </button>
      </PageHeader>

      <div className="invoice-header">
        <StatusBadge status={invoice.status} />
        <div className="invoice-header-dates">
          <span>{t('issue_date')}: {formatDate(invoice.issue_date)}</span>
          <span>{t('due_date')}: {formatDate(invoice.due_date)}</span>
        </div>
      </div>

      <div className="form-grid">
        <div className="invoice-client">
          <h3><FileText size={18} /> {t('client')}</h3>
          <div className="client-info">
            <div className="client-info-row">
              <span className="client-info-label">{t('name')}</span>
              <span>{invoice.client_name || '—'}</span>
            </div>
            {invoice.client_phone && (
              <div className="client-info-row">
                <span className="client-info-label">{t('phone')}</span>
                <span>{invoice.client_phone}</span>
              </div>
            )}
            {invoice.client_email && (
              <div className="client-info-row">
                <span className="client-info-label">{t('email')}</span>
                <span>{invoice.client_email}</span>
              </div>
            )}
            {(invoice.client_address || invoice.client_city || invoice.client_country) && (
              <div className="client-info-row">
                <span className="client-info-label">{t('address')}</span>
                <span>{[invoice.client_address, invoice.client_city, invoice.client_country].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="invoice-items-section">
        <h3 className="section-title"><FileText size={20} /> {t('items')}</h3>
        <div className="invoice-items-table-wrapper">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>{t('description')}</th>
                <th className="text-right">{t('quantity')}</th>
                <th className="text-right">{t('unit_price')}</th>
                <th className="text-right">{t('tva_rate')}</th>
                <th className="text-right">{t('subtotal')}</th>
                <th className="text-right">{t('tva')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id || i}>
                  <td>{item.description || item.product_name || '—'}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{fmt.format(item.unit_price || 0)} MRU</td>
                  <td className="text-right">{item.tva_rate || 0}%</td>
                  <td className="text-right">{fmt.format(item.subtotal || 0)} MRU</td>
                  <td className="text-right">{fmt.format(item.tva_amount || 0)} MRU</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center" style={{ color: 'var(--text-muted, #9ca3af)', padding: 24 }}>Aucune ligne</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="invoice-totals">
        <div className="totals-line">
          <span>{t('subtotal')}</span>
          <span>{fmt.format(invoice.subtotal || 0)} MRU</span>
        </div>
        <div className="totals-line">
          <span>{t('total_tva')}</span>
          <span>{fmt.format(invoice.tva_total || 0)} MRU</span>
        </div>
        <div className="totals-line totals-grand">
          <span>{t('total')}</span>
          <span>{fmt.format(invoice.total || 0)} MRU</span>
        </div>
        <div className="totals-line totals-paid">
          <span>{t('paid')}</span>
          <span>{fmt.format(invoice.paid_amount || 0)} MRU</span>
        </div>
        <div className="totals-line totals-remaining">
          <span>{t('remaining')}</span>
          <span>{fmt.format(remaining)} MRU</span>
        </div>
      </div>

      {invoice.notes && (
        <div className="invoice-notes">
          <h3>{t('notes')}</h3>
          <p>{invoice.notes}</p>
        </div>
      )}

      {payments.length > 0 && (
        <div className="payments-section">
          <h3 className="section-title"><CreditCard size={20} /> {t('payments')} ({payments.length})</h3>
          <div className="payments-list">
            {payments.map(pay => (
              <div key={pay.id} className="payment-row">
                <div className="payment-row-main">
                  <span className="payment-row-amount">{fmt.format(pay.amount || 0)} MRU</span>
                  <span className="payment-row-method">{PAYMENT_METHODS.find(m => m.value === pay.method)?.label || pay.method}</span>
                </div>
                <div className="payment-row-meta">
                  <span>{formatDate(pay.payment_date)}</span>
                  {pay.reference && <span>Ref: {pay.reference}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice.status === 'sent' && remaining > 0.01 && (
        <div className="payment-form">
          <h3 className="section-title"><CreditCard size={20} /> {t('add_payment')}</h3>
          <form onSubmit={handlePayment}>
            <div className="form-grid">
              <Input
                label={t('amount') + ' *'}
                type="number"
                min="0"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                max={remaining}
                required
              />
              <Input
                label={t('payment_date')}
                type="date"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
              />
              <Select
                label={t('payment_method')}
                options={PAYMENT_METHODS}
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
              />
              <Input
                label={t('reference')}
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
              />
            </div>
            <Input
              label={t('notes')}
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
            />
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={paying}
              >
                <CreditCard size={18} />
                {paying ? '...' : t('add_payment')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="invoice-actions">
        {invoice.status === 'draft' && (
          <>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/invoices/${id}/edit`)}
            >
              <Edit3 size={18} />
              {t('edit')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleSend}
            >
              <Send size={18} />
              {t('sent')}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
            >
              <Trash2 size={18} />
              {t('delete')}
            </button>
          </>
        )}
        {invoice.status === 'sent' && (
          <button
            className="btn btn-danger"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
            {t('delete')}
          </button>
        )}
      </div>
    </div>
  );
}
