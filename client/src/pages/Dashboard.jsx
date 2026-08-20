import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get } from '../api.js';
import { Spinner, StatusBadge, PageHeader } from '../components/ui.jsx';
import {
  Calculator, FileText, Users, AlertTriangle,
  TrendingUp, Plus, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/dashboard')
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <div className="page-error">{t('load_error') || 'Erreur de chargement'}</div>;

  const fmt = (v) => new Intl.NumberFormat('fr-MR').format(v || 0);
  const maxMonthly = Math.max(1, ...data.monthlyStats.map(m => Number(m.revenue) || 0));

  return (
    <div className="page">
      <PageHeader title={t('dashboard')} />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#22c55e18', color: '#22c55e' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="stat-value">{fmt(data.stats.totalRevenue)} MRU</div>
            <div className="stat-label">{t('total_revenue') || 'Chiffre d\'affaires'}</div>
            {data.stats.revenueSub && <div className="stat-sub">{data.stats.revenueSub}</div>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b18', color: '#f59e0b' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="stat-value">{fmt(data.stats.pendingAmount)} MRU</div>
            <div className="stat-label">{t('pending') || 'En attente'}</div>
            {data.stats.pendingSub && <div className="stat-sub">{data.stats.pendingSub}</div>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ef444418', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value">{fmt(data.stats.overdueAmount)} MRU</div>
            <div className="stat-label">{t('overdue') || 'En retard'}</div>
            {data.stats.overdueSub && <div className="stat-sub">{data.stats.overdueSub}</div>}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6366f118', color: '#6366f1' }}>
            <Users size={22} />
          </div>
          <div>
            <div className="stat-value">{data.stats.totalClients || 0}</div>
            <div className="stat-label">{t('total_clients') || 'Total clients'}</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <Link to="/invoices/new" className="btn btn-primary">
          <Plus size={18} /> {t('new_invoice') || 'Nouvelle facture'}
        </Link>
        <Link to="/clients/new" className="btn btn-outline">
          <Plus size={18} /> {t('new_client') || 'Nouveau client'}
        </Link>
      </div>

      <div className="dashboard-section">
        <div className="dashboard-card">
          <h3><FileText size={18} /> {t('recent_invoices') || 'Factures récentes'}</h3>
          {!data.recentInvoices || data.recentInvoices.length === 0 ? (
            <p className="empty-text">{t('no_results') || 'Aucune facture'}</p>
          ) : (
            <div className="invoice-list">
              {data.recentInvoices.slice(0, 5).map(inv => (
                <Link key={inv.id} to={`/invoices/${inv.id}`} className="invoice-row">
                  <div className="invoice-row-info">
                    <span className="invoice-row-number">{inv.invoice_number}</span>
                    <span className="invoice-row-client">{inv.client_name || inv.clientName || '—'}</span>
                  </div>
                  <div className="invoice-row-right">
                    <StatusBadge status={inv.status} />
                    <span className="invoice-row-amount">{fmt(inv.total)} MRU</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {data.recentInvoices && data.recentInvoices.length > 5 && (
            <Link to="/invoices" className="dashboard-link">
              {t('view_all') || 'Voir tout'} <ArrowRight size={16} />
            </Link>
          )}
        </div>

        <div className="dashboard-card">
          <h3><TrendingUp size={18} /> {t('monthly_stats') || 'Statistiques mensuelles'}</h3>
          {!data.monthlyStats || data.monthlyStats.length === 0 ? (
            <p className="empty-text">{t('no_results') || 'Aucune donnée'}</p>
          ) : (
            <div className="monthly-chart">
              <div className="bar-chart">
                {data.monthlyStats.map((m, i) => (
                  <div key={i} className="chart-bar-group">
                    <div className="chart-bar-wrapper">
                      <div
                        className="chart-bar"
                        style={{ height: `${Math.max(4, ((Number(m.revenue) || 0) / maxMonthly) * 100)}%` }}
                        title={`${fmt(m.revenue)} MRU`}
                      />
                    </div>
                    <span className="chart-bar-label">{m.label || m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
