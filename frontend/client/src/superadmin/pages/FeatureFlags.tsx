import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flag,
  Search,
  Plus,
  ToggleLeft,
  ToggleRight,
  Users,
  Layers,
  Globe,
  Shield,
  Zap,
  Edit,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Copy,
  AlertCircle,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import SuperAdminLayout from '../components/SuperAdminLayout';
import { useSuperAdmin, FeatureFlag } from '../contexts/SuperAdminContext';

const FeatureFlags = () => {
  const { 
    theme, 
    featureFlags, 
    clients, 
    plans,
    createFeatureFlag, 
    updateFeatureFlag, 
    toggleFeatureFlagForClient,
    isFeatureEnabled 
  } = useSuperAdmin();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [expandedFlags, setExpandedFlags] = useState<string[]>([]);
  const [showClientOverrides, setShowClientOverrides] = useState<string | null>(null);
  
  // New flag form
  const [newFlag, setNewFlag] = useState({
    name: '',
    key: '',
    description: '',
    isGlobal: false,
    defaultValue: false,
    enabledPlans: [] as string[],
  });

  const filteredFlags = featureFlags.filter(flag =>
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const globalFlags = filteredFlags.filter(f => f.isGlobal);
  const featureFlagsFiltered = filteredFlags.filter(f => !f.isGlobal);

  const toggleExpand = (flagId: string) => {
    setExpandedFlags(prev => 
      prev.includes(flagId) 
        ? prev.filter(id => id !== flagId) 
        : [...prev, flagId]
    );
  };

  const handleCreateFlag = () => {
    if (newFlag.name && newFlag.key) {
      createFeatureFlag({
        ...newFlag,
        enabledClients: [],
        disabledClients: [],
      });
      setShowCreateModal(false);
      setNewFlag({ name: '', key: '', description: '', isGlobal: false, defaultValue: false, enabledPlans: [] });
    }
  };

  const handleTogglePlan = (flagId: string, planId: string) => {
    const flag = featureFlags.find(f => f.id === flagId);
    if (!flag) return;
    
    const newEnabledPlans = flag.enabledPlans.includes(planId)
      ? flag.enabledPlans.filter(p => p !== planId)
      : [...flag.enabledPlans, planId];
    
    updateFeatureFlag(flagId, { enabledPlans: newEnabledPlans });
  };

  const copyFlagKey = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const getClientStatus = (flag: FeatureFlag, clientId: string, clientPlan: string) => {
    if (flag.disabledClients.includes(clientId)) return 'disabled';
    if (flag.enabledClients.includes(clientId)) return 'enabled';
    if (flag.enabledPlans.includes(clientPlan)) return 'plan';
    return flag.defaultValue ? 'default-on' : 'default-off';
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className={`text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Feature Flags
            </h1>
            <p className="text-slate-500 mt-1">
              Control feature access per plan or client
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600">
            <Plus className="w-4 h-4" />
            Create Feature Flag
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Flags', value: featureFlags.length, icon: Flag, color: 'purple' },
            { label: 'Global Flags', value: globalFlags.length, icon: Globe, color: 'blue' },
            { label: 'Active Features', value: featureFlags.filter(f => f.enabledPlans.length > 0 || f.defaultValue).length, icon: Zap, color: 'green' },
            { label: 'Beta Features', value: featureFlags.filter(f => f.enabledClients.length > 0).length, icon: Sparkles, color: 'orange' },
          ].map((stat) => (
            <Card key={stat.label} className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search feature flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
            />
          </div>
        </Card>

        {/* Global System Flags */}
        {globalFlags.length > 0 && (
          <div className="space-y-3">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <Globe className="w-5 h-5 text-blue-600" />
              System Flags
            </h2>
            {globalFlags.map((flag) => (
              <motion.div key={flag.id} layout>
                <Card className={`p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'} ${
                  flag.defaultValue ? 'border-l-4 border-l-red-500' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${flag.defaultValue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {flag.defaultValue ? <AlertCircle className="w-5 h-5 text-red-600" /> : <Shield className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{flag.name}</h3>
                          <Badge variant="outline" className="font-mono text-xs cursor-pointer" onClick={() => copyFlagKey(flag.key)}>
                            {flag.key}
                            <Copy className="w-3 h-3 ml-1" />
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{flag.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {flag.defaultValue && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          ACTIVE
                        </Badge>
                      )}
                      <Switch
                        checked={flag.defaultValue}
                        onCheckedChange={(checked) => updateFeatureFlag(flag.id, { defaultValue: checked })}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Feature Flags */}
        <div className="space-y-3">
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            <Flag className="w-5 h-5 text-purple-600" />
            Feature Flags
          </h2>
          
          <AnimatePresence>
            {featureFlagsFiltered.map((flag, index) => {
              const isExpanded = expandedFlags.includes(flag.id);
              const enabledCount = flag.enabledPlans.length + flag.enabledClients.length;
              
              return (
                <motion.div
                  key={flag.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(flag.id)}>
                    <Card className={`overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                      <CollapsibleTrigger className="w-full">
                        <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${enabledCount > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {enabledCount > 0 ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-slate-500" />}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{flag.name}</h3>
                                <Badge variant="outline" className="font-mono text-xs">{flag.key}</Badge>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">{flag.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                              {flag.enabledPlans.map(plan => (
                                <Badge key={plan} className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 capitalize">
                                  {plan}
                                </Badge>
                              ))}
                              {flag.enabledClients.length > 0 && (
                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30">
                                  +{flag.enabledClients.length} clients
                                </Badge>
                              )}
                            </div>
                            {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-700 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                          {/* Plan Selection */}
                          <div className="mb-6">
                            <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Layers className="w-4 h-4" />
                              Enable for Plans
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {plans.map(plan => {
                                const isEnabled = flag.enabledPlans.includes(plan.id);
                                return (
                                  <motion.button
                                    key={plan.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleTogglePlan(flag.id, plan.id)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                                      isEnabled
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'
                                    }`}
                                  >
                                    {isEnabled ? (
                                      <Check className="w-4 h-4 text-purple-600" />
                                    ) : (
                                      <div className="w-4 h-4 rounded border border-slate-300" />
                                    )}
                                    <span className={`font-medium ${isEnabled ? 'text-purple-700 dark:text-purple-400' : ''}`}>
                                      {plan.name}
                                    </span>
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Client Overrides */}
                          <div>
                            <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                              <Users className="w-4 h-4" />
                              Client Overrides
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {clients.slice(0, 6).map(client => {
                                const status = getClientStatus(flag, client.id, client.plan);
                                const isEnabled = status === 'enabled' || status === 'plan' || status === 'default-on';
                                
                                return (
                                  <div
                                    key={client.id}
                                    className={`p-3 rounded-lg border ${theme === 'dark' ? 'border-slate-600 bg-slate-800' : 'border-slate-200 bg-white'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                          {client.businessName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs capitalize">{client.plan}</Badge>
                                          {status === 'plan' && (
                                            <span className="text-xs text-green-600">via plan</span>
                                          )}
                                          {status === 'enabled' && (
                                            <span className="text-xs text-orange-600">override</span>
                                          )}
                                          {status === 'disabled' && (
                                            <span className="text-xs text-red-600">blocked</span>
                                          )}
                                        </div>
                                      </div>
                                      <Switch
                                        checked={isEnabled}
                                        onCheckedChange={(checked) => toggleFeatureFlagForClient(flag.key, client.id, checked)}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="outline" size="sm" onClick={() => copyFlagKey(flag.key)}>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy Key
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Create Flag Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
            <DialogHeader>
              <DialogTitle className={theme === 'dark' ? 'text-white' : ''}>Create Feature Flag</DialogTitle>
              <DialogDescription>Add a new feature flag to control access</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Flag Name</Label>
                <Input
                  value={newFlag.name}
                  onChange={(e) => setNewFlag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Advanced Analytics"
                  className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
              <div>
                <Label>Flag Key (code identifier)</Label>
                <Input
                  value={newFlag.key}
                  onChange={(e) => setNewFlag(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                  placeholder="e.g., advanced_analytics"
                  className={`font-mono ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}`}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newFlag.description}
                  onChange={(e) => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this feature do?"
                  className={theme === 'dark' ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newFlag.isGlobal}
                  onCheckedChange={(checked) => setNewFlag(prev => ({ ...prev, isGlobal: !!checked }))}
                />
                <Label>Global System Flag (affects all clients)</Label>
              </div>
              {!newFlag.isGlobal && (
                <div>
                  <Label className="mb-2 block">Enable for Plans</Label>
                  <div className="flex flex-wrap gap-2">
                    {plans.map(plan => (
                      <Button
                        key={plan.id}
                        type="button"
                        variant={newFlag.enabledPlans.includes(plan.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setNewFlag(prev => ({
                          ...prev,
                          enabledPlans: prev.enabledPlans.includes(plan.id)
                            ? prev.enabledPlans.filter(p => p !== plan.id)
                            : [...prev.enabledPlans, plan.id]
                        }))}
                      >
                        {plan.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={handleCreateFlag} className="bg-gradient-to-r from-purple-600 to-blue-600">
                Create Flag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default FeatureFlags;
