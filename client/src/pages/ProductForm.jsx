import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Textarea, Select, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { get, post, put } from '../api.js';
import { Save, ArrowLeft } from 'lucide-react';
import './ProductForm.css';

const UNIT_OPTIONS = [
  { value: 'unité', label: 'Unité' },
  { value: 'heure', label: 'Heure' },
  { value: 'jour', label: 'Jour' },
  { value: 'projet', label: 'Projet' },
  { value: 'mois', label: 'Mois' },
  { value: 'an', label: 'An' },
  { value: 'lot', label: 'Lot' },
  { value: 'page', label: 'Page' },
  { value: 'course', label: 'Course' },
  { value: 'kg', label: 'Kg' },
  { value: 'mètre', label: 'Mètre' },
];

const emptyForm = {
  name: '',
  description: '',
  unit_price: '',
  tva_rate: '16',
  unit: '',
};

export default function ProductForm() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await get(`/api/products/${id}`);
        setForm({
          name: data.name || '',
          description: data.description || '',
          unit_price: data.unit_price ?? '',
          tva_rate: data.tva_rate ?? '16',
          unit: data.unit || '',
        });
      } catch {
        toast.error(t('error.loading'));
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('validation.name_required'));
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        unit_price: form.unit_price === '' ? null : Number(form.unit_price),
        tva_rate: form.tva_rate === '' ? null : Number(form.tva_rate),
      };
      if (isEdit) {
        await put(`/api/products/${id}`, body);
      } else {
        await post('/api/products', body);
      }
      toast.success(t('success.saved'));
      navigate('/products');
    } catch {
      toast.error(t('error.saving'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="spinner-container"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page form-page">
      <PageHeader
        title={isEdit ? t('products.edit') : t('products.new')}
      >
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          {t('actions.back')}
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <Input
            label={t('fields.name') + ' *'}
            value={form.name}
            onChange={set('name')}
            required
          />
          <Input
            label={t('fields.unit_price')}
            type="number"
            step="0.01"
            min="0"
            value={form.unit_price}
            onChange={set('unit_price')}
          />
          <Input
            label={t('fields.tva_rate') + ' (%)'}
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.tva_rate}
            onChange={set('tva_rate')}
          />
          <Select
            label={t('fields.unit')}
            options={UNIT_OPTIONS}
            placeholder={t('products.select_unit')}
            value={form.unit}
            onChange={set('unit')}
          />
        </div>

        <Textarea
          label={t('fields.description')}
          value={form.description}
          onChange={set('description')}
          rows={4}
        />

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            {t('actions.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={18} />
            {saving ? t('actions.saving') : t('actions.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
