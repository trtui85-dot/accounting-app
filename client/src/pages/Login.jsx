import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth.jsx';
import { Phone, ArrowRight } from 'lucide-react';

export default function Login() {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const pinRefs = [useRef(), useRef(), useRef(), useRef()];

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
    setPhone(val);
  };

  const handlePinChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[idx] = val.slice(-1);
    setPin(newPin);
    if (val && idx < 3) pinRefs[idx + 1].current?.focus();
    if (val && idx === 3) {
      const pinStr = newPin.join('');
      if (phone.length === 8 && pinStr.length === 4) doLogin(phone, pinStr);
    }
  };

  const handlePinKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !pin[idx] && idx > 0) pinRefs[idx - 1].current?.focus();
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted) {
      const newPin = pasted.split('').concat(['', '', '', '']).slice(0, 4);
      setPin(newPin);
      pinRefs[Math.min(pasted.length, 3)].current?.focus();
      if (pasted.length === 4 && phone.length === 8) doLogin(phone, pasted);
    }
  };

  const doLogin = async (ph, pi) => {
    setError('');
    try {
      await login(ph, pi);
    } catch {
      setError(t('login_error') || 'Numéro ou code PIN incorrect');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const pinStr = pin.join('');
    if (phone.length !== 8) {
      setError(t('phone_error') || 'Le numéro doit contenir 8 chiffres');
      return;
    }
    if (pinStr.length !== 4) {
      setError(t('pin_error') || 'Le code PIN doit contenir 4 chiffres');
      return;
    }
    doLogin(phone, pinStr);
  };

  return (
    <div className="login-page">
      <div className="login-center">
        <img src="/logo-192.png" alt="Facturation" className="login-logo" />
        <h1 className="login-title">Facturation & Comptabilité</h1>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <Phone size={18} className="login-field-icon" />
            <input
              type="tel" inputMode="numeric"
              placeholder={t('phone')}
              value={phone} onChange={handlePhoneChange}
              maxLength={8} autoFocus className="login-input"
            />
          </div>

          <div className="pin-group">
            {pin.map((digit, idx) => (
              <input
                key={idx} ref={pinRefs[idx]}
                type="password" inputMode="numeric"
                className="pin-box" maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(idx, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(idx, e)}
                onPaste={handlePinPaste}
              />
            ))}
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="spinner-sm" /> : <>{t('login')} <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
