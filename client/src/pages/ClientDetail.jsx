import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner, StatusBadge, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { useConfirm } from '../components/confirm.jsx';
import { get, del } from '../api.js';
import { Edit3, Trash2, Phone, Mail, MapPin, FileText } from 'lucide-react';
import './ClientDetail.css';

const fmt = new Intl.NumberFormat('fr-MR');

export default function ClientDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await get(`/api/clients/${id}`);
        setClient(data);
      } catch {
        toast.error(t('error.loading'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleDelete = async () => {
    const ok = await confirm(t('confirm.delete_client', { name: client.name }));
    if (!ok) return;
    try {
      await del(`/api/clients/${id}`);
      toast.success(t('success.deleted'));
      navigate('/clients');
    } catch {
      toast.error(t('error.deleting'));
    }
  };

  if (loading) return <div className="page"><Spinner /></div>;
  if (!client) return null;

  const invoices = client.invoices || [];

  return (
    <div className="page">
      <PageHeader title={client.name}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/clients/${id}/edit`)}
        >
          <Edit3 size={18} />
          {t('actions.edit')}
        </button>
        <button className="btn btn-danger" onClick={handleDelete}>
          <Trash2 size={18} />
          {t('actions.delete')}
        </button>
      </PageHeader>

      <div className="detail-header">
        <div className="detail-info">
          {client.phone && (
            <div className="detail-info-row">
              <Phone size={16} />
              <span>{client.phone}</span>
            </div>
          )}
          {client.mobile && (
            <div className="detail-info-row">
              <Phone size={16} />
              <span>{client.mobile}</span>
            </div>
          )}
          {client.email && (
            <div className="detail-info-row">
              <Mail size={16} />
              <span>{client.email}</span>
            </div>
          )}
          {(client.address || client.city || client.country) && (
            <div className="detail-info-row">
              <MapPin size={16} />
              <span>
                {[client.address, client.city, client.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {client.tva_number && (
            <div className="detail-info-row">
              <span className="detail-label">{t('fields.tva_number')}:</span>
              <span>{client.tva_number}</span>
            </div>
          )}
          {client.notes && (
            <div className="detail-info-row detail-notes">
              {client.notes}
            </div>
          )}
        </div>
      </div>

      <h3 className="section-title">
        <FileText size={20} />
        {t('invoices.title')} ({invoices.length})
      </h3>

      {invoices.length === 0 ? (
        <p className="text-muted">{t('invoices.none')}</p>
      ) : (
        <div className="invoices-list">
          {invoices.map(inv => (
            <Link
              key={inv.id}
              to={`/invoices/${inv.id}`}
              className="invoice-row"
            >
              <div className="invoice-row-main">
                <span className="invoice-row-number">{inv.number}</span>
                <span className="invoice-row-date">
                  {new Date(inv.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="invoice-row-right">
                <span className="invoice-row-total">
                  {fmt.format(inv.total || 0)} MRU
                </span>
                <StatusBadge status={inv.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
