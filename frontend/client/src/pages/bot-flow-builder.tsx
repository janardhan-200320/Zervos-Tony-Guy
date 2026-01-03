import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Bot, Plus, Play, Save, Trash2, MessageSquare, List, GitBranch, Phone, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FlowNode {
  id: string;
  type: 'message' | 'buttons' | 'list' | 'condition' | 'api_call' | 'end';
  data: {
    message?: string;
    buttons?: Array<{ id: string; text: string; nextNodeId: string }>;
    listItems?: Array<{ id: string; title: string; description?: string; nextNodeId: string }>;
    condition?: { variable: string; operator: string; value: string; trueNodeId: string; falseNodeId: string };
    apiEndpoint?: string;
    endMessage?: string;
  };
  nextNodeId?: string;
}

interface BotFlow {
  id: string;
  name: string;
  description?: string;
  triggerType: 'keyword' | 'button' | 'menu' | 'welcome';
  triggerValue?: string;
  isActive: string;
  flowData: {
    nodes: FlowNode[];
    startNodeId: string;
  };
  priority?: string;
}

export default function BotFlowBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingFlow, setEditingFlow] = useState<BotFlow | null>(null);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [currentNodeType, setCurrentNodeType] = useState<FlowNode['type']>('message');
  const [nodeFormData, setNodeFormData] = useState<Partial<FlowNode>>({});

  // Fetch all flows
  const { data: flows = [], isLoading } = useQuery<BotFlow[]>({
    queryKey: ['/api/bot/flows'],
  });

  // Create flow mutation
  const createFlowMutation = useMutation({
    mutationFn: async (flow: Partial<BotFlow>) => {
      const response = await fetch('/api/bot/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flow),
      });
      if (!response.ok) throw new Error('Failed to create flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: "Success", description: "Bot flow created successfully" });
      setEditingFlow(null);
    },
  });

  // Update flow mutation
  const updateFlowMutation = useMutation({
    mutationFn: async ({ id, flow }: { id: string; flow: Partial<BotFlow> }) => {
      const response = await fetch(`/api/bot/flows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flow),
      });
      if (!response.ok) throw new Error('Failed to update flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: "Success", description: "Bot flow updated successfully" });
    },
  });

  // Delete flow mutation
  const deleteFlowMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bot/flows/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete flow');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: "Success", description: "Bot flow deleted successfully" });
    },
  });

  const createNewFlow = () => {
    const newFlow: BotFlow = {
      id: '',
      name: 'New Flow',
      description: '',
      triggerType: 'keyword',
      triggerValue: '',
      isActive: 'true',
      priority: '10',
      flowData: {
        nodes: [],
        startNodeId: '',
      },
    };
    setEditingFlow(newFlow);
  };

  const addNode = () => {
    if (!editingFlow) return;

    const nodeId = `node_${Date.now()}`;
    const newNode: FlowNode = {
      id: nodeId,
      type: currentNodeType,
      data: {},
    };

    // Set default data based on type
    if (currentNodeType === 'message') {
      newNode.data.message = '';
    } else if (currentNodeType === 'buttons') {
      newNode.data.message = '';
      newNode.data.buttons = [];
    } else if (currentNodeType === 'list') {
      newNode.data.message = '';
      newNode.data.listItems = [];
    } else if (currentNodeType === 'end') {
      newNode.data.endMessage = 'Thank you!';
    }

    const updatedNodes = [...editingFlow.flowData.nodes, newNode];
    const updatedFlow = {
      ...editingFlow,
      flowData: {
        ...editingFlow.flowData,
        nodes: updatedNodes,
        startNodeId: editingFlow.flowData.startNodeId || nodeId,
      },
    };

    setEditingFlow(updatedFlow);
    setShowNodeDialog(false);
    toast({ title: "Node added", description: `${currentNodeType} node added to flow` });
  };

  const removeNode = (nodeId: string) => {
    if (!editingFlow) return;
    const updatedNodes = editingFlow.flowData.nodes.filter(n => n.id !== nodeId);
    setEditingFlow({
      ...editingFlow,
      flowData: {
        ...editingFlow.flowData,
        nodes: updatedNodes,
      },
    });
  };

  const saveFlow = () => {
    if (!editingFlow) return;

    if (!editingFlow.name || !editingFlow.triggerType) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    if (editingFlow.flowData.nodes.length === 0) {
      toast({ title: "Error", description: "Please add at least one node", variant: "destructive" });
      return;
    }

    if (editingFlow.id) {
      updateFlowMutation.mutate({ id: editingFlow.id, flow: editingFlow });
    } else {
      createFlowMutation.mutate(editingFlow);
    }
  };

  const NodeTypeIcon = ({ type }: { type: FlowNode['type'] }) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'buttons': return <Bot className="h-4 w-4" />;
      case 'list': return <List className="h-4 w-4" />;
      case 'condition': return <GitBranch className="h-4 w-4" />;
      case 'api_call': return <Phone className="h-4 w-4" />;
      case 'end': return <X className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading bot flows...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8" />
            Bot Flow Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Create conversational flows for your WhatsApp bot
          </p>
        </div>
        <Button onClick={createNewFlow}>
          <Plus className="h-4 w-4 mr-2" />
          New Flow
        </Button>
      </div>

      {editingFlow ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Flow: {editingFlow.name}</CardTitle>
            <CardDescription>Configure your bot conversation flow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Flow Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Flow Name *</Label>
                <Input
                  value={editingFlow.name}
                  onChange={(e) => setEditingFlow({ ...editingFlow, name: e.target.value })}
                  placeholder="e.g., Welcome Flow, Booking Assistant"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingFlow.description || ''}
                  onChange={(e) => setEditingFlow({ ...editingFlow, description: e.target.value })}
                  placeholder="Brief description of this flow"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Trigger Type *</Label>
                <Select
                  value={editingFlow.triggerType}
                  onValueChange={(value: any) => setEditingFlow({ ...editingFlow, triggerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Message</SelectItem>
                    <SelectItem value="keyword">Keyword Trigger</SelectItem>
                    <SelectItem value="button">Button Click</SelectItem>
                    <SelectItem value="menu">Menu Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trigger Value</Label>
                <Input
                  value={editingFlow.triggerValue || ''}
                  onChange={(e) => setEditingFlow({ ...editingFlow, triggerValue: e.target.value })}
                  placeholder="e.g., book, help, pricing"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  type="number"
                  value={editingFlow.priority || '10'}
                  onChange={(e) => setEditingFlow({ ...editingFlow, priority: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editingFlow.isActive === 'true'}
                onCheckedChange={(checked) => setEditingFlow({ ...editingFlow, isActive: checked ? 'true' : 'false' })}
              />
              <Label>Active Flow</Label>
            </div>

            {/* Flow Nodes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Flow Nodes ({editingFlow.flowData.nodes.length})</h3>
                <Button size="sm" variant="outline" onClick={() => setShowNodeDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Node
                </Button>
              </div>

              {editingFlow.flowData.nodes.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No nodes yet. Add your first node to start building.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editingFlow.flowData.nodes.map((node, index) => (
                    <Card key={node.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-1">
                            <NodeTypeIcon type={node.type} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium capitalize">{node.type.replace('_', ' ')}</span>
                              <span className="text-xs text-muted-foreground">#{index + 1}</span>
                              {editingFlow.flowData.startNodeId === node.id && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Start</span>
                              )}
                            </div>
                            {node.data.message && (
                              <p className="text-sm text-muted-foreground">{node.data.message}</p>
                            )}
                            {node.data.buttons && node.data.buttons.length > 0 && (
                              <div className="flex gap-2 mt-2">
                                {node.data.buttons.map((btn) => (
                                  <span key={btn.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    {btn.text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeNode(node.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingFlow(null)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Test Flow
                </Button>
                <Button onClick={saveFlow} disabled={createFlowMutation.isPending || updateFlowMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Flow
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flows.map((flow) => (
            <Card key={flow.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{flow.name}</CardTitle>
                    <CardDescription className="mt-1">{flow.description || 'No description'}</CardDescription>
                  </div>
                  {flow.isActive === 'true' && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Active</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Trigger: <span className="font-medium">{flow.triggerType}</span></div>
                  <div>Nodes: <span className="font-medium">{flow.flowData.nodes.length}</span></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" onClick={() => setEditingFlow(flow)} className="flex-1">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Delete this flow?')) {
                        deleteFlowMutation.mutate(flow.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Node Dialog */}
      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Node</DialogTitle>
            <DialogDescription>Choose the type of node to add to your flow</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={currentNodeType} onValueChange={(v: any) => setCurrentNodeType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">Message (Send Text)</SelectItem>
                <SelectItem value="buttons">Buttons (Max 3)</SelectItem>
                <SelectItem value="list">List (Menu Options)</SelectItem>
                <SelectItem value="condition">Condition (If/Else)</SelectItem>
                <SelectItem value="api_call">API Call</SelectItem>
                <SelectItem value="end">End Flow</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNodeDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addNode} className="flex-1">
                Add Node
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
