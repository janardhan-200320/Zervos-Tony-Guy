import { useState, useEffect } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export interface SubscriptionFeatures {
  userLogins: number;
  roleBasedPermissions: boolean;
  onlineBooking: boolean;
  pos: boolean;
  staffManagement: boolean;
  whatsappNotifications: boolean;
  loyaltySystem: boolean;
  reviewSystem: boolean;
  inventoryManagement: boolean;
  customDomain: boolean;
  hrms: boolean;
  giftCards: boolean;
}

export interface Subscription {
  id: string;
  planId: 'classic' | 'pro' | 'elite' | 'custom';
  planName: string;
  billingCycle: 'monthly' | 'annual';
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  amount: number;
  transactionId: string;
}

export function useSubscription() {
  const { selectedWorkspace } = useWorkspace();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [features, setFeatures] = useState<SubscriptionFeatures | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, [selectedWorkspace]);

  const loadSubscription = () => {
    try {
      setLoading(true);
      
      // Load from localStorage
      const storageKey = `zervos_subscription_${selectedWorkspace?.id || 'default'}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (storedData) {
        const sub = JSON.parse(storedData) as Subscription;
        
        // Check if subscription is expired
        const endDate = new Date(sub.endDate);
        const now = new Date();
        
        if (endDate < now && sub.status === 'active') {
          sub.status = 'expired';
          localStorage.setItem(storageKey, JSON.stringify(sub));
        }
        
        setSubscription(sub);
        loadFeatures(sub.planId);
      } else {
        // Default to Classic plan with basic features
        setSubscription(null);
        loadFeatures('classic');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      loadFeatures('classic');
    } finally {
      setLoading(false);
    }
  };

  const loadFeatures = async (planId: string) => {
    try {
      const response = await fetch(`/api/subscriptions/features?planId=${planId}`);
      const data = await response.json();
      setFeatures(data.features);
    } catch (error) {
      console.error('Error loading features:', error);
      // Fallback to basic classic features
      setFeatures({
        userLogins: 1,
        roleBasedPermissions: false,
        onlineBooking: true,
        pos: true,
        staffManagement: true,
        whatsappNotifications: true,
        loyaltySystem: false,
        reviewSystem: false,
        inventoryManagement: false,
        customDomain: false,
        hrms: false,
        giftCards: false,
      });
    }
  };

  const saveSubscription = (newSubscription: Subscription) => {
    try {
      const storageKey = `zervos_subscription_${selectedWorkspace?.id || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(newSubscription));
      setSubscription(newSubscription);
      loadFeatures(newSubscription.planId);
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const hasFeature = (featureName: keyof SubscriptionFeatures): boolean => {
    if (!features) return false;
    return features[featureName] === true;
  };

  const hasAccessToUserCount = (requiredUsers: number): boolean => {
    if (!features) return false;
    return features.userLogins >= requiredUsers;
  };

  const isActive = (): boolean => {
    return subscription?.status === 'active';
  };

  const isExpired = (): boolean => {
    return subscription?.status === 'expired';
  };

  const getCurrentPlan = (): 'classic' | 'pro' | 'elite' | 'custom' => {
    return subscription?.planId || 'classic';
  };

  const getDaysRemaining = (): number => {
    if (!subscription) return 0;
    
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    return Math.max(0, days);
  };

  const cancelSubscription = async (reason?: string) => {
    try {
      if (!subscription) return;

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          reason,
        }),
      });

      if (response.ok) {
        const updatedSub = { ...subscription, status: 'cancelled' as const };
        saveSubscription(updatedSub);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  return {
    subscription,
    features,
    loading,
    hasFeature,
    hasAccessToUserCount,
    isActive,
    isExpired,
    getCurrentPlan,
    getDaysRemaining,
    saveSubscription,
    cancelSubscription,
    reload: loadSubscription,
  };
}
