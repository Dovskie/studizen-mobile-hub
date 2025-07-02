
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogIn, UserPlus } from 'lucide-react';

interface WelcomePageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const WelcomePage = ({ onLoginClick, onRegisterClick }: WelcomePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              Studizen
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Platform manajemen akademik untuk mahasiswa modern
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={onLoginClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Masuk
            </Button>
            
            <Button
              onClick={onRegisterClick}
              variant="outline"
              className="w-full py-3 dark:border-gray-600 dark:text-gray-300"
              size="lg"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Daftar Akun Baru
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kelola jadwal kuliah dan tugas dengan mudah
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
