import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Edit, Play, Pause, Trash2, Copy, BarChart3, Clock, Users, Eye, Search, Download, Workflow
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BotFlow {
  id: string;
  name: string;
  description: string;
  isActive: boolean | string;
  triggerType: string;
  triggerValue: string;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalConversations: number;
    activeChats: number;
    completedChats: number;
    avgResponseTime: number;
  };
}

export default function BotFlowsDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewFlowDialog, setShowNewFlowDialog] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);

  // Fetch flows
  const { data: flows = [], isLoading } = useQuery<BotFlow[]>({
    queryKey: ['/api/bot/flows'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/bot/flows');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log("Response text:", text);
        if (!text) {
          console.warn("Empty response from /api/bot/flows");
          return [];
        }
        const data = JSON.parse(text);
        console.log("Parsed flows:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching flows:", error);
        return [];
      }
    },
  });

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      try {
        const response = await fetch('/api/bot/flows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flowData),
        });
        
        const text = await response.text();
        console.log("Response status:", response.status);
        console.log("Response text:", text);
        
        if (!response.ok) {
          let error: any = { details: text || 'Unknown error' };
          try {
            error = JSON.parse(text);
          } catch {}
          throw new Error(error.details || error.error || `HTTP ${response.status}`);
        }
        
        if (!text) throw new Error('Empty response from server');
        return JSON.parse(text);
      } catch (error) {
        console.error("Create flow error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Flow created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: 'Success', description: 'Flow created successfully!' });
      setShowNewFlowDialog(false);
      setNewFlowName('');
      setNewFlowDescription('');
    },
    onError: (error: any) => {
      console.error("Flow creation failed:", error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create flow',
        variant: 'destructive' 
      });
    }
  });

  // Toggle flow status
  const toggleFlowMutation = useMutation({
    mutationFn: async ({ flowId, isActive }: { flowId: string; isActive: boolean }) => {
      const response = await fetch(`/api/bot/flows/${flowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to update flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
    },
  });

  // Delete flow mutation
  const deleteFlowMutation = useMutation({
    mutationFn: async (flowId: string) => {
      const response = await fetch(`/api/bot/flows/${flowId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: 'Success', description: 'Flow deleted successfully!' });
    },
  });

  const handleCreateFlow = () => {
    if (!newFlowName.trim()) {
      toast({ title: 'Error', description: 'Flow name is required', variant: 'destructive' });
      return;
    }

    createFlowMutation.mutate({
      name: newFlowName,
      description: newFlowDescription,
      triggerType: 'keyword',
      triggerValue: newFlowName.toLowerCase().replace(/\s+/g, '_'),
      isActive: 'true',
      flowData: { nodes: [], connections: [] },
    });
  };

  const filteredFlows = flows.filter((flow) =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Bot Flow Builder</h1>
                <p className="text-slate-600 mt-1">Create and manage WhatsApp marketing automation flows</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setLocation('/dashboard/bot-flows/builder')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:scale-105 transition-all duration-200"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Flow
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search flows by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 bg-white border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading flows...</p>
              </div>
            </div>
          ) : filteredFlows.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300 bg-gradient-to-br from-purple-50/30 to-blue-50/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="w-24 h-24 mx-auto mb-6"
                  >
                    <svg
                      className="w-full h-full text-purple-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <motion.circle 
                        cx="5" 
                        cy="12" 
                        r="2.5"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                      />
                      <motion.circle 
                        cx="12" 
                        cy="6" 
                        r="2.5"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.circle 
                        cx="12" 
                        cy="18" 
                        r="2.5"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                      />
                      <motion.circle 
                        cx="19" 
                        cy="12" 
                        r="2.5"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                      />
                      <path d="M7.5 12h2" strokeLinecap="round" />
                      <path d="M12 8.5v1" strokeLinecap="round" />
                      <path d="M12 14.5v1" strokeLinecap="round" />
                      <path d="M14.5 12h2" strokeLinecap="round" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {flows.length === 0 ? '🚀 Create Your First Bot Flow' : 'No flows match your search'}
                  </h3>
                  <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                    {flows.length === 0
                      ? 'Design intelligent WhatsApp automation flows with our visual builder. Engage customers, automate responses, and grow your business!'
                      : 'Try adjusting your search terms or create a new flow'}
                  </p>
                  {flows.length === 0 && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => setLocation('/dashboard/bot-flows/builder')}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg text-base px-8"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your First Flow
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">#</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Description</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">Active</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlows.map((flow, index) => (
                      <motion.tr 
                        key={flow.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className="border-b border-slate-200 hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-blue-50/30 transition-all cursor-pointer group"
                        whileHover={{ scale: 1.005 }}
                      >
                        <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 group-hover:text-purple-600 transition-colors">{flow.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{flow.description}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              const isCurrentlyActive = flow.isActive === 'true' || flow.isActive === true || flow.isActive === 'True';
                              toggleFlowMutation.mutate({
                                flowId: flow.id,
                                isActive: !isCurrentlyActive,
                              });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              (flow.isActive === 'true' || flow.isActive === true || flow.isActive === 'True')
                                ? 'bg-blue-600'
                                : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                (flow.isActive === 'true' || flow.isActive === true || flow.isActive === 'True')
                                  ? 'translate-x-5'
                                  : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Interactive Flow Diagram Button */}
                            <motion.button
                              onHoverStart={() => setHoveredActionId(`view-${flow.id}`)}
                              onHoverEnd={() => setHoveredActionId(null)}
                              onClick={() => {
                                setLocation(`/dashboard/bot-flows/builder/${flow.id}`);
                              }}
                              className="relative group p-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 hover:shadow-md"
                              title="Edit Flow"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {/* Flow Diagram SVG Icon */}
                              <svg 
                                className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors duration-200" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                {/* Animated flow nodes and connections */}
                                <motion.circle 
                                  cx="5" 
                                  cy="12" 
                                  r="2" 
                                  animate={hoveredActionId === `view-${flow.id}` ? { scale: [1, 1.3, 1] } : {}}
                                  transition={{ duration: 0.6, repeat: hoveredActionId === `view-${flow.id}` ? Infinity : 0 }}
                                />
                                <motion.circle 
                                  cx="12" 
                                  cy="6" 
                                  r="2"
                                  animate={hoveredActionId === `view-${flow.id}` ? { scale: [1, 1.3, 1] } : {}}
                                  transition={{ duration: 0.6, delay: 0.2, repeat: hoveredActionId === `view-${flow.id}` ? Infinity : 0 }}
                                />
                                <motion.circle 
                                  cx="12" 
                                  cy="18" 
                                  r="2"
                                  animate={hoveredActionId === `view-${flow.id}` ? { scale: [1, 1.3, 1] } : {}}
                                  transition={{ duration: 0.6, delay: 0.1, repeat: hoveredActionId === `view-${flow.id}` ? Infinity : 0 }}
                                />
                                <motion.circle 
                                  cx="19" 
                                  cy="12" 
                                  r="2"
                                  animate={hoveredActionId === `view-${flow.id}` ? { scale: [1, 1.3, 1] } : {}}
                                  transition={{ duration: 0.6, delay: 0.3, repeat: hoveredActionId === `view-${flow.id}` ? Infinity : 0 }}
                                />
                                <motion.path 
                                  d="M7 12h3" 
                                  animate={hoveredActionId === `view-${flow.id}` ? { 
                                    pathLength: [0, 1],
                                    opacity: [0, 1]
                                  } : { pathLength: 1, opacity: 1 }}
                                  transition={{ duration: 0.5 }}
                                />
                                <motion.path 
                                  d="M12 8v2" 
                                  animate={hoveredActionId === `view-${flow.id}` ? { 
                                    pathLength: [0, 1],
                                    opacity: [0, 1]
                                  } : { pathLength: 1, opacity: 1 }}
                                  transition={{ duration: 0.5, delay: 0.1 }}
                                />
                                <motion.path 
                                  d="M12 14v2" 
                                  animate={hoveredActionId === `view-${flow.id}` ? { 
                                    pathLength: [0, 1],
                                    opacity: [0, 1]
                                  } : { pathLength: 1, opacity: 1 }}
                                  transition={{ duration: 0.5, delay: 0.2 }}
                                />
                                <motion.path 
                                  d="M14 12h3" 
                                  animate={hoveredActionId === `view-${flow.id}` ? { 
                                    pathLength: [0, 1],
                                    opacity: [0, 1]
                                  } : { pathLength: 1, opacity: 1 }}
                                  transition={{ duration: 0.5, delay: 0.3 }}
                                />
                              </svg>
                              {/* Tooltip */}
                              {hoveredActionId === `view-${flow.id}` && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                                >
                                  Edit Flow
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </motion.div>
                              )}
                            </motion.button>

                            {/* Copy Button */}
                            <motion.button
                              onHoverStart={() => setHoveredActionId(`copy-${flow.id}`)}
                              onHoverEnd={() => setHoveredActionId(null)}
                              onClick={() => {
                                toast({ 
                                  title: 'Flow Copied!', 
                                  description: `"${flow.name}" has been duplicated` 
                                });
                              }}
                              className="relative group p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 hover:shadow-md"
                              title="Copy Flow"
                              whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Copy className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors" />
                              {hoveredActionId === `copy-${flow.id}` && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                                >
                                  Duplicate
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </motion.div>
                              )}
                            </motion.button>

                            {/* Delete Button */}
                            <motion.button
                              onHoverStart={() => setHoveredActionId(`delete-${flow.id}`)}
                              onHoverEnd={() => setHoveredActionId(null)}
                              onClick={() => {
                                if (confirm(`Delete "${flow.name}"? This action cannot be undone.`)) {
                                  deleteFlowMutation.mutate(flow.id);
                                }
                              }}
                              className="relative group p-2 rounded-lg transition-all duration-200 hover:bg-red-50 hover:shadow-md"
                              title="Delete Flow"
                              whileHover={{ scale: 1.1, rotate: [0, 10, -10, 0] }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Trash2 className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors" />
                              {hoveredActionId === `delete-${flow.id}` && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10"
                                >
                                  Delete
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </motion.div>
                              )}
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Showing 1 to {filteredFlows.length} of {flows.length} entries
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    1
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>


    </DashboardLayout>
  );
}

