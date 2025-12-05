import type { ReactNode } from 'react';
import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Crown, Shield, Sparkles, Star, ArrowRight, Mail, Phone } from 'lucide-react';
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
  popular?: boolean;
  features: string[];
  reportsTitle?: string;
  reports?: string[];
  ctaLabel: string;
  toastDescription: string;
}

const plans: SalonPlan[] = [
  {
    id: 'classic',
    name: 'Classic Salon - Starter Plan',
    tagline: 'Perfect for small salons focusing on basic bookings & operations.',
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
    name: 'Pro Salon - Business Plan',
    tagline: 'Best for salons looking to increase engagement & improve retention.',
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
    tagline: 'Designed for growing salons needing full business automation.',
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
      'HRMS (Attendance, Payroll, Leaves, )',
      'Multi-branch support (optional add-on)',
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
    name: 'enterprises Plan ( Custom Features )',
    tagline: 'Designed for growing salons needing full business automation.',
    icon: <Shield className="h-6 w-6" />,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    features: [
      'Custom domain',
      '10 - user login access',
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
      'HRMS (Attendance, Payroll, Leaves, )',
    ],
    reportsTitle: 'Advanced reports',
    reports: [
      'Full financial statements (P&L, Expense tracking, GST reports)',
      'Stock reports',
      'Staff timesheet & productivity reports',
      'Report Automation ( To Management )',
    ],
    ctaLabel: 'Create Custom Scope',
    toastDescription: 'Our enterprise team will gather requirements for your custom build.',
  },
];

const addonModules = [
  'Website booking widget',
  'Mobile app (Admin + Staff)',
  'Custom branding (white-label)',
];

export default function SubscriptionPlans() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

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
                className={`relative flex h-full flex-col overflow-hidden border-2 ${plan.borderColor} ${
                  selectedPlan === plan.id ? 'ring-4 ring-purple-200' : ''
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
                  <p className="text-sm text-slate-600">
                    {plan.tagline}
                  </p>
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
                      <ul className="mt-3 space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <Check className={`mt-0.5 h-4 w-4 ${plan.id === 'pro' ? 'text-blue-600' : plan.id === 'elite' ? 'text-amber-600' : plan.id === 'enterprise' ? 'text-purple-600' : 'text-slate-600'}`} />
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
                              <Check className={`mt-0.5 h-4 w-4 ${plan.id === 'pro' ? 'text-blue-600' : plan.id === 'elite' ? 'text-amber-600' : plan.id === 'enterprise' ? 'text-purple-600' : 'text-slate-600'}`} />
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
        </div>

        {/* Add-on Modules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-slate-50 to-slate-100 p-6">
            <h2 className="text-2xl font-bold text-slate-900">
              ADD-ON MODULES (For Any Plan)
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Optional upgrade features you can layer on top of any subscription.
            </p>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {addonModules.map((module) => (
                <li key={module} className="flex items-start gap-2 rounded-lg bg-white p-4 shadow-sm">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span className="text-sm text-slate-700">{module}</span>
                </li>
              ))}
            </ul>
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
            <div className="mb-4 flex items-start gap-3">
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
