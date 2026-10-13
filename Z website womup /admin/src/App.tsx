import React from 'react';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { StoresPage } from './pages/StoresPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CustomersPage } from './pages/CustomersPage';
import { StaffPage } from './pages/StaffPage';
import { LocationsPage } from './pages/LocationsPage';
import { AreaPricingPage } from './pages/AreaPricingPage';
import { PayoutRatesPage } from './pages/PayoutRatesPage';
import { WalletsPage } from './pages/WalletsPage';
import { MarketingPage } from './pages/MarketingPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

// Modals
import { AddStoreModal } from './components/modals/AddStoreModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { EditProductModal } from './components/modals/EditProductModal';
import { OrderDetailsModal } from './components/modals/OrderDetailsModal';

const AdminPortalContent: React.FC = () => {
  const { activeTab } = useAdmin();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardPage />;
      case 'Stores':
        return <StoresPage />;
      case 'Orders':
        return <OrdersPage />;
      case 'Inventory':
        return <InventoryPage />;
      case 'Categories':
        return <CategoriesPage />;
      case 'Customers':
        return <CustomersPage />;
      case 'Staff':
        return <StaffPage />;
      case 'Locations':
        return <LocationsPage />;
      case 'Prices':
        return <AreaPricingPage />;
      case 'PayoutRates':
        return <PayoutRatesPage />;
      case 'Wallets':
        return <WalletsPage />;
      case 'Marketing':
        return <MarketingPage />;
      case 'AuditLogs':
        return <AuditLogsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="admin-portal-app">
      {/* 100% Desktop Website Sidebar Navigation */}
      <Sidebar />

      {/* Main Wrapper */}
      <div className="admin-main-wrapper">
        <TopNavbar />
        <main className="admin-page-scrollable">
          {renderActivePage()}
        </main>
      </div>

      {/* Global Interactive Modals */}
      <AddStoreModal />
      <AddProductModal />
      <EditProductModal />
      <OrderDetailsModal />
    </div>
  );
};

export default function App() {
  return (
    <AdminProvider>
      <AdminPortalContent />
    </AdminProvider>
  );
}
