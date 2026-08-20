import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get, put, del } from '../../api.js';

const fmt = new Intl.NumberFormat('fr-MR');

export default function MobileInvoiceDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { setInvoice(await get(`/invoices/${id}`)); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [id]);

  const handleStatus = async (status) => {
    try { await put(`/invoices/${id}/status`, { status }); await refresh(); } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ?')) return;
    try { await del(`/invoices/${id}`); navigate('/invoices'); } catch {}
  };

  if (loading) return <div className="m-spinner" />;
  if (!invoice) return null;

  const items = invoice.items || [];
  const payments = invoice.payments || [];
  const remaining = (invoice.total || 0) - (invoice.paid_amount || 0);

  return (
    <div>
      <div className="m-detail-header">
        <div className="m-detail-row">
          <span className="m-detail-label">{t('invoice_number')}</span>
          <span className="m-detail-value">{invoice.invoice_number}</span>
        </div>
        <div className="m-detail-row">
          <span className="m-detail-label">{t('client')}</span>
          <span className="m-detail-value">{invoice.client_name || '—'}</span>
        </div>
        <div className="m-detail-row">
          <span className="m-detail-label">{t('status')}</span>
          <span className={`m-invoice-badge ${invoice.status}`}>{t(invoice.status)}</span>
        </div>
        <div className="m-detail-row">
          <span className="m-detail-label">{t('issue_date')}</span>
          <span className="m-detail-value">{invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('fr-FR') : '—'}</span>
        </div>
        <div className="m-detail-row">
          <span className="m-detail-label">{t('due_date')}</span>
          <span className="m-detail-value">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '—'}</span>
        </div>
      </div>

      {items.length > 0 && (
        <>
          <div className="m-section-title">{t('items')}</div>
          <div className="m-table-wrap">
            <table className="m-table">
              <thead>
                <tr><th>{t('description')}</th><th style={{ textAlign: 'right' }}>Qté</th><th style={{ textAlign: 'right' }}>Prix</th><th style={{ textAlign: 'right' }}>Total</th></tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.description || it.product_name || '—'}</td>
                    <td style={{ textAlign: 'right' }}>{it.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{fmt.format(it.unit_price || 0)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt.format(it.subtotal || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="m-totals">
        <div className="m-totals-row"><span>{t('subtotal')}</span><span>{fmt.format(invoice.subtotal || 0)} MRU</span></div>
        <div className="m-totals-row"><span>{t('total_tva')}</span><span>{fmt.format(invoice.tva_total || 0)} MRU</span></div>
        <div className="m-totals-row grand"><span>{t('total')}</span><span>{fmt.format(invoice.total || 0)} MRU</span></div>
        <div className="m-totals-row paid-row"><span>{t('paid')}</span><span>{fmt.format(invoice.paid_amount || 0)} MRU</span></div>
        <div className="m-totals-row remaining-row"><span>{t('remaining')}</span><span>{fmt.format(remaining)} MRU</span></div>
      </div>

      {payments.length > 0 && (
        <>
          <div className="m-section-title">{t('payments')} ({payments.length})</div>
          <div className="m-list">
            {payments.map(pay => (
              <div key={pay.id} className="m-payment">
                <div className="m-payment-top">
                  <span className="m-payment-amount">{fmt.format(pay.amount || 0)} MRU</span>
                  <span className="m-payment-method">{pay.method}</span>
                </div>
                <div className="m-payment-meta">{pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('fr-FR') : ''} {pay.reference ? '· ' + pay.reference : ''}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="m-btn-row">
        {invoice.status === 'draft' && (
          <>
            <button className="m-btn-full primary" onClick={() => navigate(`/invoices/${id}/edit`)}>{t('edit')}</button>
            <button className="m-btn-full secondary" onClick={() => handleStatus('sent')}>{t('sent')}</button>
          </>
        )}
        {(invoice.status === 'draft' || invoice.status === 'sent') && (
          <button className="m-btn-full danger" onClick={handleDelete}>{t('delete')}</button>
        )}
      </div>
    </div>
  );
}
