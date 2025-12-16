import { useSubscription } from '@/hooks/use-subscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useLocation } from 'wouter';

export function SubscriptionStatus() {
  const { 
    subscription, 
    isActive, 
    isExpired, 
    getCurrentPlan, 
    getDaysRemaining,
    loading 
  } = useSubscription();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = getCurrentPlan();
  const daysRemaining = getDaysRemaining();

  // Plan styling
  const planConfig = {
    classic: {
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      icon: CheckCircle2,
      color: 'bg-blue-500',
    },
    pro: {
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      icon: Zap,
      color: 'bg-purple-500',
    },
    elite: {
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      icon: Crown,
      color: 'bg-amber-500',
    },
    custom: {
      gradient: 'from-indigo-600 to-purple-600',
      bgGradient: 'from-indigo-50 to-purple-50',
      icon: Sparkles,
      color: 'bg-gradient-to-r from-indigo-600 to-purple-600',
    },
  };

  const config = planConfig[currentPlan];
  const PlanIcon = config.icon;

  // Calculate progress (assuming monthly = 30 days, annual = 365 days)
  const totalDays = subscription?.billingCycle === 'annual' ? 365 : 30;
  const progress = ((totalDays - daysRemaining) / totalDays) * 100;

  return (
    <Card className={`overflow-hidden border-2 bg-gradient-to-br ${config.bgGradient}`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
              <PlanIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 capitalize">
                  {currentPlan} Plan
                </h3>
                {isActive() && (
                  <Badge variant="default" className={`${config.color} text-white`}>
                    Active
                  </Badge>
                )}
                {isExpired() && (
                  <Badge variant="destructive">
                    Expired
                  </Badge>
                )}
              </div>
              {subscription && (
                <p className="text-sm text-gray-600 capitalize">
                  {subscription.billingCycle} Billing
                </p>
              )}
            </div>
          </div>

          {currentPlan !== 'elite' && currentPlan !== 'custom' && (
            <Button
              onClick={() => navigate('/subscription-plans')}
              size="sm"
              variant="outline"
              className="border-2 hover:bg-white"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Subscription Details */}
        {subscription && isActive() && (
          <div className="space-y-4">
            {/* Days Remaining */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Time Remaining
                </span>
                <span className="font-semibold text-gray-900">
                  {daysRemaining} days
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Renewal Date */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Renews on</span>
              <span className="font-medium text-gray-900">
                {new Date(subscription.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">
                ₹{subscription.amount.toLocaleString('en-IN')}
                {subscription.billingCycle === 'monthly' ? '/mo' : '/yr'}
              </span>
            </div>

            {/* Warning if expiring soon */}
            {daysRemaining <= 7 && daysRemaining > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">
                    Subscription Expiring Soon
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Your plan expires in {daysRemaining} days. Renew now to avoid interruption.
                  </p>
                  <Button
                    onClick={() => navigate('/subscription-plans')}
                    size="sm"
                    className="mt-2 bg-amber-600 hover:bg-amber-700"
                  >
                    Renew Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expired State */}
        {isExpired() && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">
                Subscription Expired
              </p>
              <p className="text-sm text-red-700 mb-3">
                Your subscription has expired. Renew to continue accessing premium features.
              </p>
              <Button
                onClick={() => navigate('/subscription-plans')}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Renew Subscription
              </Button>
            </div>
          </div>
        )}

        {/* No Active Subscription */}
        {!subscription && (
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg">
            <Sparkles className="h-6 w-6 text-indigo-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-indigo-900 mb-1">
                You're on the Free Plan
              </p>
              <p className="text-sm text-indigo-700 mb-3">
                Upgrade to unlock advanced features and grow your business faster.
              </p>
              <Button
                onClick={() => navigate('/subscription-plans')}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Crown className="mr-2 h-4 w-4" />
                View Plans
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
