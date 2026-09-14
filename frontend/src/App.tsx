import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';

// Layout
import { Header } from './components/layout/Header.js';
import { Footer } from './components/layout/Footer.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';

// Public Pages
import { LandingPage } from './pages/LandingPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { SecurityPage } from './pages/SecurityPage.js';
import { HowItWorksPage } from './pages/HowItWorksPage.js';
import { ServiceDirectoryPage } from './pages/ServiceDirectoryPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { VerifyEmailPage } from './pages/VerifyEmailPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';

// Citizen Portal
import { CitizenDashboard } from './pages/CitizenDashboard.js';
import { WaterApplicationPage } from './pages/WaterApplicationPage.js';
import { DrivingLicenceApplicationPage } from './pages/DrivingLicenceApplicationPage.js';
import { ApplicationDetailPage } from './pages/ApplicationDetailPage.js';
import { ConsentManagementPage } from './pages/ConsentManagementPage.js';
import { GrievancePage } from './pages/GrievancePage.js';

// Officer Portal
import { OfficerDashboard } from './pages/OfficerDashboard.js';

// Admin Portal
import { AdminDashboard } from './pages/AdminDashboard.js';
import { AdminConnectorsPage } from './pages/AdminConnectorsPage.js';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/security" element={<SecurityPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/services" element={<ServiceDirectoryPage />} />
                <Route path="/assistant" element={<AIAssistantPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Citizen Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['CITIZEN', 'CENTRAL_ADMIN']} />}>
                  <Route path="/citizen" element={<CitizenDashboard />} />
                  <Route path="/apply/water" element={<WaterApplicationPage />} />
                  <Route path="/apply/driving-licence" element={<DrivingLicenceApplicationPage />} />
                  <Route path="/applications/new/driving-licence-renewal-address" element={<DrivingLicenceApplicationPage />} />
                  <Route path="/applications/:id" element={<ApplicationDetailPage />} />
                  <Route path="/consents" element={<ConsentManagementPage />} />
                  <Route path="/grievances" element={<GrievancePage />} />
                </Route>

                {/* Officer Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'CENTRAL_ADMIN']} />}>
                  <Route path="/officer" element={<OfficerDashboard />} />
                </Route>

                {/* Central Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['CENTRAL_ADMIN']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/connectors" element={<AdminConnectorsPage />} />
                  <Route path="/admin/audit" element={<AdminAuditLogsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
