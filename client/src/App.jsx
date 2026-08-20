import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { useIsMobile } from './hooks/useIsMobile.js';
import Layout from './components/Layout.jsx';
import MobileLayout from './components/MobileLayout.jsx';
import Login from './pages/Login.jsx';

import Dashboard from './pages/Dashboard.jsx';
import InvoiceList from './pages/InvoiceList.jsx';
import InvoiceForm from './pages/InvoiceForm.jsx';
import InvoiceDetail from './pages/InvoiceDetail.jsx';
import ClientList from './pages/ClientList.jsx';
import ClientForm from './pages/ClientForm.jsx';
import ClientDetail from './pages/ClientDetail.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductForm from './pages/ProductForm.jsx';
import SettingsPage from './pages/Settings.jsx';

import MobileDashboard from './pages/mobile/MobileDashboard.jsx';
import MobileInvoiceList from './pages/mobile/MobileInvoiceList.jsx';
import MobileInvoiceForm from './pages/mobile/MobileInvoiceForm.jsx';
import MobileInvoiceDetail from './pages/mobile/MobileInvoiceDetail.jsx';
import MobileClientList from './pages/mobile/MobileClientList.jsx';
import MobileClientForm from './pages/mobile/MobileClientForm.jsx';
import MobileClientDetail from './pages/mobile/MobileClientDetail.jsx';
import MobileProductList from './pages/mobile/MobileProductList.jsx';
import MobileProductForm from './pages/mobile/MobileProductForm.jsx';
import MobileSettings from './pages/mobile/MobileSettings.jsx';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function DesktopRoutes() {
  return (
    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="invoices" element={<InvoiceList />} />
      <Route path="invoices/new" element={<InvoiceForm />} />
      <Route path="invoices/:id" element={<InvoiceDetail />} />
      <Route path="invoices/:id/edit" element={<InvoiceForm />} />
      <Route path="clients" element={<ClientList />} />
      <Route path="clients/new" element={<ClientForm />} />
      <Route path="clients/:id" element={<ClientDetail />} />
      <Route path="clients/:id/edit" element={<ClientForm />} />
      <Route path="products" element={<ProductList />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id/edit" element={<ProductForm />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
  );
}

function MobileRoutes() {
  return (
    <Route path="/" element={<PrivateRoute><MobileLayout /></PrivateRoute>}>
      <Route index element={<MobileDashboard />} />
      <Route path="invoices" element={<MobileInvoiceList />} />
      <Route path="invoices/new" element={<MobileInvoiceForm />} />
      <Route path="invoices/:id" element={<MobileInvoiceDetail />} />
      <Route path="invoices/:id/edit" element={<MobileInvoiceForm />} />
      <Route path="clients" element={<MobileClientList />} />
      <Route path="clients/new" element={<MobileClientForm />} />
      <Route path="clients/:id" element={<MobileClientDetail />} />
      <Route path="clients/:id/edit" element={<MobileClientForm />} />
      <Route path="products" element={<MobileProductList />} />
      <Route path="products/new" element={<MobileProductForm />} />
      <Route path="products/:id/edit" element={<MobileProductForm />} />
      <Route path="settings" element={<MobileSettings />} />
    </Route>
  );
}

export default function App() {
  const { user } = useAuth();
  const isMobile = useIsMobile(768);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      {isMobile ? <MobileRoutes /> : <DesktopRoutes />}
    </Routes>
  );
}
