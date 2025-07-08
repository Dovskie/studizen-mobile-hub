
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { GoogleLoginButton } from './auth/GoogleLoginButton';
import { LoginForm } from './auth/LoginForm';
import { Divider } from './auth/Divider';

interface LoginPageProps {
  onBackClick: () => void;
  onForgotPasswordClick: () => void;
  onLoginSuccess: (isAdmin?: boolean) => void;
}

export const LoginPage = ({ onBackClick, onForgotPasswordClick, onLoginSuccess }: LoginPageProps) => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBackClick}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl dark:text-gray-200">Login</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <GoogleLoginButton />
          
          <Divider />

          <LoginForm 
            onLoginSuccess={onLoginSuccess}
            onForgotPasswordClick={onForgotPasswordClick}
          />
        </CardContent>
      </Card>
    </div>
  );
};
