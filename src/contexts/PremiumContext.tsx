
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PremiumSubscription {
  id: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  price: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface PremiumContextType {
  isPremium: boolean;
  subscription: PremiumSubscription | null;
  loading: boolean;
  refreshPremiumStatus: () => Promise<void>;
  subscribeToPremium: (planType: 'monthly' | 'quarterly' | 'yearly') => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshPremiumStatus = async () => {
    if (!user) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setIsPremium(true);
        setSubscription(data);
      } else {
        setIsPremium(false);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPremium = async (planType: 'monthly' | 'quarterly' | 'yearly') => {
    if (!user) return;

    const prices = {
      monthly: 20000,
      quarterly: 45000,
      yearly: 60000,
    };

    const durations = {
      monthly: 1,
      quarterly: 3,
      yearly: 12,
    };

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durations[planType]);

    try {
      const { error } = await supabase
        .from('premium_subscriptions')
        .upsert({
          user_id: user.id,
          plan_type: planType,
          price: prices[planType],
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
        });

      if (error) throw error;

      await refreshPremiumStatus();
    } catch (error) {
      console.error('Error subscribing to premium:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshPremiumStatus();
  }, [user]);

  return (
    <PremiumContext.Provider value={{
      isPremium,
      subscription,
      loading,
      refreshPremiumStatus,
      subscribeToPremium,
    }}>
      {children}
    </PremiumContext.Provider>
  );
};
