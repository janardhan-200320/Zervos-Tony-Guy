import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Sparkles, Zap } from 'lucide-react';
import { useLocation } from 'wouter';

interface FeatureGateProps {
  feature?: keyof ReturnType<typeof useSubscription>['features'];
  requiredPlan?: 'classic' | 'pro' | 'elite' | 'custom';
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  requiredPlan,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { features, getCurrentPlan, loading } = useSubscription();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check feature access
  if (feature && features) {
    const hasAccess = features[feature];
    if (hasAccess) {
      return <>{children}</>;
    }
  }

  // Check plan level
  if (requiredPlan) {
    const currentPlan = getCurrentPlan();
    const planHierarchy: Record<'classic' | 'pro' | 'elite' | 'custom', number> = { 
      classic: 1, 
      pro: 2, 
      elite: 3, 
      custom: 4 
    };
    const currentLevel = planHierarchy[currentPlan];
    const requiredLevel = planHierarchy[requiredPlan];

    if (currentLevel >= requiredLevel) {
      return <>{children}</>;
    }
  }

  // If no restrictions, show content
  if (!feature && !requiredPlan) {
    return <>{children}</>;
  }

  // Access denied - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  // Default upgrade prompt
  const getPlanBadge = () => {
    if (requiredPlan === 'elite') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold shadow-lg">
          <Sparkles className="h-4 w-4" />
          Elite Plan
        </div>
      );
    }
    if (requiredPlan === 'pro') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold shadow-lg">
          <Zap className="h-4 w-4" />
          Pro Plan
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-6 mb-6 shadow-lg">
          <Lock className="h-12 w-12 text-gray-500" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Premium Feature
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md">
          This feature is available with the {getPlanBadge()} or higher. 
          Upgrade your subscription to unlock this and many more powerful features.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/subscription-plans')}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            View Plans & Upgrade
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Need help? Contact our support team for personalized plan recommendations.
        </p>
      </CardContent>
    </Card>
  );
}

// Inline variant for smaller UI elements
export function InlineFeatureGate({
  feature,
  requiredPlan,
  children,
}: Omit<FeatureGateProps, 'fallback' | 'showUpgradePrompt'>) {
  const { features, getCurrentPlan, loading } = useSubscription();

  if (loading) return null;

  // Check feature access
  if (feature && features) {
    const hasAccess = features[feature];
    if (hasAccess) {
      return <>{children}</>;
    }
  }

  // Check plan level
  if (requiredPlan) {
    const currentPlan = getCurrentPlan();
    const planHierarchy: Record<'classic' | 'pro' | 'elite' | 'custom', number> = { 
      classic: 1, 
      pro: 2, 
      elite: 3, 
      custom: 4 
    };
    const currentLevel = planHierarchy[currentPlan];
    const requiredLevel = planHierarchy[requiredPlan];

    if (currentLevel >= requiredLevel) {
      return <>{children}</>;
    }
  }

  // If no restrictions, show content
  if (!feature && !requiredPlan) {
    return <>{children}</>;
  }

  return null;
}
