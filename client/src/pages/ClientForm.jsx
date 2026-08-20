import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, Textarea, PageHeader } from '../components/ui.jsx';
import { useToast } from '../components/toast.jsx';
import { get, post, put } from '../api.js';
import { Save, ArrowLeft } from 'lucide-react';
import './ClientForm.css';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  country: 'Mauritanie',
  tva_number: '',
  notes: '',
};

export default function ClientForm() {
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
        const data = await get(`/api/clients/${id}`);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          mobile: data.mobile || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || 'Mauritanie',
          tva_number: data.tva_number || '',
          notes: data.notes || '',
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
      if (isEdit) {
        await put(`/api/clients/${id}`, form);
      } else {
        await post('/api/clients', form);
      }
      toast.success(t('success.saved'));
      navigate('/clients');
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
        title={isEdit ? t('clients.edit') : t('clients.new')}
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
            label={t('fields.email')}
            type="email"
            value={form.email}
            onChange={set('email')}
          />
          <Input
            label={t('fields.phone')}
            value={form.phone}
            onChange={set('phone')}
          />
          <Input
            label={t('fields.mobile')}
            value={form.mobile}
            onChange={set('mobile')}
          />
          <Input
            label={t('fields.address')}
            value={form.address}
            onChange={set('address')}
          />
          <Input
            label={t('fields.city')}
            value={form.city}
            onChange={set('city')}
          />
          <Input
            label={t('fields.country')}
            value={form.country}
            onChange={set('country')}
          />
          <Input
            label={t('fields.tva_number')}
            value={form.tva_number}
            onChange={set('tva_number')}
          />
        </div>

        <Textarea
          label={t('fields.notes')}
          value={form.notes}
          onChange={set('notes')}
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
