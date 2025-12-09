import type { ReactNode } from 'react';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Crown, Shield, Sparkles, Star, ArrowRight, Mail, Phone, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface SalonPlan {
  id: string;
  name: string;
  tagline: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  price?: string;
  popular?: boolean;
  features: string[];
  reportsTitle?: string;
  reports?: string[];
  ctaLabel: string;
  toastDescription: string;
}

interface ComparisonFeature {
  category: string;
  items: {
    name: string;
    classic: boolean | string;
    pro: boolean | string;
    elite: boolean | string;
    enterprise: boolean | string;
  }[];
}

const plans: SalonPlan[] = [
  {
    id: 'classic',
    name: 'Classic Salon',
    tagline: 'Perfect for small salons',
    price: 'Starting at ₹5,000/month',
    icon: <Star className="h-6 w-6" />,
    color: 'from-slate-500 to-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    features: [
      'Single - user login access',
      'Booking System',
      'Point of Sale (POS)',
      'Staff Member Assignment',
      'Products & Services Management',
      'Customer profile management',
      'Service duration & package builder',
      'Appointment reminders (SMS/WhatsApp )',
      'Vendor management',
      'Bulk Items & Service',
    ],
    reportsTitle: 'Reports',
    reports: [
      'Basic reports (Daily sales, Service list)',
      'Total Income',
      'Product Stock Reports',
    ],
    ctaLabel: 'Talk to Us',
    toastDescription: 'We will help you activate the Classic Salon starter toolkit.',
  },
  {
    id: 'pro',
    name: 'Pro Salon',
    tagline: 'For growing salons',
    price: 'Starting at ₹15,000/month',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    popular: true,
    features: [
      '5 - user login access',
      'Role-based permissions (Admin, Cashier, Manager)',
      'Online Booking System',
      'Point of Sale (POS)',
      'Staff Member Assignment',
      'Products & Services Management',
      'Vendor management',
      'WhatsApp Notifications (Booking, reminders, completions)',
      'Loyalty & Membership System',
      'Review & rating system',
      'Discount & promo code system',
      'Unlimited customer database',
      'Service duration & package builder',
    ],
    reportsTitle: 'Advanced Reports',
    reports: [
      'Staff Performance reports',
      'Product inventory report',
    ],
    ctaLabel: 'Request Demo',
    toastDescription: 'A product specialist will walk you through Pro Salon capabilities.',
  },
  {
    id: 'elite',
    name: 'Elite Salon',
    tagline: 'For established salons',
    price: 'Starting at ₹30,000/month',
    icon: <Crown className="h-6 w-6" />,
    color: 'from-amber-500 to-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    features: [
      'Custom domain',
      '10 - user login access',
      'Role-based permissions (Admin, Cashier, Manager)',
      'Online Booking System',
      'Point of Sale (POS)',
      'Staff Member Assignment',
      'Products & Services Management',
      'WhatsApp Notifications (Booking, reminders, completions)',
      'Loyalty & Membership System',
      'Vendor management',
      'Service duration & package builder',
      'Review & rating system',
      'Auto Birthday & Anniversary Greetings',
      'Offers & Marketing Automation',
      'WhatsApp Marketing Campaigns',
      'Inventory management with stock alerts',
      'Gift card system',
      'Accounts management',
      'HRMS (Attendance, Payroll, Leaves)',
    ],
    reportsTitle: 'Advanced reports',
    reports: [
      'Full financial statements (P&L, Expense tracking, GST reports)',
      'Stock reports',
      'Staff timesheet & productivity reports',
    ],
    ctaLabel: 'Schedule Consultation',
    toastDescription: 'We will craft an Elite Salon rollout plan with you.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Custom solutions for large chains',
    price: 'Custom pricing',
    icon: <Shield className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Custom domain',
      'Unlimited user login access',
      'Multi - Branch User',
      'Role-based permissions (Admin, Cashier, Manager)',
      'Online Booking System',
      'Point of Sale (POS)',
      'Staff Member Assignment',
      'Products & Services Management',
      'WhatsApp Notifications (Booking, reminders, completions)',
      'Loyalty & Membership System',
      'Vendor management',
      'Service duration & package builder',
      'Review & rating system',
      'Auto Birthday & Anniversary Greetings',
      'Offers & Marketing Automation',
      'WhatsApp Marketing Campaigns',
      'Inventory management with stock alerts',
      'Gift card system',
      'Accounts management',
      'HRMS (Attendance, Payroll, Leaves)',
    ],
    reportsTitle: 'Advanced reports',
    reports: [
      'Full financial statements (P&L, Expense tracking, GST reports)',
      'Stock reports',
      'Staff timesheet & productivity reports',
      'Report Automation (To Management)',
    ],
    ctaLabel: 'Create Custom Scope',
    toastDescription: 'Our enterprise team will gather requirements for your custom build.',
  },
];

const comparisonFeatures: ComparisonFeature[] = [
  {
    category: 'User Access',
    items: [
      { name: 'User Logins', classic: '1 User', pro: '5 Users', elite: '10 Users', enterprise: 'Unlimited' },
      { name: 'Role-based Permissions', classic: false, pro: true, elite: true, enterprise: true },
      { name: 'Multi-Branch Support', classic: false, pro: false, elite: false, enterprise: true },
    ],
  },
  {
    category: 'Core Features',
    items: [
      { name: 'Booking System', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'Point of Sale (POS)', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'Staff Management', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'Customer Profiles', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'Products & Services', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'Service Packages', classic: true, pro: true, elite: true, enterprise: true },
    ],
  },
  {
    category: 'Communications',
    items: [
      { name: 'SMS/WhatsApp Reminders', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'WhatsApp Notifications', classic: false, pro: true, elite: true, enterprise: true },
      { name: 'Marketing Campaigns', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'Auto Birthday/Anniversary Greetings', classic: false, pro: false, elite: true, enterprise: true },
    ],
  },
  {
    category: 'Business Management',
    items: [
      { name: 'Loyalty & Membership System', classic: false, pro: true, elite: true, enterprise: true },
      { name: 'Discount & Promo Codes', classic: false, pro: true, elite: true, enterprise: true },
      { name: 'Review & Rating System', classic: false, pro: true, elite: true, enterprise: true },
      { name: 'Gift Card System', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'Inventory Management', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'Accounts Management', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'HRMS (Attendance, Payroll)', classic: false, pro: false, elite: true, enterprise: true },
    ],
  },
  {
    category: 'Reports & Analytics',
    items: [
      { name: 'Basic Sales Reports', classic: true, pro: true, elite: true, enterprise: true },
      { name: 'Staff Performance Reports', classic: false, pro: true, elite: true, enterprise: true },
      { name: 'Financial Statements (P&L)', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'GST Reports', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'Automated Reports', classic: false, pro: false, elite: false, enterprise: true },
    ],
  },
  {
    category: 'Advanced Features',
    items: [
      { name: 'Custom Domain', classic: false, pro: false, elite: true, enterprise: true },
      { name: 'Custom Branding (White Label)', classic: false, pro: false, elite: false, enterprise: true },
      { name: 'Dedicated Support', classic: false, pro: false, elite: false, enterprise: true },
    ],
  },
];



export default function SubscriptionPlans() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const handleSelectPlan = (plan: SalonPlan) => {
    setSelectedPlan(plan.id);
    toast({
      title: `${plan.name} selected`,
      description: plan.toastDescription,
    });
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
            Salon Upgrade Plans
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Pick the bundle that matches your salon operations and growth stage.
          </p>
        </motion.div>

        {/* View Mode Toggle */}
        <div className="flex justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('cards')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500'
            }`}
          >
            Plan Cards
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode('table')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500'
            }`}
          >
            Detailed Comparison
          </motion.button>
        </div>

        {/* Plan Cards View */}
        {viewMode === 'cards' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`relative flex h-full flex-col overflow-hidden border-2 ${plan.borderColor} ${
                    selectedPlan === plan.id ? 'ring-4 ring-purple-200' : ''
                  } ${plan.popular ? 'shadow-xl md:scale-105' : 'shadow-md'} transition-all hover:shadow-2xl`}
                >
                  {plan.popular && (
                    <div className="absolute right-0 top-0">
                      <div className="rounded-bl-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                        MOST POPULAR
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
                    <p className="text-sm text-slate-600 mb-3">
                      {plan.tagline}
                    </p>
                    {plan.price && (
                      <p className="text-lg font-bold text-slate-900">
                        {plan.price}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-1 flex-col p-6">
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full bg-gradient-to-r ${plan.color} text-white shadow-md transition-all hover:shadow-lg`}
                    >
                      {plan.ctaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    
                    <div className="mt-6 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Included Features
                        </p>
                        <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                              <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.id === 'pro' ? 'text-blue-600' : plan.id === 'elite' ? 'text-amber-600' : plan.id === 'enterprise' ? 'text-purple-600' : 'text-slate-600'}`} />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.reports && plan.reports.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {plan.reportsTitle || 'Reports'}
                          </p>
                          <ul className="mt-3 space-y-2">
                            {plan.reports.map((report, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${plan.id === 'pro' ? 'text-blue-600' : plan.id === 'elite' ? 'text-amber-600' : plan.id === 'enterprise' ? 'text-purple-600' : 'text-slate-600'}`} />
                                <span>{report}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Comparison Table View */}
        {viewMode === 'table' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {comparisonFeatures.map((section, sectionIdx) => (
              <motion.div
                key={section.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIdx * 0.1 }}
                className="overflow-x-auto"
              >
                <Card className="bg-white">
                  <div className="p-6">
                    <h3 className="mb-6 text-2xl font-bold text-slate-900">
                      {section.category}
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-slate-200">
                            <th className="px-4 py-4 text-left font-semibold text-slate-900 w-1/3">
                              Feature
                            </th>
                            {plans.map((plan) => (
                              <th
                                key={plan.id}
                                className={`px-4 py-4 text-center font-semibold ${
                                  plan.popular ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  <div className={`inline-flex rounded-full bg-gradient-to-r ${plan.color} p-2 text-white`}>
                                    {plan.icon}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-900">{plan.name}</p>
                                    <p className="text-xs text-slate-600">{plan.price}</p>
                                  </div>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item, itemIdx) => (
                            <tr
                              key={item.name}
                              className={`border-b border-slate-100 transition-colors hover:bg-slate-50 ${
                                itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                              }`}
                            >
                              <td className="px-4 py-4 font-medium text-slate-900">
                                {item.name}
                              </td>
                              {plans.map((plan) => {
                                const value = item[plan.id as keyof typeof item];
                                return (
                                  <td
                                    key={plan.id}
                                    className={`px-4 py-4 text-center ${
                                      plan.popular ? 'bg-blue-50' : ''
                                    }`}
                                  >
                                    {typeof value === 'boolean' ? (
                                      value ? (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="flex justify-center"
                                        >
                                          <Check className={`h-6 w-6 ${plan.id === 'pro' ? 'text-blue-600' : plan.id === 'elite' ? 'text-amber-600' : plan.id === 'enterprise' ? 'text-purple-600' : 'text-slate-600'}`} />
                                        </motion.div>
                                      ) : (
                                        <motion.div
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="flex justify-center"
                                        >
                                          <X className="h-6 w-6 text-slate-300" />
                                        </motion.div>
                                      )
                                    ) : (
                                      <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-900">
                                        {value}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 border-2 border-blue-200 hover:shadow-xl transition-all">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-500 p-3">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Need Help Choosing?
              </h3>
            </div>
            <p className="mb-6 text-slate-600">
              Our team is here to help you find the perfect plan for your business needs. Get personalized recommendations.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg">
              <Phone className="mr-2 h-4 w-4" />
              Schedule a Call
            </Button>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 border-2 border-purple-200 hover:shadow-xl transition-all">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-full bg-purple-500 p-3">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Enterprise Solutions
              </h3>
            </div>
            <p className="mb-6 text-slate-600">
              Looking for a custom solution? Contact our sales team for enterprise pricing and dedicated support.
            </p>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg">
              <Mail className="mr-2 h-4 w-4" />
              Contact Sales
            </Button>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
