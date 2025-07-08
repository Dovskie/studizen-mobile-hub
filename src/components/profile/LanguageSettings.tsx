import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

export const LanguageSettings = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = async (newLanguage: 'en' | 'id' | 'zh') => {
    await setLanguage(newLanguage);
    toast({
      title: "Bahasa Berhasil Diubah",
      description: "Pengaturan bahasa telah disimpan",
    });
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
          🌐 {t('language')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-sm">Pilih Bahasa</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('english')}</SelectItem>
                <SelectItem value="id">{t('indonesian')}</SelectItem>
                <SelectItem value="zh">{t('chinese')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Fitur ini gratis untuk semua pengguna. Bahasa yang dipilih akan disimpan di profil Anda.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};