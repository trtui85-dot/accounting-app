import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get } from '../../api.js';
import { Plus, ArrowRight, TrendingUp, FileText, Users, AlertTriangle } from 'lucide-react';

const fmt = new Intl.NumberFormat('fr-MR');

export default function MobileDashboard() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/dashboard')
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="m-spinner" />;
  if (!data) return <div className="m-empty"><div className="m-empty-title">{t('load_error') || 'Erreur'}</div></div>;

  const s = data.stats || {};
  const maxM = Math.max(1, ...(data.monthlyStats || []).map(m => Number(m.revenue) || 0));

  return (
    <div>
      <div className="m-stats">
        <div className="m-stat">
          <div className="m-stat-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><TrendingUp size={16} /></div>
          <div><div className="m-stat-value">{fmt.format(s.totalRevenue || 0)}</div><div className="m-stat-label">CA Total</div></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FileText size={16} /></div>
          <div><div className="m-stat-value">{fmt.format(s.pendingAmount || 0)}</div><div className="m-stat-label">En attente</div></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}><AlertTriangle size={16} /></div>
          <div><div className="m-stat-value">{fmt.format(s.overdueAmount || 0)}</div><div className="m-stat-label">En retard</div></div>
        </div>
        <div className="m-stat">
          <div className="m-stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><Users size={16} /></div>
          <div><div className="m-stat-value">{s.totalClients || 0}</div><div className="m-stat-label">Clients</div></div>
        </div>
      </div>

      <div className="m-actions">
        <Link to="/invoices/new" className="m-btn m-btn-primary"><Plus size={16} /> {t('new_invoice')}</Link>
        <Link to="/clients/new" className="m-btn m-btn-outline"><Plus size={16} /> {t('new_client')}</Link>
      </div>

      {data.recentInvoices?.length > 0 && (
        <>
          <div className="m-section-title">{t('recent_invoices')}</div>
          <div className="m-list">
            {data.recentInvoices.slice(0, 5).map(inv => (
              <Link key={inv.id} to={`/invoices/${inv.id}`} className="m-list-item">
                <div className="m-list-left">
                  <span className="m-list-number">{inv.invoice_number}</span>
                  <span className="m-list-sub">{inv.client_name || '—'}</span>
                </div>
                <div className="m-list-right">
                  <span className={`m-invoice-badge ${inv.status}`}>{t(inv.status)}</span>
                  <span className="m-list-amount">{fmt.format(inv.total || 0)}</span>
                </div>
              </Link>
            ))}
          </div>
          {data.recentInvoices.length > 5 && (
            <Link to="/invoices" style={{ display: 'flex', justifyContent: 'center', padding: '6px', fontSize: 12, color: '#4f46e5', fontWeight: 600, gap: 4, alignItems: 'center' }}>
              {t('view_all')} <ArrowRight size={14} />
            </Link>
          )}
        </>
      )}

      {(data.monthlyStats || []).length > 0 && (
        <>
          <div className="m-section-title">{t('monthly_stats')}</div>
          <div className="m-chart">
            <div className="m-bar-chart">
              {data.monthlyStats.map((m, i) => (
                <div key={i} className="m-bar-group">
                  <div className="m-bar-wrapper">
                    <div className="m-bar" style={{ height: `${Math.max(5, ((Number(m.revenue) || 0) / maxM) * 100)}%` }} />
                  </div>
                  <span className="m-bar-label">{m.month?.slice(5) || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
