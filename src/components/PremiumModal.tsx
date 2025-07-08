
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Check, Zap, Brain, BookOpen } from 'lucide-react';
import { usePremium } from '@/contexts/PremiumContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal = ({ isOpen, onClose }: PremiumModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { subscribeToPremium, isPremium } = usePremium();
  const { t } = useLanguage();

  const plans = [
    {
      id: 'monthly',
      name: t('monthly'),
      price: 'Rp20.000',
      period: '/bulan',
      savings: null,
      popular: false,
    },
    {
      id: 'quarterly',
      name: t('quarterly'),
      price: 'Rp45.000',
      period: '/3 bulan',
      savings: 'Hemat Rp15.000',
      popular: true,
    },
    {
      id: 'yearly',
      name: t('yearly'),
      price: 'Rp60.000',
      period: '/tahun',
      savings: 'Hemat Rp180.000',
      popular: false,
    },
  ];

  const features = [
    'Smart Assistant & AI Rekomendasi',
    'AI Task Breakdown Otomatis',
    'Generate Soal Latihan',
    'Simulasi Ujian',
    'Upload File Unlimited',
    'Analisis Produktivitas',
    'Prioritas Customer Support',
  ];

  const handleSubscribe = async (planType: 'monthly' | 'quarterly' | 'yearly') => {
    setLoading(planType);
    try {
      await subscribeToPremium(planType);
      toast({
        title: "Berhasil Berlangganan Premium!",
        description: "Selamat! Akun Anda sekarang sudah Premium.",
      });
      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Gagal Berlangganan",
        description: "Terjadi kesalahan saat memproses langganan Anda.",
      });
    } finally {
      setLoading(null);
    }
  };

  if (isPremium) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t('premiumActive')}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-muted-foreground mb-4">
              Akun Anda sudah Premium! Nikmati semua fitur eksklusif.
            </p>
            <Button onClick={onClose} className="w-full">
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="h-6 w-6 text-yellow-500" />
            {t('upgradeToPremium')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fitur Premium:</h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Brain className="h-5 w-5" />
                <span className="text-sm font-medium">AI Powered</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600">
                <Zap className="h-5 w-5" />
                <span className="text-sm font-medium">Smart Features</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <BookOpen className="h-5 w-5" />
                <span className="text-sm font-medium">Study Tools</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pilih Paket:</h3>
            <div className="space-y-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-4 bg-blue-500">
                      Paling Populer
                    </Badge>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{plan.name}</CardTitle>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        </div>
                        {plan.savings && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {plan.savings}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.id as any)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? 'Memproses...' : 'Beli Sekarang'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-6">
          * Pembayaran akan diproses secara otomatis. Fitur premium langsung aktif setelah pembayaran berhasil.
        </div>
      </DialogContent>
    </Dialog>
  );
};
