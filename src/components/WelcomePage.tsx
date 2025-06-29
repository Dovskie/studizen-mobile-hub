
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen } from 'lucide-react';

interface WelcomePageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const WelcomePage = ({ onLoginClick, onRegisterClick }: WelcomePageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Studizen
          </h1>
          
          <p className="text-gray-600 mb-8 flex items-center justify-center gap-2">
            <BookOpen className="h-4 w-4" />
            Aplikasi Mahasiswa Modern
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={onLoginClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              Login
            </Button>
            
            <Button 
              onClick={onRegisterClick}
              variant="outline" 
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-3 text-lg"
            >
              Register
            </Button>
          </div>
          
          <div className="mt-8 text-xs text-gray-500">
            Kelola jadwal kuliah dan tugas dengan mudah
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
