import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { get } from '../../api.js';
import { Plus } from 'lucide-react';

const fmt = new Intl.NumberFormat('fr-MR');

export default function MobileProductList() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/products').then(d => { setProducts(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
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
        <div className="m-empty"><div className="m-empty-title">{t('no_products') || 'Aucun produit'}</div></div>
      ) : (
        <div className="m-product-grid">
          {filtered.map(product => (
            <Link key={product.id} to={`/products/${product.id}/edit`} className="m-product-card">
              <div className="m-product-name">{product.name}</div>
              <div className="m-product-price">{fmt.format(product.unit_price || 0)} MRU</div>
              {product.description && <div className="m-product-desc">{product.description}</div>}
              <div className="m-product-meta">
                <span className="m-product-tag">{product.tva_rate ?? 16}% TVA</span>
                {product.unit && <span className="m-product-tag">{product.unit}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link to="/products/new" className="m-btn m-btn-primary" style={{ marginTop: 8, display: 'flex' }}>
        <Plus size={16} /> {t('products.new')}
      </Link>
    </div>
  );
}
