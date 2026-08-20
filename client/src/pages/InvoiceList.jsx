import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchInput, Spinner, EmptyState, StatusBadge, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { get } from '../api.js';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import './InvoiceList.css';

const fmt = new Intl.NumberFormat('fr-MR');

const FILTER_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'draft', label: 'Brouillon' },
  { key: 'sent', label: 'Envoyées' },
  { key: 'paid', label: 'Payées' },
  { key: 'overdue', label: 'En retard' },
];

export default function InvoiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await get('/invoices');
        setInvoices(data);
      } catch {
        toast.error(t('error.loading'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = invoices.filter(inv => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.client_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page">
      <PageHeader title={t('invoices')}>
        <button className="btn btn-primary" onClick={() => navigate('/invoices/new')}>
          <Plus size={18} />
          {t('new_invoice')}
        </button>
      </PageHeader>

      <div className="invoices-toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={t('search') + '...'}
        />
      </div>

      <div className="filter-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="filter-tab-count">
                {invoices.filter(i => i.status === tab.key).length}
              </span>
            )}
            {tab.key === 'all' && (
              <span className="filter-tab-count">{invoices.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} strokeWidth={1.5} />}
          title={search || filter !== 'all' ? t('no_results') : t('no_invoices')}
        />
      ) : (
        <div className="invoices-grid">
          {filtered.map(inv => (
            <div
              key={inv.id}
              className="invoice-card"
              onClick={() => navigate(`/invoices/${inv.id}`)}
            >
              <div className="invoice-card-header">
                <span className="invoice-card-number">{inv.invoice_number}</span>
                <StatusBadge status={inv.status} />
              </div>

              <div className="invoice-card-client">{inv.client_name || '—'}</div>

              <div className="invoice-card-amount">
                <DollarSign size={16} />
                {fmt.format(inv.total || 0)} MRU
              </div>

              <div className="invoice-card-body">
                {inv.paid_amount > 0 && inv.status !== 'paid' && (
                  <div className="invoice-card-paid">
                    {t('paid')}: {fmt.format(inv.paid_amount)} MRU
                  </div>
                )}
              </div>

              <div className="invoice-card-dates">
                <span>
                  <Calendar size={13} />
                  {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString('fr-FR') : '—'}
                </span>
                <span>
                  → {inv.due_date ? new Date(inv.due_date).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
