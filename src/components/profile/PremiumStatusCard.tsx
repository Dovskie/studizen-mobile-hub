import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Crown } from 'lucide-react';
import { usePremium } from '@/contexts/PremiumContext';
import { PremiumModal } from '../PremiumModal';

export const PremiumStatusCard = () => {
  const { isPremium, subscription } = usePremium();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <>
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 dark:text-gray-200 text-base sm:text-lg">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            Status Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPremium ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Crown className="h-5 w-5" />
                <span className="font-semibold">Akun Premium Aktif</span>
              </div>
              {subscription && (
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Paket: {subscription.plan_type === 'monthly' ? 'Bulanan' : subscription.plan_type === 'quarterly' ? '3 Bulan' : 'Tahunan'}</p>
                  <p>Berakhir: {new Date(subscription.end_date).toLocaleDateString('id-ID')}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Upgrade ke Premium untuk akses fitur eksklusif seperti AI Assistant, Task Breakdown, dan Generate Soal Latihan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3 text-center border-dashed">
                  <div className="text-lg font-bold">Rp20.000</div>
                  <div className="text-xs text-gray-500">/bulan</div>
                </Card>
                <Card className="p-3 text-center border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-lg font-bold text-blue-600">Rp45.000</div>
                  <div className="text-xs text-blue-500">/3 bulan</div>
                  <div className="text-xs text-green-600 font-medium">Hemat 25%</div>
                </Card>
                <Card className="p-3 text-center border-dashed">
                  <div className="text-lg font-bold">Rp60.000</div>
                  <div className="text-xs text-gray-500">/tahun</div>
                  <div className="text-xs text-green-600 font-medium">Hemat 75%</div>
                </Card>
              </div>
              <Button 
                onClick={() => setShowPremiumModal(true)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 h-12"
              >
                <Star className="h-4 w-4 mr-2" />
                Upgrade ke Premium
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </>
  );
};