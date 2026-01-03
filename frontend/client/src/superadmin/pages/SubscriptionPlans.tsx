import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Check,
  Star,
  Crown,
  Sparkles,
  Users,
  HardDrive,
  Zap,
  Building2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  Percent,
  Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, SubscriptionPlan } from '../contexts/SuperAdminContext';
import { useToast } from '@/hooks/use-toast';

const SubscriptionPlans = () => {
  const { plans, updatePlan, theme, clients } = useSuperAdmin();
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [selectedPlanForFeature, setSelectedPlanForFeature] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'classic': return Star;
      case 'pro': return Sparkles;
      case 'elite': return Crown;
      default: return CreditCard;
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'classic': return 'from-slate-500 to-slate-700';
      case 'pro': return 'from-blue-500 to-blue-700';
      case 'elite': return 'from-purple-500 to-purple-700';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const getPlanBg = (planId: string) => {
    switch (planId) {
      case 'classic': return 'bg-slate-50 dark:bg-slate-900/50';
      case 'pro': return 'bg-blue-50 dark:bg-blue-900/30';
      case 'elite': return 'bg-purple-50 dark:bg-purple-900/30';
      default: return 'bg-gray-50 dark:bg-gray-900/50';
    }
  };

  const startEditing = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setEditForm({
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      tagline: plan.tagline,
    });
  };

  const saveChanges = (planId: string) => {
    updatePlan(planId, editForm);
    setEditingPlan(null);
    toast({
      title: '✅ Plan Updated',
      description: 'Subscription plan has been updated successfully',
    });
  };

  const cancelEditing = () => {
    setEditingPlan(null);
    setEditForm({});
  };

  const addFeature = () => {
    if (selectedPlanForFeature && newFeature.trim()) {
      const plan = plans.find(p => p.id === selectedPlanForFeature);
      if (plan) {
        updatePlan(selectedPlanForFeature, {
          features: [...plan.features, newFeature.trim()],
        });
        toast({
          title: '✅ Feature Added',
          description: `"${newFeature}" has been added to ${plan.name}`,
        });
      }
      setNewFeature('');
      setShowAddFeatureModal(false);
    }
  };

  const removeFeature = (planId: string, featureIndex: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      const updatedFeatures = plan.features.filter((_, i) => i !== featureIndex);
      updatePlan(planId, { features: updatedFeatures });
      toast({
        title: '🗑️ Feature Removed',
        description: 'Feature has been removed from the plan',
      });
    }
  };

  const togglePlanStatus = (planId: string, currentStatus: boolean) => {
    updatePlan(planId, { isActive: !currentStatus });
    toast({
      title: currentStatus ? '⏸️ Plan Disabled' : '✅ Plan Enabled',
      description: currentStatus ? 'Plan is now hidden from customers' : 'Plan is now visible to customers',
    });
  };

  // Calculate subscribers per plan
  const getSubscribersCount = (planId: string) => {
    return clients.filter(c => c.plan === planId && c.status === 'active').length;
  };

  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.isActive).length,
    avgPrice: Math.round(plans.reduce((sum, p) => sum + p.monthlyPrice, 0) / plans.length),
    totalSubscribers: clients.filter(c => c.status === 'active').length,
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Subscription Plans
            </h1>
            <p className="text-slate-500 mt-1">
              Manage pricing, features, and plan configurations
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Billing Cycle Toggle */}
            <div className={`flex items-center gap-2 p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-400'
                    : 'text-slate-500'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white dark:bg-slate-600 shadow text-purple-600 dark:text-purple-400'
                    : 'text-slate-500'
                }`}
              >
                Annual
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Plans', value: stats.totalPlans, icon: CreditCard, color: 'blue' },
            { label: 'Active Plans', value: stats.activePlans, icon: Check, color: 'green' },
            { label: 'Avg. Price', value: `₹${stats.avgPrice}`, icon: DollarSign, color: 'purple' },
            { label: 'Total Subscribers', value: stats.totalSubscribers, icon: Users, color: 'orange' },
          ].map((stat) => (
            <Card key={stat.label} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.id);
            const isEditing = editingPlan === plan.id;
            const subscribers = getSubscribersCount(plan.id);
            const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} ${!plan.isActive ? 'opacity-60' : ''}`}>
                  {/* Plan Header */}
                  <div className={`p-6 bg-gradient-to-r ${getPlanGradient(plan.id)} text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/20">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                          {isEditing ? (
                            <Input
                              value={editForm.tagline || ''}
                              onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                              className="mt-1 bg-white/20 border-white/30 text-white placeholder:text-white/50 text-sm"
                              placeholder="Tagline"
                            />
                          ) : (
                            <p className="text-sm text-white/80">{plan.tagline}</p>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={plan.isActive}
                        onCheckedChange={() => togglePlanStatus(plan.id, plan.isActive)}
                      />
                    </div>

                    {/* Price */}
                    <div className="mt-6">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">₹</span>
                          <Input
                            type="number"
                            value={billingCycle === 'monthly' ? editForm.monthlyPrice : editForm.annualPrice}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              [billingCycle === 'monthly' ? 'monthlyPrice' : 'annualPrice']: Number(e.target.value)
                            })}
                            className="w-32 bg-white/20 border-white/30 text-white text-2xl font-bold"
                          />
                          <span className="text-white/80">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">₹{displayPrice.toLocaleString()}</span>
                          <span className="text-white/80">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                      )}
                      {billingCycle === 'annual' && (
                        <Badge className="mt-2 bg-white/20 text-white">
                          Save ₹{(plan.monthlyPrice * 12 - plan.annualPrice).toLocaleString()}/year
                        </Badge>
                      )}
                    </div>

                    {/* Subscribers */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-white/80">
                      <Users className="w-4 h-4" />
                      <span>{subscribers} active subscribers</span>
                    </div>
                  </div>

                  {/* Plan Body */}
                  <div className="p-6">
                    {/* Limits */}
                    <div className={`p-4 rounded-xl mb-4 ${getPlanBg(plan.id)}`}>
                      <h4 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Plan Limits
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            {plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} users
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            {plan.limits.workspaces} workspaces
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-slate-400" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            {plan.limits.storage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-slate-400" />
                          <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                            {plan.limits.apiCalls === -1 ? 'Unlimited' : `${plan.limits.apiCalls} API`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                          Features ({plan.features.length})
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPlanForFeature(plan.id);
                            setShowAddFeatureModal(true);
                          }}
                          className="text-purple-600 h-7"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {plan.features.map((feature, featureIndex) => (
                          <motion.div
                            key={featureIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex items-start gap-2 group p-2 rounded-lg ${
                              theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className={`text-sm flex-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              {feature}
                            </span>
                            <button
                              onClick={() => removeFeature(plan.id, featureIndex)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={() => saveChanges(plan.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => startEditing(plan)}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Plan
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Revenue by Plan */}
        <Card className={`p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Revenue Distribution by Plan
          </h3>
          <div className="space-y-4">
            {plans.map((plan) => {
              const subscribers = getSubscribersCount(plan.id);
              const revenue = subscribers * plan.monthlyPrice;
              const totalRevenue = plans.reduce((sum, p) => sum + getSubscribersCount(p.id) * p.monthlyPrice, 0);
              const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

              return (
                <div key={plan.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`bg-gradient-to-r ${getPlanGradient(plan.id)} text-white`}>
                        {plan.name}
                      </Badge>
                      <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {subscribers} subscribers
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        ₹{revenue.toLocaleString()}
                      </span>
                      <span className="text-slate-500 text-sm ml-2">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className={`h-full rounded-full bg-gradient-to-r ${getPlanGradient(plan.id)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Add Feature Modal */}
      <Dialog open={showAddFeatureModal} onOpenChange={setShowAddFeatureModal}>
        <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Add New Feature</DialogTitle>
            <DialogDescription>
              Add a new feature to the {plans.find(p => p.id === selectedPlanForFeature)?.name} plan
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="feature" className={theme === 'dark' ? 'text-slate-300' : ''}>
              Feature Description
            </Label>
            <Input
              id="feature"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Enter feature description..."
              className={`mt-2 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFeatureModal(false)}>
              Cancel
            </Button>
            <Button onClick={addFeature} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
};

export default SubscriptionPlans;
