import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchInput, Spinner, EmptyState, Badge, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { useConfirm } from '../components/confirm.jsx';
import { get, del } from '../api.js';
import { Plus, Package, DollarSign } from 'lucide-react';
import './ProductList.css';

const fmt = new Intl.NumberFormat('fr-MR');

export default function ProductList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await get('/api/products');
      setProducts(data);
    } catch {
      toast.error(t('error.loading'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (e, product) => {
    e.stopPropagation();
    const ok = await confirm(t('confirm.delete_product', { name: product.name }));
    if (!ok) return;
    try {
      await del(`/api/products/${product.id}`);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success(t('success.deleted'));
    } catch {
      toast.error(t('error.deleting'));
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.unit?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page">
      <PageHeader title={t('products.title')}>
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
          <Plus size={18} />
          {t('products.new')}
        </button>
      </PageHeader>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('products.search_placeholder')}
      />

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={48} />}
          message={search ? t('products.no_results') : t('products.empty')}
        />
      ) : (
        <div className="products-grid">
          {filtered.map(product => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => navigate(`/products/${product.id}/edit`)}
            >
              <div className="product-card-header">
                <h3 className="product-card-name">{product.name}</h3>
                <button
                  className="btn btn-icon btn-danger"
                  onClick={(e) => handleDelete(e, product)}
                  title={t('actions.delete')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>

              {product.description && (
                <p className="product-card-desc">
                  {product.description.length > 80
                    ? product.description.slice(0, 80) + '…'
                    : product.description}
                </p>
              )}

              <div className="product-card-price">
                <DollarSign size={14} />
                {fmt.format(product.unit_price || 0)} MRU
              </div>

              <div className="product-card-meta">
                <Badge color="#3b82f6">{product.tva_rate ?? 16}% TVA</Badge>
                {product.unit && <Badge>{product.unit}</Badge>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
