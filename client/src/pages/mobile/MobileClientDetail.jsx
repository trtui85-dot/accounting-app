import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get, del } from '../../api.js';
import { Phone, Mail, MapPin, Edit3, Trash2 } from 'lucide-react';

const fmt = new Intl.NumberFormat('fr-MR');

export default function MobileClientDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(`/clients/${id}`).then(d => { setClient(d); setLoading(false); });
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(t('confirm.delete_client', { name: client.name }))) return;
    try { await del(`/clients/${id}`); navigate('/clients'); } catch {}
  };

  if (loading) return <div className="m-spinner" />;
  if (!client) return null;

  return (
    <div>
      <div className="m-detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div className="m-client-avatar" style={{ background: '#4f46e5', width: 36, height: 36, fontSize: 14 }}>{client.name?.[0]?.toUpperCase()}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{client.name}</div>
            {client.tva_number && <div style={{ fontSize: 11, color: '#888' }}>TVA: {client.tva_number}</div>}
          </div>
        </div>
        {client.phone && <div className="m-detail-row"><span className="m-detail-label"><Phone size={12} /> {t('phone')}</span><span className="m-detail-value">{client.phone}</span></div>}
        {client.mobile && <div className="m-detail-row"><span className="m-detail-label"><Phone size={12} /> Mobile</span><span className="m-detail-value">{client.mobile}</span></div>}
        {client.email && <div className="m-detail-row"><span className="m-detail-label"><Mail size={12} /> Email</span><span className="m-detail-value">{client.email}</span></div>}
        {(client.address || client.city) && <div className="m-detail-row"><span className="m-detail-label"><MapPin size={12} /> Adresse</span><span className="m-detail-value">{[client.address, client.city, client.country].filter(Boolean).join(', ')}</span></div>}
      </div>

      <div className="m-btn-row">
        <button className="m-btn-full secondary" onClick={() => navigate(`/clients/${id}/edit`)}><Edit3 size={14} /> {t('edit')}</button>
        <button className="m-btn-full danger" onClick={handleDelete}><Trash2 size={14} /> {t('delete')}</button>
      </div>

      {(client.invoices || []).length > 0 && (
        <>
          <div className="m-section-title">{t('invoices.title')} ({client.invoices.length})</div>
          <div className="m-list">
            {client.invoices.map(inv => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="m-list-item">
                <div className="m-list-left">
                  <span className="m-list-number">{inv.invoice_number}</span>
                  <span className="m-list-sub">{new Date(inv.issue_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="m-list-right">
                  <span className={`m-invoice-badge ${inv.status}`}>{t(inv.status)}</span>
                  <span className="m-list-amount">{fmt.format(inv.total || 0)} MRU</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
