import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get } from '../../api.js';
import { Plus } from 'lucide-react';

const fmt = new Intl.NumberFormat('fr-MR');

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'draft', label: 'Brouillon' },
  { key: 'sent', label: 'Envoyées' },
  { key: 'paid', label: 'Payées' },
  { key: 'overdue', label: 'En retard' },
];

export default function MobileInvoiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/invoices').then(d => { setInvoices(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.invoice_number?.toLowerCase().includes(q) || inv.client_name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="m-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search') + '...'} />
      </div>

      <div className="m-filters">
        {TABS.map(tab => (
          <button key={tab.key} className={`m-filter-tab ${filter === tab.key ? 'active' : ''}`} onClick={() => setFilter(tab.key)}>
            {tab.label} {tab.key === 'all' ? invoices.length : invoices.filter(i => i.status === tab.key).length}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="m-spinner" />
      ) : filtered.length === 0 ? (
        <div className="m-empty"><div className="m-empty-title">{t('no_invoices')}</div></div>
      ) : (
        filtered.map(inv => (
          <Link key={inv.id} to={`/invoices/${inv.id}`} className="m-invoice-card">
            <div className="m-invoice-left">
              <span className="m-invoice-number">{inv.invoice_number}</span>
              <span className="m-invoice-client">{inv.client_name || '—'}</span>
            </div>
            <div className="m-invoice-right">
              <span className={`m-invoice-badge ${inv.status}`}>{t(inv.status)}</span>
              <span className="m-invoice-amount">{fmt.format(inv.total || 0)} MRU</span>
            </div>
          </Link>
        ))
      )}

      <Link to="/invoices/new" className="m-btn m-btn-primary" style={{ marginTop: 8, display: 'flex' }}>
        <Plus size={16} /> {t('new_invoice')}
      </Link>
    </div>
  );
}
