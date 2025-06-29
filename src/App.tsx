
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { WelcomePage } from '@/components/WelcomePage';
import { LoginPage } from '@/components/LoginPage';
import { RegisterPage } from '@/components/RegisterPage';
import { VerificationPage } from '@/components/VerificationPage';
import { ForgotPasswordPage } from '@/components/ForgotPasswordPage';
import { ResetPasswordPage } from '@/components/ResetPasswordPage';
import { Dashboard } from '@/components/Dashboard';
import { JadwalKuliah } from '@/components/JadwalKuliah';
import { TugasKuliah } from '@/components/TugasKuliah';
import { ProfilePage } from '@/components/ProfilePage';

const queryClient = new QueryClient();

type Page = 'welcome' | 'login' | 'register' | 'verification' | 'forgot-password' | 'reset-password' | 'dashboard' | 'jadwal' | 'tugas' | 'profile';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    if (!loading) {
      // Check if we're coming from a password reset link
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const type = urlParams.get('type');
      
      if (accessToken && type === 'recovery') {
        setCurrentPage('reset-password');
        return;
      }

      if (user) {
        setCurrentPage('dashboard');
      } else {
        setCurrentPage('welcome');
      }
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return (
          <WelcomePage
            onLoginClick={() => setCurrentPage('login')}
            onRegisterClick={() => setCurrentPage('register')}
          />
        );
      
      case 'login':
        return (
          <LoginPage
            onBackClick={() => setCurrentPage('welcome')}
            onForgotPasswordClick={() => setCurrentPage('forgot-password')}
            onLoginSuccess={() => setCurrentPage('dashboard')}
          />
        );
      
      case 'register':
        return (
          <RegisterPage
            onBackClick={() => setCurrentPage('welcome')}
            onRegisterSuccess={(email) => {
              setVerificationEmail(email);
              setCurrentPage('verification');
            }}
          />
        );
      
      case 'verification':
        return (
          <VerificationPage
            email={verificationEmail}
            onBackClick={() => setCurrentPage('register')}
            onVerificationSuccess={() => setCurrentPage('dashboard')}
          />
        );
      
      case 'forgot-password':
        return (
          <ForgotPasswordPage
            onBackClick={() => setCurrentPage('login')}
          />
        );
      
      case 'reset-password':
        return (
          <ResetPasswordPage
            onResetSuccess={() => setCurrentPage('dashboard')}
          />
        );
      
      case 'dashboard':
        return (
          <Dashboard
            onJadwalClick={() => setCurrentPage('jadwal')}
            onTugasClick={() => setCurrentPage('tugas')}
            onProfileClick={() => setCurrentPage('profile')}
          />
        );
      
      case 'jadwal':
        return (
          <JadwalKuliah
            onBackClick={() => setCurrentPage('dashboard')}
          />
        );
      
      case 'tugas':
        return (
          <TugasKuliah
            onBackClick={() => setCurrentPage('dashboard')}
          />
        );
      
      case 'profile':
        return (
          <ProfilePage
            onBackClick={() => setCurrentPage('dashboard')}
          />
        );
      
      default:
        return <WelcomePage onLoginClick={() => setCurrentPage('login')} onRegisterClick={() => setCurrentPage('register')} />;
    }
  };

  return renderPage();
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
