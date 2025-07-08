
import React, { useState } from 'react';
import { Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremium } from '@/contexts/PremiumContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumModal } from './PremiumModal';

interface PremiumFeatureProps {
  children: React.ReactNode;
  className?: string;
  showOverlay?: boolean;
}

export const PremiumFeature = ({ children, className = '', showOverlay = true }: PremiumFeatureProps) => {
  const [showModal, setShowModal] = useState(false);
  const { isPremium } = usePremium();
  const { t } = useLanguage();

  if (isPremium) {
    return <div className={className}>{children}</div>;
  }

  if (!showOverlay) {
    return null;
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Blurred content */}
        <div className="filter blur-sm opacity-50 pointer-events-none">
          {children}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-3 p-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-full">
                <Star className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">{t('premiumFeature')}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade ke Premium untuk mengakses fitur ini
              </p>
              <Button 
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                <Star className="h-4 w-4 mr-2" />
                {t('upgradeToPremium')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
