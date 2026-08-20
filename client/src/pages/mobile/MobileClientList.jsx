import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get } from '../../api.js';
import { Plus } from 'lucide-react';

export default function MobileClientList() {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/clients').then(d => { setClients(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.city?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="m-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search') + '...'} />
      </div>

      {loading ? (
        <div className="m-spinner" />
      ) : filtered.length === 0 ? (
        <div className="m-empty"><div className="m-empty-title">{t('no_clients') || 'Aucun client'}</div></div>
      ) : (
        filtered.map(client => (
          <Link key={client.id} to={`/clients/${client.id}`} className="m-client-card">
            <div className="m-client-avatar" style={{ background: '#4f46e5' }}>{client.name?.[0]?.toUpperCase()}</div>
            <div className="m-client-info">
              <div className="m-client-name">{client.name}</div>
              <div className="m-client-detail">{client.phone || client.email || client.city || '—'}</div>
            </div>
          </Link>
        ))
      )}

      <Link to="/clients/new" className="m-btn m-btn-primary" style={{ marginTop: 8, display: 'flex' }}>
        <Plus size={16} /> {t('clients.new')}
      </Link>
    </div>
  );
}
