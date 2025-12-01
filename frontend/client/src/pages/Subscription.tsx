import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  Zap,
  Crown,
  Star,
  Sparkles,
  ArrowRight,
  Mail,
  Phone,
  Shield,
  Users,
  Link2,
  Calendar,
  Bell,
  Palette,
  CreditCard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface PlanFeature {
  name: string;
  free?: string | boolean;
  silver?: string | boolean;
  gold?: string | boolean;
  custom?: string | boolean;
  icon?: React.ReactNode;
}

const features: PlanFeature[] = [
  {
    name: 'Session Booking Links',
    free: '1 Link',
    silver: 'Up to 20 Links',
    gold: 'Up to 40 Links',
    custom: 'Negotiated Limit',
    icon: <Link2 className="h-4 w-4" />,
  },
  {
    name: 'Custom Company Logo',
    free: false,
    silver: true,
    gold: true,
    custom: true,
    icon: <Palette className="h-4 w-4" />,
  },
  {
    name: 'Custom Domain Name',
    free: false,
    silver: 'No (Add-on)',
    gold: 'Yes (Included)',
    custom: true,
    icon: <Shield className="h-4 w-4" />,
  },
  {
    name: 'Customer Support',
    free: 'Email Only',
    silver: 'Standard Priority',
    gold: 'High Priority',
    custom: 'Dedicated Account Manager',
    icon: <Mail className="h-4 w-4" />,
  },
  {
    name: 'Staff & Resource Allocation',
    free: false,
    silver: 'Up to 5 Staff',
    gold: 'Up to 20 Staff',
    custom: 'Negotiated',
    icon: <Users className="h-4 w-4" />,
  },
  {
    name: 'Payment Processing',
    free: 'No (Booking only)',
    silver: 'Yes (Razorpay)',
    gold: 'Yes (Razorpay)',
    custom: true,
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    name: 'Automated Scheduling',
    free: 'Basic',
    silver: true,
    gold: true,
    custom: true,
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    name: 'Automated Reminders',
    free: false,
    silver: 'Yes (Email)',
    gold: 'Yes (Email + SMS)',
    custom: true,
    icon: <Bell className="h-4 w-4" />,
  },
  {
    name: 'Booking Form Customization',
    free: 'Basic Fields',
    silver: 'Standard Fields',
    gold: 'Advanced Fields & Logic',
    custom: 'Full Customization',
    icon: <Sparkles className="h-4 w-4" />,
  },
];

const plans = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    period: 'forever',
    description: 'Perfect for testing and small-scale operations',
    icon: <Zap className="h-6 w-6" />,
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    popular: false,
  },
  {
    id: 'silver',
    name: 'Silver Package',
    price: '$29',
    period: 'per month',
    description: 'Great for growing teams and businesses',
    icon: <Star className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    popular: true,
  },
  {
    id: 'gold',
    name: 'Gold Package',
    price: '$79',
    period: 'per month',
    description: 'Best for established businesses with high volume',
    icon: <Crown className="h-6 w-6" />,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    popular: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    price: 'Contact Us',
    period: 'custom pricing',
    description: 'Tailored solutions for enterprise needs',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    popular: false,
  },
];

export default function SubscriptionPlans() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    
    if (planId === 'custom') {
      toast({
        title: 'Contact Sales',
        description: 'Our team will reach out to discuss your custom requirements.',
      });
    } else if (planId === 'free') {
      toast({
        title: 'Free Trial Active',
        description: 'You are currently on the free trial plan.',
      });
    } else {
      toast({
        title: `${planId === 'silver' ? 'Silver' : 'Gold'} Package Selected`,
        description: 'Proceed to checkout to complete your subscription.',
      });
    }
  };

  const renderFeatureValue = (value: string | boolean, planId: string) => {
    if (value === true) {
      return (
        <div className="flex items-center justify-center">
          <div className={`rounded-full p-1 ${
            planId === 'free' ? 'bg-slate-100' :
            planId === 'silver' ? 'bg-blue-100' :
            planId === 'gold' ? 'bg-amber-100' :
            'bg-purple-100'
          }`}>
            <Check className={`h-4 w-4 ${
              planId === 'free' ? 'text-slate-600' :
              planId === 'silver' ? 'text-blue-600' :
              planId === 'gold' ? 'text-amber-600' :
              'text-purple-600'
            }`} />
          </div>
        </div>
      );
    }
    
    if (value === false) {
      return (
        <div className="flex items-center justify-center">
          <X className="h-4 w-4 text-slate-300" />
        </div>
      );
    }
    
    return (
      <div className="text-center text-sm font-medium text-slate-700">
        {value}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-3">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">
            Choose Your Perfect Plan
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Unlock premium features and take your business to the next level
          </p>
          
          {/* Billing Toggle */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
            >
              <motion.span
                animate={{ x: billingCycle === 'monthly' ? 2 : 22 }}
                className="inline-block h-4 w-4 rounded-full bg-white shadow-lg"
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-500'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge className="bg-green-100 text-green-700">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative overflow-hidden border-2 ${plan.borderColor} ${
                  selectedPlan === plan.id ? 'ring-4 ring-blue-200' : ''
                } ${plan.popular ? 'shadow-xl' : 'shadow-md'} transition-all hover:shadow-2xl`}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0">
                    <div className="rounded-bl-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                      POPULAR
                    </div>
                  </div>
                )}
                
                <div className={`${plan.bgColor} p-6`}>
                  <div className={`mb-4 inline-flex rounded-full bg-gradient-to-r ${plan.color} p-3 text-white shadow-lg`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className="mb-2 text-2xl font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  
                  <div className="mb-3">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {plan.price}
                    </span>
                    {plan.price !== 'Contact Us' && (
                      <span className="ml-2 text-sm text-slate-600">
                        / {billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-600">
                    {plan.description}
                  </p>
                </div>
                
                <div className="p-6">
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full bg-gradient-to-r ${plan.color} text-white shadow-md transition-all hover:shadow-lg`}
                  >
                    {plan.id === 'free' ? 'Current Plan' : 
                     plan.id === 'custom' ? 'Contact Sales' : 
                     'Upgrade Now'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Key Features
                    </p>
                    {features.slice(0, 5).map((feature, idx) => {
                      const value = feature[plan.id as keyof typeof feature];
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {value === false ? (
                              <X className="h-4 w-4 text-slate-300" />
                            ) : (
                              <Check className={`h-4 w-4 ${
                                plan.id === 'free' ? 'text-slate-600' :
                                plan.id === 'silver' ? 'text-blue-600' :
                                plan.id === 'gold' ? 'text-amber-600' :
                                'text-purple-600'
                              }`} />
                            )}
                          </div>
                          <span className="text-sm text-slate-700">
                            {feature.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Detailed Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Detailed Feature Comparison
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Compare all features across different plans
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                      Free Trial
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                      Silver Package
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-amber-600">
                      Gold Package
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-purple-600">
                      Custom
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {features.map((feature, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + idx * 0.05 }}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-slate-400">
                            {feature.icon}
                          </div>
                          <span className="font-medium text-slate-900">
                            {feature.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderFeatureValue(feature.free || false, 'free')}
                      </td>
                      <td className="bg-blue-50/50 px-6 py-4">
                        {renderFeatureValue(feature.silver || false, 'silver')}
                      </td>
                      <td className="bg-amber-50/50 px-6 py-4">
                        {renderFeatureValue(feature.gold || false, 'gold')}
                      </td>
                      <td className="bg-purple-50/50 px-6 py-4">
                        {renderFeatureValue(feature.custom || false, 'custom')}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* FAQ / Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-2">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Need Help Choosing?
              </h3>
            </div>
            <p className="mb-4 text-slate-600">
              Our team is here to help you find the perfect plan for your business needs.
            </p>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              <Phone className="mr-2 h-4 w-4" />
              Schedule a Call
            </Button>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-purple-500 p-2">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Enterprise Solutions
              </h3>
            </div>
            <p className="mb-4 text-slate-600">
              Looking for a custom solution? Contact our sales team for enterprise pricing.
            </p>
            <Button className="bg-purple-600 text-white hover:bg-purple-700">
              <Mail className="mr-2 h-4 w-4" />
              Contact Sales
            </Button>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
