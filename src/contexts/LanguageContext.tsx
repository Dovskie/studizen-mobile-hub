
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type Language = 'en' | 'id' | 'zh';

interface Translations {
  [key: string]: {
    en: string;
    id: string;
    zh: string;
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', id: 'Dasbor', zh: '仪表板' },
  schedule: { en: 'Schedule', id: 'Jadwal', zh: '日程表' },
  tasks: { en: 'Tasks', id: 'Tugas', zh: '任务' },
  profile: { en: 'Profile', id: 'Profil', zh: '个人资料' },
  premium: { en: 'Premium', id: 'Premium', zh: '高级版' },
  
  // Forms
  save: { en: 'Save', id: 'Simpan', zh: '保存' },
  cancel: { en: 'Cancel', id: 'Batal', zh: '取消' },
  submit: { en: 'Submit', id: 'Kirim', zh: '提交' },
  
  // Premium
  upgradeToPremium: { en: 'Upgrade to Premium', id: 'Upgrade ke Premium', zh: '升级到高级版' },
  premiumFeature: { en: 'Premium Feature', id: 'Fitur Premium', zh: '高级功能' },
  premiumActive: { en: 'Premium Active', id: 'Premium Aktif', zh: '高级版激活' },
  
  // Pricing
  monthly: { en: 'Monthly', id: 'Bulanan', zh: '月度' },
  quarterly: { en: 'Quarterly', id: '3 Bulan', zh: '季度' },
  yearly: { en: 'Yearly', id: 'Tahunan', zh: '年度' },
  
  // Language
  language: { en: 'Language', id: 'Bahasa', zh: '语言' },
  english: { en: 'English', id: 'English', zh: 'English' },
  indonesian: { en: 'Indonesian', id: 'Bahasa Indonesia', zh: '印尼语' },
  chinese: { en: 'Chinese', id: '中文 (Chinese)', zh: '中文' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.language) {
      setLanguageState(profile.language as Language);
    }
  }, [profile]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
