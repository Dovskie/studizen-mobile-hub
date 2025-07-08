import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/contexts/PremiumContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProfileForm } from './profile/ProfileForm';
import { PasswordForm } from './profile/PasswordForm';
import { EmailForm } from './profile/EmailForm';
import { PremiumStatusCard } from './profile/PremiumStatusCard';
import { ThemeSettings } from './profile/ThemeSettings';
import { LanguageSettings } from './profile/LanguageSettings';
import { DangerZone } from './profile/DangerZone';

interface ProfilePageProps {
  onBackClick: () => void;
}

export const ProfilePage = ({ onBackClick }: ProfilePageProps) => {
  const { isPremium } = usePremium();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={onBackClick} className="min-w-[40px]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 truncate">
              {t('profile')} & Pengaturan
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              Kelola informasi akun dan preferensi Anda
            </p>
          </div>
          {isPremium && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
              <Crown className="h-3 w-3 sm:h-4 sm:w-4" />
              Premium
            </div>
          )}
        </div>

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 py-2">
              Akun
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs sm:text-sm px-2 py-2">
              Password
            </TabsTrigger>
            <TabsTrigger value="email" className="text-xs sm:text-sm px-2 py-2">
              Email
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-2 py-2">
              Pengaturan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <ProfileForm />
            <PremiumStatusCard />
          </TabsContent>

          <TabsContent value="password" className="space-y-4">
            <PasswordForm />
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <EmailForm />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <ThemeSettings />
            <LanguageSettings />
            <DangerZone />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
