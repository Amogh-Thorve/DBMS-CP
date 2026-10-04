import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { DashboardView } from './views/DashboardView';
import { VehiclesView } from './views/VehiclesView';
import { OwnersView } from './views/OwnersView';
import { DriversView } from './views/DriversView';
import { CamerasView } from './views/CamerasView';
import { VehicleEventsView } from './views/VehicleEventsView';
import { ViolationsView } from './views/ViolationsView';
import { FinesView } from './views/FinesView';
import { PaymentsView } from './views/PaymentsView';
import { AppealsView } from './views/AppealsView';
import { OfficersView } from './views/OfficersView';
import { SearchView } from './views/SearchView';
import { AnalyticsView } from './views/AnalyticsView';
import { ReportsView } from './views/ReportsView';

export const AppContent: React.FC = () => {
  return (
    <Layout>
      {(activeTab, setActiveTab) => {
        switch (activeTab) {
          case 'dashboard':
            return <DashboardView onNavigate={setActiveTab} />;
          case 'vehicles':
            return <VehiclesView />;
          case 'owners':
            return <OwnersView />;
          case 'drivers':
            return <DriversView />;
          case 'cameras':
            return <CamerasView />;
          case 'events':
            return <VehicleEventsView />;
          case 'violations':
            return <ViolationsView />;
          case 'fines':
            return <FinesView />;
          case 'payments':
            return <PaymentsView />;
          case 'appeals':
            return <AppealsView />;
          case 'officers':
            return <OfficersView />;
          case 'search':
            return <SearchView />;
          case 'analytics':
            return <AnalyticsView />;
          case 'reports':
            return <ReportsView />;
          default:
            return <DashboardView onNavigate={setActiveTab} />;
        }
      }}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
