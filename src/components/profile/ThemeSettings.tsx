import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const ThemeSettings = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    setTheme(savedTheme);
  }, []);

  const applyTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    
    if (selectedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', selectedTheme === 'dark');
    }
    
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    toast({
      title: "Tema Berhasil Diubah",
      description: `Tema telah diubah ke ${newTheme === 'light' ? 'terang' : newTheme === 'dark' ? 'gelap' : 'sistem'}`,
    });
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
          <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
          Preferensi Tema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="dark:text-gray-300 text-sm">Pilih Tema</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Terang</SelectItem>
                <SelectItem value="dark">Gelap</SelectItem>
                <SelectItem value="system">Ikuti Sistem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};