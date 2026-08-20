import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

function PrivateRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" />;
}

export default function App() {
  const { user } = useAuth();
  const isMobile = useIsMobile(768);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route element={<PrivateRoute />}>
        <Route element={isMobile ? <MobileLayout /> : <Layout />}>
          <Route index element={isMobile ? <MobileDashboard /> : <Dashboard />} />
          <Route path="invoices" element={isMobile ? <MobileInvoiceList /> : <InvoiceList />} />
          <Route path="invoices/new" element={isMobile ? <MobileInvoiceForm /> : <InvoiceForm />} />
          <Route path="invoices/:id" element={isMobile ? <MobileInvoiceDetail /> : <InvoiceDetail />} />
          <Route path="invoices/:id/edit" element={isMobile ? <MobileInvoiceForm /> : <InvoiceForm />} />
          <Route path="clients" element={isMobile ? <MobileClientList /> : <ClientList />} />
          <Route path="clients/new" element={isMobile ? <MobileClientForm /> : <ClientForm />} />
          <Route path="clients/:id" element={isMobile ? <MobileClientDetail /> : <ClientDetail />} />
          <Route path="clients/:id/edit" element={isMobile ? <MobileClientForm /> : <ClientForm />} />
          <Route path="products" element={isMobile ? <MobileProductList /> : <ProductList />} />
          <Route path="products/new" element={isMobile ? <MobileProductForm /> : <ProductForm />} />
          <Route path="products/:id/edit" element={isMobile ? <MobileProductForm /> : <ProductForm />} />
          <Route path="settings" element={isMobile ? <MobileSettings /> : <SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
