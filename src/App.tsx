
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
import { AdminLoginPage } from '@/components/AdminLoginPage';
import { AdminPanel } from '@/components/AdminPanel';

const queryClient = new QueryClient();

type Page = 'welcome' | 'login' | 'register' | 'verification' | 'forgot-password' | 'reset-password' | 'dashboard' | 'jadwal' | 'tugas' | 'profile' | 'admin-login' | 'admin-panel';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [verificationEmail, setVerificationEmail] = useState('');

  // Check if current user is admin
  const isAdmin = user?.email === 'Adminstudizen@studizen.com';

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

  useEffect(() => {
    // Load theme preference and apply it
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (selectedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', selectedTheme === 'dark');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
            onAdminClick={() => setCurrentPage('admin-login')}
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
            onAdminClick={isAdmin ? () => setCurrentPage('admin-panel') : undefined}
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
      
      case 'admin-login':
        return (
          <AdminLoginPage
            onBackClick={() => setCurrentPage('welcome')}
            onLoginSuccess={() => setCurrentPage('admin-panel')}
          />
        );
      
      case 'admin-panel':
        return (
          <AdminPanel
            onBackClick={() => setCurrentPage('dashboard')}
          />
        );
      
      default:
        return <WelcomePage onLoginClick={() => setCurrentPage('login')} onRegisterClick={() => setCurrentPage('register')} onAdminClick={() => setCurrentPage('admin-login')} />;
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
