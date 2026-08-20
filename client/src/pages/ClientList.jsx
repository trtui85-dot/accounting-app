import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchInput, Spinner, EmptyState, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { useConfirm } from '../components/confirm.jsx';
import { get, del } from '../api.js';
import { Plus, Building2, Phone, Mail, MapPin } from 'lucide-react';
import './ClientList.css';

export default function ClientList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await get('/clients');
      setClients(data);
    } catch (err) {
      toast.error(t('error.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (e, client) => {
    e.stopPropagation();
    const ok = await confirm(t('confirm.delete_client', { name: client.name }));
    if (!ok) return;
    try {
      await del(`/clients/${client.id}`);
      setClients(prev => prev.filter(c => c.id !== client.id));
      toast.success(t('success.deleted'));
    } catch {
      toast.error(t('error.deleting'));
    }
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page">
      <PageHeader title={t('clients.title')}>
        <button className="btn btn-primary" onClick={() => navigate('/clients/new')}>
          <Plus size={18} />
          {t('clients.new')}
        </button>
      </PageHeader>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('clients.search_placeholder')}
      />

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={48} />}
          message={search ? t('clients.no_results') : t('clients.empty')}
        />
      ) : (
        <div className="clients-grid">
          {filtered.map(client => (
            <div
              key={client.id}
              className="client-card"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="client-card-header">
                <h3 className="client-card-name">{client.name}</h3>
                <button
                  className="btn btn-icon btn-danger"
                  onClick={(e) => handleDelete(e, client)}
                  title={t('actions.delete')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <div className="client-card-info">
                {client.phone && (
                  <span className="client-card-detail">
                    <Phone size={14} /> {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="client-card-detail">
                    <Mail size={14} /> {client.email}
                  </span>
                )}
                {(client.city || client.country) && (
                  <span className="client-card-detail">
                    <MapPin size={14} /> {[client.city, client.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
