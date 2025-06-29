
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
import { Dashboard } from '@/components/Dashboard';

const queryClient = new QueryClient();

type Page = 'welcome' | 'login' | 'register' | 'verification' | 'dashboard' | 'jadwal' | 'tugas';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [verificationEmail, setVerificationEmail] = useState('');

  useEffect(() => {
    if (!loading) {
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
            onForgotPasswordClick={() => {
              // Handle forgot password
              console.log('Forgot password clicked');
            }}
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
      
      case 'dashboard':
        return (
          <Dashboard
            onJadwalClick={() => setCurrentPage('jadwal')}
            onTugasClick={() => setCurrentPage('tugas')}
          />
        );
      
      case 'jadwal':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold mb-4">Jadwal Kuliah</h1>
              <p className="text-gray-600 mb-4">Halaman jadwal kuliah akan segera hadir...</p>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        );
      
      case 'tugas':
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
              <h1 className="text-2xl font-bold mb-4">Tugas Kuliah</h1>
              <p className="text-gray-600 mb-4">Halaman tugas kuliah akan segera hadir...</p>
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </div>
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
