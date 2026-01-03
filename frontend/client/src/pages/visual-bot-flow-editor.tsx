import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, MessageSquare, Zap, List, GitBranch, Clock, Phone, Save, Trash2,
  Download, Plus, Settings, Eye, MoreVertical, X, FileJson, Lock, Play, Copy
} from 'lucide-react';

const NODE_TYPES = {
  START: 'start',
  MESSAGE: 'message',
  BUTTONS: 'buttons',
  LIST: 'list',
  CONDITION: 'condition',
  DELAY: 'delay',
  API_CALL: 'api_call',
  IMAGE: 'image',
  DOCUMENT: 'document',
  END: 'end',
};

const COMPONENT_PALETTE = [
  { type: NODE_TYPES.MESSAGE, icon: '💬', label: 'Text Message', color: 'from-blue-500 to-blue-600' },
  { type: NODE_TYPES.IMAGE, icon: '🖼️', label: 'Image Message', color: 'from-green-500 to-green-600' },
  { type: NODE_TYPES.DOCUMENT, icon: '📄', label: 'Document', color: 'from-yellow-500 to-yellow-600' },
  { type: NODE_TYPES.BUTTONS, icon: '🔘', label: 'Button Message', color: 'from-purple-500 to-purple-600' },
  { type: NODE_TYPES.LIST, icon: '📋', label: 'List Menu', color: 'from-orange-500 to-orange-600' },
  { type: NODE_TYPES.CONDITION, icon: '❓', label: 'Condition', color: 'from-yellow-500 to-yellow-600' },
  { type: NODE_TYPES.DELAY, icon: '⏱️', label: 'Delay', color: 'from-pink-500 to-pink-600' },
  { type: NODE_TYPES.API_CALL, icon: '🔗', label: 'API Call', color: 'from-red-500 to-red-600' },
  { type: NODE_TYPES.END, icon: '⛔', label: 'End', color: 'from-gray-500 to-gray-600' },
];

interface FlowNode {
  id: string;
  type: string;
  x: number;
  y: number;
  data: any;
}

interface FlowConnection {
  from: string;
  to: string;
  label?: string;
  outputKey?: string;
}

export interface BotFlow {
  id: string;
  name: string;
  description: string;
  isActive?: boolean | string;
  triggerType?: string;
  triggerValue?: string;
  createdAt?: string;
  updatedAt?: string;
  flowData?: any;
  stats?: any;
}

export default function VisualBotFlowEditor({ flow, onClose }: { flow: BotFlow; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<FlowNode[]>([
    { id: 'start_1', type: NODE_TYPES.START, x: 50, y: 50, data: { label: 'Start' } },
  ]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeFormData, setNodeFormData] = useState<any>({});
  const [showComponentMenu, setShowComponentMenu] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: any) => {
      const response = await fetch(`/api/bot/flows/${flow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flowData),
      });
      if (!response.ok) throw new Error('Failed to save flow');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/flows'] });
      toast({ title: 'Success', description: 'Flow saved successfully!' });
    },
  });

  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    const rect = canvasRef.current?.getBoundingClientRect();

    if (nodeType && rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newNode: FlowNode = {
        id: `${nodeType}_${Date.now()}`,
        type: nodeType,
        x,
        y,
        data: { label: COMPONENT_PALETTE.find(c => c.type === nodeType)?.label || nodeType },
      };

      setNodes([...nodes, newNode]);
      setEditingNodeId(newNode.id);
      setNodeFormData({ label: newNode.data.label });
      setShowNodeModal(true);
    }
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingNodeId(nodeId);
      setNodeFormData(node.data);
      setShowNodeModal(true);
    }
  };

  const handleSaveNode = () => {
    if (editingNodeId) {
      setNodes(
        nodes.map(n =>
          n.id === editingNodeId
            ? { ...n, data: { ...n.data, ...nodeFormData } }
            : n
        )
      );
      setShowNodeModal(false);
      setEditingNodeId(null);
      setNodeFormData({});
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleSaveFlow = () => {
    saveFlowMutation.mutate({
      name: flow.name,
      description: flow.description,
      flowData: { nodes, connections, startNodeId: 'start_1' },
    });
  };

  const getNodeColor = (type: string) => {
    const component = COMPONENT_PALETTE.find(c => c.type === type);
    return component?.color || 'from-slate-500 to-slate-600';
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen bg-white">
        {/* Top Toolbar */}
        <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{flow.name}</h1>
              <p className="text-sm text-slate-600">{flow.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComponentMenu(!showComponentMenu)}
              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Node
            </Button>
            <Button
              onClick={handleSaveFlow}
              disabled={saveFlowMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveFlowMutation.isPending ? 'Saving...' : 'Save Flow'}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Component Palette */}
          {showComponentMenu && (
            <div className="w-72 border-r border-slate-200 bg-slate-50 overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Available Components</h3>
                <button onClick={() => setShowComponentMenu(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2">
                {COMPONENT_PALETTE.map(component => (
                  <div
                    key={component.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component.type)}
                    className="group p-3 bg-white border border-slate-200 rounded-lg cursor-move hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className={`flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r ${component.color}`}>
                      <span className="text-xl">{component.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{component.label}</p>
                        <p className="text-xs text-white/80">Drag to canvas</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canvas */}
          <div
            ref={canvasRef}
            onDragOver={handleCanvasDragOver}
            onDrop={handleCanvasDrop}
            className="flex-1 relative bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-auto cursor-grab active:cursor-grabbing"
          >
            {/* Grid Background */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            >
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                </pattern>
              </defs>
            </svg>

            {/* Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
              {connections.map((conn, idx) => {
                const fromNode = nodes.find(n => n.id === conn.from);
                const toNode = nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                const x1 = fromNode.x + 140;
                const y1 = fromNode.y + 60;
                const x2 = toNode.x;
                const y2 = toNode.y + 30;

                return (
                  <g key={`${conn.from}-${conn.to}-${idx}`}>
                    <path
                      d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2} ${x2} ${y2}`}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            <div className="relative w-full h-full">
              {nodes.map(node => (
                <div
                  key={node.id}
                  draggable
                  onDragStart={(e) => {
                    setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                      const newX = e.clientX - rect.left - dragOffset.x;
                      const newY = e.clientY - rect.top - dragOffset.y;
                      setNodes(
                        nodes.map(n =>
                          n.id === node.id
                            ? { ...n, x: Math.max(0, newX), y: Math.max(0, newY) }
                            : n
                        )
                      );
                    }
                  }}
                  onClick={() => setSelectedNodeId(node.id)}
                  onDoubleClick={() => handleNodeDoubleClick(node.id)}
                  className={`absolute w-56 p-4 rounded-xl border-2 cursor-move transition-all bg-gradient-to-br ${getNodeColor(node.type)} text-white shadow-lg hover:shadow-xl ${
                    selectedNodeId === node.id ? 'ring-4 ring-blue-300' : ''
                  }`}
                  style={{ left: node.x, top: node.y }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{node.data.label}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {node.data.message && (
                    <p className="text-xs text-white/90 mb-2 line-clamp-2">{node.data.message}</p>
                  )}

                  {node.type === NODE_TYPES.BUTTONS && node.data.buttons?.length > 0 && (
                    <div className="text-xs space-y-1 mt-2">
                      {node.data.buttons.slice(0, 2).map((btn: any) => (
                        <div key={btn.id} className="bg-white/20 px-2 py-1 rounded text-white/90">
                          • {btn.text}
                        </div>
                      ))}
                      {node.data.buttons.length > 2 && (
                        <div className="text-white/70 text-xs">+{node.data.buttons.length - 2} more</div>
                      )}
                    </div>
                  )}

                  {/* Ports */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-blue-600" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full border-2 border-blue-600" />
                </div>
              ))}
            </div>

            {nodes.length <= 1 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-blue-600" />
                  </div>
                  <p className="text-slate-600 font-medium">Drag components from the left panel</p>
                  <p className="text-sm text-slate-500">to start building your flow</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Node Properties */}
          {selectedNodeId && (
            <div className="w-80 border-l border-slate-200 bg-slate-50 overflow-y-auto p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Node Properties
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-900 mb-2 block">Label</label>
                      <Input
                        value={nodes.find(n => n.id === selectedNodeId)?.data.label || ''}
                        onChange={(e) =>
                          setNodes(
                            nodes.map(n =>
                              n.id === selectedNodeId
                                ? { ...n, data: { ...n.data, label: e.target.value } }
                                : n
                            )
                          )
                        }
                        className="h-9"
                      />
                    </div>

                    <Button
                      onClick={() => {
                        const node = nodes.find(n => n.id === selectedNodeId);
                        if (node) {
                          setEditingNodeId(selectedNodeId);
                          setNodeFormData(node.data);
                          setShowNodeModal(true);
                        }
                      }}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Advanced Settings
                    </Button>

                    <Button
                      onClick={() => handleDeleteNode(selectedNodeId)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Node
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Node Configuration Modal */}
      <Dialog open={showNodeModal} onOpenChange={setShowNodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Node</DialogTitle>
            <DialogDescription>Set up the node properties and content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">Label</label>
              <Input
                value={nodeFormData.label || ''}
                onChange={(e) => setNodeFormData({ ...nodeFormData, label: e.target.value })}
              />
            </div>

            {(editingNodeId && nodes.find(n => n.id === editingNodeId)?.type === NODE_TYPES.MESSAGE) && (
              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">Message Text</label>
                <textarea
                  value={nodeFormData.message || ''}
                  onChange={(e) => setNodeFormData({ ...nodeFormData, message: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>
            )}

            {(editingNodeId && nodes.find(n => n.id === editingNodeId)?.type === NODE_TYPES.BUTTONS) && (
              <div>
                <label className="text-sm font-medium text-slate-900 mb-2 block">Buttons (one per line)</label>
                <textarea
                  value={(nodeFormData.buttons || []).map((b: any) => b.text).join('\n')}
                  onChange={(e) => {
                    const buttons = e.target.value.split('\n').map((text, idx) => ({
                      id: `btn_${idx}`,
                      text: text.trim(),
                    }));
                    setNodeFormData({ ...nodeFormData, buttons });
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Button 1&#10;Button 2&#10;Button 3"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNodeModal(false);
                  setEditingNodeId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNode}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Save Node
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
